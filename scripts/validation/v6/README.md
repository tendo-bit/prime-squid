Executing: `ts-node scripts/validation/v6/compare.ts`

Dataset queries:

```graphql
query MyQuery {
  lrtSummaries(limit: 1, orderBy: id_DESC) {
    id
    timestamp
    blockNumber
    balance
    elPoints
    points
  }
  lrtPointRecipients(orderBy: id_ASC) {
    id
    elPoints
    balance
    points
    pointsDate
    referralCount
    referralPoints
    referrerCount
  }
}
```

