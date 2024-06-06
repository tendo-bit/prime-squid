import { sortBy, uniqBy } from 'lodash'
import { EntityManager, MoreThan } from 'typeorm'

import {
  LRTBalanceData,
  LRTCampaign,
  LRTCampaignHistory,
  LRTCampaignRecipient,
  LRTDeposit,
  LRTNodeDelegator,
  LRTNodeDelegatorHoldings,
  LRTPointRecipient,
  LRTPointRecipientHistory,
  LRTSummary,
} from '../model'
import { Block, Context } from '../processor'
import { find, findOne } from './utils/db-utils'

export const state = {
  haveNodeDelegatorInstance: false,
  summaries: new Map<string, LRTSummary>(),
  deposits: new Map<string, LRTDeposit>(),
  recipients: new Map<string, LRTPointRecipient>(),
  balanceDatas: new Map<string, LRTBalanceData>(),
  recipientHistory: new Map<string, LRTPointRecipientHistory>(),
  nodeDelegators: new Map<string, LRTNodeDelegator>(),
  nodeDelegatorHoldings: new Map<string, LRTNodeDelegatorHoldings>(),
  campaign: new Map<string, LRTCampaign>(),
  campaignHistory: new Map<string, LRTCampaignHistory>(),
  campaignRecipient: new Map<string, LRTCampaignRecipient>(),
}

export const saveAndResetState = async (ctx: Context) => {
  // Prep data
  const campaignRecipients: LRTCampaignRecipient[] = []
  const campaignRecipientsToRemove: LRTCampaignRecipient[] = []
  for (const cr of state.campaignRecipient.values()) {
    if (cr.elPoints === 0n && cr.balance === 0n) {
      campaignRecipientsToRemove.push(cr)
    } else {
      campaignRecipients.push(cr)
    }
  }

  await Promise.all([
    ctx.store.insert([...state.summaries.values()]),
    ctx.store.insert([...state.deposits.values()]),
    ctx.store.upsert([...state.recipients.values()]).then(() => {
      return ctx.store.upsert([...state.balanceDatas.values()]) // FK link req `recipients` to exist first.
    }),
    ctx.store.upsert([...state.recipientHistory.values()]),
    ctx.store.upsert([...state.nodeDelegators.values()]),
    ctx.store.upsert([...state.nodeDelegatorHoldings.values()]),
    // Campaign Related
    ctx.store.upsert([...state.campaign.values()]),
    ctx.store.upsert([...state.campaignHistory.values()]),
    ctx.store.upsert(campaignRecipients),
    ctx.store.remove(campaignRecipientsToRemove),
  ])
  state.summaries.clear()
  state.deposits.clear()
  // state.recipients.clear() // We don't want to clear the recipients because they give us faster summary updates.
  state.balanceDatas.clear()
  state.recipientHistory.clear()
  state.nodeDelegators.clear()
  state.nodeDelegatorHoldings.clear()
  // Campaign Related
  state.campaignHistory.clear()
}

export const getBalanceDatasForRecipient = async (
  ctxOrEm: Context | EntityManager,
  recipient: string,
) => {
  const dbResults = await find(ctxOrEm, LRTBalanceData, {
    where: [
      {
        recipient: { id: recipient },
        balance: MoreThan(0n),
      },
    ],
    relations: { recipient: true },
  })
  const localResults = Array.from(state.balanceDatas.values()).filter((d) => {
    return d.recipient.id === recipient && d.balance > 0n
  })
  return sortBy(uniqBy([...localResults, ...dbResults], 'id'), 'id') // order pref for local
}

export const getRecipient = async (
  ctxOrEm: Context | EntityManager,
  id: string,
) => {
  let recipient = state.recipients.get(id)
  if (!recipient) {
    if ('store' in ctxOrEm) {
      recipient = await ctxOrEm.store.get(LRTPointRecipient, {
        where: { id },
        relations: { balanceDatas: { recipient: true } },
      })
    } else {
      recipient =
        (await ctxOrEm.findOne(LRTPointRecipient, {
          where: { id },
          relations: { balanceDatas: { recipient: true } },
        })) ?? undefined
    }
    if (!recipient) {
      recipient = new LRTPointRecipient({
        id,
        balance: 0n,
        points: 0n,
        pointsDate: new Date(0),
        referralPoints: 0n,
        elPoints: 0n,
        balanceDatas: [],
        referrerCount: 0,
        referralCount: 0,
      })
    }
    state.recipients.set(id, recipient)
  }
  return recipient
}

export const getLastNodeDelegator = async (
  ctxOrEm: Context | EntityManager,
  block: Block,
  node: string,
) => {
  return (
    state.nodeDelegators.get(`${block.header.height}:${node}`) ??
    (await findOne(ctxOrEm, LRTNodeDelegator, {
      order: { id: 'desc' },
      where: { node },
    }))
  )
}

export const getLastSummary = async (ctxOrEm: Context | EntityManager) => {
  return await find(ctxOrEm, LRTSummary, {
    take: 1,
    order: { id: 'desc' },
  }).then((r) => r[0])
}

export const getSummary = async (
  ctxOrEm: Context | EntityManager,
  block: Block,
) => {
  const id = block.header.id
  let summary = state.summaries.get(id)
  if (!summary) {
    const lastSummary = await getLastSummary(ctxOrEm)
    summary = new LRTSummary({
      id,
      timestamp: new Date(block.header.timestamp),
      blockNumber: block.header.height,
      balance: lastSummary.balance ?? 0n,
      points: lastSummary.points ?? 0n,
      elPoints: lastSummary.elPoints ?? 0n,
    })
  }
  return summary
}
