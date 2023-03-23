// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
import { ethers } from "hardhat";
import { deployed_contracts } from "../constants";

async function main() {
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // Replace the deployed TestERC20 contract address
  const tokenAddress = deployed_contracts.arbitrumgoerli.magic; // Replace with your deployed TestERC20 contract address

  // Get the TestERC20 contract instance
  const TestERC20 = await hre.ethers.getContractFactory("TestERC20");
  const testERC20 = await TestERC20.attach(tokenAddress);

  // List of addresses to mint tokens for
  const addresses = [
    "0x00...123" // TODO: Replace with your address
  ];

  // Specify the amount of tokens to mint for each address
  const amount = hre.ethers.utils.parseUnits("100000", 18); // Change the amount as needed

  // Mint tokens for each address
  for (const address of addresses) {
    console.log(`Minting ${amount.toString()} tokens for address: ${address}`);
    const tx = await testERC20.mint(amount, address);
    await tx.wait();
  }

  // Log the new balances for each address
  for (const address of addresses) {
    const balance = await testERC20.balanceOf(address);
    console.log(`New balance for address ${address}: ${balance.toString()}`);
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