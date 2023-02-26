// Tests for the castledao staking contract
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Contract } from "ethers";
import { parseEther } from "ethers/lib/utils";
import { expect } from "chai";
import { ethers } from "hardhat";


// Contracts used in the tests
let lending: Contract; 
let manager: Contract;
let bound: Contract;
let ruby: Contract;
let magicContract: Contract;
let nftERC721: Contract;

let owner: SignerWithAddress;
let magicSigner: SignerWithAddress;
let userWithNFT: SignerWithAddress;
let userWithoutNFT: SignerWithAddress;
let oracleUser: SignerWithAddress;

// TODO: Test liquidation
// TODO: Test increasing time to test liquidation  

describe("Lending", function () {
    before(async () => {
        [owner, magicSigner, userWithNFT, userWithoutNFT, oracleUser] =
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
        await manager.addManager(await oracleUser.getAddress(), 4);

        //  Deploy the Bound contract
        const Bound = await ethers.getContractFactory("ERC20Bound");
        bound = await Bound.deploy(manager.address);
        await bound.deployed();

        
    });


    beforeEach(async () => {
        // Deploy the Ruby contract
        const Ruby = await ethers.getContractFactory("Ruby");
        ruby = await Ruby.deploy(manager.address, bound.address, parseEther('21000000000'));
        await ruby.deployed();

        // Deploy the test ERC20 and ERC721 contracts
        const TestERC20 = await ethers.getContractFactory("TestERC20");
        const testERC20 = await TestERC20.connect(magicSigner).deploy();
        magicContract = await testERC20.deployed();

        
        // Deploy the lending contract
        const Lending = await ethers.getContractFactory("Lending");
        lending = (await Lending.deploy(
            manager.address,
            ruby.address,
            magicContract.address
        ));

        await lending.deployed();

        console.log('lending address: ', lending.address);

        // Add the lending contract the ability to mint tokens
        await manager.addManager(lending.address, 2);

        console.log('Manager address: ', manager.address);

        // Mint 1000 tokens to the owner
        await magicContract.connect(magicSigner).mint(parseEther('1000'), await owner.getAddress());

        console.log('Tokens minted to owner');

        // Mint 10 NFTs to the user with NFT
        const TestERC721 = await ethers.getContractFactory("TestERC721");
        const testERC721 = await TestERC721.deploy();
        nftERC721 = await testERC721.deployed();

        for(let i = 0; i < 10; i++) {
            await nftERC721.mint(await userWithNFT.getAddress());
        }
        


    });

    it('Should allow the manager to add collection', async () => {
        await lending.addCollection(nftERC721.address, 0, 10);
        expect(await lending.collectionsMaxLoanRatio(nftERC721.address)).to.equal(10);
    });


    it('Should allow the manager to set collection as active and unctive', async () => {
        await lending.addCollection(nftERC721.address, 0, 10);
        await lending.setCollectionActive(nftERC721.address, true);
        expect(await lending.activeCollections(nftERC721.address)).to.equal(true);

        await lending.setCollectionActive(nftERC721.address, false);
        expect(await lending.activeCollections(nftERC721.address)).to.equal(false);
    });

    it('should allow the ORACLE to change the floor price of a collection', async () => {
        await lending.addCollection(nftERC721.address, 0, 10);
        await lending.connect(oracleUser).setCollectionFloorPrice(nftERC721.address, parseEther('10'));
        expect(await lending.collectionsFloorPrice(nftERC721.address)).to.equal(parseEther('10'));
    });

    it('Should not allow non oracle users to change the floor price of a collection', async () => {
        await lending.addCollection(nftERC721.address, 0, 10);
        await expect(lending.setCollectionFloorPrice(nftERC721.address, parseEther('10'))).to.be.revertedWith('Manager: Not oracle');
    });

    it('should allow the manager to set the max loan ratio of a collection', async () => {
        await lending.addCollection(nftERC721.address, 0, 10);
        await lending.setCollectionMaxLoanRatio(nftERC721.address, 20);
        expect(await lending.collectionsMaxLoanRatio(nftERC721.address)).to.equal(20);
    });

    it('Should not allow non manager users to set the max loan ratio of a collection', async () => {
        await lending.addCollection(nftERC721.address, 0, 10);
        await expect(lending.connect(userWithNFT).setCollectionMaxLoanRatio(nftERC721.address, 20)).to.be.revertedWith('Manager: Not manager');
    });

    it('should not allow the NFT user to add collateral of an unallowed collection', async () => {
        await expect(lending.connect(userWithNFT).addCollateral(nftERC721.address, 1)).to.be.revertedWith('Collection not allowed');
    });

    it('should allow the user to add collateral of an allowed collection', async () => {
        await lending.addCollection(nftERC721.address, 0, 10);
        await lending.setCollectionActive(nftERC721.address, true);
        // approve collection
        await nftERC721.connect(userWithNFT).setApprovalForAll(lending.address, true);
        await lending.connect(userWithNFT).addCollateral(nftERC721.address, 1);
        expect(await lending.getUserCollateralAmount(await userWithNFT.getAddress(), nftERC721.address)).to.equal(1);
    });



});
