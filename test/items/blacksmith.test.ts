// Tests for the castledao staking contract
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Contract } from "ethers";
import { expect } from "chai";
import { ethers, upgrades } from "hardhat";

// Contracts used in the tests
let castleVerseItems: Contract;
let manager: Contract;
let metadataContract: Contract;
let magicToken: Contract;
let rubyToken: Contract;
let blacksmith: Contract;


let owner: SignerWithAddress;
let user1: SignerWithAddress;
let user2: SignerWithAddress;
let user3: SignerWithAddress;
let minterUser: SignerWithAddress;
let user1address: string;


describe("Blacksmith", function () {
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
            manager.address,
            metadataContract.address
        ]);

        await castleVerseItems.deployed();

        // Deploy the blacksmith contract
        const Blacksmith = await ethers.getContractFactory("Blacksmith");

        blacksmith = await upgrades.deployProxy(Blacksmith, [
            manager.address,
            castleVerseItems.address,
            magicToken.address,
            rubyToken.address,
        ]);

        await blacksmith.deployed();

        // Add the minter role to the blacksmith contract
        await manager.addManager(await blacksmith.address, 1);


        user1address = await user1.getAddress();
    });

    it("Should allow the manager to add an item", async () => {
        await blacksmith.addItem(1, 100, 1000, true, 10);
        const item = await blacksmith.items(1);
        expect(item.priceRuby).to.equal(100);
        expect(item.priceMagic).to.equal(1000);
        expect(item.isMagicAllowed).to.be.true;
        expect(item.maxSupply).to.equal(10);
        expect(item.paused).to.be.false;
    });

    it("Should allow the manager to modify an item", async () => {
        await blacksmith.addItem(1, 100, 1000, true, 10);
        await blacksmith.modifyItem(1, 200, 2000, false, 5);
        const item = await blacksmith.items(1);
        expect(item.priceRuby).to.equal(200);
        expect(item.priceMagic).to.equal(2000);
        expect(item.isMagicAllowed).to.be.false;
        expect(item.maxSupply).to.equal(5);
    });

    it("Should mint a free item", async () => {
        await blacksmith.addItem(1, 0, 0, true, 1);
        await blacksmith.connect(user1).purchaseItem(1, 1, true, "0x");
        expect(await castleVerseItems.balanceOf(user1address, 1)).to.equal(1);

        // Increases the supply
        expect(await blacksmith.totalSupply(1)).to.equal(1);
    });

    it("Should reject when the max supply is reached", async () => {
        await blacksmith.addItem(1, 0, 0, true, 1);
        await blacksmith.connect(user1).purchaseItem(1, 1, true, "0x");
        await expect(
            blacksmith.connect(user1).purchaseItem(1, 1, true, "0x")
        ).to.be.revertedWith("Max supply reached");
    });

    it("Should purchase an item with ruby", async () => {

        await blacksmith.addItem(1, 100, 1000, true, 1);
        await rubyToken.mint(100, user1address);
        await rubyToken.connect(user1).approve(blacksmith.address, 100);

        await blacksmith.connect(user1).purchaseItem(1, 1, false, "0x");
        expect(await castleVerseItems.balanceOf(user1address, 1)).to.equal(1);
        expect(await rubyToken.balanceOf(blacksmith.address)).to.equal(100);
    });

    it("Should purchase an item with magic", async () => {
        await blacksmith.addItem(1, 100, 1000, true, 1);
        await magicToken.mint(1000, user1address);
        await magicToken.connect(user1).approve(blacksmith.address, 1000);

        await blacksmith.connect(user1).purchaseItem(1, 1, true, "0x");
        expect(await castleVerseItems.balanceOf(user1address, 1)).to.equal(1);
        expect(await magicToken.balanceOf(blacksmith.address)).to.equal(1000);
    });

    it("Should not allow purchase with magic if not allowed", async () => {
        await blacksmith.addItem(1, 100, 1000, false, 1);
        await magicToken.mint(1000, user1address);
        await magicToken.connect(user1).approve(blacksmith.address, 1000);

        await expect(
            blacksmith.connect(user1).purchaseItem(1, 1, true, "0x")
        ).to.be.revertedWith("MAGIC payment is not allowed for this item");
    });

    it("Should reject the mint if the item is paused at the items contract level", async () => {
        await castleVerseItems.pauseItem(1);
        await blacksmith.addItem(1, 0, 0, true, 1);
        await expect(
            blacksmith.connect(user1).purchaseItem(1, 1, true, "0x")
        ).to.be.revertedWith("Item is paused");

    });



});