import { ethers } from "hardhat";

async function main() {

  // Deploy the Manager contract
  const CompetitionFactory = await ethers.getContractFactory("CompetitionFactory");
  const restrictedUser = '0x846FF49d72F4e3CA7a3D318820C6C2debe23c68A';
  const treasury = '0xeEfC874aC40BCF8A00b4484F26F599d0CE6c0F47';
  const competitionFactory = await CompetitionFactory.deploy(restrictedUser, treasury );

  await competitionFactory.deployed();

  const network = await ethers.provider.getNetwork();
  const networkName = (network.name == 'unknown' ? 'localhost' : network.name);

  console.log(`Network: ${networkName} (chainId=${network.chainId})`);
  console.log("Manager contract deployed to:", competitionFactory.address);

  if (networkName != "localhost") {
    console.log("");
    console.log("To verify this contract on Etherscan, try:");
    console.log(`npx hardhat verify --network ${networkName} ${competitionFactory.address} ${restrictedUser} ${treasury}}`);
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