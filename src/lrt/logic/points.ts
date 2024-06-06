import { LRTPointRecipientHistory, LRTSummary } from '../../model'
import { Block, Context } from '../../processor'
import { getLastSummary, state } from '../state'
import { campaigns } from './campaigns'
import { updateEigenPoints } from './eigen-points'
import { updateRecipientsPoints } from './prime-points'

export const calculatePoints = async (ctx: Context, block: Block) => {
  ctx.log.info(`Calculating points: ${new Date(block.header.timestamp)}`)
  const { summary, recipients } = await createSummary(ctx, block)
  await updateEigenPoints(ctx, block, summary, recipients)
  for (const campaign of campaigns) {
    await campaign.createHistoryEntity(ctx, block)
  }
}

const createSummary = async (ctx: Context, block: Block) => {
  const lastSummary = await getLastSummary(ctx)

  // This is a big update - we load everything!
  // Can iterate through this in batches later if needed.
  const recipients = [...state.recipients.values()]

  if (lastSummary?.id === block.header.id) {
    // The hourly run likely already created this.
    return { summary: lastSummary, recipients }
  }

  await updateRecipientsPoints(ctx, block.header.timestamp, recipients)

  let totalPoints = 0n
  let totalBalance = 0n
  for (const recipient of recipients) {
    totalBalance += recipient.balance
    totalPoints += recipient.points
    const id = `${block.header.height}:${recipient.id}`
    state.recipientHistory.set(
      id,
      new LRTPointRecipientHistory({
        id,
        timestamp: new Date(block.header.timestamp),
        blockNumber: block.header.height,
        recipient: recipient.id,
        balance: recipient.balance,
        points: recipient.points,
        pointsDate: recipient.pointsDate,
        elPoints: recipient.elPoints,
        referralPoints: recipient.referralPoints,
        referrerCount: recipient.referrerCount,
        referralCount: recipient.referralCount,
      }),
    )
  }

  // Create Summary
  const summary = new LRTSummary({
    id: block.header.id,
    timestamp: new Date(block.header.timestamp),
    blockNumber: block.header.height,
    balance: totalBalance,
    points: totalPoints,
    elPoints: lastSummary?.elPoints ?? 0n,
  })
  state.summaries.set(summary.id, summary)

  return { summary, recipients }
}
