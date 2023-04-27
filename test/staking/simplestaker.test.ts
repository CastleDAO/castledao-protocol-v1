import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Contract } from "ethers";
import { parseEther } from "ethers/lib/utils";
import { expect } from "chai";
import { ethers } from "hardhat";
import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("SimplifiedStaker Contract", () => {
    // Contracts used in the tests
    let simplifiedStaker: Contract;
    let nftContract: Contract;

    let owner: SignerWithAddress;
    let userNFT: SignerWithAddress;
    let otherUser: SignerWithAddress;

    beforeEach(async () => {
        // Deploy the test NFT contract
        const TestNFT = await ethers.getContractFactory("TestERC721");
        nftContract = await TestNFT.deploy();
        await nftContract.deployed();

        const SimplifiedStakerFactory = await ethers.getContractFactory("SimplifiedStaker");
        [owner, userNFT, otherUser] = await ethers.getSigners();
        simplifiedStaker = await SimplifiedStakerFactory.deploy(nftContract.address);
        await simplifiedStaker.deployed();
        // Mint NFTs for the users
        nftContract.mint(await userNFT.getAddress());
        nftContract.mint(await userNFT.getAddress());
        nftContract.mint(await otherUser.getAddress());
    });

    it("Should correctly deploy the simplifiedStaker contract", async () => {
        expect(simplifiedStaker.address).to.not.be.null;
    });


    it("should allow a staker to stake an NFT", async () => {
        // Approve use
        await nftContract.connect(userNFT).approve(simplifiedStaker.address, 1);

        // Stake NFT
        await simplifiedStaker.connect(userNFT).stake(1);

        // The owner of the NFT should be the simplifiedStaker
        expect(await nftContract.ownerOf(1)).to.equal(simplifiedStaker.address);

        // The staker contract should count 1 NFT staked on the collection nftContract.address
        const userStakedTokens = await simplifiedStaker.getAllStakedTokenIds(await userNFT.getAddress())
        expect(userStakedTokens.length).eq(1);
        expect(userStakedTokens[0]).eq(1);

    });

    it("should not allow to stake an NFT that is not owned by the staker", async () => {
        // Approve use
        await nftContract.connect(userNFT).approve(simplifiedStaker.address, 1);

        // Try to stake NFT
        await expect(
            simplifiedStaker.connect(otherUser).stake(1)
        ).to.be.revertedWith("ERC721: transfer from incorrect owner");
    });

    it("should allow a user to unstake an NFT", async () => {
        // Approve use
        await nftContract.connect(userNFT).approve(simplifiedStaker.address, 1);

        // Stake NFT
        await simplifiedStaker.connect(userNFT).stake(1);

        // Unstake NFT
        await simplifiedStaker.connect(userNFT).unstake(1);

        // The owner of the NFT should be the user
        expect(await nftContract.ownerOf(1)).to.equal(await userNFT.getAddress());

        // The list should be empty for the user
        const userStakedTokens = await simplifiedStaker.getAllStakedTokenIds(await userNFT.getAddress())
        expect(userStakedTokens.length).eq(0);
    });


    it("should not allow another user to unstake other users NFTs", async () => {
        // Approve use
        await nftContract.connect(userNFT).setApprovalForAll(simplifiedStaker.address, true);
        await nftContract
            .connect(otherUser)
            .setApprovalForAll(simplifiedStaker.address, true);

        // Stake NFT
        await simplifiedStaker.connect(userNFT).stake(1);

        // Try to unstake NFT
        await expect(
            simplifiedStaker.connect(otherUser).unstake(1)
        ).to.be.revertedWith("Not enough tokens staked");
    });


});