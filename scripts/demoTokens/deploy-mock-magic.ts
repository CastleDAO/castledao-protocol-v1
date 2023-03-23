// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
import { ethers } from "hardhat";

async function main() {
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // Get the TestERC20 contract factory
  const TestERC20 = await ethers.getContractFactory("TestERC20");

  // Deploy the TestERC20 contract
  const testERC20 = await TestERC20.deploy();

  await testERC20.deployed();

  const network = await ethers.provider.getNetwork();
  const networkName = (network.name == 'unknown' ? 'localhost' : network.name);

  console.log(`Network: ${networkName} (chainId=${network.chainId})`);
  console.log("TestERC20 deployed to:", testERC20.address);

  if(networkName != "localhost") {
    console.log("");
    console.log("To verify this contract on Etherscan, try:");
    console.log(`npx hardhat verify --network ${networkName} ${testERC20.address}`);
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