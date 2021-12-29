import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CunoroERC20Token__factory } from "../../types";
import { CONTRACTS } from "../constants";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
    const { deployments, getNamedAccounts, ethers } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();
    const signer = await ethers.provider.getSigner(deployer);

    const noroDeployment = await deployments.get(CONTRACTS.noro);
    const noro = await CunoroERC20Token__factory.connect(noroDeployment.address, signer);

    await deploy(CONTRACTS.bondingCalculator, {
        from: deployer,
        args: [noro.address],
        log: true,
        skipIfAlreadyDeployed: true,
    });
};

func.tags = [CONTRACTS.bondingCalculator, "staking", "bonding"];
func.dependencies = [CONTRACTS.noro];

export default func;
