import axios from 'axios'
import * as fs from 'fs'
import { Dictionary, keyBy } from 'lodash'
import * as path from 'node:path'
import { formatEther } from 'viem'

interface QueryResponse {
  data: {
    lrtSummaries: {
      id: string
      timestamp: string
      blockNumber: number
      balance: string
      points: string
      elPoints: string
    }[]
    lrtPointRecipients: {
      id: string
      balance: string
      elPoints: string
      points: string
      pointsDate: string
    }[]
  }
}

type ResponseRecipient = QueryResponse['data']['lrtPointRecipients']['0']

const main = async () => {
  const data = {
    query:
      'query MyQuery {\n  lrtSummaries(limit: 1, orderBy: id_DESC) {\n    id\n    timestamp\n    blockNumber\n    balance\n    elPoints\n    points\n  }\n  lrtPointRecipients(orderBy: id_ASC) {\n    id\n    elPoints\n    balance\n    points\n    pointsDate\n    referralCount\n    referralPoints\n    referrerCount\n  }\n}\n',
    variables: null,
    operationName: 'MyQuery',
  }
  const prev = await axios.post<QueryResponse>(
    'https://squid.subsquid.io/prime-eth-squid/graphql',
    data,
  )
  const next = await axios.post<QueryResponse>(
    'http://localhost:4350/graphql',
    data,
  )

  const prev_recipients = keyBy(prev.data.data.lrtPointRecipients, 'id')
  const next_recipients = keyBy(next.data.data.lrtPointRecipients, 'id')

  const prev_recipientIds = Object.keys(prev_recipients)
  const next_recipientIds = Object.keys(next_recipients)

  console.log('prev recipients: ' + prev_recipientIds.length)
  console.log('next recipients: ' + next_recipientIds.length)

  const compare = (a: string, b: string) => {
    if (a === b) return 0
    const aNum = Number(a)
    const bNum = Number(b)
    return 1 - aNum / bNum
  }

  const format = (v: string) => formatEther(BigInt(v))
  const dump = (prev: ResponseRecipient, next: ResponseRecipient) => {
    console.log('======prev======')
    console.log('id: ' + prev.id)
    console.log('balance: ' + format(prev.balance))
    console.log('points: ' + format(prev.points))
    console.log('elPoints: ' + format(prev.elPoints))
    console.log('pointsDate: ' + prev.pointsDate)
    console.log('======next======')
    console.log('id: ' + next.id)
    console.log('balance: ' + format(next.balance))
    console.log('points: ' + format(next.points))
    console.log('elPoints: ' + format(next.elPoints))
    console.log('pointsDate: ' + next.pointsDate)
  }

  const points: Dictionary<number> = {}
  const elPoints: Dictionary<[number, number]> = {}

  const aggregate = {
    prev: {
      points: 0n,
      elPoints: 0n,
    },
    next: {
      points: 0n,
      elPoints: 0n,
    },
  }

  for (const id of prev_recipientIds) {
    const prev_recipient = prev_recipients[id]
    const next_recipient = next_recipients[id]
    if (!next_recipient) throw new Error('Missing recipient: ' + id)
    if (prev_recipient.balance !== next_recipient.balance) {
      dump(prev_recipient, next_recipient)
      throw new Error(`Balance mismatch: ${id}`)
    }

    aggregate.prev.points += BigInt(prev_recipient.points)
    aggregate.next.points += BigInt(next_recipient.points)
    aggregate.prev.elPoints += BigInt(prev_recipient.elPoints)
    aggregate.next.elPoints += BigInt(next_recipient.elPoints)

    const pointP = compare(prev_recipient.points, next_recipient.points)
    const elPointP = compare(prev_recipient.elPoints, next_recipient.elPoints)

    points[id] = pointP
    elPoints[id] = [
      elPointP,
      (Number(next_recipient.elPoints) - Number(prev_recipient.elPoints)) /
        1e18,
    ]

    // Temporary holders could have larger percentage differences since the
    //   timeframes of calculation have become more frequent from prev to prev.
    const exceptions = [
      '0x00f6e344277a439395338ff768888f00d20a3c79', // TODO: Manual check required
      '0x0293fafe77e87627af48a55ec2129f769a9cb270',
      '0x03364d3c1411974713a49d5a91d02d8271a1ba00',
      '0x033e556b2b4d0a9444dd1e6e417442a6e907aa0a', // From 0 EL points to 15? What happened?
      '0x05c57f574c5a3cbdb51a3ca2ccbe0171d1f9765a',
      // '0x05c57f574c5a3cbdb51a3ca2ccbe0171d1f9765a', // Gnosis Test from Franck
    ]
    //
    if (false && !(elPointP <= 0.01)) {
      dump(prev_recipient, next_recipient)
      console.log(elPointP)
      if (id === '0xd85a569f3c26f81070544451131c742283360400') {
        console.log(
          'Ignoring mismatch here, known bug in prev and not shown to users.',
        )
      } else if (exceptions.includes(id)) {
        console.log('An exception has been made for this address.')
      } else {
        throw new Error(
          `Points mismatch: ${id} ${format(prev_recipient.points)} ${format(
            next_recipient.points,
          )}`,
        )
      }
    }
  }

  fs.writeFileSync(
    path.join(__dirname, './elPoints.json'),
    JSON.stringify(elPoints, null, 2),
  )
  fs.writeFileSync(
    path.join(__dirname, './points.json'),
    JSON.stringify(points, null, 2),
  )

  console.log(aggregate)

  console.log('=== prev =================')
  console.log(`Sum of recipient EL points: ${aggregate.prev.elPoints}`)
  console.log(
    `Summary shown EL points:    ${next.data.data.lrtSummaries[0].elPoints}`,
  )

  console.log('=== next =================')
  console.log(`Sum of recipient EL points: ${aggregate.next.elPoints}`)
  console.log(
    `Summary shown EL points:    ${next.data.data.lrtSummaries[0].elPoints}`,
  )
}

main()
