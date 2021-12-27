const { ethers, waffle, network } = require("hardhat");
const { expect } = require("chai");
//const { FakeContract, smock } = require("@defi-wonderland/smock");

const { utils } = require("ethers");
const { advanceBlock } = require("../utils/advancement");

describe("Treasury", async () => {
    const LARGE_APPROVAL = "100000000000000000000000000000000";
    const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
    // Initial mint for Frax and DAI (10,000,000)
    const initialMint = "10000000000000000000000000";
    // Reward rate of .1%
    const initialRewardRate = "1000";
    // Debt limit of 10
    const debtLimit = "10000000000";

    const mineBlock = async () => {
        await network.provider.request({
            method: "evm_mine",
            params: [],
        });
    };

    // Calculate index after some number of epochs. Takes principal and rebase rate.
    // TODO verify this works
    const calcIndex = (principal, rate, epochs) => principal * (1 + rate) ** epochs;

    // TODO needs cleanup. use Bignumber.
    // Mine block and rebase. Returns the new index.
    const triggerRebase = async () => {
        mineBlock();
        await staking.rebase();

        return await sNoro.index();
    };

    let deployer, alice, bob, carol;
    let erc20Factory;
    let stakingFactory;
    let noroFactory;
    let sNoroFactory;
    let gNoroFactory;
    let treasuryFactory;
    let distributorFactory;
    let authFactory;
    let mockSNoroFactory;

    let auth;
    let dai;
    let lpToken;
    let noro;
    let sNoro;
    let staking;
    let gNoro;
    let treasury;
    let distributor;

    /**
     * Everything in this block is only run once before all tests.
     * This is the home for setup methodss
     */
    before(async () => {
        [deployer, alice, bob, carol] = await ethers.getSigners();

        //owner = await ethers.getSigner("0x763a641383007870ae96067818f1649e5586f6de")

        //erc20Factory = await ethers.getContractFactory('MockERC20');
        // TODO use dai as erc20 for now
        authFactory = await ethers.getContractFactory("CunoroAuthority");
        erc20Factory = await ethers.getContractFactory("DAI");

        stakingFactory = await ethers.getContractFactory("CunoroStaking");
        noroFactory = await ethers.getContractFactory("CunoroERC20Token");
        sNoroFactory = await ethers.getContractFactory("sCunoro");
        gNoroFactory = await ethers.getContractFactory("gNORO");
        treasuryFactory = await ethers.getContractFactory("CunoroTreasury");
        distributorFactory = await ethers.getContractFactory("Distributor");
    });

    // These should not be in beforeEach.
    beforeEach(async () => {
        //dai = await smock.fake(erc20Factory);
        //lpToken = await smock.fake(erc20Factory);
        dai = await erc20Factory.deploy(0);
        lpToken = await erc20Factory.deploy(0);

        // TODO use promise.all
        auth = await authFactory.deploy(
            deployer.address,
            deployer.address,
            deployer.address,
            deployer.address
        ); // TODO
        noro = await noroFactory.deploy(auth.address);
        sNoro = await sNoroFactory.deploy();
        gNoro = await gNoroFactory.deploy(sNoro.address, sNoro.address); // Call migrate immediately
        staking = await stakingFactory.deploy(
            noro.address,
            sNoro.address,
            gNoro.address,
            "10",
            "1",
            "9",
            auth.address
        );
        treasury = await treasuryFactory.deploy(noro.address, "0", auth.address);
        distributor = await distributorFactory.deploy(
            treasury.address,
            noro.address,
            staking.address,
            auth.address
        );

        // Setup for each component

        // Needed for treasury deposit
        //await gNoro.migrate(staking.address, sNoro.address);
        await dai.mint(deployer.address, initialMint);
        await dai.approve(treasury.address, LARGE_APPROVAL);

        // Needed to spend deployer's NORO
        await noro.approve(staking.address, LARGE_APPROVAL);

        // To get past NORO contract guards
        await auth.pushVault(treasury.address, true);

        // Initialization for sNORO contract.
        // Set index to 10
        await sNoro.setIndex("10000000000");
        await sNoro.setgNORO(gNoro.address);
        await sNoro.initialize(staking.address, treasury.address);

        // Set distributor staking contract
        await staking.setDistributor(distributor.address);

        // Don't need to disable timelock because disabled by default.

        // toggle reward manager
        await treasury.enable("8", distributor.address, ZERO_ADDRESS);
        // toggle deployer reserve depositor
        await treasury.enable("0", deployer.address, ZERO_ADDRESS);
        // toggle liquidity depositor
        await treasury.enable("4", deployer.address, ZERO_ADDRESS);
        // toggle DAI as reserve token
        await treasury.enable("2", dai.address, ZERO_ADDRESS);
        // set sNORO
        await treasury.enable("9", sNoro.address, ZERO_ADDRESS);

        // Deposit 10,000 DAI to treasury, 1,000 NORO gets minted to deployer with 9000 as excess reserves (ready to be minted)
        await treasury
            .connect(deployer)
            .deposit("10000000000000000000000", dai.address, "9000000000000");

        // Add staking as recipient of distributor with a test reward rate
        await distributor.addRecipient(staking.address, initialRewardRate);

        // Get sNORO in deployer wallet
        const snoroAmount = "1000000000000";
        await noro.approve(staking.address, snoroAmount);
        await staking.stake(deployer.address, snoroAmount, true, true);

        // Transfer 10 sNORO to alice for testing
        await sNoro.transfer(alice.address, debtLimit);
    });

    it("should not have debt logged for alice", async () => {
        expect(await sNoro.debtBalances(alice.address)).to.equal(0);
    });

    it("should not have alice as a debtor", async () => {
        expect(await treasury.permissions(7, alice.address)).to.equal(false);
    });

    it("should enable alice as a debtor", async () => {
        await treasury.enable(7, alice.address, alice.address);
        expect(await treasury.permissions(7, alice.address)).to.equal(true);
    });

    it("should have debt limit as zero", async () => {
        await treasury.enable(7, alice.address, alice.address);
        expect(await treasury.debtLimit(alice.address)).to.equal(0);
    });

    it("should set debt limit", async () => {
        await treasury.enable(7, alice.address, alice.address);
        await treasury.setDebtLimit(alice.address, debtLimit);
        expect(await treasury.debtLimit(alice.address)).to.equal(debtLimit);
    });

    it("should allow alice to borrow", async () => {
        await treasury.enable(7, alice.address, ZERO_ADDRESS);
        await treasury.setDebtLimit(alice.address, debtLimit);
        await treasury.connect(alice).incurDebt(1e9, dai.address);
        expect(await sNoro.debtBalances(alice.address)).to.equal(1);
    });

    it("should allow alice to borrow up to her balance in dai", async () => {
        let staked = await sNoro.balanceOf(alice.address);
        await treasury.enable(7, alice.address, ZERO_ADDRESS);
        await treasury.setDebtLimit(alice.address, debtLimit);
        await treasury.connect(alice).incurDebt(String(staked * 1000000000), dai.address);
        expect(await sNoro.debtBalances(alice.address)).to.equal(staked);
    });

    it("should not allow alice to borrow more than her balance in dai", async () => {
        let staked = await sNoro.balanceOf(alice.address);
        await treasury.enable(7, alice.address, ZERO_ADDRESS);
        await treasury.setDebtLimit(alice.address, debtLimit);
        await expect(
            treasury.connect(alice).incurDebt(String(staked * 1000000000 + 1000000000), dai.address)
        ).to.be.revertedWith("");
    });

    it("should allow alice to borrow up to her balance in noro", async () => {
        let staked = await sNoro.balanceOf(alice.address);
        await treasury.enable(10, alice.address, ZERO_ADDRESS);
        await treasury.setDebtLimit(alice.address, debtLimit);
        await treasury.connect(alice).incurDebt(staked, noro.address);
        expect(await sNoro.debtBalances(alice.address)).to.equal(staked);
    });

    it("should not allow alice to borrow more than her balance in sNoro", async () => {
        let staked = await sNoro.balanceOf(alice.address);
        await treasury.enable(10, alice.address, ZERO_ADDRESS);
        await treasury.setDebtLimit(alice.address, debtLimit * 2);
        await expect(
            treasury.connect(alice).incurDebt(String(staked + 1), noro.address)
        ).to.be.revertedWith("sNORO: insufficient balance");
    });

    it("should not allow alice to borrow more than her debt limit", async () => {
        sNoro.transfer(alice.address, debtLimit);
        let staked = await sNoro.balanceOf(alice.address);
        await treasury.enable(10, alice.address, ZERO_ADDRESS);
        await treasury.setDebtLimit(alice.address, debtLimit);
        await expect(treasury.connect(alice).incurDebt(staked, noro.address)).to.be.revertedWith(
            "Treasury: exceeds limit"
        );
    });

    it("should allow alice to repay in dai", async () => {
        let staked = await sNoro.balanceOf(alice.address);
        await treasury.enable(7, alice.address, ZERO_ADDRESS);
        await treasury.setDebtLimit(alice.address, debtLimit);
        await treasury.connect(alice).incurDebt(String(staked * 1e9), dai.address);
        await dai.connect(alice).approve(treasury.address, String(staked * 1e9));
        await treasury.connect(alice).repayDebtWithReserve(String(staked * 1e9), dai.address);
        expect(await sNoro.debtBalances(alice.address)).to.equal(0);
    });

    it("should allow alice to repay her debt in noro", async () => {
        let staked = await sNoro.balanceOf(alice.address);
        await treasury.enable(10, alice.address, ZERO_ADDRESS);
        await treasury.setDebtLimit(alice.address, debtLimit);
        await treasury.connect(alice).incurDebt(staked, noro.address);
        await noro.connect(alice).approve(treasury.address, staked);
        await treasury.connect(alice).repayDebtWithNORO(staked);
        expect(await sNoro.debtBalances(alice.address)).to.equal(0);
    });
});
