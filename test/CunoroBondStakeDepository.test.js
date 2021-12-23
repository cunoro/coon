const { ethers, timeAndMine } = require('hardhat')
const { expect } = require('chai')
const {
  formatUnits,
  formatEther,
  parseEther,
  parseUnits,
} = require('@ethersproject/units')

describe('CunoroBondStakeDepository', function () {
  // Large number for approval for DAI
  const largeApproval = '100000000000000000000000000000000'

  // What epoch will be first epoch
  const firstEpochNumber = '0'

  // How many seconds are in each epoch
  const epochLength = 86400 / 3

  // Ethereum 0 address, used when toggling changes in treasury
  const zeroAddress = '0x0000000000000000000000000000000000000000'

  // Initial staking index
  const initialIndex = '1737186817'

  const initialRewardRate = '5000'

  let // Used as default deployer for contracts, asks as owner of contracts.
    deployer,
    // Used as the default user for deposits and trade. Intended to be the default regular user.
    depositor,
    dao,
    coon,
    sCoon,
    dai,
    treasury,
    staking,
    daiBond,
    firstEpochTime

  beforeEach(async function () {
    ;[deployer, depositor, dao] = await ethers.getSigners()

    firstEpochTime = (await deployer.provider.getBlock()).timestamp - 100

    const COON = await ethers.getContractFactory('CunoroCoonERC20')
    coon = await COON.deploy()
    await coon.setVault(deployer.address)

    const DAI = await ethers.getContractFactory('DAI')
    dai = await DAI.deploy(0)

    const StakedCOON = await ethers.getContractFactory('StakedCunoroCoonERC20')
    sCoon = await StakedCOON.deploy()

    const Treasury = await ethers.getContractFactory('CunoroTreasury')
    treasury = await Treasury.deploy(
      coon.address,
      dai.address,
      zeroAddress,
      zeroAddress,
      0
    )

    const DAIBond = await ethers.getContractFactory('CunoroBondStakeDepository')
    daiBond = await DAIBond.deploy(
      coon.address,
      sCoon.address,
      dai.address,
      treasury.address,
      dao.address,
      zeroAddress
    )

    const Staking = await ethers.getContractFactory('CunoroStaking')
    staking = await Staking.deploy(
      coon.address,
      sCoon.address,
      epochLength,
      firstEpochNumber,
      firstEpochTime
    )

    const StakingWarmup = await ethers.getContractFactory('CunoroStakingWarmup')
    const stakingWarmup = await StakingWarmup.deploy(
      staking.address,
      sCoon.address
    )

    const StakingDistributor = await ethers.getContractFactory(
      'CunoroStakingDistributor'
    )
    const stakingDistributor = await StakingDistributor.deploy(
      treasury.address,
      coon.address,
      epochLength,
      firstEpochTime
    )
    await stakingDistributor.addRecipient(staking.address, initialRewardRate)

    await sCoon.initialize(staking.address)
    await sCoon.setIndex(initialIndex)

    await staking.setContract('0', stakingDistributor.address)
    await staking.setContract('1', stakingWarmup.address)

    await coon.setVault(treasury.address)

    // queue and toggle deployer reserve depositor
    await treasury.queue('0', deployer.address)
    await treasury.toggle('0', deployer.address, zeroAddress)

    await treasury.queue('0', daiBond.address)
    await treasury.toggle('0', daiBond.address, zeroAddress)

    await treasury.queue('8', stakingDistributor.address)
    await treasury.toggle('8', stakingDistributor.address, zeroAddress)

    await daiBond.setStaking(staking.address)

    // await coon.approve(stakingHelper.address, largeApproval)
    await dai.approve(treasury.address, largeApproval)
    await dai.approve(daiBond.address, largeApproval)
    await dai.connect(depositor).approve(daiBond.address, largeApproval)

    // mint 1,000,000 DAI for testing
    await dai.mint(deployer.address, parseEther(String(100 * 10000)))
    await dai.transfer(depositor.address, parseEther('10000'))
  })

  describe('adjust', function () {
    it('should able to adjust with bcv <= 40', async function () {
      const bcv = 38
      const bondVestingLength = 10
      const minBondPrice = 400 // bond price = $4
      const maxBondPayout = 1000 // 1000 = 1% of COON total supply
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
      const maxBondPayout = 1000 // 1000 = 1% of COON total supply
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
      const maxBondPayout = 1000 // 1000 = 1% of COON total supply
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
    it('failed to redeem not fully vested bond', async function () {
      await treasury.deposit(
        parseEther('10000'),
        dai.address,
        parseUnits('7500', 9)
      )

      const bcv = 300
      const bondVestingLength = 10
      const minBondPrice = 400 // bond price = $4
      const maxBondPayout = 1000 // 1000 = 1% of COON total supply
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

      await daiBond.deposit(parseEther('100'), largeApproval, deployer.address)

      const prevDAOReserve = await coon.balanceOf(dao.address)
      expect(prevDAOReserve).to.eq(parseUnits('25', 9))
      console.log('dao balance: ' + formatUnits(prevDAOReserve, 9))

      await timeAndMine.setTimeIncrease(2)

      await expect(daiBond.redeem(deployer.address, false)).to.be.revertedWith(
        'not fully vested'
      )
    })

    it('should redeem sCOON when vested fully', async function () {
      await treasury.deposit(
        parseEther('10000'),
        dai.address,
        parseUnits('7500', 9)
      )

      const bcv = 300
      const bondVestingLength = 15
      const minBondPrice = 400 // bond price = $4
      const maxBondPayout = 10000 // 1000 = 1% of COON total supply
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

      expect(await daiBond.bondPriceInUSD()).to.eq(parseEther('4'))

      await expect(() =>
        daiBond.deposit(parseEther('1000'), largeApproval, deployer.address)
      ).to.changeTokenBalance(coon, dao, parseUnits('250', 9))

      await timeAndMine.setTimeIncrease(432001)
      await staking.rebase()

      await expect(() =>
        daiBond.redeem(deployer.address, false)
      ).to.changeTokenBalance(sCoon, deployer, parseUnits('265', 9))
    })

    it('should deploy twice and redeem sCOON when vested fully', async function () {
      await treasury.deposit(
        parseEther('100000'),
        dai.address,
        parseUnits('75000', 9)
      )

      const bcv = 300
      const bondVestingLength = 15
      const minBondPrice = 5000 // bond price = $50
      const maxBondPayout = 10000 // 1000 = 1% of COON total supply
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

      expect(await daiBond.bondPriceInUSD()).to.eq(parseEther('50'))

      await expect(() =>
        daiBond.deposit(parseEther('50'), largeApproval, deployer.address)
      ).to.changeTokenBalance(coon, dao, parseUnits('1', 9))
      await expect(() =>
        daiBond
          .connect(depositor)
          .deposit(parseEther('500'), largeApproval, depositor.address)
      ).to.changeTokenBalance(coon, dao, parseUnits('10', 9))

      await timeAndMine.setTimeIncrease(86400)
      await staking.rebase()

      await expect(() =>
        daiBond.deposit(parseEther('3000'), largeApproval, deployer.address)
      ).to.changeTokenBalance(coon, dao, parseUnits('60', 9))

      await timeAndMine.setTimeIncrease(432001)
      await staking.rebase()

      await expect(() =>
        daiBond.redeem(deployer.address, false)
      ).to.changeTokenBalance(sCoon, deployer, '116861328128')

      await expect(() =>
        daiBond.redeem(depositor.address, false)
      ).to.changeTokenBalance(sCoon, depositor, '331847447121')
    })
  })
})
