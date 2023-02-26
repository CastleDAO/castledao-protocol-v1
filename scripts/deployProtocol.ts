import { ethers } from "hardhat";

async function main() {
  const currentTimestampInSeconds = Math.round(Date.now() / 1000);
  const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;
  const unlockTime = currentTimestampInSeconds + ONE_YEAR_IN_SECS;

  const lockedAmount = ethers.utils.parseEther("1");

  // Manager contract
  const Manager = await ethers.getContractFactory("Manager");
  const manager = await Manager.deploy();
  await manager.deployed();
  console.log(`Manager deployed at ${manager.address}`);

  // Add admins to the manager contract
  const [owner, addr1] = await ethers.getSigners();
  await manager.addAdmin(addr1.address);
  console.log(`Added ${addr1.address} as admin`);

  // Deploy the bound contract that serves to limit the transfer of tokens

  const Bound = await ethers.getContractFactory("ERC20Bound");
  const bound = await Bound.deploy(manager.address);
  await bound.deployed();
  console.log(`Bound deployed at ${bound.address}`);

  // Deploy the Ruby token
  const Ruby = await ethers.getContractFactory("Ruby");
  const ruby = await Ruby.deploy(
    manager.address,
    bound.address,
    750000000000000000000000000
  );
  await ruby.deployed();

  console.log(`Ruby deployed at ${ruby.address}`);

  console.log(`Manager deployed at ${manager.address}`);
  console.log(
    `Lock with 1 ETH and unlock timestamp ${unlockTime} deployed to ${lock.address}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
