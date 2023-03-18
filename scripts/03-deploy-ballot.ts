import { ethers } from "hardhat";
import whitelist from "./ballot/whitelist.json";

async function main() {
  const network = await ethers.provider.getNetwork();
  const networkName = network.name == "unknown" ? "localhost" : network.name;

  console.log(`Network: ${networkName} (chainId=${network.chainId})`);

  // deploy main contract with descriptor address as argument
  const CastleDAOBallot = await ethers.getContractFactory("CastleDAOBallot");
  const myContract = await CastleDAOBallot.deploy();
  await myContract.deployed();

  console.log("CastleDAOBallot deployed to:", myContract.address);

  const chunkSize = 100;

  for (let i = 0; i < whitelist.length; i += chunkSize) {
    const chunk = whitelist.slice(i, i + chunkSize);
    await myContract.addToWhitelistMultiple(chunk);
    console.log("Whitelist added", chunk.length);
  }

  // if (networkName != 'localhost') {
  //   console.log('');
  //   console.log('To verify this contract on Etherscan, try:');
  //   console.log(
  //     `npx hardhat verify --network ${networkName} ${contract.address}`,
  //   );
  // }

  if (networkName !== "localhost") {
    console.log("");
    console.log("To verify this contract on Etherscan, try:");
    console.log(
      `npx hardhat verify --network ${networkName} ${myContract.address}`
    );
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
