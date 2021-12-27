const { ethers } = require('hardhat')

function toNoroAmount(value) {
  return ethers.utils.parseUnits(String(value), 9)
}

module.exports = {
  toNoroAmount
}
