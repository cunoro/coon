const { ethers, timeAndMine } = require('hardhat')
const { expect } = require('chai')
const { BigNumber } = require('@ethersproject/bignumber')

describe('Staking', function () {
  // Large number for approval for DAI
  const largeApproval = '100000000000000000000000000000000'

  // What epoch will be first epoch
  const firstEpochNumber = '1'

  // How many seconds are in each epoch
  const epochLength = 86400 / 3

  // Initial reward rate for epoch
  const initialRewardRate = '3000'

  // Ethereum 0 address, used when toggling changes in treasury
  const zeroAddress = '0x0000000000000000000000000000000000000000'

  // Initial staking index
  const initialIndex = '1000000000'

  let // Used as default deployer for contracts, asks as owner of contracts.
    deployer,
    // Used as the default user for deposits and trade. Intended to be the default regular user.
    coon,
    sCoon,
    dai,
    treasury,
    stakingDistributor,
    staking,
    stakingHelper,
    firstEpochTime

  beforeEach(async function () {
    deployer = await ethers.getSigner()

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

    const StakingDistributor = await ethers.getContractFactory(
      'CunoroStakingDistributor'
    )
    stakingDistributor = await StakingDistributor.deploy(
      treasury.address,
      coon.address,
      epochLength,
      firstEpochTime
    )

    const Staking = await ethers.getContractFactory('CunoroStaking')
    staking = await Staking.deploy(
      coon.address,
      sCoon.address,
      epochLength,
      firstEpochNumber,
      firstEpochTime
    )

    // Deploy staking helper
    const StakingHelper = await ethers.getContractFactory('CunoroStakingHelper')
    stakingHelper = await StakingHelper.deploy(staking.address, coon.address)

    const StakingWarmup = await ethers.getContractFactory('CunoroStakingWarmup')
    const stakingWarmup = await StakingWarmup.deploy(
      staking.address,
      sCoon.address
    )

    await sCoon.initialize(staking.address)
    await sCoon.setIndex(initialIndex)

    await staking.setContract('0', stakingDistributor.address)
    await staking.setContract('1', stakingWarmup.address)

    await stakingDistributor.addRecipient(staking.address, initialRewardRate)

    await coon.setVault(treasury.address)

    // queue and toggle reward manager
    await treasury.queue('8', stakingDistributor.address)
    await treasury.toggle('8', stakingDistributor.address, zeroAddress)

    // queue and toggle deployer reserve depositor
    await treasury.queue('0', deployer.address)
    await treasury.toggle('0', deployer.address, zeroAddress)

    await coon.approve(stakingHelper.address, largeApproval)
    await dai.approve(treasury.address, largeApproval)

    // mint 1,000,000 DAI for testing
    await dai.mint(
      deployer.address,
      BigNumber.from(100 * 10000).mul(BigNumber.from(10).pow(18))
    )
  })

  describe('treasury deposit', function () {
    it('should get COON', async function () {
      await expect(() =>
        treasury.deposit(
          BigNumber.from(100 * 10000).mul(BigNumber.from(10).pow(18)),
          dai.address,
          BigNumber.from(750000).mul(BigNumber.from(10).pow(9))
        )
      ).to.changeTokenBalance(
        coon,
        deployer,
        BigNumber.from(25 * 10000).mul(BigNumber.from(10).pow(9))
      )
    })
  })

  describe('stake', function () {
    it('should get equally sCoon tokens', async function () {
      await treasury.deposit(
        BigNumber.from(100 * 10000).mul(BigNumber.from(10).pow(18)),
        dai.address,
        BigNumber.from(750000).mul(BigNumber.from(10).pow(9))
      )

      await expect(() =>
        stakingHelper.stake(
          BigNumber.from(100).mul(BigNumber.from(10).pow(9)),
          deployer.address
        )
      ).to.changeTokenBalance(
        sCoon,
        deployer,
        BigNumber.from(100).mul(BigNumber.from(10).pow(9))
      )
    })
  })

  describe('rebase', function () {
    it('distribute 0 for first block', async function () {
      await treasury.deposit(
        BigNumber.from(100 * 10000).mul(BigNumber.from(10).pow(18)),
        dai.address,
        BigNumber.from(750000).mul(BigNumber.from(10).pow(9))
      )

      await stakingHelper.stake(
        BigNumber.from(100).mul(BigNumber.from(10).pow(9)),
        deployer.address
      )

      await expect(() => staking.rebase()).to.changeTokenBalance(
        sCoon,
        deployer,
        0
      )

      expect(await sCoon.index()).to.eq('1000000000')
    })

    it('should rebase after epoch end', async function () {
      await treasury.deposit(
        BigNumber.from(100 * 10000).mul(BigNumber.from(10).pow(18)),
        dai.address,
        BigNumber.from(750000).mul(BigNumber.from(10).pow(9))
      )

      await stakingHelper.stake(
        BigNumber.from(100).mul(BigNumber.from(10).pow(9)),
        deployer.address
      )

      // 0 -> 1: no reward
      await expect(() => staking.rebase()).to.changeTokenBalance(
        sCoon,
        deployer,
        0
      )

      const epoch = await staking.epoch()
      const distribute = epoch[3]

      // advanced next block time to next epoch
      await timeAndMine.setTimeIncrease(86400 / 3 + 1)

      // 1 -> 2
      await expect(() => staking.rebase()).to.changeTokenBalance(
        sCoon,
        deployer,
        distribute
      )
      expect(await sCoon.index()).to.eq('8500000000')
    })

    it('should not rebase before epoch end', async function () {
      await treasury.deposit(
        BigNumber.from(100 * 10000).mul(BigNumber.from(10).pow(18)),
        dai.address,
        BigNumber.from(750000).mul(BigNumber.from(10).pow(9))
      )

      await stakingHelper.stake(
        BigNumber.from(100).mul(BigNumber.from(10).pow(9)),
        deployer.address
      )

      // 0 -> 1: no reward
      await expect(() => staking.rebase()).to.changeTokenBalance(
        sCoon,
        deployer,
        0
      )

      // advanced next block time to same epoch
      await timeAndMine.setTimeIncrease(86400 / 3 - 200)

      // 1 -> 1
      await expect(() => staking.rebase()).to.changeTokenBalance(
        sCoon,
        deployer,
        0
      )

      const [, number, endTime, distribute] = await staking.epoch()
      expect(number).to.eq(2)
      expect(endTime).to.eq(firstEpochTime + 86400 / 3)
      expect(distribute).to.eq('750000000000')
    })

    it('should not receive reward', async function () {
      await treasury.deposit(
        BigNumber.from(100 * 10000).mul(BigNumber.from(10).pow(18)),
        dai.address,
        BigNumber.from(750000).mul(1e9)
      )

      await stakingHelper.stake(BigNumber.from(100).mul(1e9), deployer.address)

      // 0 -> 1: no reward
      await expect(() => staking.rebase()).to.changeTokenBalance(
        sCoon,
        deployer,
        0
      )

      // advanced next block time to next epoch
      await timeAndMine.setTimeIncrease(86400 / 3 + 1)

      // 1 -> 2
      await expect(() => staking.rebase()).to.changeTokenBalance(
        sCoon,
        deployer,
        '750000000000'
      )
      expect(await sCoon.index()).to.eq('8500000000')

      // set distributor to zero
      staking.setContract(0, zeroAddress)

      // 2 -> 3, still get reward
      await timeAndMine.setTimeIncrease(86400 / 3 + 1)

      await expect(() => staking.rebase()).to.changeTokenBalance(
        sCoon,
        deployer,
        '752250000000'
      )

      // 3 -> 4, no reward
      await timeAndMine.setTimeIncrease(86400 / 3 + 1)
      await expect(() => staking.rebase()).to.changeTokenBalance(
        sCoon,
        deployer,
        0
      )
    })
  })

  describe('warmup', function () {
    beforeEach(async function () {
      await treasury.deposit(
        BigNumber.from(100 * 10000).mul(BigNumber.from(10).pow(18)),
        dai.address,
        BigNumber.from(750000).mul(BigNumber.from(10).pow(9))
      )
    })

    it('in stay in warmup after 1 epoch', async function () {
      await staking.setWarmup(2)

      await expect(() =>
        stakingHelper.stake(100 * 1e9, deployer.address)
      ).to.changeTokenBalance(sCoon, deployer, 0)

      const [deposit, _, expiry, lock] = await staking.warmupInfo(
        deployer.address
      )
      expect(deposit).to.eq(100 * 1e9)
      expect(expiry).to.eq(4)
      expect(lock).to.be.false

      await timeAndMine.setTimeIncrease(86400 / 3 + 1)
      await staking.rebase()
      await expect(() => staking.claim(deployer.address)).to.changeTokenBalance(
        sCoon,
        deployer,
        0
      )

      await timeAndMine.setTimeIncrease(86400 / 3 + 1)
      await staking.rebase()
      await expect(() => staking.claim(deployer.address)).to.changeTokenBalance(
        sCoon,
        deployer,
        '1602250000000'
      )
    })

    it('should be able to forfeit without reward', async function () {
      await staking.setWarmup(2)

      await expect(() =>
        stakingHelper.stake(100 * 1e9, deployer.address)
      ).to.changeTokenBalance(sCoon, deployer, 0)

      const [deposit, _, expiry, lock] = await staking.warmupInfo(
        deployer.address
      )
      expect(deposit).to.eq(100 * 1e9)
      expect(expiry).to.eq(4)
      expect(lock).to.be.false

      await timeAndMine.setTimeIncrease(86400 / 3 + 1)
      await staking.rebase()
      await expect(() => staking.forfeit()).to.changeTokenBalance(
        coon,
        deployer,
        100 * 1e9
      )
    })
  })
})
