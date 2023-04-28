import { ethers } from "hardhat";
import { deployed_contracts } from "../constants";

async function main() {

    const network = await ethers.provider.getNetwork();

    // Assume the Castle contract is already deployed and you have its address
    const castleContractAddress =
        network.chainId === 42161
            ? deployed_contracts.mainnet.castles
            : deployed_contracts.arbitrumgoerli.castles;

    // Deploy the SimpleStakers contract
    const SimpleStakers = await ethers.getContractFactory("SimplifiedStaker");
    const simpleStakers = await SimpleStakers.deploy(castleContractAddress);
    await simpleStakers.deployed();
    console.log("SimpleStakers contract deployed to:", simpleStakers.address);

    const networkName = network.name === "unknown" ? "localhost" : network.name;

    console.log(`Network: ${networkName} (chainId=${network.chainId})`);

    if (networkName !== "localhost") {
        console.log("");
        console.log("To verify this contract on Etherscan, try:");
        console.log(
            `npx hardhat verify --network ${networkName} ${simpleStakers.address} ${castleContractAddress}`
        );
    }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });