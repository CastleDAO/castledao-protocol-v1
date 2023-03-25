// Deploys the GeneralsAmuletStaker contract and sets the initial amulet properties.
import { ethers } from "hardhat";
import { deployed_contracts } from "./constants";

async function main() {
    const [deployer] = await ethers.getSigners();

    const network = await ethers.provider.getNetwork();

    // Assume the contracts are already deployed and you have their addresses
    const ballotContractAddress = network.chainId === 42161 ? deployed_contracts.mainnet.ballot : deployed_contracts.arbitrumgoerli.ballot;
    const managerContractAddress = network.chainId === 42161 ? deployed_contracts.mainnet.manager : deployed_contracts.arbitrumgoerli.manager;
    const generalContractAddress = network.chainId === 42161 ? deployed_contracts.mainnet.generals : deployed_contracts.arbitrumgoerli.generals;

    // Interact with the deployed Ballot contract
    const Ballots = await hre.ethers.getContractFactory("CastleDAOBallot");
    const ballotContract = await Ballots.attach(ballotContractAddress);
    console.log("Ballot contract address:", ballotContract.address);

    // Interact with the deployed Manager contract
    const Manager = await hre.ethers.getContractFactory("Manager");
    const manager = await Manager.attach(managerContractAddress);
    console.log("Manager contract address:", manager.address);

    // Interact with the deployed General contract
    const Generals = await hre.ethers.getContractFactory("CryptoGenerals");
    const generalContract = await Generals.attach(generalContractAddress);
    console.log("General contract address:", generalContract.address);

    // Deploy the GeneralsAmuletStaker contract
    const GeneralsAmuletStaker = await hre.ethers.getContractFactory("GeneralsAmuletStaker");
    const generalsAmuletStaker = await GeneralsAmuletStaker.deploy(
        manager.address,
        ballotContract.address,
        generalContract.address
    );
    await generalsAmuletStaker.deployed();
    console.log("GeneralsAmuletStaker contract deployed to:", generalsAmuletStaker.address);

    // Add the different amulet types
    // sea, fire, forest, magic, dark, plains
    const availableAmulets = ['sea', 'fire', 'magic', 'dark', 'plains', 'forest', 'mountain', 'ice', 'castle', 'desert', 'science'];

    for(let i = 0; i < availableAmulets.length; i++) {
        await generalsAmuletStaker.addAmulet(
            i + 1,
            availableAmulets[i]
        )

        console.log(`Added amulet ${availableAmulets[i]} with id ${i + 1} to the GeneralsAmuletStaker contract`)
    }
    const networkName = (network.name == 'unknown' ? 'localhost' : network.name);

    console.log(`Network: ${networkName} (chainId=${network.chainId})`);

    if (networkName != "localhost") {
        console.log("");
        console.log("To verify these contracts on Etherscan, try:");
        console.log(
            `npx hardhat verify --network ${networkName} ${generalsAmuletStaker.address} ${manager.address} ${ballotContract.address} ${generalContract.address}`
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