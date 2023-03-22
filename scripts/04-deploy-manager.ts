import { ethers } from "hardhat";

async function main() {

  // Deploy the Manager contract
  const Manager = await ethers.getContractFactory("Manager");
  const manager = await Manager.deploy();

  await manager.deployed();

  const network = await ethers.provider.getNetwork();
  const networkName = (network.name == 'unknown' ? 'localhost' : network.name);

  console.log(`Network: ${networkName} (chainId=${network.chainId})`);
  console.log("Manager contract deployed to:", manager.address);

  // Add managers
  const manager1Address = "0x123..."; // Replace with the desired address
  const manager1Type = 1; // Replace with the desired manager type

  const manager2Address = "0x456..."; // Replace with the desired address
  const manager2Type = 2; // Replace with the desired manager type

  await manager.addManager(manager1Address, manager1Type);
  console.log(`Added manager ${manager1Address} with type ${manager1Type}`);

  await manager.addManager(manager2Address, manager2Type);
  console.log(`Added manager ${manager2Address} with type ${manager2Type}`);


  if(networkName != "localhost") {
    console.log("");
    console.log("To verify this contract on Etherscan, try:");
    console.log(`npx hardhat verify --network ${networkName} ${manager.address}`);
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