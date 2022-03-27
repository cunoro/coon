// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

function sleep(ms = 0) {
    return new Promise(r => setTimeout(r, ms));
}

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts on TESTNET with the account: " + deployer.address);
    console.log("Account balance:", (await deployer.getBalance()).toString());
    console.log("===================================================================");

    const INIT_INDEX = Math.pow(10, 9);
    const EPOCH_LEGNTH = 900;
    const FIRST_EPOCH_NUM = 1;
    const FIRST_EPOCH_TIME = 1647981000;
    const REWARD_RATE = 2188;

    const CONTROL_VARIABLE = 40;
    const MIN_PRICE = 100;
    const MAX_PAYOUT = 1000;
    const BOND_FEE = 0;
    const MAX_DEBT = Math.pow(10, 15);
    const VESTING_TERM = 5*24*3600;

    const DAO = "0x0E8125aE8373b79DB639196529bbF6dA8a366891";
    const BEND = "0x19a1165A79AFAAeFd805969B32a0640d4Db9f131";
    const WAVAX = "0xd00ae08403B9bbb9124bB305C09058E32C39A48c";
    const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
    const AVAX_FEED = "0x5498BB86BC934c8D34FDA08E81D444153d0D06aD";

    const NORO = "0x0BA8602A163148259E654140a87BD84BF3861957";
    const SNORO = "0x3036a20f8e38B5e78025De4b6A0e30e58b6F09e6";

// StandardBondingCalculator deploy
    const BondingCalculator = await ethers.getContractFactory("CunoroBondingCalculator");
    const bondingcalculator = await BondingCalculator.deploy(NORO);
    await bondingcalculator.deployed();

    console.log("BondingCalculator Deployed.", bondingcalculator.address);

// wsNORO deploy
    const wsNORO = await ethers.getContractFactory("WsNORO");
    const wsnoro = await wsNORO.deploy(SNORO);
    await wsnoro.deployed();

    console.log("wsNORO Deployed.", wsnoro.address);
    console.log("===================================================================");

    console.log("BondingCalculator: " + bondingcalculator.address);
    console.log("wsNORO: " + wsnoro.address);
}

main()
    .then(() => process.exit())
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
