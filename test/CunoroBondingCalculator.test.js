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
    COON,
    coon,
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

    COON = await ethers.getContractFactory('CunoroCoonERC20')
    coon = await COON.connect(deployer).deploy()
    await coon.setVault(deployer.address)

    DAI = await ethers.getContractFactory('DAI')
    dai = await DAI.connect(deployer).deploy(0)

    UniswapV2FactoryContract = ContractFactory.fromSolidity(
      UniswapV2FactoryJson,
      deployer
    )
    uniFactory = await UniswapV2FactoryContract.connect(deployer).deploy(
      deployer.address
    )

    await uniFactory.connect(deployer).createPair(coon.address, dai.address)
    pairAddress = await uniFactory.getPair(coon.address, dai.address)
    UniswapV2Pair = ContractFactory.fromSolidity(UniswapV2PairJson, deployer)
    lp = await UniswapV2Pair.attach(pairAddress)

    BondingCalcContract = await ethers.getContractFactory(
      'CunoroBondingCalculator'
    )
    bondingCalc = await BondingCalcContract.connect(deployer).deploy(
      coon.address
    )
  })

  describe('getKValue', function () {
    it('should return x*y', async function () {
      const coonAmount = BigNumber.from(100).mul(BigNumber.from(10).pow(9))
      const daiAmount = BigNumber.from(400).mul(BigNumber.from(10).pow(18))
      await coon.mint(deployer.address, coonAmount)
      await dai.mint(deployer.address, daiAmount)

      await coon.transfer(lp.address, coonAmount)
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
      const coonAmount = BigNumber.from(100).mul(BigNumber.from(10).pow(9))
      const daiAmount = BigNumber.from(400).mul(BigNumber.from(10).pow(18))
      await coon.mint(deployer.address, coonAmount)
      await dai.mint(deployer.address, daiAmount)

      await coon.transfer(lp.address, coonAmount)
      await dai.transfer(lp.address, daiAmount)
      await lp.mint(deployer.address)

      const totalValue = await bondingCalc.getTotalValue(lp.address)

      expect(totalValue).to.eq(400000000000)
    })
  })
})
