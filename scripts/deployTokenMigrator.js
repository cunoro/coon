const { ethers } = require("hardhat");

async function main() {

    const [deployer] = await ethers.getSigners();
    console.log('Deploying contracts with the account: ' + deployer.address);

    const oldNORO = "0x383518188c0c6d7730d91b2c03a03c837814a899";
    const oldsNORO = "0x04f2694c8fcee23e8fd0dfea1d4f5bb8c352111f";
    const oldStaking = "0xfd31c7d00ca47653c6ce64af53c1571f9c36566a";
    const oldwsNORO = "0xCa76543Cf381ebBB277bE79574059e32108e3E65";
    const sushiRouter = "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F";
    const uniRouter = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
    const oldTreasury = "0x31F8Cc382c9898b273eff4e0b7626a6987C846E8";

    const authorityAddress = "";

    const Authority = await ethers.getContractFactory('CunoroAuthority');
    const authority = await Authority.deploy(authorityAddress, authorityAddress, authorityAddress, authorityAddress);

    const Migrator = await ethers.getContractFactory('CunoroTokenMigrator');
    const migrator = await Migrator.deploy(oldNORO, oldsNORO, oldTreasury, oldStaking, oldwsNORO, sushiRouter, uniRouter, '0', authority.address);

    const GNORO = await ethers.getContractFactory('gNORO');
    const gNORO = await GNORO.deploy(migrator.address, oldsNORO);


    console.log("Migrator: " + migrator.address);
    console.log("gNORO: " + gNORO.address);
}

main()
    .then(() => process.exit())
    .catch(error => {
        console.error(error);
        process.exit(1);
})