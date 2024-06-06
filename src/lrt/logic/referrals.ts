import { isAddress } from 'viem'

import { decodeAddress, encodeAddress } from '../utils/encoding'

export interface ReferrerData {
  referralId: string
  address: string
  referrerMultiplier: bigint
}

export const referrerList: ReferrerData[] = [
  // Tests
  // {
  //   referralId: 'Origin',
  //   address: '0xF92aaa76e61af8dD5E1eFC888EACEb229d4a6795'.toLowerCase(),
  //   referrerMultiplier: 10n,
  // },

  // Official
  {
    referralId: 'alexwacy',
    address: '0x769c1c6754308B71b9080476dC5bE43Fc07805fc',
    referrerMultiplier: 10n,
  },
  {
    referralId: 'gideon',
    address: '0xCc263863362fe3d31784cb467111dE8eD9C95FB1',
    referrerMultiplier: 10n,
  },
  {
    referralId: 'xeus',
    address: '0x6bccf642b6bcb4e0c8ac490ead141dedd03a4c4f',
    referrerMultiplier: 10n,
  },
  {
    referralId: 'potens',
    address: '0x5a6DB0FF376b539d0dc1202c20Ab3efDAc81482d',
    referrerMultiplier: 10n,
  },
  {
    referralId: 'hermes',
    address: '0x9E4C537E9bAc8799E5dc2355219f21338f4801eA',
    referrerMultiplier: 10n,
  },
  {
    referralId: 'michael',
    address: '0x15e243363d02b57d1e8ad83ad1898f9eea8929f4',
    referrerMultiplier: 10n,
  },
  {
    referralId: 'davidgmi',
    address: '0xCE381A18BcE0A27e6a5DBCef8b7f58b425bc9d93',
    referrerMultiplier: 10n,
  },
  {
    referralId: 'tanaka',
    address: '0x313e2223436e151C6B4167c63a5e0324aC8FbcED',
    referrerMultiplier: 10n,
  },
  {
    referralId: 'salazar',
    address: '0x9Ef9e304E1f8E9792005aBf5d01241b1E9CEDD1b',
    referrerMultiplier: 10n,
  },
  {
    referralId: 'cryptonova',
    address: '0xb338B3177B1668eb4c921c5971853712Ae1F7219',
    referrerMultiplier: 10n,
  },
  {
    referralId: 'resdegen',
    address: '0xf8d1AE33b2454548939f8C8B08a2f07fD0535805',
    referrerMultiplier: 10n,
  },
  {
    referralId: 'brill',
    address: '0xb5a35e549d114923a7c60cdc70ce9fd4e1048c17',
    referrerMultiplier: 10n,
  },
  {
    referralId: 'marsdefi',
    address: '0x0Eb904f5d2CBA4FD6425097E091Bd5dd109C87fD',
    referrerMultiplier: 10n,
  },
  {
    referralId: 'viktordefi',
    address: '0xDcf8c3e582198a20559a5952145680510209b9b8',
    referrerMultiplier: 10n,
  },
  {
    referralId: 'arndxt',
    address: '0xce76ebf1c9fb4a4bde0b4256c3814ca5cb938914',
    referrerMultiplier: 10n,
  },
  {
    referralId: 'bmsbonus',
    address: '0x156B1156833aBEA5c5779ee8FD88edc21CADcf23',
    referrerMultiplier: 10n,
  },
  {
    referralId: 'stacymuur',
    address: '0xaA9543F2eFF0e7A4b267F839612945841172B02F',
    referrerMultiplier: 10n,
  },
  {
    referralId: 'shoal',
    address: '0x0E99f7d366711f8cCf05Eaf871f72D37AbEC1937',
    referrerMultiplier: 10n,
  },
  {
    referralId: 'rethboost',
    address: '0xdead000000000000000000000000000000000001',
    referrerMultiplier: 10n,
  },
  {
    referralId: 'ethxboost',
    address: '0xdead000000000000000000000000000000000002',
    referrerMultiplier: 10n,
  },
  {
    referralId: 'exodus',
    address: '0xdB2e6ef9a200D4F7330C900623382a14F1cE091C',
    referrerMultiplier: 10n,
  },
  // Native Staking
  {
    referralId: 'ashraf',
    address: '0xc6CA1Ee4583fBdb912c74b6Bf3aA2A6a4dA10E22',
    referrerMultiplier: 10n,
  },
  {
    referralId: 'zcrypto',
    address: '0xFA2CEE4C10CE5E9c81E2C6d87567f8C87ECfF555',
    referrerMultiplier: 10n,
  },
  {
    referralId: 'mrcrypto',
    address: '0x519e9aa581e8a00cf4aa51ffc85b5e2bd2beca75',
    referrerMultiplier: 10n,
  },
  {
    referralId: 'yahya',
    address: '0x249265F9B06d2F7Ab5282126786ae3F73b1Ddd29',
    referrerMultiplier: 10n,
  },
  {
    referralId: 'nickypham',
    address: '0x7A510789FF98074bC6A75B06D0f447c7BA8b6842',
    referrerMultiplier: 10n,
  },
  {
    referralId: 'banklessdiscord',
    address: '0xdead000000000000000000000000000000000003',
    referrerMultiplier: 10n,
  },
  {
    referralId: 'banklesspod',
    address: '0xdead000000000000000000000000000000000004',
    referrerMultiplier: 10n,
  },
  {
    referralId: 'banklessnl',
    address: '0xdead000000000000000000000000000000000005',
    referrerMultiplier: 10n,
  },
].map((o) => ({ ...o, address: o.address.toLowerCase() }))

export const getReferralDataForRecipient = (recipient: string) => {
  return referrerList.filter((r) => r.address === recipient)
}

export const getReferralDataForReferralCodes = (referralId: string) => {
  const entry = referrerList.find((r) => r.referralId === referralId)
  if (entry)
    return {
      referralId,
      address: entry.address,
      outgoingReferralMultiplier: entry.referrerMultiplier,
      valid: true,
    }
  if (isAddress(referralId))
    return {
      referralId: encodeAddress(referralId),
      address: referralId,
      outgoingReferralMultiplier: 0n,
      valid: true,
    }
  try {
    const decodedAddress = decodeAddress(referralId)
    if (isAddress(decodedAddress)) {
      return {
        referralId,
        address: decodedAddress,
        outgoingReferralMultiplier: 0n,
        valid: true,
      }
    } else {
      return {
        referralId,
        address: undefined,
        outgoingReferralMultiplier: 0n,
        valid: false,
      }
    }
  } catch (err) {
    return {
      referralId,
      address: undefined,
      outgoingReferralMultiplier: 0n,
      valid: false,
    }
  }
}

export const isValidReferralId = (referralId: string) => {
  return getReferralDataForReferralCodes(referralId).valid
}

export const isReferralSelfReferencing = (
  referralId: string,
  recipient: string,
) => {
  const data = getReferralDataForReferralCodes(referralId)
  if (!data) return false
  return data.address?.toLowerCase() === recipient
}
