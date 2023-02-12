import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Contract } from "ethers";
import { parseEther } from "ethers/lib/utils";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("Staker Contract", () => {
  // Contracts used in the tests
  let staker: Contract;
  let magicContract: Contract;
  let nftERC1155: Contract;
  let nftERC721: Contract;

  let owner: SignerWithAddress;
  let magicSigner: SignerWithAddress;
  let userERC20: SignerWithAddress;
  let userNFT: SignerWithAddress;
  let otherUser: SignerWithAddress;

  beforeEach(async () => {
    const StakerFactory = await ethers.getContractFactory("Staker");
    [owner, magicSigner, userERC20, userNFT, otherUser] =
      await ethers.getSigners();
    staker = await StakerFactory.deploy();

    // Deploy the test ERC20 and ERC721 contracts
    const TestERC20 = await ethers.getContractFactory("TestERC20");
    const testERC20 = await TestERC20.connect(magicSigner).deploy();
    magicContract = await testERC20.deployed();

    // Send magic to the user
    magicContract.mint(parseEther("200"), userERC20.address);
    magicContract.mint(parseEther("200"), otherUser.address);

    const TestERC721 = await ethers.getContractFactory("TestERC721");
    const testERC721 = await TestERC721.connect(magicSigner).deploy();
    nftERC721 = await testERC721.deployed();

    // Send NFT to the user
    nftERC721.mint(userNFT.address);
    nftERC721.mint(otherUser.address);

    // Deploy the test ERC1155 contract
    const TestERC1155 = await ethers.getContractFactory("TestERC1155");
    const testERC1155 = await TestERC1155.connect(magicSigner).deploy();
    nftERC1155 = await testERC1155.deployed();

    // Send ERC1155 to the user
    nftERC1155.mint(3, 1, userNFT.address);
    // Mint another ERC1155 to the user
    nftERC1155.mint(3, 2, userNFT.address);
  });

  it("Should correctly deploy the staker contract", async () => {
    expect(staker.address).to.not.be.null;
  });

  describe("Stake Method", () => {
    it("should allow a staker to stake ERC20 tokens", async () => {
      const amount = parseEther("200");

      const balance = await magicContract.balanceOf(userERC20.address);
      console.log(balance);

      // Approve use
      await magicContract.connect(userERC20).approve(staker.address, amount);

      // Stake magic
      await staker
        .connect(userERC20)
        .stakeFungible(magicContract.address, amount);

      // The balance of the user should be 0
      expect(await magicContract.balanceOf(userERC20.address)).to.equal(0);

      // The balance of the staker should be 200
      expect(await magicContract.balanceOf(staker.address)).to.equal(amount);

      // The staker contract should count 200 tokens staked on the collection magicContract.address
      expect(
        await staker.getCollectionStakedTokensCount(magicContract.address)
      ).to.equal(amount);
    });

    it("should allow a staker to stake ERC721 tokens", async () => {
      // Approve use
      await nftERC721.connect(userNFT).approve(staker.address, 1);

      // Stake NFT
      await staker.connect(userNFT).stakeERC721(nftERC721.address, 1);

      // The owner of the NFT should be the staker
      expect(await nftERC721.ownerOf(1)).to.equal(staker.address);

      // The staker contract should count 1 NFT staked on the collection nftERC721.address
      expect(
        await staker.getCollectionStakedTokensCount(nftERC721.address)
      ).to.equal(1);
    });

    it("should not allow to stake an NFT that is not minted", async () => {
      // Approve use
      await nftERC721.connect(userNFT).approve(staker.address, 1);

      // Try to stake NFT
      await expect(
        staker.connect(userNFT).stakeERC721(nftERC721.address, 3)
      ).to.be.revertedWith("ERC721: invalid token ID");
    });

    it("should not allow to stake an NFT that is not owned by the staker", async () => {
      // Approve use
      await nftERC721.connect(userNFT).setApprovalForAll(staker.address, true);
      await nftERC721
        .connect(otherUser)
        .setApprovalForAll(staker.address, true);

      // Try to stake NFT
      await expect(
        staker.connect(userNFT).stakeERC721(nftERC721.address, 2)
      ).to.be.revertedWith("ERC721: transfer from incorrect owner");
    });

    it("should allow a staker to stake ERC1155 tokens", async () => {
      // Approve use
      await nftERC1155.connect(userNFT).setApprovalForAll(staker.address, true);

      // The owner of the NFT should be the user
      expect(await nftERC1155.balanceOf(userNFT.address, 1)).to.equal(3);

      // Stake NFT
      await staker.connect(userNFT).stakeERC1155(nftERC1155.address, 1, 3);

      // The owner of the NFT should be the staker
      expect(await nftERC1155.balanceOf(staker.address, 1)).to.equal(3);

      // The staker contract should count 3 NFT staked on the collection nftERC1155.address
      expect(
        await staker.getCollectionStakedTokensCount(nftERC1155.address)
      ).to.equal(3);
    });

    it("should allow a user to unstake ERC1155 tokens", async () => {
      // Approve use
      await nftERC1155.connect(userNFT).setApprovalForAll(staker.address, true);

      // Stake NFT
      await staker.connect(userNFT).stakeERC1155(nftERC1155.address, 1, 3);

      // The staker contract should count 3 NFT staked on the collection nftERC1155.address
      expect(
        await staker.getCollectionStakedTokensCount(nftERC1155.address)
      ).to.equal(3);

      // Unstake NFT
      await staker.connect(userNFT).unstakeERC1155(nftERC1155.address, 1, 3);

      // The owner of the NFT should be the user
      expect(await nftERC1155.balanceOf(staker.address, 1)).to.equal(0);

      // The staker contract should count 0 NFT staked on the collection nftERC1155.address
      expect(
        await staker.getCollectionStakedTokensCount(nftERC1155.address)
      ).to.equal(0);
    });

    it("should not allow to stake an ERC1155 that is not owned by the staker", async () => {
      // Approve use
      await nftERC1155.connect(userNFT).setApprovalForAll(staker.address, true);
      await nftERC1155
        .connect(otherUser)
        .setApprovalForAll(staker.address, true);

      // Try to stake NFT
      await expect(
        staker.connect(otherUser).stakeERC1155(nftERC1155.address, 2, 1)
      ).to.be.revertedWith("ERC1155: insufficient balance for transfer");
    });

    it("should not allow to stake an ERC1155 that is not approved by the staker", async () => {
      // Try to stake NFT
      await expect(
        staker.connect(userNFT).stakeERC1155(nftERC1155.address, 1, 3)
      ).to.be.revertedWith("ERC1155: caller is not token owner or approved");
    });

    it("Should not allow another user to unstake other users Fungible tokens", async () => {
      // Approve use
      await magicContract
        .connect(userERC20)
        .approve(staker.address, parseEther("100"));

      // Stake magic
      await staker
        .connect(userERC20)
        .stakeFungible(magicContract.address, parseEther("100"));

      // Try to unstake magic
      await expect(
        staker
          .connect(userNFT)
          .unstakeFungible(magicContract.address, parseEther("100"))
      ).to.be.revertedWith("Not enough tokens staked");
    });

    it("Should not allow another user to unstake other users NFTs", async () => {
      // Approve use
      await nftERC721.connect(userNFT).setApprovalForAll(staker.address, true);
      await nftERC721
        .connect(userERC20)
        .setApprovalForAll(staker.address, true);

      // Stake NFT
      await staker.connect(userNFT).stakeERC721(nftERC721.address, 1);

      // Try to unstake NFT
      await expect(
        staker.connect(userERC20).unstakeERC721(nftERC721.address, 1)
      ).to.be.revertedWith("Not enough tokens staked");
    });
  });
});
