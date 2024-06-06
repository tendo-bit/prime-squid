import { fromHex, hexToString, trim } from 'viem'

import { decodeAddress } from '../lrt/utils/encoding'

export const isExactInputSingleTransaction = (
  input: string | undefined | null,
) => {
  return !!input && input.startsWith('0x414bf389')
}

export const getReferrerIdFromExactInputSingle = (
  input: string | undefined | null,
) => {
  // input is 586 char long: 10 for fn sighash + 8 * 64 for args + 64 referrer
  if (input && isExactInputSingleTransaction(input) && input.length === 586) {
    try {
      const hex = `0x${input.slice(-64)}` as `0x${string}`
      const str = hexToString(trim(hex))
      return decodeAddress(str)
    } catch {}
  }

  return undefined
}
