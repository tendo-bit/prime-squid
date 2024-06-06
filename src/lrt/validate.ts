import { Entity, EntityClass } from '@subsquid/typeorm-store'
import assert from 'assert'
import { sortBy } from 'lodash'

import { LRTPointRecipientHistory, LRTSummary } from '../model'
import { Block, Context } from '../processor'
import { env } from '../utils/env'
import { jsonify } from '../utils/jsonify'

export const name = 'validate'

let firstBlock = true

export const process = async (ctx: Context) => {
  if (env.BLOCK_FROM) return
  for (const block of ctx.blocks) {
    await validateExpectations(
      ctx,
      block,
      LRTSummary,
      expectations.lrtSummaries,
    )
    await validateExpectations(
      ctx,
      block,
      LRTPointRecipientHistory,
      expectations.lrtPointRecipientHistory,
    )
    firstBlock = false
  }
}

const validateExpectations = async <
  T extends Entity & {
    timestamp: string
    blockNumber: number
  },
>(
  ctx: Context,
  block: Block,
  Class: EntityClass<any>,
  expectations?: T[],
) => {
  if (!expectations) return
  if (firstBlock) {
    while (expectations[0]?.blockNumber < block.header.height) {
      const entity = expectations.shift()!
      await validateExpectation(ctx, Class, entity)
    }
  }
  assert(
    !expectations.length || expectations[0]?.blockNumber >= block.header.height,
    'Something is missing',
  )
  while (expectations[0]?.blockNumber === block.header.height) {
    const entity = expectations.shift()!
    await validateExpectation(ctx, Class, entity)
  }
}

const validateExpectation = async <
  T extends Entity & {
    timestamp: string
    blockNumber: number
  },
>(
  ctx: Context,
  Class: EntityClass<any>,
  expectation: T,
) => {
  const actual = await ctx.store.findOne(Class, {
    where: { id: expectation.id },
  })
  assert(
    actual,
    `Expected entity does not exist: Entity=${Class.name} id=${expectation.id}`,
  )
  expectation.timestamp = new Date(expectation.timestamp).toJSON()
  // We decide to only care about float decimal accuracy to the 8th.
  assert.deepEqual(
    JSON.parse(
      jsonify(actual, (_key, value) =>
        typeof value === 'number' ? Number(value.toFixed(8)) : value,
      ),
    ),
    JSON.parse(
      jsonify(expectation, (_key, value) =>
        typeof value === 'number' ? Number(value.toFixed(8)) : value,
      ),
    ),
  )
  ctx.log.info(`Validated entity: Entity=${Class.name} id=${expectation.id}`)
}

const e = (arr: any[]) => {
  return sortBy(arr, (v) => v.blockNumber)
}

const expectations = {
  lrtSummaries: e([
    {
      id: '0019145906-9a91c',
      balance: '20690928672687557',
      blockNumber: 19145906,
      elPoints: '0',
      points: '0',
      timestamp: '2024-02-03T06:00:11.000Z',
    },
    {
      id: '0019146014-77d2f',
      balance: '20690928672687557',
      blockNumber: 19146014,
      elPoints: '0',
      points: '0',
      timestamp: '2024-02-03T06:21:59.000Z',
    },
    {
      id: '0019160341-86b04',
      balance: '525341441156344833912',
      blockNumber: 19160341,
      elPoints: '0',
      points: '0',
      timestamp: '2024-02-05T06:38:11.000Z',
    },
    {
      id: '0019160360-574f4',
      balance: '580373419230347733796',
      blockNumber: 19160360,
      elPoints: '0',
      points: '0',
      timestamp: '2024-02-05T06:41:59.000Z',
    },
  ]),
  lrtPointRecipientHistory: e([
    {
      id: '19164900:0xad9898452b692ef4fcf89517bb224306000a3625',
      elPoints: '1886056253128258536',
      blockNumber: 19164900,
      balance: '1182826847843887818',
      points: '144048596286588137589510',
      pointsDate: '2024-02-05T22:01:47.000Z',
      recipient: '0xad9898452b692ef4fcf89517bb224306000a3625',
      referralCount: 0,
      referralPoints: '0',
      referrerCount: 0,
      timestamp: '2024-02-05T22:01:47.000Z',
    },
    {
      id: '19164900:0x9227dff3a69cac5bc42984256588c88d1581237b',
      elPoints: '712073846698420139',
      blockNumber: 19164900,
      balance: '446572079769821914',
      points: '54385036447968145233078',
      pointsDate: '2024-02-05T22:01:47.000Z',
      recipient: '0x9227dff3a69cac5bc42984256588c88d1581237b',
      referralCount: 0,
      referralPoints: '0',
      referrerCount: 0,
      timestamp: '2024-02-05T22:01:47.000Z',
    },
    {
      id: '19164900:0xa14ed585b6a4745caa6cc94952379853d93cb3d6',
      elPoints: '53204870187424502529',
      blockNumber: 19164900,
      balance: '33367058267405216659',
      points: '4266729158298773552045911',
      pointsDate: '2024-02-05T22:01:47.000Z',
      recipient: '0xa14ed585b6a4745caa6cc94952379853d93cb3d6',
      referralCount: 0,
      referralPoints: '0',
      referrerCount: 0,
      timestamp: '2024-02-05T22:01:47.000Z',
    },
    {
      id: '19165191:0x2ffda0ec5fbf8b71343483241ebc7a5c1db9e77e',
      elPoints: '108506497805224132',
      blockNumber: 19165191,
      balance: '99829583497192562',
      points: '8325787263665859652806',
      pointsDate: '2024-02-05T23:00:11.000Z',
      recipient: '0x2ffda0ec5fbf8b71343483241ebc7a5c1db9e77e',
      referralCount: 0,
      referralPoints: '0',
      referrerCount: 0,
      timestamp: '2024-02-05T23:00:11.000Z',
    },
    {
      id: '19165191:0xa89e0b7673769472f59e5a0e605745fa5a92432c',
      elPoints: '84928202099174426',
      blockNumber: 19165191,
      balance: '89993866946193920',
      points: '6695543700796827631788',
      pointsDate: '2024-02-05T23:00:11.000Z',
      recipient: '0xa89e0b7673769472f59e5a0e605745fa5a92432c',
      referralCount: 0,
      referralPoints: '0',
      referrerCount: 0,
      timestamp: '2024-02-05T23:00:11.000Z',
    },
    {
      id: '19165191:0x6d5239dead451398115532cfec48a6da59ff0ba7',
      elPoints: '4885203019912718773',
      blockNumber: 19165191,
      balance: '7088986314568352449',
      points: '413996800770791782029126',
      pointsDate: '2024-02-05T23:00:11.000Z',
      recipient: '0x6d5239dead451398115532cfec48a6da59ff0ba7',
      referralCount: 0,
      referralPoints: '0',
      referrerCount: 0,
      timestamp: '2024-02-05T23:00:11.000Z',
    },
    {
      id: '19170241:0xe410a7d0f664ae1ab3a8c9c57a8a3ded1db8c312',
      elPoints: '176769768029826563517',
      blockNumber: 19170241,
      balance: '11046130136168047524',
      points: '10352410150845577109453252',
      pointsDate: '2024-02-06T16:00:11.000Z',
      recipient: '0xe410a7d0f664ae1ab3a8c9c57a8a3ded1db8c312',
      referralCount: 0,
      referralPoints: '0',
      referrerCount: 0,
      timestamp: '2024-02-06T16:00:11.000Z',
    },
  ]),
} as const
