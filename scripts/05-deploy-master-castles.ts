// Deploys the master contracts and transfers ownership of the generals and castle contracts to the master contract.
import { ethers } from "hardhat";
import { deployed_contracts } from "./constants";

async function main() {
    const [deployer] = await ethers.getSigners();

    const network = await ethers.provider.getNetwork();

    // Assume the contracts are already deployed and you have their addresses
    const castleContractAddress = network.chainId === 42161 ? deployed_contracts.mainnet.castles : deployed_contracts.arbitrumgoerli.castles;
    const managerContractAddress = network.chainId === 42161 ? deployed_contracts.mainnet.manager : deployed_contracts.arbitrumgoerli.manager;
    const magicContractAddress = network.chainId === 42161 ? deployed_contracts.mainnet.magic : deployed_contracts.arbitrumgoerli.magic;

    // Interact with the deployed Castle contract
    const CastlesArbi = await hre.ethers.getContractFactory("CastlesArbi");
    const castleContract = await CastlesArbi.attach(castleContractAddress);
    console.log("Castle contract address:", castleContract.address);
  
    // Interact with the deployed Manager contract
    const Manager = await hre.ethers.getContractFactory("Manager");
    const manager = await Manager.attach(managerContractAddress);
    console.log("Manager contract address:", manager.address);
  
    // Deploy the Master contract
    const Master = await hre.ethers.getContractFactory("MasterCastles");
    const master = await Master.deploy(
      manager.address,
      castleContract.address
    );
    await master.deployed();
    console.log("Master contract deployed to:", master.address);
      
    // Set the price in ETH for minting castles at master
    await master.setCastlePriceETH(ethers.utils.parseEther("0.05"));
    console.log("Master contract price set to 0.05 ETH");

    // Set the price in MAGIC for minting castles at master
    await master.setCastlePrices(magicContractAddress, ethers.utils.parseEther("50"));
    console.log("Master contract price set to 50 MAGIC");

    // Transfer ownership of the Castle contract to the Master contract
    await castleContract.transferOwnership(master.address);
    console.log("Castle contract ownership transferred to Master");
  
    const networkName = (network.name == 'unknown' ? 'localhost' : network.name);
  
    console.log(`Network: ${networkName} (chainId=${network.chainId})`);
  
    if (networkName != "localhost") {
      console.log("");
      console.log("To verify these contracts on Etherscan, try:");
      console.log(
        `npx hardhat verify --network ${networkName} ${master.address} ${manager.address} ${castleContract.address}`
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