// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying BondDepository contracts on TESTNET with the account: " + deployer.address);
    console.log("Account balance:", (await deployer.getBalance()).toString());
    console.log("===================================================================");

    const INIT_INDEX = Math.pow(10, 9);
    const EPOCH_LEGNTH = 900;
    const FIRST_EPOCH_NUM = 0;
    const FIRST_EPOCH_TIME = 1647504000;
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

    const CUNORO_ADDRESS = "0xFa2b33254B85A792D93C471804AcEBa45d977706";
    const TREASURY_ADDRESS = "0x1e2DeCf82DC4F8CB817Aa03F14aEEDa750fc9408";

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
    await bonddepository.initializeBondTerms(
        CONTROL_VARIABLE,
        MIN_PRICE,
        MAX_PAYOUT,
        BOND_FEE,
        MAX_DEBT,
        VESTING_TERM
    );
    // add depositor to treasury
    const treasury = await ethers.getContractAt("CunoroTreasury", TREASURY_ADDRESS);
    await treasury.queue(0, bonddepository.address);
    await treasury.toggle(0, bonddepository.address, ZERO_ADDRESS);
    // setStaking
    await bonddepository.setStaking(helper.address, true);

// BondDepository_AVAX deploy
    const AvaxBondDepository = await ethers.getContractFactory("AvaxBondDepository");
    const avaxbonddepository = await AvaxBondDepository.deploy(
        CUNORO_ADDRESS,
        WAVAX,
        TREASURY_ADDRESS,
        DAO,
        AVAX_FEED
    );
    await avaxbonddepository.deployed();
    // initializeBondTerms
    await avaxbonddepository.initializeBondTerms(
        CONTROL_VARIABLE,
        MIN_PRICE,
        MAX_PAYOUT,
        MAX_DEBT,
        VESTING_TERM
    );
    // add depositor to treasury
    await treasury.queue(0, avaxbonddepository.address);
    await treasury.toggle(0, avaxbonddepository.address, ZERO_ADDRESS);
    // setStaking
    await avaxbonddepository.setStaking(helper.address, true);

    console.log("BondDepository(BEND): " + bonddepository.address);
    console.log("BondDepository(AVAX): " + avaxbonddepository.address);
}

main()
    .then(() => process.exit())
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
