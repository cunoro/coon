const { ethers } = require('hardhat')
const { ContractFactory } = require('ethers')
const { expect } = require('chai')
const { toNoroAmount } = require('./helpers/unit')
const UniswapV2FactoryJson = require('@uniswap/v2-core/build/UniswapV2Factory.json')
const UniswapV2PairJson = require('@uniswap/v2-core/build/UniswapV2Pair.json')
const UniswapV2RouterJson = require('@uniswap/v2-periphery/build/UniswapV2Router02.json')

describe.skip('NoroTokenMigrator', function () {
  // Large number for approval for DAI
  const largeApproval = '100000000000000000000000000000000'

  // Ethereum 0 address, used when toggling changes in treasury
  const zeroAddress = '0x0000000000000000000000000000000000000000'

  let deployer,
    // Used as the default user for deposits and trade. Intended to be the default regular user.
    depositor,
    noro,
    noro2,
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

    const NORO = await ethers.getContractFactory('CunoroNoroERC20')
    noro = await NORO.deploy()
    const NORO2 = await ethers.getContractFactory('CunoroNoroERC20V2')
    noro2 = await NORO2.deploy()

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

    await quickFactory.createPair(noro.address, dai.address)
    const pairAddress = await quickFactory.getPair(noro.address, dai.address)
    const UniswapV2Pair = ContractFactory.fromSolidity(
      UniswapV2PairJson,
      deployer
    )
    lp = UniswapV2Pair.attach(pairAddress)

    await quickFactory.createPair(noro2.address, dai.address)
    const pair2Address = await quickFactory.getPair(noro2.address, dai.address)
    lp2 = UniswapV2Pair.attach(pair2Address)

    const BondingCalculator = await ethers.getContractFactory(
      'CunoroBondingCalculator'
    )
    const bondingCalculator = await BondingCalculator.deploy(noro.address)

    const Treasury = await ethers.getContractFactory('CunoroTreasury')
    treasury = await Treasury.deploy(
      noro.address,
      dai.address,
      lp.address,
      bondingCalculator.address,
      0
    )
    treasury2 = await Treasury.deploy(
      noro2.address,
      dai.address,
      lp2.address,
      bondingCalculator.address,
      0
    )

    const MigratorContract = await ethers.getContractFactory(
      'NoroTokenMigrator'
    )
    migrator = await MigratorContract.deploy(
      noro.address,
      treasury.address,
      quickRouter.address,
      quickFactory.address,
      noro2.address,
      treasury2.address,
      dai.address
    )

    // const StakingDistributor = await ethers.getContractFactory(
    //   'CunoroStakingDistributor'
    // )
    // stakingDistributor = await StakingDistributor.deploy(
    //   treasury.address,
    //   noro.address,
    //   epochLength,
    //   firstEpochTime
    // )

    // const Staking = await ethers.getContractFactory('CunoroStaking')
    // staking = await Staking.deploy(
    //   noro.address,
    //   sNoro.address,
    //   epochLength,
    //   firstEpochNumber,
    //   firstEpochTime
    // )

    // // Deploy staking helper
    // const StakingHelper = await ethers.getContractFactory('CunoroStakingHelper')
    // stakingHelper = await StakingHelper.deploy(staking.address, noro.address)

    // const StakingWarmup = await ethers.getContractFactory('CunoroStakingWarmup')
    // const stakingWarmup = await StakingWarmup.deploy(
    //   staking.address,
    //   sNoro.address
    // )

    // await sNoro.initialize(staking.address)
    // await sNoro.setIndex(initialIndex)

    // await staking.setContract('0', stakingDistributor.address)
    // await staking.setContract('1', stakingWarmup.address)

    // await stakingDistributor.addRecipient(staking.address, initialRewardRate)

    await noro.setVault(treasury.address)
    await noro2.setVault(treasury2.address)

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

    // await noro.approve(stakingHelper.address, largeApproval)
    await dai.approve(treasury.address, largeApproval)
    await lp.approve(treasury.address, largeApproval)
    await noro.approve(migrator.address, largeApproval)
    await dai.approve(quickRouter.address, largeApproval)
    await noro.approve(quickRouter.address, largeApproval)
    await noro.connect(depositor).approve(migrator.address, largeApproval)

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
      const oldLPNoroAmount = toNoroAmount('46983.066687369')

      // deposit DAI and mint NOROs
      await expect(() =>
        treasury.deposit(oldDaiReserve, dai.address, profit)
      ).to.changeTokenBalance(noro, deployer, oldTotalSupply)

      // deposit NORO/DAI lp
      await quickRouter.addLiquidity(
        dai.address,
        noro.address,
        oldLPDaiAmount,
        oldLPNoroAmount,
        oldLPDaiAmount,
        oldLPNoroAmount,
        deployer.address,
        1000000000000
      )

      const lpBalance = await lp.balanceOf(deployer.address)
      const lpValue = await treasury.valueOfToken(lp.address, lpBalance)
      await treasury.deposit(lpBalance, lp.address, lpValue)

      const oldNoroAmount = await noro.balanceOf(deployer.address)

      // migrate contracts
      await migrator.migrateContracts()

      // migrator should not have any token left
      expect(await lp.balanceOf(migrator.address)).to.eq('0')
      expect(await noro.balanceOf(migrator.address)).to.eq('0')
      expect(await dai.balanceOf(migrator.address)).to.eq('0')
      expect(await noro2.balanceOf(migrator.address)).to.eq('68130326723254')

      // just left enough mai for total supply of old noro
      expect(await dai.balanceOf(treasury.address)).to.eq(
        '340651633616274806525292'
      )
      expect(await noro2.totalSupply()).to.eq(oldTotalSupply.div(5).sub(1))

      // transfer noro to another user
      await noro.transfer(depositor.address, ethers.utils.parseUnits('100', 9))

      // migrate personal
      await migrator.migrate()
      await migrator.connect(depositor).migrate()

      expect(await noro2.balanceOf(deployer.address)).to.eq(
        oldNoroAmount.sub(ethers.utils.parseUnits('100', 9)).div(5)
      )
      expect(await noro2.balanceOf(depositor.address)).to.eq(
        ethers.utils.parseUnits('20', 9)
      )
      expect(await noro.balanceOf(deployer.address)).to.eq('0')
      expect(await noro.balanceOf(depositor.address)).to.eq('0')

      // migrator should not have any token left
      expect(await lp.balanceOf(migrator.address)).to.eq('0')
      expect(await noro.balanceOf(migrator.address)).to.eq('0')
      expect(await dai.balanceOf(migrator.address)).to.eq('0')
      expect(await noro2.balanceOf(migrator.address)).to.eq('0')

      // old noro total supply should be 1, locked in QuickSwap
      expect(await noro.totalSupply()).to.eq('1')

      // old treasury reserve should < 1
      expect(await dai.balanceOf(treasury.address)).to.eq('1806525292')
      expect(await lp.balanceOf(treasury.address)).to.eq('0')

      // new LP open in x5 price
      const [daiAmount, newNoroAmount] = await lp2.getReserves()
      expect(daiAmount).to.eq('1328699790772922447494252')
      expect(newNoroAmount).to.eq(oldLPNoroAmount.div(5))

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
