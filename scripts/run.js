// @dev. This script will deploy this V1.1 of Olympus. It will deploy the whole ecosystem except for the LP tokens and their bonds.
// This should be enough of a test environment to learn about and test implementations with the Olympus as of V1.1.
// Not that the every instance of the Treasury's function 'valueOf' has been changed to 'valueOfToken'...
// This solidity function was conflicting w js object property name

const assert = require("assert");
const { ethers } = require("hardhat");
const TraderJoeABI = require("./JoeFactory.json").abi;
const IUniswapV2Pair = require("./IUniswapV2Pair.json").abi;
const JoeRouter02 = require("./JoeRouter02.json").abi;

async function main() {
  const [deployer, MockDAO] = await ethers.getSigners();

  // Deploy DAI Avalanche
  const DAI = await ethers.getContractFactory("DAI");
  const dai = DAI.attach("0xd586E7F844cEa2F87f50152665BCbc2C279D8d70");

  const DAIBond = await ethers.getContractFactory("CunoroBondDepository");
  const daiBond = DAIBond.attach("");
}

main()
  .then(() => process.exit())
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
