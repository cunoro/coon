let addresses = {
  sNORO_ADDRESS: '0xAAc144Dc08cE39Ed92182dd85ded60E5000C9e67',
  NORO_ADDRESS: '0xC250e9987A032ACAC293d838726C511E6E1C029d',
  DAI_ADDRESS: '0xa3Fa99A148fA48D14Ed51d610c367C61876997F1',
  TREASURY_ADDRESS: '0x8ce47D56EAa1299d3e06FF3E04637449fFb01C9C',
  NORO_BONDING_CALC_ADDRESS: '0x651125e097D7e691f3Df5F9e5224f0181E3A4a0E',
  STAKING_ADDRESS: '0xC8B0243F350AA5F8B979b228fAe522DAFC61221a',
  STAKING_HELPER_ADDRESS: '0x76B38319483b570B4BCFeD2D35d191d3c9E01691',
  MIGRATOR: '0xDaa1f5036eC158fca9E5ce791ab3e213cD1c41df',
  RESERVES: {
    DAI: '0xa3Fa99A148fA48D14Ed51d610c367C61876997F1',
    DAI_NORO: '0x1581802317f32A2665005109444233ca6E3e2D68',
  },
  BONDS: {
    DAI: '0x603A74Fd527b85E0A1e205517c1f24aC71f5C263',
    DAI_NORO: '0x706587BD39322A6a78ddD5491cDbb783F8FD983E',
  },
  NORO_CIRCULATING_SUPPLY: '0x99ee91871cf39A44E3Fc842541274d7eA05AE4b3',
}

const { BigNumber } = ethers
const [deployer] = await ethers.getSigners()
const ITraderJoePair = require('./scripts/ITraderJoePair.json').abi

const lp = new ethers.Contract(
  addresses.RESERVES.DAI_NORO,
  ITraderJoePair,
  deployer
)
const NORO = await ethers.getContractFactory('CunoroNoroERC20')
const noro = await NORO.attach(addresses.NORO_ADDRESS)

const DAI = await ethers.getContractFactory('DAI')
const dai = DAI.attach(addresses.DAI_ADDRESS)

const Treasury = await ethers.getContractFactory('CunoroTreasury')
const treasury = Treasury.attach(addresses.TREASURY_ADDRESS)

const Staking = await ethers.getContractFactory('CunoroStaking')
const staking = Staking.attach(addresses.STAKING_ADDRESS)

const StakingDistributor = await ethers.getContractFactory(
  'CunoroStakingDistributor'
)
const stakingDistributor = StakingDistributor.attach(
  await staking.distributor()
)

const DAIBond = await ethers.getContractFactory('CunoroBondDepository')
const daiBond = DAIBond.attach(addresses.BONDS.DAI)

const LPBond = await ethers.getContractFactory('CunoroBondDepository')
const lpBond = LPBond.attach(addresses.BONDS.DAI_NORO)

const Migrator = await ethers.getContractFactory('NoroTokenMigrator')
const migrator = Migrator.attach(addresses.MIGRATOR)

module.exports = {
  lp,
  noro,
  dai,
  treasury,
  staking,
  daiBond,
  lpBond,
}
