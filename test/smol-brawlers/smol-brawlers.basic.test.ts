import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { Contract } from "ethers";
import { ethers, upgrades } from "hardhat";

describe("Smol Brawlers: Basic", function () {
    let smolBrawlers: Contract;
    let manager: Contract;
    let metadataContract: Contract;


    let owner: SignerWithAddress;
    let user1: SignerWithAddress;
    let user2: SignerWithAddress;
    let user3: SignerWithAddress;
    let minterUser: SignerWithAddress;


    beforeEach(async () => {
        [owner, user1, user2, user3, minterUser] = await ethers.getSigners();

        // Deploy the manager contract
        const Manager = await ethers.getContractFactory("Manager");
        manager = await Manager.deploy();

        // Add the owner as an admin and manager
        await manager.addAdmin(await owner.getAddress());
        await manager.addManager(await owner.getAddress(), 0);
        await manager.addManager(await owner.getAddress(), 1);
        await manager.addManager(await owner.getAddress(), 2);
        await manager.addManager(await owner.getAddress(), 3);
        await manager.addManager(await minterUser.getAddress(), 1);

        // Deploy the metadata contract (Temporal one)
        const NFTMetadata = await ethers.getContractFactory("SmolBrawlersMetadata");
        metadataContract = await NFTMetadata.deploy("https://example.com/metadata/");
        await metadataContract.deployed();

        // Deploy the SmolBrawlers contract
        const SmolBrawlers = await ethers.getContractFactory("SmolBrawlers");
        smolBrawlers = await upgrades.deployProxy(SmolBrawlers, [
            "SmolBrawlers",
            "SMOLBRAWLERS",
            manager.address,
            metadataContract.address
        ]);

        await smolBrawlers.deployed();
    });

    // Correct deployment
    it("Should initialize contract with name, symbol, baseUri and token counter", async () => {
        expect(await smolBrawlers.symbol()).to.equal("SMOLBRAWLERS");
        expect(await smolBrawlers.name()).to.equal("SmolBrawlers");
        expect(await smolBrawlers.getCurrentTokenId()).to.equal(0);

    });


});
