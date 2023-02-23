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
  

  // Deployed addresses of previously deployed contracts 

  const addresses = {
    'goerli': {
      castles: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
      cryptogenerals: '0x7Fb3D1C320cE071c691B595c8C4128bC7c3b9Fb2',
      defiheroes: '0x67b6D479c7bb412C54e03dCA8E1bc6740ce6b99C',
      smolbrains: '0x3f3DdDd3d3d3D3D3D61141441441441441441441',
      adventurersOfTheVoid: '0x6325439389e0797ab35752b4f43a14c004f22a9c',
    },
    'arbitrum': {
      castles: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
      cryptogenerals: '0x7Fb3D1C320cE071c691B595c8C4128bC7c3b9Fb2',
      defiheroes: '0x67b6D479c7bb412C54e03dCA8E1bc6740ce6b99C',
      smolbrains: '0x3f3DdDd3d3d3D3D3D61141441441441441441441',
      adventurersOfTheVoid: '0x6325439389e0797ab35752b4f43a14c004f22a9c',
    },
  };

  const currentNetwork = await ethers.provider.getNetwork();
  console.log(`Current network: ${currentNetwork.name}`)

  const castlesArbiAddress = addresses[currentNetwork.name].castles;
  const cryptogeneralsAddress = addresses[currentNetwork.name].cryptogenerals;
  const defiHeroesAddress = addresses[currentNetwork.name].defiheroes;
  const smolbrainsAddress = addresses[currentNetwork.name].smolbrains;
  const adventurersOfTheVoidAddress = addresses[currentNetwork.name].adventurersOfTheVoid;


  // Deploy the staking contract
  const StakerFactory = await ethers.getContractFactory("CastleDAOStaking");
  const castledaoStaking = await StakerFactory.deploy(
    manager.address,
    ruby.address,
    [castlesArbiAddress, cryptogeneralsAddress, defiHeroesAddress, smolbrainsAddress, adventurersOfTheVoidAddress],
    [20 , 10, 5, 0, 0],
    [30, 50, 100],
    [10, 12, 15]
  );

  await castledaoStaking.deployed();
  console.log(`Staking contract deployed at ${castledaoStaking.address}`);

  // Add the staking contract the ability to mint tokens
  await manager.addManager(castledaoStaking.address, 2);

  // Add the staking contract the ability to burn tokens

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
