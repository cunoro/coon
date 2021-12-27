import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";

import {
  CunoroERC20Token,
  CunoroERC20Token__factory,
  CunoroAuthority__factory
} from '../../types';

describe("CunoroTest", () => {
  let deployer: SignerWithAddress;
  let vault: SignerWithAddress;
  let bob: SignerWithAddress;
  let alice: SignerWithAddress;
  let noro: CunoroERC20Token;

  beforeEach(async () => {
    [deployer, vault, bob, alice] = await ethers.getSigners();

    const authority = await (new CunoroAuthority__factory(deployer)).deploy(deployer.address, deployer.address, deployer.address, vault.address);
    await authority.deployed();

    noro = await (new CunoroERC20Token__factory(deployer)).deploy(authority.address);

  });

  it("correctly constructs an ERC20", async () => {
    expect(await noro.name()).to.equal("Cunoro");
    expect(await noro.symbol()).to.equal("NORO");
    expect(await noro.decimals()).to.equal(9);
  });

  describe("mint", () => {
    it("must be done by vault", async () => {
      await expect(noro.connect(deployer).mint(bob.address, 100)).
        to.be.revertedWith("UNAUTHORIZED");
    });

    it("increases total supply", async () => {
      let supplyBefore = await noro.totalSupply();
      await noro.connect(vault).mint(bob.address, 100);
      expect(supplyBefore.add(100)).to.equal(await noro.totalSupply());
    });
  });

  describe("burn", () => {
    beforeEach(async () => {
      await noro.connect(vault).mint(bob.address, 100);
    });

    it("reduces the total supply", async () => {
      let supplyBefore = await noro.totalSupply();
      await noro.connect(bob).burn(10);
      expect(supplyBefore.sub(10)).to.equal(await noro.totalSupply());
    });

    it("cannot exceed total supply", async () => {
      let supply = await noro.totalSupply();
      await expect(noro.connect(bob).burn(supply.add(1))).
        to.be.revertedWith("ERC20: burn amount exceeds balance");
    });

    it("cannot exceed bob's balance", async () => {
      await noro.connect(vault).mint(alice.address, 15);
      await expect(noro.connect(alice).burn(16)).
        to.be.revertedWith("ERC20: burn amount exceeds balance");
    });
  });
});