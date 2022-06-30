import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { waitFor } from "../txHelper";
import { CONTRACTS, INITIAL_REWARD_RATE, INITIAL_INDEX, BOUNTY_AMOUNT } from "../constants";
import {
    CunoroAuthority__factory,
    Distributor__factory,
    CunoroERC20Token__factory,
    CunoroStaking__factory,
    SCunoro__factory,
    GOHM__factory,
    CunoroTreasury__factory,
    LUSDAllocator__factory,
} from "../../types";

// TODO: Shouldn't run setup methods if the contracts weren't redeployed.
const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
    const { deployments, getNamedAccounts, ethers } = hre;
    const { deployer } = await getNamedAccounts();
    const signer = await ethers.provider.getSigner(deployer);

    const authorityDeployment = await deployments.get(CONTRACTS.authority);
    const noroDeployment = await deployments.get(CONTRACTS.noro);
    const sNoroDeployment = await deployments.get(CONTRACTS.sNoro);
    const gNoroDeployment = await deployments.get(CONTRACTS.gNoro);
    const distributorDeployment = await deployments.get(CONTRACTS.distributor);
    const treasuryDeployment = await deployments.get(CONTRACTS.treasury);
    const stakingDeployment = await deployments.get(CONTRACTS.staking);
    const lusdAllocatorDeployment = await deployments.get(CONTRACTS.lusdAllocator);

    const authorityContract = await CunoroAuthority__factory.connect(
        authorityDeployment.address,
        signer
    );
    const noro = CunoroERC20Token__factory.connect(noroDeployment.address, signer);
    const sNoro = SCunoro__factory.connect(sNoroDeployment.address, signer);
    const gNoro = GOHM__factory.connect(gNoroDeployment.address, signer);
    const distributor = Distributor__factory.connect(distributorDeployment.address, signer);
    const staking = CunoroStaking__factory.connect(stakingDeployment.address, signer);
    const treasury = CunoroTreasury__factory.connect(treasuryDeployment.address, signer);
    const lusdAllocator = LUSDAllocator__factory.connect(lusdAllocatorDeployment.address, signer);

    // Step 1: Set treasury as vault on authority
    await waitFor(authorityContract.pushVault(treasury.address, true));
    console.log("Setup -- authorityContract.pushVault: set vault on authority");

    // Step 2: Set distributor as minter on treasury
    await waitFor(treasury.enable(8, distributor.address, ethers.constants.AddressZero)); // Allows distributor to mint noro.
    console.log("Setup -- treasury.enable(8):  distributor enabled to mint noro on treasury");

    // Step 3: Set distributor on staking
    await waitFor(staking.setDistributor(distributor.address));
    console.log("Setup -- staking.setDistributor:  distributor set on staking");

    // Step 4: Initialize sOHM and set the index
    if ((await sNoro.gOHM()) == ethers.constants.AddressZero) {
        await waitFor(sNoro.setIndex(INITIAL_INDEX)); // TODO
        await waitFor(sNoro.setgOHM(gNoro.address));
        await waitFor(sNoro.initialize(staking.address, treasuryDeployment.address));
    }
    console.log("Setup -- snoro initialized (index, gnoro)");

    // Step 5: Set up distributor with bounty and recipient
    await waitFor(distributor.setBounty(BOUNTY_AMOUNT));
    await waitFor(distributor.addRecipient(staking.address, INITIAL_REWARD_RATE));
    console.log("Setup -- distributor.setBounty && distributor.addRecipient");

    // Approve staking contact to spend deployer's OHM
    // TODO: Is this needed?
    // await noro.approve(staking.address, LARGE_APPROVAL);
};

func.tags = ["setup"];
func.dependencies = [CONTRACTS.noro, CONTRACTS.sNoro, CONTRACTS.gNoro];

export default func;
