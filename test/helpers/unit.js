const { ethers } = require('hardhat')

function toCoonAmount(value) {
  return ethers.utils.parseUnits(String(value), 9)
}

module.exports = {
  toCoonAmount
}
