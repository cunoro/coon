const { ContractFactory } = require('ethers')
const UniswapV2FactoryJson = require('@uniswap/v2-core/build/UniswapV2Factory.json')
const UniswapV2PairJson = require('@uniswap/v2-core/build/UniswapV2Pair.json')
const UniswapV2RouterJson = require('@uniswap/v2-periphery/build/UniswapV2Router02.json')

const zeroAddress = '0x0000000000000000000000000000000000000000'

async function deployUniswap(deployer) {
  const UniswapV2FactoryContract = ContractFactory.fromSolidity(
    UniswapV2FactoryJson,
    deployer
  )
  const UniswapV2Router = ContractFactory.fromSolidity(
    UniswapV2RouterJson,
    deployer
  )
  const factory = await UniswapV2FactoryContract.deploy(deployer.address)
  const router = await UniswapV2Router.deploy(factory.address, zeroAddress)
  return { factory, router }
}

function getPair(address, signer) {
  const UniswapV2Pair = ContractFactory.fromSolidity(UniswapV2PairJson, signer)
  return UniswapV2Pair.attach(address)
}

module.exports = {
  deployUniswap,
  getPair,
}
