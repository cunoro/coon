// @dev. This script will deploy v2 of Cunoro. It will deploy the whole ecosystem.

const { ethers } = require('hardhat')
const UniswapV2ABI = require('./IUniswapV2Factory.json').abi
const { getAddresses, getQuickSwapAddresses } = require('./addresses')

async function main() {
  const [deployer] = await ethers.getSigners()
  const daoAddr = '0x929A27c46041196e1a49C7B459d63eC9A20cd879'
  console.log('Deploying contracts with the account: ' + deployer.address)

  // Initial staking index
  const initialIndex = '1000000000'

  const { provider } = deployer
  // What epoch will be first epoch
  const firstEpochNumber = '49'
  const firstEpochEndTime = 1637280000 // 2021-11-19 00:00 UTC
  console.log(
    'First epoch timestamp: ' +
      firstEpochEndTime +
      ' ' +
      new Date(firstEpochEndTime * 1000).toUTCString()
  )

  // How many seconds are in each epoch
  const epochLengthInSeconds = 86400 / 3
  // const epochLengthInSeconds = 60*10

  // Initial reward rate for epoch
  const initialRewardRate = '5000'

  // Ethereum 0 address, used when toggling changes in newTreasury
  const zeroAddress = '0x0000000000000000000000000000000000000000'

  // MAI bond BCV
  const maiBondBCV = '300'

  // Bond vesting length in seconds.
  const bondVestingLength = 5 * 24 * 3600

  // Min bond price
  const minBondPrice = '12000'

  // Max bond payout, 1000 = 1% of NORO total supply
  const maxBondPayout = '50'

  // DAO fee for bond
  const bondFee = '10000'

  // Max debt bond can take on
  const maxBondDebt = '8000000000000000'

  // Initial Bond debt
  const initialBondDebt = '0'

  // const warmupPeriod = '3'

  const chainId = (await provider.getNetwork()).chainId
  const oldContractAddresses = getAddresses(chainId)
  const { router: quickswapRouterAddr, factory: quickswapFactoryAddr } =
    getQuickSwapAddresses(chainId)
  const maiAddr = oldContractAddresses.MAI_ADDRESS

  // Deploy NORO v2
  const NORO2 = await ethers.getContractFactory('CunoroClamERC20V2')
  // const newClam = NORO2.attach('0xC250e9987A032ACAC293d838726C511E6E1C029d')
  const newClam = await NORO2.deploy()
  await newClam.deployTransaction.wait()
  console.log('NORO deployed: ' + newClam.address)

  const ClamCirculatingSupply = await ethers.getContractFactory(
    'ClamCirculatingSupply'
  )
  // const noroCirculatingSupply = ClamCirculatingSupply.attach(
  //   '0x99ee91871cf39A44E3Fc842541274d7eA05AE4b3'
  // )
  const noroCirculatingSupply = await ClamCirculatingSupply.deploy(
    deployer.address
  )
  await noroCirculatingSupply.deployTransaction.wait()
  await (await noroCirculatingSupply.initialize(newClam.address)).wait()

  const quickswapFactory = new ethers.Contract(
    quickswapFactoryAddr,
    UniswapV2ABI,
    deployer
  )
  await (await quickswapFactory.createPair(newClam.address, maiAddr)).wait()
  const lpAddress = await quickswapFactory.getPair(newClam.address, maiAddr)
  console.log('LP: ' + lpAddress)

  // Deploy bonding calc
  const BondingCalculator = await ethers.getContractFactory(
    'CunoroBondingCalculator'
  )
  const bondingCalculator = await BondingCalculator.deploy(newClam.address)
  await bondingCalculator.deployTransaction.wait()

  // Deploy newTreasury
  const Treasury = await ethers.getContractFactory('CunoroTreasury')
  const newTreasury = await Treasury.deploy(
    newClam.address,
    maiAddr,
    lpAddress,
    bondingCalculator.address,
    chainId === 80001 ? '0' : '43200' // no time lock for testnet
  )
  await newTreasury.deployTransaction.wait()
  console.log('Treasury deployed: ' + newTreasury.address)

  // Deploy staking distributor
  const StakingDistributor = await ethers.getContractFactory(
    'CunoroStakingDistributor'
  )
  // const stakingDistributor = StakingDistributor.attach(
  //   '0xD42938418E648b981bA2814b0C8b4F6f35CE61B8'
  // )
  const stakingDistributor = await StakingDistributor.deploy(
    newTreasury.address,
    newClam.address,
    epochLengthInSeconds,
    firstEpochEndTime
  )
  await stakingDistributor.deployTransaction.wait()
  console.log('staking distributor: ' + stakingDistributor.address)

  // Deploy sNORO
  const StakedNORO = await ethers.getContractFactory('StakedCunoroClamERC20V2')
  // const sNORO = StakedNORO.attach('0x3949F058238563803b5971711Ad19551930C8209')
  const sNORO = await StakedNORO.deploy()
  await sNORO.deployTransaction.wait()
  console.log('sNOROv2: ' + sNORO.address)

  // Deploy Staking
  const Staking = await ethers.getContractFactory('CunoroStaking')
  // const staking = await Staking.attach(
  //   '0xcF2A11937A906e09EbCb8B638309Ae8612850dBf'
  // )
  const staking = await Staking.deploy(
    newClam.address,
    sNORO.address,
    epochLengthInSeconds,
    firstEpochNumber,
    firstEpochEndTime
  )
  await staking.deployTransaction.wait()
  console.log('staking: ' + staking.address)

  // Deploy staking warmpup
  const StakingWarmup = await ethers.getContractFactory('CunoroStakingWarmup')
  // const stakingWarmup = StakingWarmup.attach(
  //   '0x314de54E2B64E36F4B0c75079C7FB7f894750014'
  // )
  const stakingWarmup = await StakingWarmup.deploy(
    staking.address,
    sNORO.address
  )
  await stakingWarmup.deployTransaction.wait()
  console.log('staking warmup: ' + staking.address)

  // Deploy staking helper
  const StakingHelper = await ethers.getContractFactory('CunoroStakingHelper')
  // const stakingHelper = StakingHelper.attach(
  //   '0x22F587EcF472670c61aa4715d0b76D2fa40A9798'
  // )
  const stakingHelper = await StakingHelper.deploy(
    staking.address,
    newClam.address
  )
  await stakingHelper.deployTransaction.wait()
  console.log('staking helper: ' + stakingHelper.address)

  // Deploy MAI bond
  const MAIBond = await ethers.getContractFactory('CunoroBondDepository')
  // const maiBond = MAIBond.attach('0x28077992bFA9609Ae27458A766470b03D43dEe8A')
  const maiBond = await MAIBond.deploy(
    newClam.address,
    maiAddr,
    newTreasury.address,
    daoAddr,
    zeroAddress
  )
  await maiBond.deployTransaction.wait()
  console.log('mai bond: ' + maiBond.address)

  const MaiClamBond = await ethers.getContractFactory('CunoroBondDepository')
  // const maiClamBond = MaiClamBond.attach(
  //   '0x79B47c03B02019Af78Ee0de9B0b3Ac0786338a0d'
  // )
  const maiClamBond = await MaiClamBond.deploy(
    newClam.address,
    lpAddress,
    newTreasury.address,
    daoAddr,
    bondingCalculator.address
  )
  await maiClamBond.deployTransaction.wait()
  console.log('noro/mai bond: ' + maiClamBond.address)

  const Migrator = await ethers.getContractFactory('ClamTokenMigrator')
  const migrator = await Migrator.deploy(
    oldContractAddresses.NORO_ADDRESS,
    oldContractAddresses.TREASURY_ADDRESS,
    quickswapRouterAddr,
    quickswapFactoryAddr,
    newClam.address,
    newTreasury.address,
    maiAddr
  )
  await migrator.deployTransaction.wait()
  console.log('migrator: ' + migrator.address)

  console.log(
    JSON.stringify({
      sNORO_ADDRESS: sNORO.address,
      NORO_ADDRESS: newClam.address,
      OLD_NORO_ADDRESS: oldContractAddresses.NORO_ADDRESS,
      OLD_SNORO_ADDRESS: oldContractAddresses.sNORO_ADDRESS,
      MAI_ADDRESS: maiAddr,
      TREASURY_ADDRESS: newTreasury.address,
      NORO_BONDING_CALC_ADDRESS: bondingCalculator.address,
      STAKING_ADDRESS: staking.address,
      OLD_STAKING_ADDRESS: oldContractAddresses.STAKING_ADDRESS,
      STAKING_HELPER_ADDRESS: stakingHelper.address,
      MIGRATOR: migrator.address,
      RESERVES: {
        MAI: maiAddr,
        OLD_MAI_NORO: oldContractAddresses.RESERVES.MAI_NORO,
        MAI_NORO: lpAddress,
      },
      BONDS: {
        OLD_MAI: oldContractAddresses.BONDS.MAI,
        MAI: maiBond.address,
        OLD_MAI_NORO: oldContractAddresses.BONDS.MAI_NORO_V2,
        MAI_NORO: maiClamBond.address,
      },
      NORO_CIRCULATING_SUPPLY: noroCirculatingSupply.address,
    })
  )

  await (await sNORO.initialize(staking.address)).wait()

  await (await newTreasury.queue('0', maiBond.address)).wait()
  await (await newTreasury.queue('4', maiClamBond.address)).wait()
  await (await newTreasury.queue('8', stakingDistributor.address)).wait()
  console.log('queue bonds / distributor to new treasury')

  const oldTreasury = Treasury.attach(oldContractAddresses.TREASURY_ADDRESS)
  if (chainId === 80001) {
    await (await oldTreasury.queue('1', migrator.address)).wait()
    await (await oldTreasury.queue('3', migrator.address)).wait()
    await (await oldTreasury.queue('6', migrator.address)).wait()
    console.log('queue migrator as old treasury manager')
  }

  await (await newTreasury.queue('0', migrator.address)).wait()
  await (await newTreasury.queue('4', migrator.address)).wait()
  await (await newTreasury.queue('8', migrator.address)).wait()
  console.log('queue migrator as new treasury depositor')

  // Set staking for bonds
  await (await maiBond.setStaking(stakingHelper.address, true)).wait()
  await (await maiClamBond.setStaking(stakingHelper.address, true)).wait()
  console.log('set staking for bonds')

  // set distributor contract and warmup contract
  await (await staking.setContract('0', stakingDistributor.address)).wait()
  await (await staking.setContract('1', stakingWarmup.address)).wait()
  console.log('set distributor / warmup for staking ')

  // Set newTreasury for NORO token
  await (await newClam.setVault(newTreasury.address)).wait()
  console.log('set vault for noro')

  // Add staking contract as distributor recipient
  await (
    await stakingDistributor.addRecipient(staking.address, initialRewardRate)
  ).wait()
  console.log('add reward rate for staking distributor')

  // TODO: toggle after 43200 blocks
  // toggle bonds / distributor to new treasury
  if (chainId === 80001) {
    await (await newTreasury.toggle('0', maiBond.address, zeroAddress)).wait()
    await (
      await newTreasury.toggle('4', maiClamBond.address, zeroAddress)
    ).wait()
    await (
      await newTreasury.toggle('8', stakingDistributor.address, zeroAddress)
    ).wait()
    console.log('toggle bonds / distributor to new treasury')

    // toggle migrator as old treasury manager
    await (await oldTreasury.toggle('1', migrator.address, zeroAddress)).wait()
    await (await oldTreasury.toggle('3', migrator.address, zeroAddress)).wait()
    await (await oldTreasury.toggle('6', migrator.address, zeroAddress)).wait()
    console.log('toggle migrator as old treasury manager')

    // toggle migrator as new treasury depositor
    await (await newTreasury.toggle('0', migrator.address, zeroAddress)).wait()
    await (await newTreasury.toggle('4', migrator.address, zeroAddress)).wait()
    await (await newTreasury.toggle('8', migrator.address, zeroAddress)).wait()
    console.log('toggle migrator as new treasury depositor')
  }

  await verify(newClam.address, [])
  await verify(sNORO.address, [])
  await verify(noroCirculatingSupply.address, [deployer.address])
  await verify(newTreasury.address, [
    newClam.address,
    maiAddr,
    lpAddress,
    bondingCalculator.address,
    chainId === 80001 ? '0' : '43200', // no time lock for testnet
  ])
  await verify(stakingDistributor.address, [
    newTreasury.address,
    newClam.address,
    epochLengthInSeconds,
    firstEpochEndTime,
  ])
  await verify(staking.address, [
    newClam.address,
    sNORO.address,
    epochLengthInSeconds,
    firstEpochNumber,
    firstEpochEndTime,
  ])
  await verify(stakingWarmup.address, [staking.address, sNORO.address])
  await verify(stakingHelper.address, [staking.address, newClam.address])
  await verify(maiBond.address, [
    newClam.address,
    maiAddr,
    newTreasury.address,
    daoAddr,
    zeroAddress,
  ])
  await verify(maiClamBond.address, [
    newClam.address,
    lpAddress,
    newTreasury.address,
    daoAddr,
    bondingCalculator.address,
  ])
  await verify(migrator.address, [
    oldContractAddresses.NORO_ADDRESS,
    oldContractAddresses.TREASURY_ADDRESS,
    quickswapRouterAddr,
    quickswapFactoryAddr,
    newClam.address,
    newTreasury.address,
    maiAddr,
  ])

  // Set bond terms
  // await (await maiBond.initializeBondTerms(
  //   maiBondBCV,
  //   bondVestingLength,
  //   minBondPrice,
  //   maxBondPayout,
  //   bondFee,
  //   maxBondDebt,
  //   initialBondDebt
  // )).wait()
  // await (await maiClamBond.initializeBondTerms(
  //   '40',
  //   bondVestingLength,
  //   minBondPrice,
  //   maxBondPayout,
  //   bondFee,
  //   maxBondDebt,
  //   initialBondDebt
  // )).wait()

  // Initialize sNORO and set the index
  // await (await sNORO.setIndex(initialIndex)).wait()
}

async function verify(address, constructorArguments) {
  try {
    await hre.run('verify:verify', {
      address,
      constructorArguments,
    })
  } catch (err) {
    console.warn(`verify failed: ${address} ${err.message}`)
  }
}

main()
  .then(() => process.exit())
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
