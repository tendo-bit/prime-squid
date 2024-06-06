import { parseEther } from 'viem'

import * as abiStrategyManager from '../../abi/el-strategy-manager'
import {
  LRTNodeDelegator,
  LRTNodeDelegatorHoldings,
  LRTPointRecipient,
  LRTSummary,
} from '../../model'
import { Block, Context } from '../../processor'
import * as config from '../config'
import { getLastNodeDelegator, state } from '../state'
import { campaigns } from './campaigns'

export const updateEigenPoints = async (
  ctx: Context,
  block: Block,
  summary: LRTSummary,
  recipients: LRTPointRecipient[],
) => {
  if (state.haveNodeDelegatorInstance) {
    const totalBalance = recipients.reduce((sum, r) => sum + r.balance, 0n)
    let totalPointsEarned = 0n
    let totalPoints = 0n
    let from: bigint = 0n
    for (const node of config.addresses.nodeDelegators.filter(
      (n) => n.blockNumber <= block.header.height,
    )) {
      const result = await updateNodeDelegatorEigenPoints(
        ctx,
        block,
        node.address,
      )
      totalPointsEarned += result.pointsEarned
      totalPoints += result.nodeDelegator.points
      from = from > result.from ? from : result.from
    }

    // Calculate each recipient's points
    for (const recipient of recipients) {
      const recipientElPointsEarned =
        (recipient.balance * totalPointsEarned) / totalBalance
      recipient.elPoints += recipientElPointsEarned

      // Calculate multipliers from campaigns
      if (from) {
        for (const campaign of campaigns) {
          const result = await campaign.updateEigenPoints(
            ctx,
            recipient,
            recipientElPointsEarned,
            from,
          )
          recipient.elPoints += result.elPoints
        }
      }
    }

    summary.elPoints = totalPoints
  }
}

const updateNodeDelegatorEigenPoints = async (
  ctx: Context,
  block: Block,
  node: string,
) => {
  const strategyManagerContract = new abiStrategyManager.Contract(
    ctx,
    block.header,
    '0x858646372CC42E1A627fcE94aa7A7033e7CF075A',
  )
  const [assets, balances] = await strategyManagerContract.getDeposits(node)
  const totalBalance = balances.reduce((sum, balance) => sum + balance, 0n)
  const lastNodeDelegatorEntry = await getLastNodeDelegator(
    ctx,
    block,
    node.toLowerCase(),
  )

  const calcPoints = (ethAmount: bigint, hours: bigint) => {
    return (ethAmount * hours) / 1_000000000_000000000n
  }

  let from: bigint = parseEther(block.header.timestamp.toString())
  const to: bigint = parseEther(block.header.timestamp.toString())
  let pointsEarned = 0n
  if (lastNodeDelegatorEntry) {
    from = parseEther(lastNodeDelegatorEntry.timestamp.getTime().toString())
    const hourLength =
      ((to - from) * 1_000000000_000000000n) / parseEther('3600000')
    pointsEarned = calcPoints(lastNodeDelegatorEntry?.amount, hourLength)
  }

  const nodeDelegator = new LRTNodeDelegator({
    id: `${block.header.height}:${node}`,
    blockNumber: block.header.height,
    timestamp: new Date(block.header.timestamp),
    node: node.toLowerCase(),
    amount: totalBalance,
    points: (lastNodeDelegatorEntry?.points ?? 0n) + pointsEarned,
    holdings: [],
  })

  if (lastNodeDelegatorEntry?.id === nodeDelegator.id) {
    throw new Error(
      `Already created an LRTNodeDelegator with id ${nodeDelegator.id}`,
    )
  }

  // ctx.log.info({
  //   lastNodeDelegatorEntry: !!lastNodeDelegatorEntry,
  //   timestamp: nodeDelegator.timestamp,
  //   pointsEarned: formatEther(nodeDelegator.points),
  // })

  nodeDelegator.holdings = assets.map((asset, i) => {
    const holding = new LRTNodeDelegatorHoldings({
      id: `${block.header.height}:${node}:${asset.toLowerCase()}`,
      asset: asset.toLowerCase(),
      delegator: nodeDelegator,
      amount: balances[i],
    })
    state.nodeDelegatorHoldings.set(holding.id, holding)
    return holding
  })

  state.nodeDelegators.set(nodeDelegator.id, nodeDelegator)
  return { nodeDelegator, pointsEarned, from, to }
}
