const { ethers } = require("hardhat");

async function main() {

    const [deployer] = await ethers.getSigners();
    console.log('Deploying contracts with the account: ' + deployer.address);


    const firstEpochNumber = "";
    const firstBlockNumber = "";
    const gNORO = "";
    const authority = "";

    const NORO = await ethers.getContractFactory('CunoroERC20Token');
    const noro = await NORO.deploy(authority);

    const CunoroTreasury = await ethers.getContractFactory('CunoroTreasury');
    const cunoroTreasury = await CunoroTreasury.deploy(noro.address, '0', authority);

    const SNORO = await ethers.getContractFactory('sCunoro');
    const sNORO = await SNORO.deploy();

    const CunoroStaking = await ethers.getContractFactory('CunoroStaking');
    const staking = await CunoroStaking.deploy(noro.address, sNORO.address, gNORO, '2200', firstEpochNumber, firstBlockNumber, authority);

    const Distributor = await ethers.getContractFactory('Distributor');
    const distributor = await Distributor.deploy(cunoroTreasury.address, noro.address, staking.address, authority );

    await sNORO.setIndex('');
    await sNORO.setgNORO(gNORO);
    await sNORO.initialize(staking.address, cunoroTreasury.address);
    


    console.log("NORO: " + noro.address);
    console.log("Cunoro Treasury: " + cunoroTreasury.address);
    console.log("Staked Cunoro: " + sNORO.address);
    console.log("Staking Contract: " + staking.address);
    console.log("Distributor: " + distributor.address);
}

main()
    .then(() => process.exit())
    .catch(error => {
        console.error(error);
        process.exit(1);
})