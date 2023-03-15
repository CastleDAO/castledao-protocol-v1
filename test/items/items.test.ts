// Tests for the castledao staking contract
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Contract } from "ethers";
import { parseEther } from "ethers/lib/utils";
import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";

// Contracts used in the tests
let castleVerseItems: Contract;
let manager: Contract;
let metadataContract: Contract;
let magicToken: Contract;
let rubyToken: Contract;


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

        // Deploy the magic and ruby token contracts
        const ERC20 = await ethers.getContractFactory("TestERC20");
        magicToken = await ERC20.deploy();
        await magicToken.deployed();
        rubyToken = await ERC20.deploy();
        await rubyToken.deployed();

        // Deploy the CastleVerseItems contract
        const CastleVerseItems = await ethers.getContractFactory("CastleVerseItems");
        castleVerseItems = await upgrades.deployProxy(CastleVerseItems, [
            "https://example.com/items/",
            manager.address,
            metadataContract.address,
            magicToken.address,
            rubyToken.address
        ]);

        await castleVerseItems.deployed();

        user1address = await user1.getAddress();
    });

    it("Should allow the manager to add an item", async () => {
        await castleVerseItems.addItem(1, 100, 1000, true, false);
        const item = await castleVerseItems.items(1);
        expect(item.priceRuby).to.equal(100);
        expect(item.priceMagic).to.equal(1000);
        expect(item.isMagicAllowed).to.be.true;
        expect(item.isRestricted).to.be.false;
    });

    it("Should allow the manager to modify an item", async () => {
        await castleVerseItems.addItem(1, 100, 1000, true, false);
        await castleVerseItems.modifyItem(1, 200, 2000, false, true);
        const item = await castleVerseItems.items(1);
        expect(item.priceRuby).to.equal(200);
        expect(item.priceMagic).to.equal(2000);
        expect(item.isMagicAllowed).to.be.false;
        expect(item.isRestricted).to.be.true;
    });

    it("Should mint a free item", async () => {
        await castleVerseItems.addItem(1, 0, 0, true, false);
        await castleVerseItems.connect(user1).mintItem(1, 1, "0x");
        expect(await castleVerseItems.balanceOf(user1address, 1)).to.equal(1);
    });

    it("Should purchase an item with ruby", async () => {

        await castleVerseItems.addItem(1, 100, 1000, true, false);
        await rubyToken.mint(100, user1address);
        await rubyToken.connect(user1).approve(castleVerseItems.address, 100);

        await castleVerseItems.connect(user1).purchaseItem(1, 1, false, "0x");
        expect(await castleVerseItems.balanceOf(user1address, 1)).to.equal(1);
        expect(await rubyToken.balanceOf(castleVerseItems.address)).to.equal(100);
    });

    it("Should purchase an item with magic", async () => {
        await castleVerseItems.addItem(1, 100, 1000, true, false);
        await magicToken.mint(1000, user1address);
        await magicToken.connect(user1).approve(castleVerseItems.address, 1000);

        await castleVerseItems.connect(user1).purchaseItem(1, 1, true, "0x");
        expect(await castleVerseItems.balanceOf(user1address, 1)).to.equal(1);
        expect(await magicToken.balanceOf(castleVerseItems.address)).to.equal(1000);
    });

    it("Should not allow purchase with magic if not allowed", async () => {
        await castleVerseItems.addItem(1, 100, 1000, false, false);
        await magicToken.mint(1000, user1address);
        await magicToken.connect(user1).approve(castleVerseItems.address, 1000);

        await expect(
            castleVerseItems.connect(user1).purchaseItem(1, 1, true, "0x")
        ).to.be.revertedWith("MAGIC payment is not allowed for this item");
    });

    it("Should allow the manager to mint items", async () => {
        await castleVerseItems.addItem(1, 100, 1000, true, false);

        await castleVerseItems.managerMint((await user2.getAddress()), 1, 1, "0x");
        expect(await castleVerseItems.balanceOf((await user2.getAddress()), 1)).to.equal(1);
    });

    it("Should allow the manager to mint batch items", async () => {
        await castleVerseItems.addItem(1, 100, 1000, true, false);

        await castleVerseItems.addItem(2, 100, 1000, false, false);

        await castleVerseItems.managerMintBatch((await user3.getAddress()), [1, 2], [1, 1], "0x");
        expect(await castleVerseItems.balanceOf((await user3.getAddress()), 1)).to.equal(1);
        expect(await castleVerseItems.balanceOf((await user3.getAddress()), 2)).to.equal(1);
    });

    it("Should allow users to burn their items", async () => {
        await castleVerseItems.addItem(1, 100, 1000, true, false);

        await castleVerseItems.managerMint((await user2.getAddress()), 1, 1, "0x");
        await castleVerseItems.connect(user2).burn((await user2.getAddress()), 1, 1);
        expect(await castleVerseItems.balanceOf((await user2.getAddress()), 1)).to.equal(0);
    });

    it("Should allow users to burn batch items", async () => {
        await castleVerseItems.addItem(1, 100, 1000, true, false);

        await castleVerseItems.addItem(2, 100, 1000, true, false);

        await castleVerseItems.managerMintBatch(user1address, [1, 2], [1, 1], "0x");
        await castleVerseItems.connect(user1).burnBatch(user1address, [1, 2], [1, 1]);
        expect(await castleVerseItems.balanceOf(user1address, 1)).to.equal(0);
        expect(await castleVerseItems.balanceOf(user1address, 2)).to.equal(0);
    });
});