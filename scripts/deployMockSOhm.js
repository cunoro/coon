const { ethers } = require("hardhat");

async function main() {
    // Initialize sOHM to index of 1 and rebase percentage of 1%
    const mockSNoroFactory = await ethers.getContractFactory("MockSOHM");
    const mockSNoro = await mockSNoroFactory.deploy("1000000000", "10000000");

    console.log("SOHM DEPLOYED AT", mockSNoro.address);
}

main()
    .then(() => process.exit())
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
