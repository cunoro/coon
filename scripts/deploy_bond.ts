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
    console.log("Deploying BondDepository contracts on TESTNET with the account: " + deployer.address);
    console.log("Account balance:", (await deployer.getBalance()).toString());
    console.log("===================================================================");

    const DAO = "0x8c8eC00fb235dE3922182b47d2E8f8e69268039a";

    const CUNORO_ADDRESS = ""
    const TREASURY_ADDRESS = ""
    const STAKING_HELPER_ADDRESS = ""

    const BEND = "0x19a1165A79AFAAeFd805969B32a0640d4Db9f131";
    const WAVAX = "0xd00ae08403B9bbb9124bB305C09058E32C39A48c";
    const AVAX_FEED = "0x5498BB86BC934c8D34FDA08E81D444153d0D06aD";

    const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

    // Bond Terms
    const CONTROL_VARIABLE = 40;
    const MIN_PRICE = 100;
    const MAX_PAYOUT = 10000;
    const BOND_FEE = 0;
    const MAX_DEBT = Math.pow(10, 15);
    const VESTING_TERM = 5*24*3600;

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
    tx = await bonddepository.initializeBondTerms(
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

    console.log("BondDepository_BEND Deployed.", bonddepository.address);

    // BondDepository_AVAX deploy
    const AvaxBondDepository = await ethers.getContractFactory("AvaxBondDepository");
    const avaxbonddepository = await AvaxBondDepository.deploy(
        cunoro.address,
        WAVAX,
        treasury.address,
        DAO,
        AVAX_FEED
    );
    await avaxbonddepository.deployed();
    // initializeBondTerms
    tx = await avaxbonddepository.initializeBondTerms(
        CONTROL_VARIABLE,
        MIN_PRICE,
        MAX_PAYOUT,
        MAX_DEBT,
        VESTING_TERM
    );
    // add depositor to treasury
    await tx.wait();
    tx = await treasury.queue(0, avaxbonddepository.address);
    await tx.wait();
    tx = await treasury.toggle(0, avaxbonddepository.address, ZERO_ADDRESS);
    // setStaking
    await tx.wait();
    tx = await avaxbonddepository.setStaking(STAKING_HELPER_ADDRESS, true);
    await tx.wait();

    console.log("BondDepository_AVAX Deployed.", avaxbonddepository.address);

    console.log("===================================================================");
    console.log("BondDepository(BEND) : " + bonddepository.address);
    console.log("BondDepository(AVAX) : " + avaxbonddepository.address);
}

main()
    .then(() => process.exit())
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
