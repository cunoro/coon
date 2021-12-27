const { ContractFactory } = require('ethers')
const JoeFactoryJson = require('../../scripts/JoeFactory.json')
const UniswapV2PairJson = require('../../scripts/IUniswapV2Pair.json')
const JoeRouter02Json = require('../../scripts/JoeRouter02.json')

const zeroAddress = '0x0000000000000000000000000000000000000000'

async function deployTraderJoe(deployer) {
  const JoeFactoryContract = ContractFactory.fromSolidity(
    JoeFactoryJson,
    deployer
  )
  const JoeRouter02 = ContractFactory.fromSolidity(
    JoeRouter02Json,
    deployer
  )
  const factory = await JoeFactoryContract.deploy(deployer.address)
  const router = await JoeRouter02.deploy(factory.address, zeroAddress)
  return { factory, router }
}

function getPair(address, signer) {
  const UniswapV2Pair = ContractFactory.fromSolidity(UniswapV2PairJson, signer)
  return UniswapV2Pair.attach(address)
}

module.exports = {
  deployTraderJoe,
  getPair,
}
