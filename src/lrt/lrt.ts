import { EvmBatchProcessor } from '@subsquid/evm-processor'
import { MoreThan } from 'typeorm'

import * as abiErc20 from '../abi/erc20'
import * as abiDepositPool from '../abi/lrt-deposit-pool'
import { LRTDeposit, LRTNodeDelegator, LRTPointRecipient } from '../model'
import { Block, Context, Log } from '../processor'
import {
  RANGE,
  assetDepositIntoStrategyFilter,
  depositFilter,
  transferFilter,
  uniswapSwapFilter,
} from './filters'
import { removeExpiredCampaigns } from './logic/campaigns'
import { calculatePoints } from './logic/points'
import { addBalance, transferBalance } from './logic/recipient'
import { getLastSummary, saveAndResetState, state } from './state'

export { from } from './filters'

export const setup = (processor: EvmBatchProcessor) => {
  processor.addLog(depositFilter.value)
  processor.addLog(transferFilter.value)
  processor.addLog(assetDepositIntoStrategyFilter.value)
  processor.addLog(uniswapSwapFilter.value)
  processor.includeAllBlocks(RANGE) // need for the hourly processing
}

let intervalProcessed = false
const lastIntervalProcessed = {
  '60': 0,
  '5': 0,
}
export const initialize = async (ctx: Context) => {
  const nodeDelegator = await ctx.store
    .find(LRTNodeDelegator, { take: 1 })
    .then((n) => n[0])
  state.haveNodeDelegatorInstance = !!nodeDelegator

  const summary = await getLastSummary(ctx)
  for (const key of Object.keys(
    lastIntervalProcessed,
  ) as (keyof typeof lastIntervalProcessed)[]) {
    lastIntervalProcessed[key] = summary
      ? Math.floor(summary.timestamp.getTime() / (Number(key) * 60000))
      : 0
  }

  const recipients = await ctx.store.find(LRTPointRecipient, {
    where: [{ balance: MoreThan(0n) }, { referralCount: MoreThan(0) }],
    relations: {
      balanceDatas: {
        recipient: true,
      },
    },
  })
  for (const recipient of recipients) {
    state.recipients.set(recipient.id, recipient)
  }
}

export const process = async (ctx: Context) => {
  // ============================
  // Process chain data
  for (const block of ctx.blocks) {
    intervalProcessed = false
    for (const log of block.logs) {
      if (
        !state.haveNodeDelegatorInstance &&
        block.logs.find((log) => assetDepositIntoStrategyFilter.matches(log))
      ) {
        // We don't want to process certain things until we've seen our first assetDepositIntoStrategy.
        state.haveNodeDelegatorInstance = true
      }
      if (depositFilter.matches(log)) {
        await processInterval(ctx, block, '5')
        await processDeposit(ctx, block, log)
      } else if (transferFilter.matches(log)) {
        await processInterval(ctx, block, '5')
        await processTransfer(ctx, block, log)
      } else if (assetDepositIntoStrategyFilter.matches(log)) {
        await processInterval(ctx, block, '5')
      }
    }
    await processInterval(ctx, block, '60')
  }

  const lastBlock = ctx.blocks[ctx.blocks.length - 1]
  if (ctx.isHead) {
    await processInterval(ctx, lastBlock, '5')
  }
  await saveAndResetState(ctx)
  removeExpiredCampaigns(lastBlock)
}

const processInterval = async (
  ctx: Context,
  block: Block,
  interval: keyof typeof lastIntervalProcessed,
) => {
  const blockInterval = Math.floor(
    block.header.timestamp / (Number(interval) * 60000),
  )
  if (intervalProcessed) {
    lastIntervalProcessed[interval] = blockInterval
    return
  }
  if (lastIntervalProcessed[interval] !== blockInterval) {
    await saveAndResetState(ctx)
    await calculatePoints(ctx, block)
    intervalProcessed = true
    lastIntervalProcessed[interval] = blockInterval
  }
}
const processDeposit = async (ctx: Context, block: Block, log: Log) => {
  const {
    depositor: depositorAddress,
    asset,
    depositAmount,
    primeEthMintAmount,
    referralId,
  } = abiDepositPool.events.AssetDeposit.decode(log)
  const timestamp = new Date(block.header.timestamp)
  const deposit = new LRTDeposit({
    id: log.id,
    blockNumber: block.header.height,
    timestamp: timestamp,
    asset: asset.toLowerCase(),
    depositor: depositorAddress.toLowerCase(),
    depositAmount,
    amountReceived: primeEthMintAmount,
    referralId,
  })
  state.deposits.set(deposit.id, deposit)
  await addBalance(ctx, {
    log,
    depositAsset: deposit.asset,
    recipient: deposit.depositor,
    referralId: deposit.referralId,
    timestamp: deposit.timestamp,
    balance: deposit.amountReceived,
    source: 'mint',
  })
}

const processTransfer = async (ctx: Context, block: Block, log: Log) => {
  const data = abiErc20.events.Transfer.decode(log)
  await transferBalance(ctx, block, {
    log,
    timestamp: new Date(block.header.timestamp),
    from: data.from.toLowerCase(),
    to: data.to.toLowerCase(),
    amount: data.value,
  })
}
