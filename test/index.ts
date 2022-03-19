import { expect } from "chai";
import { ethers } from "hardhat";

import { Bend, CunoroERC20Token, SCunoroERC20Token, CunoroTreasury, CunoroStaking, Distributor, StakingHelper, StakingWarmup, CunoroBondDepository, AvaxBondDepository, CunoroBondingCalculator, WsNORO } from "../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("Olympus DAO Test", function () {
	let bend : Bend;
	let cunoro : CunoroERC20Token;
	let scunoro : SCunoroERC20Token;
	let treasury : CunoroTreasury;
	let staking : CunoroStaking;
	let distributor : Distributor;
	let helper : StakingHelper;
	let warmup : StakingWarmup;
	let bonddepository : CunoroBondDepository;
	let avaxbonddepository : AvaxBondDepository;
	let bondingcalculator : CunoroBondingCalculator;
	let wsnoro : WsNORO;
	let deployer : SignerWithAddress;
	let accounts : SignerWithAddress[];
	// let bend, cunoro, scunoro, treasury, staking, distributor, helper, warmup, bonddepository, avaxbonddepository, bondingcalculator, wsnoro;
	// let deployer, accounts;

	this.beforeAll(async () => {
		[deployer, ...accounts] = await ethers.getSigners();
	    console.log("Deploying contracts on TESTNET with the account: " + deployer.address);
	    console.log("Account balance:", (await deployer.getBalance()).toString());
	    console.log("===================================================================");

	    const INIT_INDEX = Math.pow(10, 9);
	    const EPOCH_LEGNTH = 900;
	    const FIRST_EPOCH_NUM = 1;
	    const FIRST_EPOCH_TIME = 1647705600;
	    const REWARD_RATE = 2188;

	    const CONTROL_VARIABLE = 40;
	    const MIN_PRICE = 100;
	    const MAX_PAYOUT = 1000;
	    const BOND_FEE = 0;
	    const MAX_DEBT = Math.pow(10, 15);
	    const VESTING_TERM = 5*24*3600;

	    const WAVAX = "0xd00ae08403B9bbb9124bB305C09058E32C39A48c";
	    const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
	    const AVAX_FEED = "0x5498BB86BC934c8D34FDA08E81D444153d0D06aD";

	// BEND token deploy
		const Bend = await ethers.getContractFactory("Bend");
	    bend = await Bend.deploy();
	    await bend.deployed();

	    await bend.transfer(accounts[1].address, 1000000);
	    console.log("BEND balance of account 1 : ", await bend.balanceOf(accounts[1].address));
	    
	    console.log("Bend Deployed.", bend.address);

	// NORO token deploy
	    const Cunoro = await ethers.getContractFactory("CunoroERC20Token");
	    cunoro = await Cunoro.deploy();
	    await cunoro.deployed();

	    console.log("Cunoro Deployed.", cunoro.address);

	// sNORO token deploy
	    const sCunoro = await ethers.getContractFactory("SCunoroERC20Token");
	    scunoro = await sCunoro.deploy();
	    await scunoro.deployed();
	    // setIndex
	    await scunoro.setIndex(INIT_INDEX);

	    console.log("sCunoro Deployed.", scunoro.address);

	// Treasury deploy
	    const Treasury = await ethers.getContractFactory("CunoroTreasury");
	    treasury = await Treasury.deploy(cunoro.address, bend.address, 0);
	    await treasury.deployed();
	    // add reserve token, dao
	    await treasury.queue(2, WAVAX);
	    await treasury.toggle(2, WAVAX, ZERO_ADDRESS);

	    await treasury.queue(3, deployer.address);
	    await treasury.toggle(3, deployer.address, ZERO_ADDRESS);
	    // Cunoro.setVault
	    await cunoro.setVault(treasury.address);

	    console.log("Treasury Deployed.", treasury.address);

	// Staking deploy
	    const Staking = await ethers.getContractFactory("CunoroStaking");
	    staking = await Staking.deploy(
	        cunoro.address,
	        scunoro.address,
	        EPOCH_LEGNTH,
	        FIRST_EPOCH_NUM,
	        FIRST_EPOCH_TIME
	    );
	    await staking.deployed();
	    //sCunoro.initialize
	    await scunoro.initialize(staking.address);

	    console.log("Staking Deployed.", staking.address);

	// StakingDistributor deploy
	    const Distributor = await ethers.getContractFactory("Distributor");
	    distributor = await Distributor.deploy(
	        treasury.address,
	        cunoro.address,
	        EPOCH_LEGNTH,
	        FIRST_EPOCH_TIME
	    );
	    await distributor.deployed();
	    // addRecipient
	    await distributor.addRecipient(staking.address, REWARD_RATE);
	    // add reward manager to treasury
	    await treasury.queue(8, distributor.address);
	    await treasury.toggle(8, distributor.address, ZERO_ADDRESS);
	    // staking.setContract
	    await staking.setContract(0, distributor.address);

	    console.log("Distributor Deployed.", distributor.address);

	// StakingHelper deploy
	    const Helper = await ethers.getContractFactory("StakingHelper");
	    helper = await Helper.deploy(staking.address, cunoro.address);
	    await helper.deployed();

	    console.log("Helper Deployed.", helper.address);

	// StakingWarmup deploy
	    const Warmup = await ethers.getContractFactory("StakingWarmup");
	    warmup = await Warmup.deploy(staking.address, scunoro.address);
	    await warmup.deployed();
	    // staking.setContract
	    await staking.setContract(1, warmup.address);

	    console.log("Warmup Deployed.", warmup.address);

	// BondDepository_BEND deploy
	    const BondDepository = await ethers.getContractFactory("CunoroBondDepository");
	    bonddepository = await BondDepository.deploy(
	        cunoro.address,
	        bend.address,
	        treasury.address,
	        deployer.address,
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
	    await treasury.queue(0, bonddepository.address);
	    await treasury.toggle(0, bonddepository.address, ZERO_ADDRESS);
	    // setStaking
	    await bonddepository.setStaking(helper.address, true);

	    console.log("BondDepository_BEND Deployed.", bonddepository.address);

	// BondDepository_AVAX deploy
	    const AvaxBondDepository = await ethers.getContractFactory("AvaxBondDepository");
	    avaxbonddepository = await AvaxBondDepository.deploy(
	        cunoro.address,
	        WAVAX,
	        treasury.address,
	        deployer.address,
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

	    console.log("BondDepository_AVAX Deployed.", avaxbonddepository.address);

	// StandardBondingCalculator deploy
	    const BondingCalculator = await ethers.getContractFactory("CunoroBondingCalculator");
	    bondingcalculator = await BondingCalculator.deploy(cunoro.address);
	    await bondingcalculator.deployed();

	    console.log("BondingCalculator Deployed.", bondingcalculator.address);

	// wsNORO deploy
	    const wsNORO = await ethers.getContractFactory("WsNORO");
	    wsnoro = await wsNORO.deploy(scunoro.address);
	    await wsnoro.deployed();

	    console.log("wsNORO Deployed.", wsnoro.address);
	    console.log("===================================================================");

	    console.log("NORO: " + cunoro.address);
	    console.log("sNORO: " + scunoro.address);
	    console.log("Treasury: " + treasury.address);
	    console.log("Staking: " + staking.address);
	    console.log("Distributor: " + distributor.address);
	    console.log("Helper: " + helper.address);
	    console.log("Warmup: " + warmup.address);
	    console.log("BondDepository(BEND): " + bonddepository.address);
	    console.log("BondDepository(AVAX): " + avaxbonddepository.address);
	    console.log("BondingCalculator: " + bondingcalculator.address);
	    console.log("wsNORO: " + wsnoro.address);
	});

	it("BondDepository_BEND", async function() {
	    await bend.approve(bonddepository.address, 100000);
		console.log("allowance of deployer : ", await bend.allowance(deployer.address, bonddepository.address));

		await bend.connect(accounts[1]).approve(bonddepository.address, 100000);
		console.log("allowance of account 1 : ", await bend.allowance(accounts[1].address, bonddepository.address));

		// await bonddepository.deposit(5000, 30000, deployer.address);
		// console.log("bondinfo of deployer : ", await bonddepository.bondInfo(deployer.address));

		await bonddepository.connect(accounts[1]).deposit(5000, 30000, accounts[1].address);
		console.log("bondinfo of accounts[1]: ", await bonddepository.bondInfo(accounts[1].address));
	});
});