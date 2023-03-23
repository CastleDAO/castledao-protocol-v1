// Deploys the master contracts and transfers ownership of the generals and castle contracts to the master contract.
import { ethers } from "hardhat";
import { deployed_contracts } from "./constants";

async function main() {
    const [deployer] = await ethers.getSigners();

    // Assume the contracts are already deployed and you have their addresses
    const generalsContractAddress = deployed_contracts.arbitrumgoerli.generals;
    const managerContractAddress = deployed_contracts.arbitrumgoerli.manager;

    // Interact with the deployed Generals contract
    const CryptoGenerals = await ethers.getContractFactory("CryptoGenerals");
    const generalsContract = await CryptoGenerals.attach(generalsContractAddress);
    console.log("Generals contract address:", generalsContract.address);


    // Interact with the deployed Manager contract
    const Manager = await hre.ethers.getContractFactory("Manager");
    const manager = await Manager.attach(managerContractAddress);
    console.log("Manager contract address:", manager.address);

    // Deploy the Master contract
    const Master = await hre.ethers.getContractFactory("MasterGenerals");
    const master = await Master.deploy(
        manager.address,
        generalsContract.address
    );
    await master.deployed();
    console.log("Master Generals contract deployed to:", master.address);

    // Transfer ownership of the Generals contract to the Master contract
    await generalsContract.transferOwnership(master.address);
    console.log("Generals contract ownership transferred to Master Generals");


    const network = await ethers.provider.getNetwork();
    const networkName = (network.name == 'unknown' ? 'localhost' : network.name);

    console.log(`Network: ${networkName} (chainId=${network.chainId})`);

    if (networkName != "localhost") {
        console.log("");
        console.log("To verify these contracts on Etherscan, try:");
        console.log(
            `npx hardhat verify --network ${networkName} ${master.address} ${manager.address} ${generalsContract.address} ${castleContract.address}`
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