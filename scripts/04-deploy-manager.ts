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
  const manager1Address = "0xd6ecFf5F50c1A7e27C2e0422C76817FD21c44b2D"; // Replace with the desired address


  await manager.addManager(manager1Address, 1);
  console.log(`Added manager ${manager1Address} with type 1`);

  await manager.addManager(manager1Address, 2);
  console.log(`Added manager ${manager1Address} with type 2`);

  await manager.addManager(manager1Address, 3);
  console.log(`Added manager ${manager1Address} with type3`);

  await manager.addManager(manager1Address, 4);
  console.log(`Added manager ${manager1Address} with type 4`);

  await manager.addManager(manager1Address, 5);
  console.log(`Added manager ${manager1Address} with type 5`);


  if (networkName != "localhost") {
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