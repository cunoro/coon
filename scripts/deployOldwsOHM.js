const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with the account: " + deployer.address);

    const oldsNORO = "0x1Fecda1dE7b6951B248C0B62CaeBD5BAbedc2084";

    const WSNORO = await ethers.getContractFactory("wNORO");
    const wsNORO = await WSNORO.deploy(oldsNORO);

    console.log("old wsNORO: " + wsNORO.address);
}

main()
    .then(() => process.exit())
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
