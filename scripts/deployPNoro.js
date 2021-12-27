// @dev. This script will deploy pNORO contracts

const { BigNumber } = require('@ethersproject/bignumber')
const { ethers } = require('hardhat')
const AVALANCHE_MAINNET = {
  sNORO_ADDRESS: '0xAAc144Dc08cE39Ed92182dd85ded60E5000C9e67',
  NORO_ADDRESS: '0xC250e9987A032ACAC293d838726C511E6E1C029d',
  OLD_NORO_ADDRESS: '0x4d6A30EFBE2e9D7A9C143Fce1C5Bb30d9312A465',
  OLD_SNORO_ADDRESS: '0x3949F058238563803b5971711Ad19551930C8209',
  MAI_ADDRESS: '0xa3Fa99A148fA48D14Ed51d610c367C61876997F1',
  TREASURY_ADDRESS: '0x8ce47D56EAa1299d3e06FF3E04637449fFb01C9C',
  OLD_TREASURY: '0xab328Ca61599974b0f577d1F8AB0129f2842d765',
  NORO_BONDING_CALC_ADDRESS: '0x651125e097D7e691f3Df5F9e5224f0181E3A4a0E',
  STAKING_ADDRESS: '0xC8B0243F350AA5F8B979b228fAe522DAFC61221a',
  OLD_STAKING_ADDRESS: '0xcF2A11937A906e09EbCb8B638309Ae8612850dBf',
  STAKING_HELPER_ADDRESS: '0x76B38319483b570B4BCFeD2D35d191d3c9E01691',
  MIGRATOR: '0xDaa1f5036eC158fca9E5ce791ab3e213cD1c41df',
  RESERVES: {
    MAI: '0xa3Fa99A148fA48D14Ed51d610c367C61876997F1',
    OLD_MAI_NORO: '0x8094f4C9a4C8AD1FF4c6688d07Bd90f996C7CA21',
    MAI_NORO: '0x1581802317f32A2665005109444233ca6E3e2D68',
  },
  BONDS: {
    MAI: '0x603A74Fd527b85E0A1e205517c1f24aC71f5C263',
    MAI_NORO: '0x706587BD39322A6a78ddD5491cDbb783F8FD983E',
    OLD_MAI: '0x28077992bFA9609Ae27458A766470b03D43dEe8A',
    OLD_MAI_NORO: '0x79B47c03B02019Af78Ee0de9B0b3Ac0786338a0d',
    OLD_MAI_NORO_V2: '0x603A74Fd527b85E0A1e205517c1f24aC71f5C263',
  },
  NORO_CIRCULATING_SUPPLY: '0x99ee91871cf39A44E3Fc842541274d7eA05AE4b3',
  IDO: '0x7f637ea843405dff10592f894292a8f1188166f9',
}

const daoAddr = '0x929A27c46041196e1a49C7B459d63eC9A20cd879'

async function main() {
  const [deployer] = await ethers.getSigners()

  const addresses = AVALANCHE_MAINNET

  console.log('Deploying contracts with the account: ' + deployer.address)

  const PreCunoroNoroERC20 = await ethers.getContractFactory('PreCunoroNoroERC20')
  const pNoro = await PreCunoroNoroERC20.deploy()
  await pNoro.deployTransaction.wait()
  console.log('pNORO deployed at: ' + pNoro.address)
  await (
    await pNoro.transfer(
      daoAddr,
      BigNumber.from(700000000).mul(BigNumber.from(10).pow(18))
    )
  ).wait()

  const ExercisePreNoro = await ethers.getContractFactory('ExercisePreNoro')
  const exercisePreNoro = await ExercisePreNoro.deploy(
    pNoro.address,
    addresses.NORO_ADDRESS,
    addresses.MAI_ADDRESS,
    addresses.TREASURY_ADDRESS,
    addresses.NORO_CIRCULATING_SUPPLY
  )
  await exercisePreNoro.deployTransaction.wait()
  console.log('exercisePreNoro deployed at: ' + exercisePreNoro.address)

  await (
    await exercisePreNoro.setTerms(
      deployer.address,
      '300000000000000000000000000',
      '50000'
    )
  ).wait()

  const Treasury = await ethers.getContractFactory('CunoroTreasury')
  const treasury = Treasury.attach(addresses.TREASURY_ADDRESS)
  await (await treasury.queue('0', exercisePreNoro.address)).wait()
  // TODO: toggle after 43200 blocks
  // await (await treasury.toggle('0', exercisePreNoro.address)).wait()
}

main()
  .then(() => process.exit())
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
