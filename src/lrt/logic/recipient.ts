import { LRTBalanceData } from '../../model'
import { Block, Context, Log } from '../../processor'
import { tokens } from '../../utils/addresses'
import { getReferrerIdFromExactInputSingle } from '../../utils/uniswap'
import { uniswapSwapFilter } from '../filters'
import { getBalanceDatasForRecipient, getRecipient, state } from '../state'
import { campaigns } from './campaigns'
import { updateRecipientsPoints } from './prime-points'
import { getReferralDataForReferralCodes } from './referrals'

export const addBalance = async (
  ctx: Context,
  params: {
    log: Log
    timestamp: Date
    recipient: string
    referralId?: string
    balance: bigint
    depositAsset?: string
    source?: 'mint' | 'uniswap' | undefined
  },
) => {
  const recipient = await getRecipient(ctx, params.recipient.toLowerCase())
  recipient.balance += params.balance
  const balanceData = new LRTBalanceData({
    id: params.log.id,
    recipient,
    referralId: params.referralId,
    asset: params.depositAsset,
    source: params.source,
    balance: params.balance,
    balanceDate: params.timestamp,
    pointsDate: params.timestamp,
    points: 0n,
    referralPointsBase: 0n,
  })
  if (params.referralId) {
    const rcData = getReferralDataForReferralCodes(params.referralId)
    if (rcData.address) {
      await getRecipient(ctx, rcData.address)
    }
  }
  recipient.balanceDatas.push(balanceData)
  state.balanceDatas.set(balanceData.id, balanceData)
  for (const campaign of campaigns) {
    await campaign.addBalance(
      ctx,
      recipient,
      params.timestamp,
      params.balance,
      params.source,
    )
  }
}

export const removeBalance = async (
  ctx: Context,
  params: {
    log: Log
    timestamp: Date
    recipient: string
    balance: bigint
  },
) => {
  const recipient = await getRecipient(ctx, params.recipient)

  await updateRecipientsPoints(ctx, params.timestamp.getTime(), [recipient])

  recipient.balance -= params.balance
  let amountToRemove = params.balance
  const balanceDatas = await getBalanceDatasForRecipient(ctx, params.recipient)
  if (!balanceDatas.length) {
    throw new Error(
      `should have results here for ${params.recipient}, tx ${params.log.transactionHash}`,
    )
  }
  // - Prefer not to remove balance from OETH deposits.
  // - Prefer to remove balance from recent balances.
  balanceDatas.sort((a, b) => {
    if (a.asset === tokens.OETH && b.asset !== tokens.OETH) {
      return 1
    } else if (a.asset !== tokens.OETH && b.asset === tokens.OETH) {
      return -1
    } else {
      return a.id > b.id ? -1 : 1
    }
  })
  for (const balanceData of balanceDatas) {
    if (amountToRemove === 0n) return
    if (amountToRemove > balanceData.balance) {
      amountToRemove -= balanceData.balance
      balanceData.balance = 0n
    } else {
      balanceData.balance -= amountToRemove
      amountToRemove = 0n
    }
    if (balanceData.balance === 0n && balanceData.points === 0n) {
      state.balanceDatas.delete(balanceData.id)
    } else {
      state.balanceDatas.set(balanceData.id, balanceData)
    }
  }
  for (const campaign of campaigns) {
    await campaign.removeBalance(
      ctx,
      recipient,
      params.timestamp,
      params.balance,
    )
  }
}

export const transferBalance = async (
  ctx: Context,
  block: Block,
  params: {
    log: Log
    timestamp: Date
    from: string
    to: string
    amount: bigint
  },
) => {
  // Mints are already handled by the deposit handler.
  if (params.from === '0x0000000000000000000000000000000000000000') return

  await removeBalance(ctx, {
    log: params.log,
    timestamp: params.timestamp,
    recipient: params.from,
    balance: params.amount,
  })

  // Can ignore 0x0000000000000000000000000000000000000000 address for burns
  if (params.to === '0x0000000000000000000000000000000000000000') return

  const uniswapLog = block.logs.find(
    (l) =>
      params.log.transactionHash === l.transactionHash &&
      uniswapSwapFilter.matches(l),
  )
  const source = uniswapLog ? 'uniswap' : undefined
  const referralId = uniswapLog
    ? getReferrerIdFromExactInputSingle(params.log.transaction?.input)
    : undefined

  await addBalance(ctx, {
    log: params.log,
    timestamp: params.timestamp,
    recipient: params.to,
    balance: params.amount,
    referralId,
    source,
  })
}
