import { TokenAddress, tokens } from '../utils/addresses'
import { nativeStakingEndDate, nativeStakingPreLaunch } from './logic/campaigns'

export const startBlock = 19143860 // Contract Deploy: 0xA479582c8b64533102F6F528774C536e354B8d32
export const from = 19143860

const hourMs = 3600000
export const pointInterval = hourMs
const primeLaunchDate = new Date('2024-02-05 12:00 PM PST')

const eth = (val: bigint) => val * 1_000000000_000000000n

export interface PointCondition {
  name: string
  // The multiplier the point condition will apply.
  // For every 100 multiplier, recipients will earn 10000 points per 1e18 primeETH per hour.
  multiplier: bigint
  // The asset required for this point condition to take effect.
  asset?: TokenAddress
  // The dates which this point condition will take effect.
  startDate?: Date
  // The dates which this point condition will take effect.
  endDate?: Date
  // The dates balance must have been acquired within for this point condition to take effect.
  balanceStartDate?: Date
  // The dates balance must have been acquired within for this point condition to take effect.
  balanceEndDate?: Date
}

export interface BalanceBonus {
  name: string
  gte: bigint
  multiplier: bigint
}

export const pointConditions: PointCondition[] = [
  {
    name: 'oeth-2x',
    startDate: primeLaunchDate,
    asset: tokens.OETH,
    multiplier: 100n,
  },
  {
    name: 'reth-1.1x',
    startDate: new Date('2024-02-08T18:00:00.000Z'),
    asset: tokens.rETH,
    multiplier: 10n,
  },
  {
    name: 'week1-5x',
    startDate: primeLaunchDate,
    endDate: new Date('2024-02-06'),
    multiplier: 100n,
  },
  {
    name: 'week1-4x',
    startDate: primeLaunchDate,
    endDate: new Date('2024-02-07'),
    multiplier: 100n,
  },
  {
    name: 'week1-3x',
    startDate: primeLaunchDate,
    endDate: new Date('2024-02-08'),
    multiplier: 100n,
  },
  {
    name: 'week1-2x',
    startDate: primeLaunchDate,
    endDate: new Date('2024-02-09'),
    multiplier: 100n,
  },
  {
    name: 'native-1.5x',
    startDate: nativeStakingPreLaunch.toDate(),
    endDate: nativeStakingEndDate.toDate(),
    balanceStartDate: nativeStakingPreLaunch.toDate(),
    balanceEndDate: nativeStakingEndDate.toDate(),
    multiplier: 50n,
  },
  { name: 'standard', startDate: primeLaunchDate, multiplier: 100n },
]

export const referralConditions: PointCondition[] = [
  {
    name: 'referrals-standard',
    balanceStartDate: primeLaunchDate,
    multiplier: 10n,
  },
  {
    name: 'referrals-native-bonus',
    startDate: nativeStakingPreLaunch.toDate(),
    endDate: nativeStakingEndDate.toDate(),
    balanceStartDate: nativeStakingPreLaunch.toDate(),
    balanceEndDate: nativeStakingEndDate.toDate(),
    multiplier: 10n,
  },
]

// Maintain Order - Only one gets applied.
export const balanceBonuses: BalanceBonus[] = [
  { name: 'gte2000', gte: eth(2000n), multiplier: 20n },
  { name: 'gte1000', gte: eth(1000n), multiplier: 15n },
  { name: 'gte100', gte: eth(100n), multiplier: 10n },
  { name: 'gte10', gte: eth(10n), multiplier: 5n },
]

// LRT Addresses: https://github.com/oplabs/primestaked-eth/blob/main/README.md
export const addresses = {
  lrtToken: '0x6ef3D766Dfe02Dc4bF04aAe9122EB9A0Ded25615',
  lrtDepositPool: '0xA479582c8b64533102F6F528774C536e354B8d32',
  lrtOracle: '0xA755c18CD2376ee238daA5Ce88AcF17Ea74C1c32',
  nodeDelegators: [
    {
      address: '0x8bBBCB5F4D31a6db3201D40F478f30Dc4F704aE2',
      blockNumber: 19143860,
    },
  ],
}
