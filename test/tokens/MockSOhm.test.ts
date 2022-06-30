import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { expect } from "chai";
import { ethers } from "hardhat";
import { MockSNORO__factory, MockSNORO } from "../../types";

describe("Mock sNoro Tests", () => {
    // 100 sNORO
    const INITIAL_AMOUNT = "100000000000";

    let initializer: SignerWithAddress;
    let alice: SignerWithAddress;
    let bob: SignerWithAddress;
    let sNoro: MockSNORO;

    beforeEach(async () => {
        [initializer, alice, bob] = await ethers.getSigners();

        // Initialize to index of 1 and rebase percentage of 1%
        sNoro = await new MockSNORO__factory(initializer).deploy("1000000000", "10000000");

        // Mint 100 sNORO for intializer account
        await sNoro.mint(initializer.address, INITIAL_AMOUNT);
    });

    it("should rebase properly", async () => {
        expect(await sNoro.balanceOf(initializer.address)).to.equal(INITIAL_AMOUNT);
        expect(await sNoro._agnosticBalance(initializer.address)).to.equal("100000000000");
        expect(await sNoro.index()).to.equal("1000000000");

        await sNoro.rebase();
        expect(await sNoro._agnosticBalance(initializer.address)).to.equal("100000000000");
        expect(await sNoro.balanceOf(initializer.address)).to.equal("101000000000");
        expect(await sNoro.index()).to.equal("1010000000");
    });

    it("should transfer properly", async () => {
        expect(await sNoro.balanceOf(initializer.address)).to.equal(INITIAL_AMOUNT);
        expect(await sNoro._agnosticBalance(initializer.address)).to.equal("100000000000");

        //await sNoro.approve(bob.address, INITIAL_AMOUNT);
        await sNoro.transfer(bob.address, INITIAL_AMOUNT);

        expect(await sNoro.balanceOf(initializer.address)).to.equal("0");
        expect(await sNoro._agnosticBalance(initializer.address)).to.equal("0");

        expect(await sNoro.balanceOf(bob.address)).to.equal(INITIAL_AMOUNT);
        expect(await sNoro._agnosticBalance(bob.address)).to.equal("100000000000");
    });

    it("should transfer properly after rebase", async () => {
        const afterRebase = "101000000000";

        expect(await sNoro.balanceOf(initializer.address)).to.equal(INITIAL_AMOUNT);
        expect(await sNoro._agnosticBalance(initializer.address)).to.equal("100000000000");

        await sNoro.rebase();
        expect(await sNoro.balanceOf(initializer.address)).to.equal(afterRebase);
        expect(await sNoro._agnosticBalance(initializer.address)).to.equal("100000000000");

        const rebasedAmount = "1000000000";
        await sNoro.transfer(bob.address, rebasedAmount); // Transfer rebased amount

        expect(await sNoro.balanceOf(initializer.address)).to.equal(INITIAL_AMOUNT);
        expect(await sNoro._agnosticBalance(initializer.address)).to.equal("99009900991");

        expect(await sNoro.balanceOf(bob.address)).to.equal(Number(rebasedAmount) - 1); // Precision error ;(
        expect(await sNoro._agnosticBalance(bob.address)).to.equal("990099009");
    });

    it("should drip funds to users", async () => {
        expect(await sNoro.balanceOf(initializer.address)).to.equal(INITIAL_AMOUNT);

        await sNoro.drip();

        expect(await sNoro.balanceOf(initializer.address)).to.equal("200000000000");
    });
});
