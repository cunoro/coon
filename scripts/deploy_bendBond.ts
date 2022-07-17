// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat";
import * as dotenv from "dotenv";
import CunoroTreasury from "../artifacts/contracts/Treasury.sol/CunoroTreasury.json"

dotenv.config();

function sleep(ms = 0) {
    return new Promise(r => setTimeout(r, ms));
}

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying BondDepository contracts on TESTNET with the account: " + deployer.address);
    console.log("Account balance:", (await deployer.getBalance()).toString());
    console.log("===================================================================");

    const DAO = "0x813C38214799535c1375606188aD7E8Fd1762651";

    const CUNORO_ADDRESS = "0x8810dc193bA78b0dB831687EBB8d79f24a8b5E81"
    const TREASURY_ADDRESS = "0xE62bec7F3Dba623223cb3Bd23f901dA3fAC42893"
    const STAKING_HELPER_ADDRESS = "0xa276eCf241346a98308aB980E52995c530B6f905"

    const BEND = "0x3160591776e34C319F2Ad28Ba8c1F4829adc3907";
    const WAVAX = "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7";
    const AVAX_FEED = "0x0A77230d17318075983913bC2145DB16C7366156";

    const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

    // Bond Terms
    const CONTROL_VARIABLE = 40;
    const MIN_PRICE = 100;
    const MAX_PAYOUT = 40000;
    const BOND_FEE = 0;
    const MAX_DEBT = Math.pow(10, 15);
    const VESTING_TERM = 5*24*3600;

    const treasury =  new ethers.Contract(TREASURY_ADDRESS, CunoroTreasury.abi, deployer)

    // BondDepository_BEND deploy
    const BondDepository = await ethers.getContractFactory("CunoroBondDepository");
    const bonddepository = await BondDepository.deploy(
        CUNORO_ADDRESS,
        BEND,
        TREASURY_ADDRESS,
        DAO,
        ZERO_ADDRESS
    );
    await bonddepository.deployed();
    // initializeBondTerms
    let tx = await bonddepository.initializeBondTerms(
        CONTROL_VARIABLE,
        MIN_PRICE,
        MAX_PAYOUT,
        BOND_FEE,
        MAX_DEBT,
        VESTING_TERM
    );
    // add depositor to treasury
    await tx.wait();
    tx = await treasury.queue(0, bonddepository.address);
    await tx.wait();
    tx = await treasury.toggle(0, bonddepository.address, ZERO_ADDRESS);
    // setStaking
    await tx.wait();
    tx = await bonddepository.setStaking(STAKING_HELPER_ADDRESS, true);
    await tx.wait();

    console.log("===================================================================");
    console.log("BondDepository(BEND) : " + bonddepository.address);
}

main()
    .then(() => process.exit())
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
