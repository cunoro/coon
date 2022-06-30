import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CONTRACTS } from "../constants";

// Mainnet Addresses addresses
const oldNORO = "0xb2ea5e36875ef456caBA4612D9567cEbe155975E";
const oldsNORO = "0xe5a71723339eb0707dA9fa260C0F902dA618039C";
const oldTreasury = "0x04899316411499990D9452a9fFb62ba45850dB3d";
const oldStaking = "0xe5De80ef3EA62905234EF276c92268AbF86364B6";
const oldwsNORO = "0x22a2B7A2b1dF17DB4Dd6B18fD292eb83c3f1695b";
const joeRouter = "0xF5c7d9733e5f53abCC1695820c4818C59B457C2C";
const uniRouter = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    const authorityDeployment = await deployments.get(CONTRACTS.authority);

    await deploy(CONTRACTS.migrator, {
        from: deployer,
        args: [
            oldNORO,
            oldsNORO,
            oldTreasury,
            oldStaking,
            oldwsNORO,
            joeRouter,
            uniRouter,
            "0",
            authorityDeployment.address,
        ],
        log: true,
        skipIfAlreadyDeployed: true,
    });
};

func.tags = [CONTRACTS.migrator, "migration"];

export default func;
