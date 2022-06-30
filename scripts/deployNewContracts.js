const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with the account: " + deployer.address);

    const firstEpochNumber = "";
    const firstBlockNumber = "";
    const gOHM = "";
    const authority = "";

    const OHM = await ethers.getContractFactory("CunoroERC20Token");
    const noro = await OHM.deploy(authority);

    const CunoroTreasury = await ethers.getContractFactory("CunoroTreasury");
    const cunoroTreasury = await CunoroTreasury.deploy(noro.address, "0", authority);

    const SOHM = await ethers.getContractFactory("sCunoro");
    const sOHM = await SOHM.deploy();

    const CunoroStaking = await ethers.getContractFactory("CunoroStaking");
    const staking = await CunoroStaking.deploy(
        noro.address,
        sOHM.address,
        gOHM,
        "2200",
        firstEpochNumber,
        firstBlockNumber,
        authority
    );

    const Distributor = await ethers.getContractFactory("Distributor");
    const distributor = await Distributor.deploy(
        cunoroTreasury.address,
        noro.address,
        staking.address,
        authority
    );

    await sOHM.setIndex("");
    await sOHM.setgOHM(gOHM);
    await sOHM.initialize(staking.address, cunoroTreasury.address);

    console.log("OHM: " + noro.address);
    console.log("Cunoro Treasury: " + cunoroTreasury.address);
    console.log("Staked Cunoro: " + sOHM.address);
    console.log("Staking Contract: " + staking.address);
    console.log("Distributor: " + distributor.address);
}

main()
    .then(() => process.exit())
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
