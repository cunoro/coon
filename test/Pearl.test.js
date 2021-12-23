const { ethers, timeAndMine } = require('hardhat')
const { expect } = require('chai')
const { BigNumber } = require('@ethersproject/bignumber')

describe('Pearl', function () {
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
    pearl,
    dai,
    treasury,
    stakingDistributor,
    staking,
    stakingHelper,
    firstEpochTime

  beforeEach(async function () {
    deployer = await ethers.getSigner()

    firstEpochTime = (await deployer.provider.getBlock()).timestamp - 100

    const COON = await ethers.getContractFactory('CunoroCoonERC20V2')
    coon = await COON.deploy()
    await coon.setVault(deployer.address)

    const DAI = await ethers.getContractFactory('DAI')
    dai = await DAI.deploy(0)

    const StakedCOON = await ethers.getContractFactory('StakedCunoroCoonERC20V2')
    sCoon = await StakedCOON.deploy()

    const PEARL = await ethers.getContractFactory('CunoroPearlERC20')
    pearl = await PEARL.deploy(sCoon.address)

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

  it('should able wrap and unwrap', async function () {
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

    await expect(() =>
      stakingHelper.stake(
        BigNumber.from(25 * 10000).mul(BigNumber.from(10).pow(9)),
        deployer.address
      )
    ).to.changeTokenBalance(
      sCoon,
      deployer,
      BigNumber.from(25 * 10000).mul(BigNumber.from(10).pow(9))
    )

    await sCoon.approve(
      pearl.address,
      BigNumber.from(25 * 10000).mul(BigNumber.from(10).pow(9))
    )

    await expect(() =>
      pearl.wrap(BigNumber.from(25 * 10000).mul(BigNumber.from(10).pow(9)))
    ).to.changeTokenBalance(
      pearl,
      deployer,
      BigNumber.from(25 * 10000).mul(BigNumber.from(10).pow(18))
    )

    await expect(() =>
      pearl.unwrap(BigNumber.from(25 * 10000).mul(BigNumber.from(10).pow(18)))
    ).to.changeTokenBalance(
      sCoon,
      deployer,
      BigNumber.from(25 * 10000).mul(BigNumber.from(10).pow(9))
    )
  })

  it('should able wrap and unwrap after rebase', async function () {
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

    await expect(() =>
      stakingHelper.stake(
        BigNumber.from(25 * 10000).mul(BigNumber.from(10).pow(9)),
        deployer.address
      )
    ).to.changeTokenBalance(
      sCoon,
      deployer,
      BigNumber.from(25 * 10000).mul(BigNumber.from(10).pow(9))
    )

    await sCoon.approve(
      pearl.address,
      BigNumber.from(25 * 10000).mul(BigNumber.from(10).pow(9))
    )

    await expect(() =>
      pearl.wrap(BigNumber.from(25 * 10000).mul(BigNumber.from(10).pow(9)))
    ).to.changeTokenBalance(
      pearl,
      deployer,
      BigNumber.from(25 * 10000).mul(BigNumber.from(10).pow(18))
    )
    expect(await sCoon.balanceOf(deployer.address)).to.equal(0)

    // 0 -> 1 no reward
    await staking.rebase()
    expect(await sCoon.index()).to.equal(initialIndex)

    // 1 -> 2
    await timeAndMine.setTimeIncrease(86400 / 3 + 1)
    await staking.rebase()
    const currentIndex = await sCoon.index()
    expect(currentIndex).to.equal(1003000000)

    await expect(() =>
      pearl.unwrap(BigNumber.from(25 * 10000).mul(BigNumber.from(10).pow(18)))
    ).to.changeTokenBalance(
      sCoon,
      deployer,
      BigNumber.from(250750).mul(BigNumber.from(10).pow(9))
    )
  })
})
