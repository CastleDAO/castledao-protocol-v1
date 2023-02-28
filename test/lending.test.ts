// Tests for the castledao staking contract
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Contract } from "ethers";
import { parseEther } from "ethers/lib/utils";
import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";

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
    ruby = await Ruby.deploy(
      manager.address,
      bound.address,
      parseEther("21000000000")
    );
    await ruby.deployed();

    // Deploy the test ERC20 and ERC721 contracts
    const TestERC20 = await ethers.getContractFactory("TestERC20");
    const testERC20 = await TestERC20.connect(magicSigner).deploy();
    magicContract = await testERC20.deployed();

    // Deploy the lending contract
    const Lending = await ethers.getContractFactory("Lending");
    lending = await Lending.deploy(
      manager.address,
      ruby.address,
      magicContract.address
    );

    await lending.deployed();

    console.log("lending address: ", lending.address);

    // Add the lending contract the ability to mint tokens
    await manager.addManager(lending.address, 2);

    console.log("Manager address: ", manager.address);

    // Mint 1000 tokens to the owner
    await magicContract
      .connect(magicSigner)
      .mint(parseEther("1000"), await owner.getAddress());

    console.log("Tokens minted to owner");

    // Mint 10 NFTs to the user with NFT
    const TestERC721 = await ethers.getContractFactory("TestERC721");
    const testERC721 = await TestERC721.deploy();
    nftERC721 = await testERC721.deployed();

    for (let i = 0; i < 10; i++) {
      await nftERC721.mint(await userWithNFT.getAddress());
    }

    // Send 1000 tokens to the lending contract
    await magicContract
      .connect(owner)
      .transfer(lending.address, parseEther("1000"));

    // Log the magic balance of the lending contract
    console.log(
      "Magic balance of lending contract: ",
      await magicContract.balanceOf(lending.address)
    );
  });

  it("Should allow the manager to add collection", async () => {
    await lending.addCollection(nftERC721.address, 0, 10);
    expect(await lending.collectionsMaxLoanRatio(nftERC721.address)).to.equal(
      10
    );
  });

  it("Should allow the manager to set collection as active and unctive", async () => {
    await lending.addCollection(nftERC721.address, 0, 10);
    await lending.setCollectionActive(nftERC721.address, true);
    expect(await lending.activeCollections(nftERC721.address)).to.equal(true);

    await lending.setCollectionActive(nftERC721.address, false);
    expect(await lending.activeCollections(nftERC721.address)).to.equal(false);
  });

  it("should allow the ORACLE to change the floor price of a collection", async () => {
    await lending.addCollection(nftERC721.address, 0, 10);
    await lending
      .connect(oracleUser)
      .setCollectionFloorPrice(nftERC721.address, parseEther("10"));
    expect(await lending.collectionsFloorPrice(nftERC721.address)).to.equal(
      parseEther("10")
    );
  });

  it("Should not allow non oracle users to change the floor price of a collection", async () => {
    await lending.addCollection(nftERC721.address, 0, 10);
    await expect(
      lending.setCollectionFloorPrice(nftERC721.address, parseEther("10"))
    ).to.be.revertedWith("Manager: Not oracle");
  });

  it("should allow the manager to set the max loan ratio of a collection", async () => {
    await lending.addCollection(nftERC721.address, 0, 10);
    await lending.setCollectionMaxLoanRatio(nftERC721.address, 20);
    expect(await lending.collectionsMaxLoanRatio(nftERC721.address)).to.equal(
      20
    );
  });

  it("Should not allow non manager users to set the max loan ratio of a collection", async () => {
    await lending.addCollection(nftERC721.address, 0, 10);
    await expect(
      lending
        .connect(userWithNFT)
        .setCollectionMaxLoanRatio(nftERC721.address, 20)
    ).to.be.revertedWith("Manager: Not manager");
  });

  it("should not allow the NFT user to add collateral of an unallowed collection", async () => {
    await expect(
      lending.connect(userWithNFT).addCollateral(nftERC721.address, 1)
    ).to.be.revertedWith("Collection not allowed");
  });

  it("should allow the user to add collateral of an allowed collection", async () => {
    await lending.addCollection(nftERC721.address, 0, 10);
    await lending.setCollectionActive(nftERC721.address, true);
    // approve collection
    await nftERC721
      .connect(userWithNFT)
      .setApprovalForAll(lending.address, true);
    await lending.connect(userWithNFT).addCollateral(nftERC721.address, 1);
    expect(
      await lending.getUserCollateralAmount(
        await userWithNFT.getAddress(),
        nftERC721.address
      )
    ).to.equal(1);
  });

  describe("Smol Brains lending", () => {
    beforeEach(async () => {
      // Max loan ratio 10%, if floor is 1000 and max loan ratio is 10% then max loan per item is 100

      await lending.addCollection(nftERC721.address, 10, 10);
      await lending.setCollectionActive(nftERC721.address, true);
      // set floor price
      await lending
        .connect(oracleUser)
        .setCollectionFloorPrice(nftERC721.address, parseEther("1000"));
      // approve collection
      await nftERC721
        .connect(userWithNFT)
        .setApprovalForAll(lending.address, true);
      await lending.connect(userWithNFT).addCollateral(nftERC721.address, 1);
    });

    it("Should not allow the user to borrow more than the max loan ratio", async () => {
      await expect(
        lending
          .connect(userWithNFT)
          .borrow(parseEther("200"), nftERC721.address)
      ).to.be.revertedWith("Cannot borrow, LTV ratio too high");
    });

    it("Should allow the user to borrow up to the max loan ratio", async () => {
      const loanInfoFirst = await lending.getUserLoanAmountAndTVL(
        await userWithNFT.getAddress(),
        nftERC721.address
      );
      // Loan amount should be 0 initially
      expect(loanInfoFirst[0]).to.equal(0);

      // Log magic balance of lending contract
      // Allow the lending contract to use magic
      await lending
        .connect(userWithNFT)
        .borrow(parseEther("100"), nftERC721.address);
      expect(
        await magicContract.balanceOf(await userWithNFT.getAddress())
      ).to.equal(parseEther("100"));

      // Check the user has a loan
      const loanInfo = await lending.getUserLoanAmountAndTVL(
        await userWithNFT.getAddress(),
        nftERC721.address
      );

      // total borrowed should be 100
      expect(loanInfo[0]).to.equal(parseEther("100"));

      // total value locked should be 1000
      expect(loanInfo[1]).to.equal(parseEther("1000"));

      // Get LTV ratio
      const ltvRatio = await lending.getUserLTV(
        await userWithNFT.getAddress(),
        nftERC721.address
      );
      expect(ltvRatio).to.equal(10);
    });

    // at 10% apy for 1 year, the 100 loan should be repaid with 110
    it("should increase fees after 1 year", async () => {
      await lending
        .connect(userWithNFT)
        .borrow(parseEther("100"), nftERC721.address);
      await time.increase(time.duration.years(1));

      // Get the fees
      const fees = await lending.getUserLoanFees(
        await userWithNFT.getAddress(),
        nftERC721.address
      );
      expect(fees).to.equal(parseEther("10"));

      // Get the total amount to repay
      const loan = await lending.loans(
        await userWithNFT.getAddress(),
        nftERC721.address
      );
      // loan amount is 100
      expect(loan.amount).to.equal(parseEther("100"));

      // Increase another year
      await time.increase(time.duration.years(1));

      // Get the fees
      const fees2 = await lending.getUserLoanFees(
        await userWithNFT.getAddress(),
        nftERC721.address
      );

      // Fees should be 20
      expect(fees2).to.equal(parseEther("20"));

      // User repays 15 magic
      await magicContract
        .connect(userWithNFT)
        .approve(lending.address, parseEther("100"));
      await lending
        .connect(userWithNFT)
        .repay(
          await userWithNFT.getAddress(),
          nftERC721.address,
          parseEther("15")
        );

      // Get the fees
      const fees3 = await lending.getUserLoanFees(
        await userWithNFT.getAddress(),
        nftERC721.address
      );

      // Fees should be 5
      expect(fees3).to.equal(parseEther("5"));

      // User repays 25 magic more
      await lending
        .connect(userWithNFT)
        .repay(
          await userWithNFT.getAddress(),
          nftERC721.address,
          parseEther("25")
        );

      // Get the fees
      const fees4 = await lending.getUserLoanFees(
        await userWithNFT.getAddress(),
        nftERC721.address
      );

      // Fees should be 0
      expect(fees4).to.equal(0);

      // Total loan debt now should be 80
      const loan2 = await lending.loans(
        await userWithNFT.getAddress(),
        nftERC721.address
      );
      expect(loan2.amount).to.equal(parseEther("80"));

      // Mint more magic for the user from the owner
      await magicContract
        .connect(magicSigner)
        .mint(parseEther("100"), await userWithNFT.getAddress());

      // Try to repay more than 80 magic
      await expect(
        lending
          .connect(userWithNFT)
          .repay(
            await userWithNFT.getAddress(),
            nftERC721.address,
            parseEther("100")
          )
      ).to.be.revertedWith(
        "Too much magic to repay, please input the right amount"
      );
    });

    it("claims rewards when repaying", async () => {
      await lending
        .connect(userWithNFT)
        .borrow(parseEther("100"), nftERC721.address);

      // enable the rewards
      await lending.setRewardsAPY(nftERC721.address, 10);

      await time.increase(time.duration.years(1));
      // Get the fees
      const fees = await lending.getUserLoanFees(
        await userWithNFT.getAddress(),
        nftERC721.address
      );
      expect(fees).to.equal(parseEther("10"));

      // Repay 10 magic
      await magicContract
        .connect(userWithNFT)
        .approve(lending.address, parseEther("100"));
      await lending
        .connect(userWithNFT)
        .repay(
          await userWithNFT.getAddress(),
          nftERC721.address,
          parseEther("10")
        );

      // The total rewards claimed should be 10
      const loan = await lending.loans(
        await userWithNFT.getAddress(),
        nftERC721.address
      );
      expect(loan.totalRewardsClaimed).to.equal(parseEther("10"));
    });

    it("Incurring an additional borrow should increase the accumulated fees and claim rewards", async () => {
      await lending
        .connect(userWithNFT)
        .borrow(parseEther("50"), nftERC721.address);

      // enable the rewards
      await lending.setRewardsAPY(nftERC721.address, 10);

      await time.increase(time.duration.years(1));
      // Get the fees
      const fees = await lending.getUserLoanFees(
        await userWithNFT.getAddress(),
        nftERC721.address
      );
      expect(fees).to.equal(parseEther("5"));

      // Borrow 50 more magic
      await lending
        .connect(userWithNFT)
        .borrow(parseEther("50"), nftERC721.address);

      // The total rewards claimed should be 5
      const loan = await lending.loans(
        await userWithNFT.getAddress(),
        nftERC721.address
      );
      expect(loan.totalRewardsClaimed).to.equal(parseEther("5"));
      // last loan rewards date should be current block timestamp
      expect(loan.lastRewardTimestamp).to.equal(await time.latest());

      // Last total updated fees should be 5
      expect(loan.accumulatedFees).to.equal(parseEther("5"));

      // last loan updated date should be current block timestamp
      expect(loan.accumulatedFeesTimestamp).to.equal(await time.latest());
    });
  });
});
