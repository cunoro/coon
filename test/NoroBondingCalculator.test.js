const { ethers } = require('hardhat')
const { expect } = require('chai')
const { BigNumber } = require('@ethersproject/bignumber')
const { ContractFactory } = require('ethers')
const UniswapV2FactoryJson = require('@uniswap/v2-core/build/UniswapV2Factory.json')
const UniswapV2PairJson = require('@uniswap/v2-core/build/UniswapV2Pair.json')

describe('CunoroBondingCalculator', function () {
  let // Used as default deployer for contracts, asks as owner of contracts.
    deployer,
    // Used as the default user for deposits and trade. Intended to be the default regular user.
    NORO,
    noro,
    DAI,
    dai,
    UniswapV2FactoryContract,
    uniFactory,
    pairAddress,
    UniswapV2Pair,
    lp,
    BondingCalcContract,
    bondingCalc

  beforeEach(async function () {
    deployer = await ethers.getSigner()

    NORO = await ethers.getContractFactory('CunoroNoroERC20')
    noro = await NORO.connect(deployer).deploy()
    await noro.setVault(deployer.address)

    DAI = await ethers.getContractFactory('DAI')
    dai = await DAI.connect(deployer).deploy(0)

    UniswapV2FactoryContract = ContractFactory.fromSolidity(
      UniswapV2FactoryJson,
      deployer
    )
    uniFactory = await UniswapV2FactoryContract.connect(deployer).deploy(
      deployer.address
    )

    await uniFactory.connect(deployer).createPair(noro.address, dai.address)
    pairAddress = await uniFactory.getPair(noro.address, dai.address)
    UniswapV2Pair = ContractFactory.fromSolidity(UniswapV2PairJson, deployer)
    lp = await UniswapV2Pair.attach(pairAddress)

    BondingCalcContract = await ethers.getContractFactory(
      'CunoroBondingCalculator'
    )
    bondingCalc = await BondingCalcContract.connect(deployer).deploy(
      noro.address
    )
  })

  describe('getKValue', function () {
    it('should return x*y', async function () {
      const noroAmount = BigNumber.from(100).mul(BigNumber.from(10).pow(9))
      const daiAmount = BigNumber.from(400).mul(BigNumber.from(10).pow(18))
      await noro.mint(deployer.address, noroAmount)
      await dai.mint(deployer.address, daiAmount)

      await noro.transfer(lp.address, noroAmount)
      await dai.transfer(lp.address, daiAmount)
      await lp.mint(deployer.address)

      const k = await bondingCalc.getKValue(lp.address)

      expect(k).to.eq(
        BigNumber.from(100).mul(400).mul(BigNumber.from(10).pow(18))
      )
    })
  })

  describe('getTotalValue', function () {
    it('should return total value in USD', async function () {
      const noroAmount = BigNumber.from(100).mul(BigNumber.from(10).pow(9))
      const daiAmount = BigNumber.from(400).mul(BigNumber.from(10).pow(18))
      await noro.mint(deployer.address, noroAmount)
      await dai.mint(deployer.address, daiAmount)

      await noro.transfer(lp.address, noroAmount)
      await dai.transfer(lp.address, daiAmount)
      await lp.mint(deployer.address)

      const totalValue = await bondingCalc.getTotalValue(lp.address)

      expect(totalValue).to.eq(400000000000)
    })
  })
})
