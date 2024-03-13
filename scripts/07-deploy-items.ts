// Deploys the GeneralsAmuletStaker contract and sets the initial amulet properties.
import { ethers, upgrades } from "hardhat";
import { deployed_contracts } from "./constants";

async function main() {
    const [deployer] = await ethers.getSigners();

    const network = await ethers.provider.getNetwork();

    const managerContractAddress = network.chainId === 42161 ? deployed_contracts.mainnet.manager : deployed_contracts.arbitrumgoerli.manager;


    const NFTMetadata = await ethers.getContractFactory("ItemsMetadataV1");
    const metadataURL = "https://slayersofmoloch.com/api/items/metadata/"
    const metadataContract = await NFTMetadata.deploy(metadataURL);
    await metadataContract.deployed();

    // Interact with the deployed Manager contract
    const Manager = await hre.ethers.getContractFactory("Manager");
    const manager = await Manager.attach(managerContractAddress);
    console.log("Manager contract address:", manager.address);

    // Add the minter address for the API 
    const APIAddress = "0xTest"
    // Minter role
    await manager.addManager(APIAddress, 1);

    const CastleVerseItems = await ethers.getContractFactory("CastleVerseItems");
    const castleVerseItems = await upgrades.deployProxy(CastleVerseItems, [
        manager.address,
        metadataContract.address
    ]);

    await castleVerseItems.deployed();


    const networkName = (network.name == 'unknown' ? 'localhost' : network.name);

    console.log(`Network: ${networkName} (chainId=${network.chainId})`);

    if (networkName != "localhost") {
        console.log("");
        console.log("To verify these contracts on Etherscan, try:");
        console.log(
            `npx hardhat verify --network ${networkName} ${metadataContract.address} ${metadataURL}`
        );

        console.log(
            `npx hardhat verify --network ${networkName} ${castleVerseItems.address} ${manager.address} ${metadataContract.address}`
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