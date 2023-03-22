import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Contract } from "ethers";
import { expect } from "chai";
import { ethers, upgrades } from "hardhat";

let castleVerseCrafting: Contract;
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

describe("CastleVerseCrafting", function () {
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
            metadataContract.address,
            magicToken.address,
            rubyToken.address
        ]);

        await castleVerseItems.deployed();

        user1address = await user1.getAddress();
        // Deploy the CastleVerseCrafting contract
        const CastleVerseCrafting = await ethers.getContractFactory("Crafting");
        castleVerseCrafting = await upgrades.deployProxy(CastleVerseCrafting, [
            manager.address,
            castleVerseItems.address,
            magicToken.address,
            rubyToken.address,
        ]);

        await castleVerseCrafting.deployed();


        // Add some items to the items contract
        await castleVerseItems.addItem(1, 100, 1000, true, false);
        await castleVerseItems.addItem(2, 100, 1000, true, false);

        // Restricted items
        await castleVerseItems.addItem(3, 100, 1000, true, true);
        await castleVerseItems.addItem(4, 100, 1000, true, true);

        // Add the minter role to the crafitng contract
        await manager.addManager(await castleVerseCrafting.address, 1);


    });

    it("Should allow the manager to add a recipe", async () => {
        await castleVerseCrafting.addRecipe(1, [2, 3], [1, 1], 500, 1000, 43, 100);
        const recipe = await castleVerseCrafting.recipes(1);

        const recipeInputItemsLength = await castleVerseCrafting.getRecipeInputItemsLength(1);
        const recipeInputAmountsLength = await castleVerseCrafting.getRecipeInputAmountsLength(1);

        let recipeInputItems = [];
        let recipeInputAmounts = [];

        for (let i = 0; i < recipeInputItemsLength; i++) {
            recipeInputItems.push(await castleVerseCrafting.getRecipeInputItem(1, i));
        }


        for (let i = 0; i < recipeInputAmountsLength; i++) {
            recipeInputAmounts.push(await castleVerseCrafting.getRecipeInputAmount(1, i));
        }

        expect(recipeInputItems).to.deep.equal([2, 3]);
        expect(recipeInputAmounts).to.deep.equal([1, 1]);
        expect(recipe.magicCost).to.equal(500);
        expect(recipe.rubyCost).to.equal(1000);
        expect(recipe.outputItem).to.equal(43);
        expect(recipe.successChance).to.equal(100);
    });

    it("Should allow users to craft an item", async () => {
        await castleVerseCrafting.addRecipe(1, [2, 3], [1, 1], 500, 1000, 4, 100);
        console.log('added recipe')
        // Mint necessary input items and tokens to user1
        await castleVerseItems.managerMintBatch(user1address, [1, 2, 3], [1, 1, 1], "0x");
        await magicToken.mint(500, user1address);
        await rubyToken.mint(1000, user1address);

        // Approve tokens for crafting contract
        await magicToken.connect(user1).approve(castleVerseCrafting.address, 500);
        await rubyToken.connect(user1).approve(castleVerseCrafting.address, 1000);
        // Approve items for crafting contract
        await castleVerseItems.connect(user1).setApprovalForAll(castleVerseCrafting.address, true);

        await castleVerseCrafting.connect(user1).craft(1);

        expect(await castleVerseItems.balanceOf(user1address, 1)).to.equal(1);
        expect(await castleVerseItems.balanceOf(user1address, 2)).to.equal(0);
        expect(await castleVerseItems.balanceOf(user1address, 3)).to.equal(0);
        expect(await castleVerseItems.balanceOf(user1address, 4)).to.equal(1);

        expect(await magicToken.balanceOf(user1address)).to.equal(0);
        expect(await rubyToken.balanceOf(user1address)).to.equal(0);
    });

});