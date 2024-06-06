import * as fs from 'fs'
import { Dictionary, keyBy } from 'lodash'
import * as path from 'node:path'
import { formatEther } from 'viem'

import * as v5 from './data-v5.json'
import * as v6 from './data-v6.json'

interface Recipient {
  id: string
  balance: string
  elPoints: string
  points: string
  pointsDate: string
}

const v5_recipients = keyBy<Recipient>(v5.data.lrtPointRecipients, 'id')
const v6_recipients = keyBy<Recipient>(v6.data.lrtPointRecipients, 'id')

const v5_recipientIds = Object.keys(v5_recipients)
const v6_recipientIds = Object.keys(v6_recipients)

console.log('v5 recipients: ' + v5_recipientIds.length)
console.log('v6 recipients: ' + v6_recipientIds.length)

const compare = (a: string, b: string) => {
  if (a === b) return 0
  const aNum = Number(a)
  const bNum = Number(b)
  return 1 - aNum / bNum
}

const format = (v: string) => formatEther(BigInt(v))
const dump = (prev: Recipient, next: Recipient) => {
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
  v5: {
    points: 0n,
    elPoints: 0n,
  },
  v6: {
    points: 0n,
    elPoints: 0n,
  },
}

for (const id of v5_recipientIds) {
  const v5_recipient = v5_recipients[id]
  const v6_recipient = v6_recipients[id]
  if (!v6_recipient) throw new Error('Missing recipient: ' + id)
  if (v5_recipient.balance !== v6_recipient.balance) {
    dump(v5_recipient, v6_recipient)
    throw new Error(`Balance mismatch: ${id}`)
  }

  aggregate.v5.points += BigInt(v5_recipient.points)
  aggregate.v6.points += BigInt(v6_recipient.points)
  aggregate.v5.elPoints += BigInt(v5_recipient.elPoints)
  aggregate.v6.elPoints += BigInt(v6_recipient.elPoints)

  const pointP = compare(v5_recipient.points, v6_recipient.points)
  const elPointP = compare(v5_recipient.elPoints, v6_recipient.elPoints)

  points[id] = pointP
  elPoints[id] = [
    elPointP,
    (Number(v6_recipient.elPoints) - Number(v5_recipient.elPoints)) / 1e18,
  ]

  // Temporary holders could have larger percentage differences since the
  //   timeframes of calculation have become more frequent from v5 to v5.
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
    dump(v5_recipient, v6_recipient)
    console.log(elPointP)
    if (id === '0xd85a569f3c26f81070544451131c742283360400') {
      console.log(
        'Ignoring mismatch here, known bug in v5 and not shown to users.',
      )
    } else if (exceptions.includes(id)) {
      console.log('An exception has been made for this address.')
    } else {
      throw new Error(
        `Points mismatch: ${id} ${format(v5_recipient.points)} ${format(
          v6_recipient.points,
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

console.log('=== v5 =================')
console.log(`Sum of recipient EL points: ${aggregate.v5.elPoints}`)
console.log(`Summary shown EL points:    ${v5.data.lrtSummaries[0].elPoints}`)

console.log('=== v6 =================')
console.log(`Sum of recipient EL points: ${aggregate.v6.elPoints}`)
console.log(`Summary shown EL points:    ${v6.data.lrtSummaries[0].elPoints}`)
