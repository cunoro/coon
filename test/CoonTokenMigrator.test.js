const { ethers } = require('hardhat')
const { ContractFactory } = require('ethers')
const { expect } = require('chai')
const { toCoonAmount } = require('./helpers/unit')
const UniswapV2FactoryJson = require('@uniswap/v2-core/build/UniswapV2Factory.json')
const UniswapV2PairJson = require('@uniswap/v2-core/build/UniswapV2Pair.json')
const UniswapV2RouterJson = require('@uniswap/v2-periphery/build/UniswapV2Router02.json')

describe.skip('CoonTokenMigrator', function () {
  // Large number for approval for DAI
  const largeApproval = '100000000000000000000000000000000'

  // Ethereum 0 address, used when toggling changes in treasury
  const zeroAddress = '0x0000000000000000000000000000000000000000'

  let deployer,
    // Used as the default user for deposits and trade. Intended to be the default regular user.
    depositor,
    coon,
    coon2,
    dai,
    lp,
    lp2,
    quickFactory,
    quickRouter,
    treasury,
    treasury2,
    migrator

  beforeEach(async function () {
    deployer = await ethers.getSigner()

    const DAI = await ethers.getContractFactory('DAI')
    dai = await DAI.deploy(0)

    const COON = await ethers.getContractFactory('CunoroCoonERC20')
    coon = await COON.deploy()
    const COON2 = await ethers.getContractFactory('CunoroCoonERC20V2')
    coon2 = await COON2.deploy()

    const UniswapV2FactoryContract = ContractFactory.fromSolidity(
      UniswapV2FactoryJson,
      deployer
    )
    quickFactory = await UniswapV2FactoryContract.deploy(deployer.address)

    const UniswapV2Router = ContractFactory.fromSolidity(
      UniswapV2RouterJson,
      deployer
    )
    quickRouter = await UniswapV2Router.deploy(
      quickFactory.address,
      zeroAddress
    )

    await quickFactory.createPair(coon.address, dai.address)
    const pairAddress = await quickFactory.getPair(coon.address, dai.address)
    const UniswapV2Pair = ContractFactory.fromSolidity(
      UniswapV2PairJson,
      deployer
    )
    lp = UniswapV2Pair.attach(pairAddress)

    await quickFactory.createPair(coon2.address, dai.address)
    const pair2Address = await quickFactory.getPair(coon2.address, dai.address)
    lp2 = UniswapV2Pair.attach(pair2Address)

    const BondingCalculator = await ethers.getContractFactory(
      'CunoroBondingCalculator'
    )
    const bondingCalculator = await BondingCalculator.deploy(coon.address)

    const Treasury = await ethers.getContractFactory('CunoroTreasury')
    treasury = await Treasury.deploy(
      coon.address,
      dai.address,
      lp.address,
      bondingCalculator.address,
      0
    )
    treasury2 = await Treasury.deploy(
      coon2.address,
      dai.address,
      lp2.address,
      bondingCalculator.address,
      0
    )

    const MigratorContract = await ethers.getContractFactory(
      'CoonTokenMigrator'
    )
    migrator = await MigratorContract.deploy(
      coon.address,
      treasury.address,
      quickRouter.address,
      quickFactory.address,
      coon2.address,
      treasury2.address,
      dai.address
    )

    // const StakingDistributor = await ethers.getContractFactory(
    //   'CunoroStakingDistributor'
    // )
    // stakingDistributor = await StakingDistributor.deploy(
    //   treasury.address,
    //   coon.address,
    //   epochLength,
    //   firstEpochTime
    // )

    // const Staking = await ethers.getContractFactory('CunoroStaking')
    // staking = await Staking.deploy(
    //   coon.address,
    //   sCoon.address,
    //   epochLength,
    //   firstEpochNumber,
    //   firstEpochTime
    // )

    // // Deploy staking helper
    // const StakingHelper = await ethers.getContractFactory('CunoroStakingHelper')
    // stakingHelper = await StakingHelper.deploy(staking.address, coon.address)

    // const StakingWarmup = await ethers.getContractFactory('CunoroStakingWarmup')
    // const stakingWarmup = await StakingWarmup.deploy(
    //   staking.address,
    //   sCoon.address
    // )

    // await sCoon.initialize(staking.address)
    // await sCoon.setIndex(initialIndex)

    // await staking.setContract('0', stakingDistributor.address)
    // await staking.setContract('1', stakingWarmup.address)

    // await stakingDistributor.addRecipient(staking.address, initialRewardRate)

    await coon.setVault(treasury.address)
    await coon2.setVault(treasury2.address)

    // queue and toggle deployer reserve depositor
    await treasury.queue('0', deployer.address)
    await treasury.toggle('0', deployer.address, zeroAddress)
    await treasury.queue('4', deployer.address)
    await treasury.toggle('4', deployer.address, zeroAddress)

    // queue and toggle migrator as manager
    await treasury.queue('1', migrator.address)
    await treasury.toggle('1', migrator.address, zeroAddress)
    await treasury.queue('3', migrator.address)
    await treasury.toggle('3', migrator.address, zeroAddress)
    await treasury.queue('6', migrator.address)
    await treasury.toggle('6', migrator.address, zeroAddress)

    // queue and toggle migrator as new treasury depositor
    await treasury2.queue('0', migrator.address)
    await treasury2.toggle('0', migrator.address, zeroAddress)
    await treasury2.queue('4', migrator.address)
    await treasury2.toggle('4', migrator.address, zeroAddress)
    await treasury2.queue('8', migrator.address)
    await treasury2.toggle('8', migrator.address, zeroAddress)

    // await coon.approve(stakingHelper.address, largeApproval)
    await dai.approve(treasury.address, largeApproval)
    await lp.approve(treasury.address, largeApproval)
    await coon.approve(migrator.address, largeApproval)
    await dai.approve(quickRouter.address, largeApproval)
    await coon.approve(quickRouter.address, largeApproval)
    await coon.connect(depositor).approve(migrator.address, largeApproval)

    await dai.mint(
      deployer.address,
      ethers.utils.parseEther(String(1000 * 10000))
    )
  })

  describe('migrate process', function () {
    it('should deposit excess dai to the new treasury', async function () {
      const oldDaiReserve = ethers.utils.parseEther('905126.540522624806525292')
      const oldTotalSupply = ethers.BigNumber.from('387634700303642')
      const profit = oldDaiReserve.div(1e9).sub(oldTotalSupply)
      const oldLPDaiAmount = ethers.utils.parseEther(
        '1328699.790772922615662018'
      )
      const oldLPCoonAmount = toCoonAmount('46983.066687369')

      // deposit DAI and mint COONs
      await expect(() =>
        treasury.deposit(oldDaiReserve, dai.address, profit)
      ).to.changeTokenBalance(coon, deployer, oldTotalSupply)

      // deposit COON/DAI lp
      await quickRouter.addLiquidity(
        dai.address,
        coon.address,
        oldLPDaiAmount,
        oldLPCoonAmount,
        oldLPDaiAmount,
        oldLPCoonAmount,
        deployer.address,
        1000000000000
      )

      const lpBalance = await lp.balanceOf(deployer.address)
      const lpValue = await treasury.valueOfToken(lp.address, lpBalance)
      await treasury.deposit(lpBalance, lp.address, lpValue)

      const oldCoonAmount = await coon.balanceOf(deployer.address)

      // migrate contracts
      await migrator.migrateContracts()

      // migrator should not have any token left
      expect(await lp.balanceOf(migrator.address)).to.eq('0')
      expect(await coon.balanceOf(migrator.address)).to.eq('0')
      expect(await dai.balanceOf(migrator.address)).to.eq('0')
      expect(await coon2.balanceOf(migrator.address)).to.eq('68130326723254')

      // just left enough mai for total supply of old coon
      expect(await dai.balanceOf(treasury.address)).to.eq(
        '340651633616274806525292'
      )
      expect(await coon2.totalSupply()).to.eq(oldTotalSupply.div(5).sub(1))

      // transfer coon to another user
      await coon.transfer(depositor.address, ethers.utils.parseUnits('100', 9))

      // migrate personal
      await migrator.migrate()
      await migrator.connect(depositor).migrate()

      expect(await coon2.balanceOf(deployer.address)).to.eq(
        oldCoonAmount.sub(ethers.utils.parseUnits('100', 9)).div(5)
      )
      expect(await coon2.balanceOf(depositor.address)).to.eq(
        ethers.utils.parseUnits('20', 9)
      )
      expect(await coon.balanceOf(deployer.address)).to.eq('0')
      expect(await coon.balanceOf(depositor.address)).to.eq('0')

      // migrator should not have any token left
      expect(await lp.balanceOf(migrator.address)).to.eq('0')
      expect(await coon.balanceOf(migrator.address)).to.eq('0')
      expect(await dai.balanceOf(migrator.address)).to.eq('0')
      expect(await coon2.balanceOf(migrator.address)).to.eq('0')

      // old coon total supply should be 1, locked in QuickSwap
      expect(await coon.totalSupply()).to.eq('1')

      // old treasury reserve should < 1
      expect(await dai.balanceOf(treasury.address)).to.eq('1806525292')
      expect(await lp.balanceOf(treasury.address)).to.eq('0')

      // new LP open in x5 price
      const [daiAmount, newCoonAmount] = await lp2.getReserves()
      expect(daiAmount).to.eq('1328699790772922447494252')
      expect(newCoonAmount).to.eq(oldLPCoonAmount.div(5))

      // new treasury have the same amount of total reserves
      await treasury2.auditReserves()

      expect(await lp2.balanceOf(treasury2.address)).to.eq(
        '3533451312169791387'
      )
      expect(await dai.balanceOf(treasury2.address)).to.eq(
        '905126540522623000000000'
      )
      expect(await treasury2.totalReserves()).to.eq('1128601623477964')
    })
  })
})
