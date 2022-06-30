import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { FakeContract, smock } from "@defi-wonderland/smock";

import {
    CunoroStaking,
    CunoroTreasury,
    CunoroERC20Token,
    CunoroERC20Token__factory,
    SCunoro,
    SCunoro__factory,
    GNORO,
    CunoroAuthority__factory,
} from "../../types";

const TOTAL_GONS = 5000000000000000;
const ZERO_ADDRESS = ethers.utils.getAddress("0x0000000000000000000000000000000000000000");

describe("sNoro", () => {
    let initializer: SignerWithAddress;
    let alice: SignerWithAddress;
    let bob: SignerWithAddress;
    let noro: CunoroERC20Token;
    let sNoro: SCunoro;
    let gNoroFake: FakeContract<GNORO>;
    let stakingFake: FakeContract<CunoroStaking>;
    let treasuryFake: FakeContract<CunoroTreasury>;

    beforeEach(async () => {
        [initializer, alice, bob] = await ethers.getSigners();
        stakingFake = await smock.fake<CunoroStaking>("CunoroStaking");
        treasuryFake = await smock.fake<CunoroTreasury>("CunoroTreasury");
        gNoroFake = await smock.fake<GNORO>("gNORO");

        const authority = await new CunoroAuthority__factory(initializer).deploy(
            initializer.address,
            initializer.address,
            initializer.address,
            initializer.address
        );
        noro = await new CunoroERC20Token__factory(initializer).deploy(authority.address);
        sNoro = await new SCunoro__factory(initializer).deploy();
    });

    it("is constructed correctly", async () => {
        expect(await sNoro.name()).to.equal("Staked NORO");
        expect(await sNoro.symbol()).to.equal("sNORO");
        expect(await sNoro.decimals()).to.equal(9);
    });

    describe("initialization", () => {
        describe("setIndex", () => {
            it("sets the index", async () => {
                await sNoro.connect(initializer).setIndex(3);
                expect(await sNoro.index()).to.equal(3);
            });

            it("must be done by the initializer", async () => {
                await expect(sNoro.connect(alice).setIndex(3)).to.be.reverted;
            });

            it("cannot update the index if already set", async () => {
                await sNoro.connect(initializer).setIndex(3);
                await expect(sNoro.connect(initializer).setIndex(3)).to.be.reverted;
            });
        });

        describe("setgNORO", () => {
            it("sets gNoroFake", async () => {
                await sNoro.connect(initializer).setgNORO(gNoroFake.address);
                expect(await sNoro.gNORO()).to.equal(gNoroFake.address);
            });

            it("must be done by the initializer", async () => {
                await expect(sNoro.connect(alice).setgNORO(gNoroFake.address)).to.be.reverted;
            });

            it("won't set gNoroFake to 0 address", async () => {
                await expect(sNoro.connect(initializer).setgNORO(ZERO_ADDRESS)).to.be.reverted;
            });
        });

        describe("initialize", () => {
            it("assigns TOTAL_GONS to the stakingFake contract's balance", async () => {
                await sNoro
                    .connect(initializer)
                    .initialize(stakingFake.address, treasuryFake.address);
                expect(await sNoro.balanceOf(stakingFake.address)).to.equal(TOTAL_GONS);
            });

            it("emits Transfer event", async () => {
                await expect(
                    sNoro.connect(initializer).initialize(stakingFake.address, treasuryFake.address)
                )
                    .to.emit(sNoro, "Transfer")
                    .withArgs(ZERO_ADDRESS, stakingFake.address, TOTAL_GONS);
            });

            it("emits LogStakingContractUpdated event", async () => {
                await expect(
                    sNoro.connect(initializer).initialize(stakingFake.address, treasuryFake.address)
                )
                    .to.emit(sNoro, "LogStakingContractUpdated")
                    .withArgs(stakingFake.address);
            });

            it("unsets the initializer, so it cannot be called again", async () => {
                await sNoro
                    .connect(initializer)
                    .initialize(stakingFake.address, treasuryFake.address);
                await expect(
                    sNoro.connect(initializer).initialize(stakingFake.address, treasuryFake.address)
                ).to.be.reverted;
            });
        });
    });

    describe("post-initialization", () => {
        beforeEach(async () => {
            await sNoro.connect(initializer).setIndex(1);
            await sNoro.connect(initializer).setgNORO(gNoroFake.address);
            await sNoro.connect(initializer).initialize(stakingFake.address, treasuryFake.address);
        });

        describe("approve", () => {
            it("sets the allowed value between sender and spender", async () => {
                await sNoro.connect(alice).approve(bob.address, 10);
                expect(await sNoro.allowance(alice.address, bob.address)).to.equal(10);
            });

            it("emits an Approval event", async () => {
                await expect(await sNoro.connect(alice).approve(bob.address, 10))
                    .to.emit(sNoro, "Approval")
                    .withArgs(alice.address, bob.address, 10);
            });
        });

        describe("increaseAllowance", () => {
            it("increases the allowance between sender and spender", async () => {
                await sNoro.connect(alice).approve(bob.address, 10);
                await sNoro.connect(alice).increaseAllowance(bob.address, 4);

                expect(await sNoro.allowance(alice.address, bob.address)).to.equal(14);
            });

            it("emits an Approval event", async () => {
                await sNoro.connect(alice).approve(bob.address, 10);
                await expect(await sNoro.connect(alice).increaseAllowance(bob.address, 4))
                    .to.emit(sNoro, "Approval")
                    .withArgs(alice.address, bob.address, 14);
            });
        });

        describe("decreaseAllowance", () => {
            it("decreases the allowance between sender and spender", async () => {
                await sNoro.connect(alice).approve(bob.address, 10);
                await sNoro.connect(alice).decreaseAllowance(bob.address, 4);

                expect(await sNoro.allowance(alice.address, bob.address)).to.equal(6);
            });

            it("will not make the value negative", async () => {
                await sNoro.connect(alice).approve(bob.address, 10);
                await sNoro.connect(alice).decreaseAllowance(bob.address, 11);

                expect(await sNoro.allowance(alice.address, bob.address)).to.equal(0);
            });

            it("emits an Approval event", async () => {
                await sNoro.connect(alice).approve(bob.address, 10);
                await expect(await sNoro.connect(alice).decreaseAllowance(bob.address, 4))
                    .to.emit(sNoro, "Approval")
                    .withArgs(alice.address, bob.address, 6);
            });
        });

        describe("circulatingSupply", () => {
            it("is zero when all owned by stakingFake contract", async () => {
                await stakingFake.supplyInWarmup.returns(0);
                await gNoroFake.totalSupply.returns(0);
                await gNoroFake.balanceFrom.returns(0);

                const totalSupply = await sNoro.circulatingSupply();
                expect(totalSupply).to.equal(0);
            });

            it("includes all supply owned by gNoroFake", async () => {
                await stakingFake.supplyInWarmup.returns(0);
                await gNoroFake.totalSupply.returns(10);
                await gNoroFake.balanceFrom.returns(10);

                const totalSupply = await sNoro.circulatingSupply();
                expect(totalSupply).to.equal(10);
            });

            it("includes all supply in warmup in stakingFake contract", async () => {
                await stakingFake.supplyInWarmup.returns(50);
                await gNoroFake.totalSupply.returns(0);
                await gNoroFake.balanceFrom.returns(0);

                const totalSupply = await sNoro.circulatingSupply();
                expect(totalSupply).to.equal(50);
            });
        });
    });
});
