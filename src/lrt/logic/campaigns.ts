import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { remove } from 'lodash'
import { parseEther } from 'viem'

import {
  LRTCampaign,
  LRTCampaignHistory,
  LRTCampaignRecipient,
  LRTPointRecipient,
} from '../../model'
import { Block, Context } from '../../processor'
import { UNISWAP_WETH_PRIMEETH_POOL_ADDRESS } from '../../utils/addresses'
import { PointCondition } from '../config'
import { state } from '../state'

dayjs.extend(utc)

const eth = (val: bigint) => val * 1_000000000_000000000n

export interface CampaignConfig {
  name: string
  excludeAddresses: string[]
  startDate: Date
  endDate: Date
  elPointLimit: bigint
  elPointConditions: PointCondition[]
}

export const nativeStakingPreLaunch = dayjs.utc('2024-02-09 12:00 PM PST')
export const nativeStakingStartDate = dayjs.utc('2024-03-18 12:00 PM PDT')
export const nativeStakingEndDate = dayjs.utc('2024-03-25 12:00 PM PDT')
const configs: CampaignConfig[] = [
  {
    name: 'native-staking',
    excludeAddresses: [UNISWAP_WETH_PRIMEETH_POOL_ADDRESS],
    startDate: nativeStakingPreLaunch.toDate(),
    endDate: nativeStakingEndDate.toDate(),
    elPointLimit: eth(1_000_000n),
    elPointConditions: [
      {
        // Pre-launch deposits
        name: 'native-staking-pre-launch',
        multiplier: 0n,
        startDate: nativeStakingPreLaunch.toDate(),
        endDate: nativeStakingStartDate.toDate(),
      },
      {
        // First 24 hours: 4.20x
        name: 'native-staking-el-4.20x',
        multiplier: 320n,
        startDate: nativeStakingStartDate.toDate(),
        endDate: nativeStakingStartDate.add(1, 'day').toDate(),
      },
      {
        // Next 3 days: 1.69x
        name: 'native-staking-el-1.69x',
        multiplier: 69n,
        startDate: nativeStakingStartDate.add(1, 'day').toDate(),
        endDate: nativeStakingStartDate.add(4, 'day').toDate(),
      },
      {
        // Next 3 days: 1.42x
        name: 'native-staking-el-1.42x',
        multiplier: 42n,
        startDate: nativeStakingStartDate.add(4, 'day').toDate(),
        endDate: nativeStakingStartDate.add(7, 'day').toDate(),
      },
    ],
  },
]

const getLRTCampaign = async (ctx: Context, config: CampaignConfig) => {
  const id = config.name
  let entity = state.campaign.get(id)
  if (!entity) {
    entity = await ctx.store.get(LRTCampaign, id)
    if (entity) {
      state.campaign.set(entity.id, entity)
    }
  }
  if (!entity) {
    entity = new LRTCampaign({
      id,
      campaign: config.name,
      balance: 0n,
      elPoints: 0n,
    })
    state.campaign.set(entity.id, entity)
  }
  return entity
}

const getLRTCampaignRecipient = async (
  ctx: Context,
  config: CampaignConfig,
  recipient: LRTPointRecipient,
) => {
  const id = `${config.name}:${recipient.id}`
  let entity = state.campaignRecipient.get(id)
  if (!entity) {
    entity = await ctx.store.get(LRTCampaignRecipient, id)
    if (entity) {
      state.campaignRecipient.set(entity.id, entity)
    }
  }
  if (!entity) {
    entity = new LRTCampaignRecipient({
      id,
      campaign: config.name,
      recipient: recipient.id,
      balance: 0n,
      elPoints: 0n,
    })
    state.campaignRecipient.set(entity.id, entity)
  }
  return entity
}

export const createCampaignProcessor = (config: CampaignConfig) => {
  return {
    config,
    withinCampaignTimeline(timestamp: Date) {
      return timestamp >= config.startDate && timestamp < config.endDate
    },
    async addBalance(
      ctx: Context,
      recipient: LRTPointRecipient,
      timestamp: Date,
      balanceIn: bigint,
      source: 'mint' | 'uniswap' | undefined,
    ) {
      if (!this.withinCampaignTimeline(timestamp)) return
      if (source !== 'mint' && source !== 'uniswap') return
      if (config.excludeAddresses.includes(recipient.id)) return
      const campaign = await getLRTCampaign(ctx, config)
      campaign.balance += balanceIn
      const entity = await getLRTCampaignRecipient(ctx, config, recipient)
      entity.balance += balanceIn
    },
    async removeBalance(
      ctx: Context,
      recipient: LRTPointRecipient,
      timestamp: Date,
      balanceOut: bigint,
    ) {
      if (!this.withinCampaignTimeline(timestamp)) return
      if (config.excludeAddresses.includes(recipient.id)) return
      const campaign = await getLRTCampaign(ctx, config)
      campaign.balance -= balanceOut
      const entity = await getLRTCampaignRecipient(ctx, config, recipient)
      entity.balance -= balanceOut
    },
    async updateEigenPoints(
      ctx: Context,
      recipient: LRTPointRecipient,
      amount: bigint,
      from: bigint,
    ) {
      const campaign = await getLRTCampaign(ctx, config)
      if (campaign.elPoints > config.elPointLimit) {
        throw new Error('Too many points awarded.')
      } else if (campaign.elPoints === config.elPointLimit) {
        return { elPoints: 0n }
      }
      const campaignRecipient = await getLRTCampaignRecipient(
        ctx,
        config,
        recipient,
      )
      if (campaignRecipient.balance > 0 && recipient.balance > 0) {
        const conditions = config.elPointConditions.filter((c) => {
          return (
            c.startDate &&
            from >= parseEther(c.startDate.valueOf().toString()) &&
            c.endDate &&
            from < parseEther(c.endDate.valueOf().toString())
          )
        })
        const multiplier = conditions.reduce((sum, c) => sum + c.multiplier, 0n)
        let amountFromMultiplier =
          (((amount * campaignRecipient.balance) / recipient.balance) *
            multiplier) /
          100n
        let overage =
          campaign.elPoints + amountFromMultiplier - config.elPointLimit
        if (overage > 0) {
          amountFromMultiplier -= overage
          ctx.log.info(`overage detected - campaign complete`)
        }

        // ctx.log.info({
        //   recipientBalance: formatEther(recipient.balance),
        //   campaignRecipientBalance: formatEther(campaignRecipient.balance),
        //   multiplier: multiplier,
        //   amount: formatEther(amount),
        //   amountFromMultiplier: formatEther(amountFromMultiplier),
        //   overage: formatEther(overage),
        // })

        campaign.elPoints += amountFromMultiplier
        campaignRecipient.elPoints += amountFromMultiplier

        return {
          elPoints: amountFromMultiplier,
        }
      }
      return { elPoints: 0n }
    },
    async createHistoryEntity(ctx: Context, block: Block) {
      const campaign = await getLRTCampaign(ctx, config)
      const id = `${block.header.height}:${config.name}`
      state.campaignHistory.set(
        id,
        new LRTCampaignHistory({
          id,
          blockNumber: block.header.height,
          timestamp: new Date(block.header.timestamp),
          campaign: campaign.campaign,
          balance: campaign.balance,
          elPoints: campaign.elPoints,
        }),
      )
    },
  }
}

export const campaigns = configs.map((config) =>
  createCampaignProcessor(config),
)

export const removeExpiredCampaigns = (block: Block) => {
  remove(campaigns, (c) => {
    if (c.config.endDate.valueOf() < block.header.timestamp) {
      state.campaign.delete(c.config.name)
      for (const cr of state.campaignRecipient.values()) {
        state.campaignRecipient.delete(cr.id)
      }
      console.log(`Removed campaign: ${c.config.name}`)
      return true
    }
  })
}
