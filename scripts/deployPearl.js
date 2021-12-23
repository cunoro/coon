const { ethers } = require('hardhat')

async function main() {
  const PEARL = await ethers.getContractFactory('OtterPearlERC20')
  const pearl = await PEARL.deploy('0xAAc144Dc08cE39Ed92182dd85ded60E5000C9e67')
  console.log(`done, pearl address: ${pearl.address}`)
}

main()
  .then(() => process.exit())
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
