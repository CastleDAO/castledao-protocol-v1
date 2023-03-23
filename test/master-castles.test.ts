import { ethers } from "hardhat";
import { Contract, Signer } from "ethers";
import { expect } from "chai";
import { parseEther } from "ethers/lib/utils";

describe("Master contract", function () {
    let master: Contract;
    let owner: Signer;
    let user: Signer;
    let otherUser: Signer;
    let magicSigner: Signer;
    let castleContract: Contract;
    let magicContract: Contract;


    beforeEach(async function () {
        [owner, user, otherUser, magicSigner] = await ethers.getSigners();


        // Deploy the castles contracts
        const CastleNFT = await ethers.getContractFactory("CastlesArbi");
        castleContract = await CastleNFT.deploy();
        await castleContract.deployed();

        // Deploy the Manager contract
        const Manager = await ethers.getContractFactory("Manager");
        const managerInstance = await Manager.deploy();
        await managerInstance.deployed();

        // Deploy the test ERC20 and ERC721 contracts
        const TestERC20 = await ethers.getContractFactory("TestERC20");
        const testERC20 = await TestERC20.connect(magicSigner).deploy();
        magicContract = await testERC20.deployed();

        // Deploy the Master contract
        const Master = await ethers.getContractFactory("MasterCastles");
        master = await Master.deploy(managerInstance.address, castleContract.address);
        await master.deployed();

        // Add owner as admin and manager in the Manager contract
        await managerInstance.addAdmin(await owner.getAddress());
        await managerInstance.addManager(await owner.getAddress(), 0);
        await managerInstance.addManager(await owner.getAddress(), 1);
        await managerInstance.addManager(await owner.getAddress(), 2);
        await managerInstance.addManager(await owner.getAddress(), 3);

        // Mint 1000 magic for otherUser
        await magicContract
            .connect(magicSigner)
            .mint(parseEther("1000"), await otherUser.getAddress());

        // Transfer ownership of castleContract to master contract
        await castleContract.connect(owner).transferOwnership(master.address);


    });

    it('should allow to set the price in eth for a castle', async () => {
        // Set the price in eth for a castle
        await master.connect(owner).setCastlePriceETH(parseEther("1"));

      

        // Check that the price in eth for a castle is 1 eth
        expect(await master.castlePriceETH()).to.equal(parseEther("1"));


    })

    it('should allow to set the price for a castle in magic', async () => {
        // Set the price for magic for a castle
        await master.connect(owner).setCastlePrices(magicContract.address, parseEther("100"));



        // Check that the price for magic for a castle is 100 magic
        expect(await master.castlePrices(magicContract.address)).to.equal(parseEther("100"));

    })

    it('should allow the owner to mint for free a castle ', async () => {
        // Mint a castle for free
        const tokenId = 1;

        await master.connect(owner).privilegedMintCastles(await owner.getAddress(), [tokenId]);

        // Check that the castle was minted to the owner
        expect(await castleContract.ownerOf(tokenId)).to.equal(await owner.getAddress());

 
    })

    it("should transfer ownership, mint, withdraw tokens, and transfer ownership back", async function () {


        // Check that the new owner of castleContract is the master contract
        expect(await castleContract.owner()).to.equal(master.address);

        // Set the price in eth for a castle
        await master.connect(owner).setCastlePriceETH(ethers.utils.parseEther("1"));

        // Set the price for magic for a castle
        await master.connect(owner).setCastlePrices(magicContract.address, ethers.utils.parseEther("100"));

        // Mint a castle using the master contract
        const tokenId = 1;
        await master.connect(owner).mintCastlesETH([tokenId], { value: ethers.utils.parseEther("1") });

        // Check that the castle was minted to the owner
        expect(await castleContract.ownerOf(tokenId)).to.equal(await owner.getAddress());

        // Set a dummy ERC20 token address and amount to withdraw
        const tokenAmount = ethers.utils.parseUnits("100", 18);

        // Buy a castle with magic from a otherUser
        await magicContract
            .connect(otherUser)
            .approve(master.address, tokenAmount);
        await master.connect(otherUser).mintCastlesToken([2], magicContract.address);

        // Check that the castle was minted to the otherUser
        expect(await castleContract.ownerOf(2)).to.equal(await otherUser.getAddress());

        // Check that the contract has 100 magic
        expect(await magicContract.balanceOf(master.address)).to.equal(tokenAmount);

        // Call the withdrawTokens function
        await master.connect(owner).withdrawTokens(magicContract.address, tokenAmount);

        // Check the owner's balance of magic
        expect(await magicContract.balanceOf(await owner.getAddress())).to.equal(tokenAmount);

        // check the contract has 0 magic
        expect(await magicContract.balanceOf(master.address)).to.equal(0);

        // Transfer ownership of castleContract back to the original owner
        await master.connect(owner).transferContractOwnership(await owner.getAddress());

        // Check that the owner of castleContract is the original owner again
        expect(await castleContract.owner()).to.equal(await owner.getAddress());
    });

    it('returns the eth to the owner after callign ownerWithdraw', async () => {

        // Log the initial balance of the owner
        console.log("Initial balance of owner: ", await owner.getBalance());
        const prevBalance = await owner.getBalance();
        // Set the price in eth for a castle
        await master.connect(owner).setCastlePriceETH(ethers.utils.parseEther("1"));

        // Mint a castle using the master contract
        const tokenId = 1;
        await master.connect(owner).mintCastlesETH([tokenId], { value: ethers.utils.parseEther("1") });

        // Check that the castle was minted to the owner

        expect(await castleContract.ownerOf(tokenId)).to.equal(await owner.getAddress());

        console.log('We are about to call ownerWithdraw')

        // Call the ownerWithdraw function
        await master.connect(owner).ownerWithdraw();

        // Log the new balance of the owner
        console.log("New balance of owner: ", await owner.getBalance());
        const newBalance = await owner.getBalance();

        // Check that the difference between balances is less than 1 eth
        expect(newBalance.sub(prevBalance)).to.be.lt(ethers.utils.parseEther("1"));

    })

    it("should revert if a non-manager tries to set prices for castles and generals", async () => {
        await expect(master.connect(user).setCastlePriceETH(parseEther("1"))).to.be.revertedWith("Manager: Not manager");
    });
    
    it("should revert if a non-manager tries to perform privileged minting for castles and generals", async () => {
        await expect(master.connect(user).privilegedMintCastles(await user.getAddress(), [1])).to.be.revertedWith("Manager: Not minter");
    });
    
    it("should revert if a non-manager tries to withdraw tokens", async () => {
        await expect(master.connect(user).withdrawTokens(magicContract.address, parseEther("100"))).to.be.revertedWith("Manager: Not manager");
    });
    
    it("should revert if a non-manager tries to transfer contract ownership", async () => {
        await expect(master.connect(user).transferContractOwnership(await user.getAddress())).to.be.revertedWith("Manager: Not an Admin");
    });
    
});