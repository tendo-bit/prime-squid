import axios from 'axios'
import { Query, Resolver } from 'type-graphql'
import type { EntityManager } from 'typeorm'
import { formatEther, parseEther } from 'viem'

let resultCache: bigint | undefined = undefined
let resultCacheDate: number | undefined = undefined

@Resolver()
export class EigenLayerResolver {
  constructor(private tx: () => Promise<EntityManager>) {}

  @Query(() => BigInt)
  async totalEigenLayerPoints(): Promise<bigint> {
    if (
      resultCache &&
      resultCacheDate &&
      Date.now() - resultCacheDate < 60000 * 5
    ) {
      return resultCache
    }
    return await fetchEigenLayerPoints()
      .then((r) => {
        resultCache = parseEther(r.toString())
        resultCacheDate = Date.now()
        return resultCache
      })
      .catch((err) => {
        console.log(err)
        return 0n
      })
  }
}

export const fetchEigenLayerPoints = async () => {
  const address = '0x0000000000000000000000000000000000000000'
  const response = await axios.get(
    `https://app.eigenlayer.xyz/api/trpc/tokenStaking.getRestakingPoints,nativeStaking.getNativeStakingSummaryByEigenpod?batch=1&input=%7B"0"%3A%7B"json"%3A%7B"staker"%3A"${address}"%7D%7D%2C"1"%3A%7B"json"%3A%7B"podOwnerAddress"%3A"${address}"%7D%7D%7D`,
    { withCredentials: false },
  )

  const strategies = response.data?.[0]?.result?.data?.json ?? []
  const nativePoints =
    response?.data?.[1]?.result?.data?.json?.globalStats?.points ?? 0

  return strategies.reduce(
    (acc: number, curr: any) =>
      acc + +formatEther(BigInt(curr?.totalIntegratedShares ?? 0)) / 3600,
    nativePoints,
  )
}
