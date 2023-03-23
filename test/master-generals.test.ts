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
    let generalsContract: Contract;
    let magicContract: Contract;


    beforeEach(async function () {
        [owner, user, otherUser, magicSigner] = await ethers.getSigners();

        // Deploy the Generals contracts
        const CryptoGenerals = await ethers.getContractFactory("CryptoGenerals");
        generalsContract = await CryptoGenerals.deploy();
        await generalsContract.deployed();


        // Deploy the Manager contract
        const Manager = await ethers.getContractFactory("Manager");
        const managerInstance = await Manager.deploy();
        await managerInstance.deployed();

        // Deploy the test ERC20 and ERC721 contracts
        const TestERC20 = await ethers.getContractFactory("TestERC20");
        const testERC20 = await TestERC20.connect(magicSigner).deploy();
        magicContract = await testERC20.deployed();

        // Deploy the Master contract
        const Master = await ethers.getContractFactory("MasterGenerals");
        master = await Master.deploy(managerInstance.address, generalsContract.address);
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

        // Transfer ownership of contract to master contract
        await generalsContract.connect(owner).transferOwnership(master.address);
    });

    it('should allow to set the price in eth for a general', async () => {

        // Set the price in eth for a general
        await master.connect(owner).setGeneralPriceETH(parseEther("1"));

        // Check that the price in eth for a general is 1 eth
        expect(await master.generalPriceETH()).to.equal(parseEther("1"));
    })

    it('should allow to set the price for a general in magic', async () => {


        // Set the price for magic for a general
        await master.connect(owner).setGeneralPrices(magicContract.address, parseEther("100"));


        // Check that the price for magic for a general is 100 magic

        expect(await master.generalPrices(magicContract.address)).to.equal(parseEther("100"));
    })

    it('should allow the owner to mint for free a general', async () => {
        // Mint a general for free
        await master.connect(owner).privilegedMintGenerals(await owner.getAddress(), 1);

        // Check that the general was minted to the owner
        expect(await generalsContract.ownerOf(1)).to.equal(await owner.getAddress());
    })

    it("should transfer ownership, mint, withdraw tokens, and transfer ownership back", async function () {


        // Set a dummy ERC20 token address and amount to withdraw
        const tokenAmount = ethers.utils.parseUnits("100", 18);

        // Buy a general with magic from a otherUser
        await magicContract
            .connect(otherUser)
            .approve(master.address, tokenAmount);

        // Set the price for magic for a general
        await master.connect(owner).setGeneralPrices(magicContract.address, tokenAmount);

        // Mint a general using the master contract
        await master.connect(otherUser).mintGeneralsToken(1, magicContract.address);

        // Check that the contract has 100 magic
        expect(await magicContract.balanceOf(master.address)).to.equal(tokenAmount);

        // Call the withdrawTokens function
        await master.connect(owner).withdrawTokens(magicContract.address, tokenAmount);

        // Check the owner's balance of magic
        expect(await magicContract.balanceOf(await owner.getAddress())).to.equal(tokenAmount);

        // check the contract has 0 magic
        expect(await magicContract.balanceOf(master.address)).to.equal(0);

        // Transfer ownership of contract back to the original owner
        await master.connect(owner).transferContractOwnership(await owner.getAddress());

        // Check that the owner of contract is the original owner again
        expect(await generalsContract.owner()).to.equal(await owner.getAddress());
    });


    it("should revert if a non-manager tries to set prices generals", async () => {
        await expect(master.connect(user).setGeneralPriceETH(parseEther("1"))).to.be.revertedWith("Manager: Not manager");
    });

    it("should revert if a non-manager tries to perform privileged minting  generals", async () => {
        await expect(master.connect(user).privilegedMintGenerals(await user.getAddress(), 1)).to.be.revertedWith("Manager: Not minter");
    });

    it("should revert if a non-manager tries to withdraw tokens", async () => {
        await expect(master.connect(user).withdrawTokens(magicContract.address, parseEther("100"))).to.be.revertedWith("Manager: Not manager");
    });

    it("should revert if a non-manager tries to transfer contract ownership", async () => {
        await expect(master.connect(user).transferContractOwnership(await user.getAddress())).to.be.revertedWith("Manager: Not an Admin");
    });

});