// Tests for the castledao staking contract
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Contract } from "ethers";
import { expect } from "chai";
import { ethers, upgrades } from "hardhat";

// Contracts used in the tests
let castleVerseItems: Contract;
let manager: Contract;
let metadataContract: Contract;


let owner: SignerWithAddress;
let user1: SignerWithAddress;
let user2: SignerWithAddress;
let user3: SignerWithAddress;
let minterUser: SignerWithAddress;
let user1address: string;


describe("Items", function () {
    beforeEach(async () => {
        [owner, user1, user2, user3, minterUser] =
            await ethers.getSigners();

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

        // Deploy the metadata contract
        const NFTMetadata = await ethers.getContractFactory("ItemsMetadataV1");
        metadataContract = await NFTMetadata.deploy("https://example.com/metadata/");
        await metadataContract.deployed();


        // Deploy the CastleVerseItems contract
        const CastleVerseItems = await ethers.getContractFactory("CastleVerseItems");
        castleVerseItems = await upgrades.deployProxy(CastleVerseItems, [
            manager.address,
            metadataContract.address
        ]);

        await castleVerseItems.deployed();

        user1address = await user1.getAddress();
    });



    it("Should allow the manager to mint items", async () => {
        await castleVerseItems.managerMint((await user2.getAddress()), 1, 1, "0x");
        expect(await castleVerseItems.balanceOf((await user2.getAddress()), 1)).to.equal(1);
    });

    it("Should allow the manager to mint batch items", async () => {
        await castleVerseItems.managerMintBatch((await user3.getAddress()), [1, 2], [1, 1], "0x");
        expect(await castleVerseItems.balanceOf((await user3.getAddress()), 1)).to.equal(1);
        expect(await castleVerseItems.balanceOf((await user3.getAddress()), 2)).to.equal(1);
    });

    it("Should allow users to burn their items", async () => {
        await castleVerseItems.managerMint((await user2.getAddress()), 1, 1, "0x");
        await castleVerseItems.connect(user2).burn((await user2.getAddress()), 1, 1);
        expect(await castleVerseItems.balanceOf((await user2.getAddress()), 1)).to.equal(0);
    });

    it("Should allow users to burn batch items", async () => {
        await castleVerseItems.managerMintBatch(user1address, [1, 2], [1, 1], "0x");
        await castleVerseItems.connect(user1).burnBatch(user1address, [1, 2], [1, 1]);
        expect(await castleVerseItems.balanceOf(user1address, 1)).to.equal(0);
        expect(await castleVerseItems.balanceOf(user1address, 2)).to.equal(0);
    });

    it('should return the right token uri', async () => {
        expect(await castleVerseItems.uri(1)).to.equal("https://example.com/metadata/1.json");
    });

    it("should reject when a non manager tries to mint", async () => {
        await expect(castleVerseItems.connect(user1).managerMint(user1address, 1, 1, "0x")).to.be.revertedWith("Manager: Not minter");
    });

    it("should reject when a non manager tries to mint batch", async () => {
        await expect(castleVerseItems.connect(user1).managerMintBatch(user1address, [1, 2], [1, 1], "0x")).to.be.revertedWith("Manager: Not minter");
    })

    it("Should allow to set an item as paused", async () => {
        await castleVerseItems.pauseItem(1);
        expect(await castleVerseItems.pausedItems(1)).to.equal(true);
    })

    it("Should allow to set an item as unpaused", async () => {
        await castleVerseItems.pauseItem(1);
        await castleVerseItems.unpauseItem(1);
        expect(await castleVerseItems.pausedItems(1)).to.equal(false);
    })

    it("should not allow to mint a paused item", async () => {
        await castleVerseItems.pauseItem(1);
        await expect(castleVerseItems.managerMint(user1address, 1, 1, "0x")).to.be.revertedWith("Item is paused");
    });
});