const { ethers, timeAndMine } = require('hardhat')
const { expect } = require('chai')
const { BigNumber } = require('@ethersproject/bignumber')
const { formatUnits, formatEther } = require('@ethersproject/units')

describe('Bonding', function () {
  // Large number for approval for DAI
  const largeApproval = '100000000000000000000000000000000'

  // What epoch will be first epoch
  const firstEpochNumber = '0'

  // How many seconds are in each epoch
  const epochLength = 86400 / 3

  // Ethereum 0 address, used when toggling changes in treasury
  const zeroAddress = '0x0000000000000000000000000000000000000000'

  // Initial staking index
  const initialIndex = '1000000000'

  const daoAddr = '0x176311b81309240a8700BCC6129D5dF85087358D'

  let // Used as default deployer for contracts, asks as owner of contracts.
    deployer,
    // Used as the default user for deposits and trade. Intended to be the default regular user.
    noro,
    sNoro,
    dai,
    treasury,
    staking,
    stakingHelper,
    daiBond,
    firstEpochTime

  beforeEach(async function () {
    deployer = await ethers.getSigner()

    firstEpochTime = (await deployer.provider.getBlock()).timestamp - 100

    const NORO = await ethers.getContractFactory('CunoroNoroERC20')
    noro = await NORO.deploy()
    await noro.setVault(deployer.address)

    const DAI = await ethers.getContractFactory('DAI')
    dai = await DAI.deploy(0)

    const StakedNORO = await ethers.getContractFactory('StakedCunoroNoroERC20')
    sNoro = await StakedNORO.deploy()

    const Treasury = await ethers.getContractFactory('CunoroTreasury')
    treasury = await Treasury.deploy(
      noro.address,
      dai.address,
      zeroAddress,
      zeroAddress,
      0
    )

    const DAIBond = await ethers.getContractFactory('CunoroBondDepository')
    daiBond = await DAIBond.deploy(
      noro.address,
      dai.address,
      treasury.address,
      daoAddr,
      zeroAddress
    )

    const Staking = await ethers.getContractFactory('CunoroStaking')
    staking = await Staking.deploy(
      noro.address,
      sNoro.address,
      epochLength,
      firstEpochNumber,
      firstEpochTime
    )

    // Deploy staking helper
    const StakingHelper = await ethers.getContractFactory('CunoroStakingHelper')
    stakingHelper = await StakingHelper.deploy(staking.address, noro.address)

    const StakingWarmup = await ethers.getContractFactory('CunoroStakingWarmup')
    const stakingWarmup = await StakingWarmup.deploy(
      staking.address,
      sNoro.address
    )

    await sNoro.initialize(staking.address)
    await sNoro.setIndex(initialIndex)

    await staking.setContract('1', stakingWarmup.address)

    await noro.setVault(treasury.address)

    // queue and toggle deployer reserve depositor
    await treasury.queue('0', deployer.address)
    await treasury.toggle('0', deployer.address, zeroAddress)

    await treasury.queue('0', daiBond.address)
    await treasury.toggle('0', daiBond.address, zeroAddress)

    await daiBond.setStaking(stakingHelper.address, true)

    await noro.approve(stakingHelper.address, largeApproval)
    await dai.approve(treasury.address, largeApproval)
    await dai.approve(daiBond.address, largeApproval)

    // mint 1,000,000 DAI for testing
    await dai.mint(
      deployer.address,
      BigNumber.from(100 * 10000).mul(BigNumber.from(10).pow(18))
    )
  })

  describe('adjust', function () {
    it('should able to adjust with bcv <= 40', async function () {
      const bcv = 38
      const bondVestingLength = 10
      const minBondPrice = 400 // bond price = $4
      const maxBondPayout = 1000 // 1000 = 1% of NORO total supply
      const daoFee = 10000 // DAO fee for bond
      const maxBondDebt = '8000000000000000'
      const initialBondDebt = 0
      await daiBond.initializeBondTerms(
        bcv,
        bondVestingLength,
        minBondPrice,
        maxBondPayout, // Max bond payout,
        daoFee,
        maxBondDebt,
        initialBondDebt
      )

      await daiBond.setAdjustment(true, 1, 50, 0)
      const adjustment = await daiBond.adjustment()
      expect(adjustment[0]).to.be.true
      expect(adjustment[1]).to.eq(1)
      expect(adjustment[2]).to.eq(50)
      expect(adjustment[3]).to.eq(0)
    })

    it('should failed to adjust with too large increment', async function () {
      const bcv = 100
      const bondVestingLength = 10
      const minBondPrice = 400 // bond price = $4
      const maxBondPayout = 1000 // 1000 = 1% of NORO total supply
      const daoFee = 10000 // DAO fee for bond
      const maxBondDebt = '8000000000000000'
      const initialBondDebt = 0
      await daiBond.initializeBondTerms(
        bcv,
        bondVestingLength,
        minBondPrice,
        maxBondPayout, // Max bond payout,
        daoFee,
        maxBondDebt,
        initialBondDebt
      )

      await expect(daiBond.setAdjustment(true, 3, 50, 0)).to.be.revertedWith(
        'Increment too large'
      )
    })

    it('should be able to adjust with normal increment', async function () {
      const bcv = 100
      const bondVestingLength = 10
      const minBondPrice = 400 // bond price = $4
      const maxBondPayout = 1000 // 1000 = 1% of NORO total supply
      const daoFee = 10000 // DAO fee for bond
      const maxBondDebt = '8000000000000000'
      const initialBondDebt = 0
      await daiBond.initializeBondTerms(
        bcv,
        bondVestingLength,
        minBondPrice,
        maxBondPayout, // Max bond payout,
        daoFee,
        maxBondDebt,
        initialBondDebt
      )

      await daiBond.setAdjustment(false, 2, 80, 3)
      const adjustment = await daiBond.adjustment()
      expect(adjustment[0]).to.be.false
      expect(adjustment[1]).to.eq(2)
      expect(adjustment[2]).to.eq(80)
      expect(adjustment[3]).to.eq(3)
    })
  })

  describe('deposit', function () {
    it('should get vested fully', async function () {
      await treasury.deposit(
        BigNumber.from(10000).mul(BigNumber.from(10).pow(18)),
        dai.address,
        BigNumber.from(7500).mul(BigNumber.from(10).pow(9))
      )

      const bcv = 300
      const bondVestingLength = 10
      const minBondPrice = 400 // bond price = $4
      const maxBondPayout = 1000 // 1000 = 1% of NORO total supply
      const daoFee = 10000 // DAO fee for bond
      const maxBondDebt = '8000000000000000'
      const initialBondDebt = 0
      await daiBond.initializeBondTerms(
        bcv,
        bondVestingLength,
        minBondPrice,
        maxBondPayout, // Max bond payout,
        daoFee,
        maxBondDebt,
        initialBondDebt
      )

      let bondPrice = await daiBond.bondPriceInUSD()
      console.log('bond price: ' + formatEther(bondPrice))

      let depositAmount = BigNumber.from(100).mul(BigNumber.from(10).pow(18))
      await daiBond.deposit(depositAmount, largeApproval, deployer.address)

      const prevDAOReserve = await noro.balanceOf(daoAddr)
      expect(prevDAOReserve).to.eq(
        BigNumber.from(25).mul(BigNumber.from(10).pow(9))
      )
      console.log('dao balance: ' + formatUnits(prevDAOReserve, 9))

      await timeAndMine.setTimeIncrease(2)

      await expect(() =>
        daiBond.redeem(deployer.address, false)
      ).to.changeTokenBalance(
        noro,
        deployer,
        BigNumber.from(5).mul(BigNumber.from(10).pow(9))
      )

      // bond 2nd times
      bondPrice = await daiBond.bondPriceInUSD()
      console.log('bond price: ' + formatEther(bondPrice))

      depositAmount = BigNumber.from(100).mul(BigNumber.from(10).pow(18))

      await daiBond.deposit(depositAmount, largeApproval, deployer.address)
      console.log(
        'dao balance: ' + formatUnits(await noro.balanceOf(daoAddr), 9)
      )
      expect(await noro.balanceOf(daoAddr)).to.eq('35834236186')

      await timeAndMine.setTimeIncrease(20)
      await expect(() =>
        daiBond.redeem(deployer.address, false)
      ).to.changeTokenBalance(noro, deployer, '30834236186')
    })

    it('should get vested partially', async function () {
      await treasury.deposit(
        BigNumber.from(10000).mul(BigNumber.from(10).pow(18)),
        dai.address,
        BigNumber.from(7500).mul(BigNumber.from(10).pow(9))
      )

      const bcv = 300
      const bondVestingLength = 10
      const minBondPrice = 400 // bond price = $4
      const maxBondPayout = 1000 // 1000 = 1% of NORO total supply
      const daoFee = 10000 // DAO fee for bond
      const maxBondDebt = '8000000000000000'
      const initialBondDebt = 0
      await daiBond.initializeBondTerms(
        bcv,
        bondVestingLength,
        minBondPrice,
        maxBondPayout, // Max bond payout,
        daoFee,
        maxBondDebt,
        initialBondDebt
      )

      const bondPrice = await daiBond.bondPriceInUSD()

      const depositAmount = BigNumber.from(100).mul(BigNumber.from(10).pow(18))
      const totalNoro = depositAmount
        .div(bondPrice)
        .mul(BigNumber.from(10).pow(9))
      await daiBond.deposit(depositAmount, largeApproval, deployer.address)

      // vested 20%
      await timeAndMine.setTimeIncrease(2)
      await expect(() =>
        daiBond.redeem(deployer.address, false)
      ).to.changeTokenBalance(noro, deployer, totalNoro.div(5))

      // fully vested, get rest 80%
      await timeAndMine.setTimeIncrease(10)
      await expect(() =>
        daiBond.redeem(deployer.address, false)
      ).to.changeTokenBalance(noro, deployer, totalNoro - totalNoro.div(5))
    })

    it('should staked directly', async function () {
      await treasury.deposit(
        BigNumber.from(10000).mul(BigNumber.from(10).pow(18)),
        dai.address,
        BigNumber.from(7500).mul(BigNumber.from(10).pow(9))
      )

      const bcv = 300
      const bondVestingLength = 10
      const minBondPrice = 400 // bond price = $4
      const maxBondPayout = 1000 // 1000 = 1% of NORO total supply
      const daoFee = 10000 // DAO fee for bond
      const maxBondDebt = '8000000000000000'
      const initialBondDebt = 0
      await daiBond.initializeBondTerms(
        bcv,
        bondVestingLength,
        minBondPrice,
        maxBondPayout, // Max bond payout,
        daoFee,
        maxBondDebt,
        initialBondDebt
      )

      let bondPrice = await daiBond.bondPriceInUSD()
      console.log('bond price: ' + formatEther(bondPrice))

      let depositAmount = BigNumber.from(100).mul(BigNumber.from(10).pow(18))
      await daiBond.deposit(depositAmount, largeApproval, deployer.address)

      const prevDAOReserve = await noro.balanceOf(daoAddr)
      expect(prevDAOReserve).to.eq(
        BigNumber.from(25).mul(BigNumber.from(10).pow(9))
      )
      console.log('dao balance: ' + formatUnits(prevDAOReserve, 9))

      await timeAndMine.setTimeIncrease(2)

      await daiBond.redeem(deployer.address, true)

      expect(await sNoro.balanceOf(deployer.address)).to.eq('5000000000')
    })
  })
})
