import { BigNumber, ContractFactory } from "ethers";
import { ethers } from "hardhat";
import chai, { expect } from "chai";
import {
    CunoroStaking,
    CunoroERC20Token,
    GNORO,
    CunoroAuthority,
    DAI,
    SCunoro,
    CunoroTreasury,
    Distributor,
    YieldStreamer,
    IUniswapV2Router,
    AggregatorV3Interface,
} from "../../types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { toDecimals, toNoro, advanceEpoch, fromDecimals } from "../utils/Utilities";
import { FakeContract, smock } from "@defi-wonderland/smock";

describe("YieldStreamer", async () => {
    const LARGE_APPROVAL = "100000000000000000000000000000000";
    const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
    // Initial mint for Frax and DAI (10,000,000)
    const initialMint = toDecimals(10000000);
    // Reward rate of .1%
    const initialRewardRate = "1000";

    const triggerRebase = async () => {
        advanceEpoch(); // 8 hours per rebase
        await staking.rebase();
        return await sNoro.index();
    };

    chai.use(smock.matchers);

    let deployer: SignerWithAddress;
    let alice: SignerWithAddress;
    let bob: SignerWithAddress;
    let erc20Factory: ContractFactory;
    let stakingFactory: ContractFactory;
    let noroFactory: ContractFactory;
    let sNoroFactory: ContractFactory;
    let gNoroFactory: ContractFactory;
    let treasuryFactory: ContractFactory;
    let distributorFactory: ContractFactory;
    let authFactory: ContractFactory;
    let yieldStreamerFactory: ContractFactory;

    let auth: CunoroAuthority;
    let dai: DAI;
    let noro: CunoroERC20Token;
    let sNoro: SCunoro;
    let staking: CunoroStaking;
    let gNoro: GNORO;
    let treasury: CunoroTreasury;
    let distributor: Distributor;
    let yieldStreamer: YieldStreamer;
    let sushiRouter: FakeContract<IUniswapV2Router>;
    let oracleRouter: FakeContract<AggregatorV3Interface>;

    before(async () => {
        [deployer, alice, bob] = await ethers.getSigners();
        authFactory = await ethers.getContractFactory("CunoroAuthority");
        erc20Factory = await ethers.getContractFactory("DAI");
        stakingFactory = await ethers.getContractFactory("CunoroStaking");
        noroFactory = await ethers.getContractFactory("CunoroERC20Token");
        sNoroFactory = await ethers.getContractFactory("sCunoro");
        gNoroFactory = await ethers.getContractFactory("gNORO");
        treasuryFactory = await ethers.getContractFactory("CunoroTreasury");
        distributorFactory = await ethers.getContractFactory("Distributor");
        yieldStreamerFactory = await ethers.getContractFactory("YieldStreamer");
        sushiRouter = await smock.fake<IUniswapV2Router>("IUniswapV2Router");
        oracleRouter = await smock.fake<AggregatorV3Interface>("AggregatorV3Interface");
    });

    beforeEach(async () => {
        dai = (await erc20Factory.deploy(0)) as DAI;
        auth = (await authFactory.deploy(
            deployer.address,
            deployer.address,
            deployer.address,
            deployer.address
        )) as CunoroAuthority;
        noro = (await noroFactory.deploy(auth.address)) as CunoroERC20Token;
        sNoro = (await sNoroFactory.deploy()) as SCunoro;
        gNoro = (await gNoroFactory.deploy(deployer.address, sNoro.address)) as GNORO;
        const blockNumBefore = await ethers.provider.getBlockNumber();
        const blockBefore = await ethers.provider.getBlock(blockNumBefore);
        staking = (await stakingFactory.deploy(
            noro.address,
            sNoro.address,
            gNoro.address,
            "28800", // 1 epoch = 8 hours
            "1",
            blockBefore.timestamp + 28800, // First epoch in 8 hours. Avoids first deposit to set epoch.distribute wrong
            auth.address
        )) as CunoroStaking;
        await gNoro.migrate(staking.address, sNoro.address);
        treasury = (await treasuryFactory.deploy(
            noro.address,
            "0",
            auth.address
        )) as CunoroTreasury;
        distributor = (await distributorFactory.deploy(
            treasury.address,
            noro.address,
            staking.address,
            auth.address
        )) as Distributor;
        yieldStreamer = (await yieldStreamerFactory.deploy(
            gNoro.address,
            sNoro.address,
            noro.address,
            dai.address,
            sushiRouter.address,
            staking.address,
            auth.address,
            oracleRouter.address,
            1000,
            1000,
            toDecimals(1)
        )) as YieldStreamer;

        // Setup for each component

        // Needed for treasury deposit
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

        // queue and toggle reward manager
        await treasury.enable("8", distributor.address, ZERO_ADDRESS);
        // queue and toggle deployer reserve depositor
        await treasury.enable("0", deployer.address, ZERO_ADDRESS);
        // queue and toggle liquidity depositor
        await treasury.enable("4", deployer.address, ZERO_ADDRESS);
        // queue and toggle DAI as reserve token
        await treasury.enable("2", dai.address, ZERO_ADDRESS);

        // Deposit 10,000 DAI to treasury, 1,000 NORO gets minted to deployer with 9000 as excess reserves (ready to be minted)
        await treasury.connect(deployer).deposit(toDecimals(10000), dai.address, toNoro(9000));

        // Add staking as recipient of distributor with a test reward rate
        await distributor.addRecipient(staking.address, initialRewardRate);

        // Get sNORO in deployer wallet
        const snoroAmount = toNoro(1000);
        await noro.approve(staking.address, snoroAmount);
        await staking.stake(deployer.address, snoroAmount, true, true);
        await triggerRebase(); // Trigger first rebase to set initial distribute amount. This rebase shouldn't update index.

        // Transfer 100 sNORO to alice for testing
        await sNoro.transfer(alice.address, toNoro(100));

        // Alice should wrap noro to gNoro. Should have 10gNoro
        await sNoro.approve(staking.address, LARGE_APPROVAL);
        await staking.wrap(deployer.address, toNoro(500));
        await sNoro.connect(alice).approve(staking.address, LARGE_APPROVAL);
        await staking.connect(alice).wrap(alice.address, toNoro(100));

        await gNoro.connect(alice).approve(yieldStreamer.address, LARGE_APPROVAL);
        await gNoro.connect(deployer).approve(yieldStreamer.address, LARGE_APPROVAL);
        await dai.connect(deployer).transfer(yieldStreamer.address, toDecimals(1000000)); // Give dai to yieldstreamer so it has dai to pay out. Mocking the noro dai swap with smock.
    });

    it("should rebase properly", async () => {
        await expect(await sNoro.index()).is.equal("10000000000");
        await triggerRebase();
        await expect(await sNoro.index()).is.equal("10010000000");
        await triggerRebase();
        await expect(await sNoro.index()).is.equal("10020010000");
        await triggerRebase();
        await expect(await sNoro.index()).is.equal("10030030010");
    });

    it("Upkeep sends correct amount of dai to recipients. Deposit and Upkeep info updated correctly.", async () => {
        await yieldStreamer
            .connect(deployer)
            .deposit(toDecimals(10), bob.address, 1, toDecimals(5));
        await expect(
            await yieldStreamer
                .connect(alice)
                .deposit(toDecimals(10), alice.address, 1, toDecimals(5))
        ).to.emit(yieldStreamer, "Deposited");

        await expect(await yieldStreamer.idCount()).is.equal("2");
        await expect((await yieldStreamer.depositInfo(0)).principalAmount).is.equal(toNoro(100));
        await expect((await yieldStreamer.recipientInfo(0)).recipientAddress).is.equal(bob.address);
        await expect((await yieldStreamer.recipientInfo(0)).paymentInterval).is.equal(1);
        await expect((await yieldStreamer.recipientInfo(0)).userMinimumAmountThreshold).is.equal(
            toDecimals(5)
        );
        await expect(await yieldStreamer.activeDepositIds(1)).is.equal(1);

        await triggerRebase();

        const expectedYield = await gNoro.balanceTo(toNoro(0.1)); // yield is 0.1sNoro convert this to gNoro
        const actualYield = await yieldStreamer.redeemableBalance(0);
        await expect(actualYield).is.closeTo(expectedYield, 1); // 1 digit off due to precision issues of converting gNoro to sNoro and back to gNoro.

        const amountOfDai = toNoro(0.2).mul(100).mul(1000000000).mul(999).div(1000); // Mock the amount of Dai coming out of swap.
        oracleRouter.latestRoundData.returns([0, amountOfDai, 0, 0, 0]);
        sushiRouter.swapExactTokensForTokens.returns([BigNumber.from("0"), amountOfDai]);

        await yieldStreamer.upkeep();

        await expect(await dai.balanceOf(bob.address)).is.equal(amountOfDai.div(2));
        await expect(await dai.balanceOf(alice.address)).is.equal(amountOfDai.div(2));
    });

    it("Adding to deposit calculates agnostic with changing index. Withdrawing does not withdraw more gNoro than there is.", async () => {
        await yieldStreamer.connect(alice).deposit(toDecimals(5), alice.address, 1, toDecimals(5)); //5 gNoro deposited, 50 sNoro principal
        await triggerRebase();

        await expect((await yieldStreamer.depositInfo(0)).principalAmount).is.equal(toNoro(50)); // still should be 100sNoro but less gNoro
        await expect((await yieldStreamer.depositInfo(0)).agnosticAmount).is.equal(toDecimals(5)); // still should be 10gNoro. But its more than 100 sNoro

        await yieldStreamer.connect(alice).addToDeposit(0, toDecimals(5)); // add another 5gNoro or 50.05 sNoro since index change
        await expect((await yieldStreamer.depositInfo(0)).principalAmount).is.equal(toNoro(100.05)); // total sNoro should be 100.05
        await expect((await yieldStreamer.depositInfo(0)).agnosticAmount).is.equal(toDecimals(10)); // agnostic should be 20 gNoro or 200.2 sNoro.

        const expectedYield = await gNoro.balanceTo(toNoro(0.05)); // yield is 0.05sNoro convert this to gNoro
        const actualYield = await yieldStreamer.redeemableBalance(0);
        await expect(actualYield).is.closeTo(expectedYield, 1); // 1 digit off due to precision issues of converting gNoro to sNoro and back to gNoro.

        await yieldStreamer.connect(alice).withdrawYield(0);
        await expect(await gNoro.balanceOf(alice.address)).is.equal(actualYield);

        let principalInGNORO = await yieldStreamer.getPrincipalInGNORO(0);
        await yieldStreamer.connect(alice).withdrawPrincipal(0, toDecimals(10));
        await expect(await gNoro.balanceOf(alice.address)).is.equal(
            principalInGNORO.add(actualYield)
        );
    });

    it("withdrawing all yield does it for all deposits recipient is liable for", async () => {
        await yieldStreamer
            .connect(deployer)
            .deposit(toDecimals(10), alice.address, 1, toDecimals(5));
        await yieldStreamer.connect(alice).deposit(toDecimals(10), alice.address, 1, toDecimals(5));
        await triggerRebase();
        await expect(await gNoro.balanceOf(alice.address)).is.equal("0");

        let expectedYield = await yieldStreamer.redeemableBalance(0);

        await yieldStreamer.connect(alice).withdrawAllYield();
        await expect(await yieldStreamer.redeemableBalance(0)).is.equal(0);
        await expect(await yieldStreamer.redeemableBalance(1)).is.equal(0);
        await expect(await gNoro.balanceOf(alice.address)).is.equal(expectedYield.mul(2));
    });

    it("withdrawing yield on behalf of others", async () => {
        await yieldStreamer.connect(alice).deposit(toDecimals(10), alice.address, 1, toDecimals(5));
        await triggerRebase();
        await expect(await gNoro.balanceOf(alice.address)).is.equal("0");
        let expectedYield = await yieldStreamer.redeemableBalance(0);

        await yieldStreamer.connect(deployer).givePermissionToRedeem(bob.address);

        await yieldStreamer.connect(bob).redeemYieldOnBehalfOf(0);
        await expect(await yieldStreamer.redeemableBalance(0)).is.equal(0);
        await expect(await gNoro.balanceOf(alice.address)).is.equal(expectedYield);

        await triggerRebase();
        await yieldStreamer.connect(deployer).revokePermissionToRedeem(bob.address);
        await expect(yieldStreamer.connect(bob).redeemYieldOnBehalfOf(0)).to.be.reverted;
    });

    it("withdrawing all yield on behalf of others", async () => {
        await yieldStreamer
            .connect(deployer)
            .deposit(toDecimals(10), alice.address, 1, toDecimals(5));
        await yieldStreamer.connect(alice).deposit(toDecimals(10), alice.address, 1, toDecimals(5));
        await triggerRebase();
        await expect(await gNoro.balanceOf(alice.address)).is.equal("0");
        let expectedYield = await yieldStreamer.redeemableBalance(0);

        await yieldStreamer.connect(deployer).givePermissionToRedeem(bob.address);
        await yieldStreamer.connect(bob).redeemAllYieldOnBehalfOf(alice.address);

        await expect(await yieldStreamer.redeemableBalance(0)).is.equal(0);
        await expect(await yieldStreamer.redeemableBalance(1)).is.equal(0);
        await expect(await gNoro.balanceOf(alice.address)).is.equal(expectedYield.mul(2));
    });

    it("withdrawing part of principal", async () => {
        await yieldStreamer.connect(alice).deposit(toDecimals(10), alice.address, 1, toDecimals(5)); //10gNoro deposited. 100sNoro principal
        await triggerRebase();
        await expect(await gNoro.balanceOf(alice.address)).is.equal("0");

        await expect(
            await yieldStreamer.connect(alice).withdrawPrincipal(0, toDecimals(5))
        ).to.emit(yieldStreamer, "Withdrawn"); // withdraw 5 gNoro principal should be a bit less than 100sNoro since rebase happened
        await expect(await gNoro.balanceOf(alice.address)).is.equal(toDecimals(5));
        await expect((await yieldStreamer.depositInfo(0)).principalAmount).is.equal(toNoro(49.95));
    });

    it("withdrawing all of principal", async () => {
        await yieldStreamer.connect(alice).deposit(toDecimals(10), alice.address, 1, toDecimals(5)); //10gNoro deposited. 100sNoro principal
        await triggerRebase();
        await expect(await gNoro.balanceOf(alice.address)).is.equal("0");

        await expect(
            await yieldStreamer.connect(alice).withdrawPrincipal(0, toDecimals(100))
        ).to.emit(yieldStreamer, "Withdrawn"); // withdraw 5 gNoro principal should be a bit less than 100sNoro since rebase happened
        await expect(await gNoro.balanceOf(alice.address)).is.equal(toDecimals(10));
        await expect(yieldStreamer.activeDepositIds(0)).to.be.reverted;
    });

    it("harvest unclaimed dai premature", async () => {
        await yieldStreamer
            .connect(alice)
            .deposit(toDecimals(10), alice.address, 1, toDecimals(1000));
        await triggerRebase();

        const amountOfDai = toNoro(0.1).mul(100).mul(1000000000); // Mock the amount of Dai coming out of swap. 0.1 Noro should give roughly 10 DAi. Assuming Noro=100DAI
        oracleRouter.latestRoundData.returns([0, amountOfDai, 0, 0, 0]);
        sushiRouter.swapExactTokensForTokens.returns([BigNumber.from("0"), amountOfDai]);

        await expect(await yieldStreamer.upkeep()).to.emit(yieldStreamer, "UpkeepComplete");

        await expect((await yieldStreamer.recipientInfo(0)).unclaimedStreamTokens).is.equals(
            toDecimals(10)
        );
        await yieldStreamer.connect(alice).harvestStreamTokens(0);
        await expect(await dai.balanceOf(alice.address)).is.equals(toDecimals(10));
    });

    it("Disabled functions revert", async () => {
        await yieldStreamer.disableDeposits(true);
        await expect(
            yieldStreamer.deposit(toDecimals(5), alice.address, 1, toDecimals(5))
        ).to.be.revertedWith("DepositDisabled");
        await expect(yieldStreamer.addToDeposit(0, toDecimals(5))).to.be.revertedWith(
            "DepositDisabled"
        );
        await yieldStreamer.disableDeposits(false);
        await yieldStreamer.connect(alice).deposit(toDecimals(10), alice.address, 1, toDecimals(5));

        await triggerRebase();
        await yieldStreamer.disableUpkeep(true);
        await expect(yieldStreamer.upkeep()).to.be.revertedWith("UpkeepDisabled");

        await yieldStreamer.disableWithdrawals(true);
        await expect(yieldStreamer.withdrawPrincipal(0, toDecimals(10))).to.be.revertedWith(
            "WithdrawDisabled"
        );
        await expect(yieldStreamer.withdrawYield(0)).to.be.revertedWith("WithdrawDisabled");
        await expect(yieldStreamer.harvestStreamTokens(0)).to.be.revertedWith("WithdrawDisabled");
    });

    it("User can update user settings", async () => {
        await yieldStreamer
            .connect(alice)
            .deposit(toDecimals(10), alice.address, 604800, toDecimals(1000));

        await yieldStreamer.connect(alice).updatePaymentInterval(0, 2419200);
        await yieldStreamer.connect(alice).updateUserMinThreshold(0, toDecimals(2000));

        await expect((await yieldStreamer.recipientInfo(0)).paymentInterval).is.equal(2419200);
        await expect((await yieldStreamer.recipientInfo(0)).userMinimumAmountThreshold).is.equal(
            toDecimals(2000)
        );
    });

    it("Governor can update contract settins", async () => {
        await expect(await yieldStreamer.maxSwapSlippagePercent()).is.equal(1000);
        await expect(await yieldStreamer.feeToDaoPercent()).is.equal(1000);
        await expect(await yieldStreamer.minimumTokenThreshold()).is.equal(toDecimals(1));

        await yieldStreamer.setMaxSwapSlippagePercent(10);
        await yieldStreamer.setFeeToDaoPercent(10);
        await yieldStreamer.setminimumTokenThreshold(toDecimals(1000));

        await expect(await yieldStreamer.maxSwapSlippagePercent()).is.equal(10);
        await expect(await yieldStreamer.feeToDaoPercent()).is.equal(10);
        await expect(await yieldStreamer.minimumTokenThreshold()).is.equal(toDecimals(1000));
    });

    it("Upkeep Eligibility returns correct values", async () => {
        await yieldStreamer
            .connect(deployer)
            .deposit(toDecimals(10), bob.address, 1, toDecimals(5));
        await yieldStreamer.connect(alice).deposit(toDecimals(10), alice.address, 1, toDecimals(5));

        await triggerRebase();

        let yieldPerDeposit = await yieldStreamer.redeemableBalance(0);
        let upkeepEligibility = await yieldStreamer.upkeepEligibility();
        await expect(upkeepEligibility[0]).is.equals("2");
        await expect(upkeepEligibility[1]).is.equals(yieldPerDeposit.mul(2));
    });

    it("Returns recipients total yield with multiple deposits", async () => {
        await yieldStreamer
            .connect(deployer)
            .deposit(toDecimals(10), bob.address, 1, toDecimals(5));
        await yieldStreamer.connect(alice).deposit(toDecimals(10), bob.address, 1, toDecimals(5));

        await triggerRebase();

        let yieldPerDeposit = await yieldStreamer.redeemableBalance(0);
        await expect(await yieldStreamer.totalRedeemableBalance(bob.address)).is.equals(
            yieldPerDeposit.mul(2)
        );
    });
});
