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
    FRAX: '0x45c32fa6df82ead1e2ef74d17b76547eddfaff89',
    FRAX_NORO: '0x1f847e05afaf47ec54626928d0e6c235663e938f',
  },
  BONDS: {
    DAI: '0x603A74Fd527b85E0A1e205517c1f24aC71f5C263',
    DAI_NORO: '0x706587BD39322A6a78ddD5491cDbb783F8FD983E',
  },
  NORO_CIRCULATING_SUPPLY: '0x99ee91871cf39A44E3Fc842541274d7eA05AE4b3',
}

const zeroAddress = '0x0000000000000000000000000000000000000000'
const daoAddr = '0x929a27c46041196e1a49c7b459d63ec9a20cd879'
const reserveAddr = '0x3fcc446c70489610462be9d61528c51151aca49f'
const oracleAddr = '0xAB594600376Ec9fD91F8e885dADF0CE036862dE0'
const isLPBond = true

async function main() {
  const Treasury = await ethers.getContractFactory('CunoroTreasury')
  const treasury = Treasury.attach(addresses.TREASURY_ADDRESS)

  let AvaxBondDepository = await ethers.getContractFactory(
    'CunoroAvaxLPBondDepository'
  )
  let bond = AvaxBondDepository.attach('0x1dAc605bDD4e8F3ab23da9B360e672f4e973A196')
  // const bond = await AvaxBondDepository.deploy(
  //   addresses.NORO_ADDRESS,
  //   addresses.sNORO_ADDRESS,
  //   reserveAddr,
  //   addresses.TREASURY_ADDRESS,
  //   addresses.STAKING_ADDRESS,
  //   addresses.NORO_BONDING_CALC_ADDRESS,
  //   daoAddr,
  //   oracleAddr
  // )
  // await bond.deployTransaction.wait()

  console.log('Bond deployed at: ' + bond.address)

  await hre.run('verify:verify', {
    address: bond.address,
    constructorArguments: [
      addresses.NORO_ADDRESS,
      addresses.sNORO_ADDRESS,
      reserveAddr,
      addresses.TREASURY_ADDRESS,
      addresses.STAKING_ADDRESS,
      addresses.NORO_BONDING_CALC_ADDRESS,
      daoAddr,
      oracleAddr,
    ],
  })

  // await treasury.toggle('0', daiBond.address, zeroAddress)
  // await treasury.toggle('2', reserveAddr, zeroAddress)

  // const tokenMinPrice = '5000'
  // await daiBond.initializeBondTerms(
  //   '120',
  //   5 * 24 * 3600,
  //   tokenMinPrice,
  //   '50',
  //   '10000',
  //   '8000000000000000',
  //   '0'
  // )
}

main()
  .then(() => console.log('done'))
  .catch((err) => console.error(err))
