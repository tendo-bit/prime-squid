import * as abiErc20 from '../abi/erc20'
import * as abiDepositPool from '../abi/lrt-deposit-pool'
import * as abiNodeDelegator from '../abi/lrt-node-delegator'
import * as abiUniswapPool from '../abi/uniswap-weth-prime-pool'
import { UNISWAP_WETH_PRIMEETH_POOL_ADDRESS } from '../utils/addresses'
import { logFilter } from '../utils/logFilter'
import * as config from './config'

// Export
export const from = config.startBlock

// CONSTANTS
export const RANGE = { from }

export const depositFilter = logFilter({
  address: [config.addresses.lrtDepositPool],
  topic0: [abiDepositPool.events.AssetDeposit.topic],
  range: RANGE,
})
export const transferFilter = logFilter({
  address: [config.addresses.lrtToken],
  topic0: [abiErc20.events.Transfer.topic],
  range: RANGE,
})
export const assetDepositIntoStrategyFilter = logFilter({
  address: config.addresses.nodeDelegators.map((n) => n.address),
  topic0: [abiNodeDelegator.events.AssetDepositIntoStrategy.topic],
  range: RANGE,
})
export const uniswapSwapFilter = logFilter({
  address: [UNISWAP_WETH_PRIMEETH_POOL_ADDRESS],
  topic0: [abiUniswapPool.events.Swap.topic],
  range: RANGE,
  transaction: true,
})
