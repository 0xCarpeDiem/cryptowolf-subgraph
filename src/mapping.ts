import {GeneratedResultNFT, HuntingNFT, MintedNFT} from '../generated/HuntingNFT/HuntingNFT'
import {Hunting, HuntingInfo} from '../generated/schema'
import {Address, BigDecimal, BigInt} from '@graphprotocol/graph-ts'

const HUNTING_NFT_ADDR = '0x7b5f99fbc5c1e5b9e75d41b8e56ecb7caf39e4c4'
const contract = HuntingNFT.bind(Address.fromString(HUNTING_NFT_ADDR))

const ZERO = BigInt.zero()
const ONE = BigInt.fromI32(1)

export function handleMintedNFT(event: MintedNFT): void {
  const id = event.params.id
  let hunting = loadOrCreate(id)
  hunting.owner = event.params.to
  updateHunting(id, hunting)
  hunting.save()

  const stats = loadOrCreateInfo(hunting.huntingType)
  stats.count = stats.count.plus(ONE)
  stats.save()
}

export function handleGeneratedResultNFT(event: GeneratedResultNFT): void {
  const id = event.params.tokenId
  let hunting = loadOrCreate(id)
  updateHunting(id, hunting)
  hunting.save()

  const stats = loadOrCreateInfo(hunting.huntingType)
  stats.totalRewards = stats.totalRewards.plus(hunting.reward)
  if (hunting.reward.gt(ZERO)) {
    stats.win = stats.win.plus(ONE)
  } else {
    stats.loss = stats.loss.plus(ONE)
  }
  stats.winPerc = stats.win.toBigDecimal().div(stats.count.toBigDecimal())
  stats.lossPerc = stats.loss.toBigDecimal().div(stats.count.toBigDecimal())
  stats.save()
}

function updateHunting(id: BigInt, hunting: Hunting): void {
  hunting.huntingType = contract.positionToAttack(id)
  hunting.reward = contract.rewards(id)
  hunting.wolfPackId = contract.wolfPackId(id)
  hunting.isGenerated = contract.isGenerated(id)
  hunting.timestamp = contract.dateOfHunting(id)
}

function loadOrCreate(id: BigInt): Hunting {
  let hunting = Hunting.load(id.toHex())
  if (hunting == null) {
    hunting = new Hunting(id.toHex())
  }
  return hunting
}

function loadOrCreateInfo(huntingType: BigInt): HuntingInfo {
  let huntingStats = HuntingInfo.load(huntingType.toHex())
  if (huntingStats == null) {
    huntingStats = new HuntingInfo(huntingType.toHex())
    huntingStats.count = ZERO
    huntingStats.loss = ZERO
    huntingStats.lossPerc = BigDecimal.zero()
    huntingStats.win = ZERO
    huntingStats.winPerc = BigDecimal.zero()
    huntingStats.totalRewards = ZERO
  }
  return huntingStats
}
