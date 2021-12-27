const { ethers } = require('hardhat')
const { expect } = require('chai')
const { BigNumber } = require('@ethersproject/bignumber')

describe('Presale', function () {
  // Large number for approval for DAI
  const largeApproval = '100000000000000000000000000000000'

  // Ethereum 0 address, used when toggling changes in treasury
  const zeroAddress = '0x0000000000000000000000000000000000000000'

  let // Used as default deployer for contracts, asks as owner of contracts.
    deployer,
    // Used as the default user for deposits and trade. Intended to be the default regular user.
    noro,
    pNoro,
    exercisePreNoro,
    dai,
    treasury

  beforeEach(async function () {
    deployer = await ethers.getSigner()

    const NORO = await ethers.getContractFactory('CunoroNoroERC20')
    noro = await NORO.deploy()
    await noro.setVault(deployer.address)

    const DAI = await ethers.getContractFactory('DAI')
    dai = await DAI.deploy(0)

    const PreCunoroNoroERC20 = await ethers.getContractFactory(
      'PreCunoroNoroERC20'
    )
    pNoro = await PreCunoroNoroERC20.deploy()

    const Treasury = await ethers.getContractFactory('CunoroTreasury')
    treasury = await Treasury.deploy(
      noro.address,
      dai.address,
      zeroAddress,
      zeroAddress,
      0
    )

    const NoroCirculatingSupply = await ethers.getContractFactory(
      'NoroCirculatingSupply'
    )
    const noroCirculatingSupply = await NoroCirculatingSupply.deploy(
      deployer.address
    )
    await noroCirculatingSupply.initialize(noro.address)

    const ExercisePreNoro = await ethers.getContractFactory('ExercisePreNoro')
    exercisePreNoro = await ExercisePreNoro.deploy(
      pNoro.address,
      noro.address,
      dai.address,
      treasury.address,
      noroCirculatingSupply.address
    )

    await noro.setVault(treasury.address)

    // queue and toggle deployer reserve depositor
    await treasury.queue('0', deployer.address)
    await treasury.toggle('0', deployer.address, zeroAddress)

    await treasury.queue('0', exercisePreNoro.address)
    await treasury.toggle('0', exercisePreNoro.address, zeroAddress)

    await dai.approve(treasury.address, largeApproval)
    await dai.approve(exercisePreNoro.address, largeApproval)
    await pNoro.approve(exercisePreNoro.address, largeApproval)

    // mint 1,000,000 DAI for testing
    await dai.mint(
      deployer.address,
      BigNumber.from(100 * 10000).mul(BigNumber.from(10).pow(18))
    )

    // mint 250,000 NORO for testing
    treasury.deposit(
      BigNumber.from(50 * 10000).mul(BigNumber.from(10).pow(18)),
      dai.address,
      BigNumber.from(25 * 10000).mul(BigNumber.from(10).pow(9))
    )
  })

  describe('exercise', function () {
    it('should get reverted', async function () {
      await exercisePreNoro.setTerms(
        deployer.address,
        BigNumber.from(30000).mul(BigNumber.from(10).pow(18)),
        10 * 10000 // 10%
      )

      await expect(
        exercisePreNoro.exercise(
          BigNumber.from(30000).mul(BigNumber.from(10).pow(18))
        )
      ).to.be.revertedWith('Not enough vested')
    })

    it('should get noro', async function () {
      await exercisePreNoro.setTerms(
        deployer.address,
        BigNumber.from(30000).mul(BigNumber.from(10).pow(18)),
        10 * 10000 // 10%
      )

      await expect(() =>
        exercisePreNoro.exercise(
          BigNumber.from(10000).mul(BigNumber.from(10).pow(18))
        )
      ).to.changeTokenBalance(
        noro,
        deployer,
        BigNumber.from(10000).mul(BigNumber.from(10).pow(9))
      )
      expect(await dai.balanceOf(deployer.address)).to.eq(
        BigNumber.from(490000).mul(BigNumber.from(10).pow(18))
      )
      expect(await pNoro.balanceOf(deployer.address)).to.eq(
        '999990000000000000000000000'
      )
    })
  })
})
