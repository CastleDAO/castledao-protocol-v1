// Tests for the castledao staking contract
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber, Contract } from "ethers";
import { parseEther } from "ethers/lib/utils";
import { expect } from "chai";
import { ethers } from "hardhat";
import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";


// Contracts used in the tests
let castledaoStaking: Contract;
let castlesArbi: Contract;
let cryptogenerals: Contract;
let manager: Contract;
let bound: Contract;
let ruby: Contract;

let owner: SignerWithAddress;
let magicSigner: SignerWithAddress;
let userERC20: SignerWithAddress;
let userNFT: SignerWithAddress;
let otherUser: SignerWithAddress;


describe("CastleDAOStaking", function () {
    before(async () => {
        [owner, magicSigner, userERC20, userNFT, otherUser] =
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

        //  Deploy the Bound contract
        const Bound = await ethers.getContractFactory("ERC20Bound");
        bound = await Bound.deploy(manager.address);
        await bound.deployed();

        // Deploy the Ruby contract
        const Ruby = await ethers.getContractFactory("Ruby");
        ruby = await Ruby.deploy(manager.address, bound.address, parseEther('21000000000'));
        await ruby.deployed();

    });


    beforeEach(async () => {
        // Deploy the castles NFT
        const CastlesArbi = await ethers.getContractFactory("CastlesArbi");
        castlesArbi = await CastlesArbi.deploy();
        await castlesArbi.deployed();

        // Mint 10 castles to the user
        for (var i = 1; i <= 10; i++) {
            await castlesArbi.connect(owner).ownerClaim(i);
            await castlesArbi.connect(owner).transferFrom(owner.address, userNFT.address, i);
        }

        const CryptoGenerals = await ethers.getContractFactory("CryptoGenerals");
        cryptogenerals = await CryptoGenerals.deploy();
        await cryptogenerals.deployed();

        // Mint 10 generals to the user
        for (var i = 1; i <= 10; i++) {
            await cryptogenerals.connect(owner).ownerClaim();
            await cryptogenerals.connect(owner).transferFrom(owner.address, userNFT.address, i);
        }

        const StakerFactory = await ethers.getContractFactory("CastleDAOStaking");

        castledaoStaking = await StakerFactory.deploy(
            manager.address, ruby.address, [castlesArbi.address], [10],
            [0, 30], [2, 25]);
        await castledaoStaking.deployed();

        // Add the staking contract the ability to mint tokens
        await manager.addManager(castledaoStaking.address, 2);

        // Approve contracts
        await castlesArbi.connect(userNFT).setApprovalForAll(castledaoStaking.address, true);
        await cryptogenerals.connect(userNFT).setApprovalForAll(castledaoStaking.address, true);


    });

    it('should allow to stake a castle with a 0 lock', async () => {

        await castledaoStaking.connect(userNFT).stakeCastleDAONFT([castlesArbi.address], [1], [0]);

        // The owner of the NFT should be the staker
        expect(await castlesArbi.ownerOf(1)).to.equal(castledaoStaking.address);

    });

    it('should return the initial reward for a 0 lock', async () => {
        const userAddress = await userNFT.getAddress();
        await castledaoStaking.connect(userNFT).stakeCastleDAONFT([castlesArbi.address], [1], [0]);

        // The owner of the NFT should be the staker
        expect(await castledaoStaking.getRewardAmount(userAddress, castlesArbi.address, 1)).to.equal(0);

        // Time travel one day
        await time.increase(time.duration.days(1));

        // The reward should be 12 (2 for a 0 lock + 10 for the castles)
        expect(await castledaoStaking.getRewardAmount(userAddress, castlesArbi.address, 1)).to.equal(12);
    })

    it('should not allow to stake with an invalid lock period', async () => {
        await expect(castledaoStaking.connect(userNFT).stakeCastleDAONFT([castlesArbi.address], [1], [1])).to.be.revertedWith("Lock time not allowed");
    });

    it('should not allow to stake with an invalid NFT', async () => {
        await expect(castledaoStaking.connect(userNFT).stakeCastleDAONFT([cryptogenerals.address], [1], [0])).to.be.revertedWith("Collection not allowed");
    });


    it('should allow to stake a castle with a 1 month lock', async () => {
        const userAddress = await userNFT.getAddress();

        await castledaoStaking.connect(userNFT).stakeCastleDAONFT([castlesArbi.address], [1], [30]);

        // The owner of the NFT should be the staker
        expect(await castlesArbi.ownerOf(1)).to.equal(castledaoStaking.address);

        // The locktime should be 30
        const lockTimeInfo = await castledaoStaking.checkLockTime(castlesArbi.address, userAddress, 1)
        expect(lockTimeInfo.lockDaysDuration).to.equal(30);

        // time travel 29 days
        await time.increase(time.duration.days(29));

        // The rewards should be equal to one 29 of rewards (35 per day)
        expect(await castledaoStaking.getRewardAmount(userAddress, castlesArbi.address, 1)).to.equal(1015);

        console.log(await castledaoStaking.stakedTokens(userAddress, castlesArbi.address, 1))

        // Trying to unstake should fail
        await expect(castledaoStaking.connect(userNFT).unstakeCastleDAONFT([castlesArbi.address], [1])).to.be.revertedWith("Lock time has not passed yet");

        // time travel 1 day
        await time.increase(time.duration.days(1));

        // The rewards should be equal to one month of rewards (35 per day)
        expect(await castledaoStaking.getRewardAmount(userAddress, castlesArbi.address, 1)).to.equal(1050);

        // Trying to unstake should work
        await castledaoStaking.connect(userNFT).unstakeCastleDAONFT([castlesArbi.address], [1]);

        // The owner of the NFT should be the user
        expect(await castlesArbi.ownerOf(1)).to.equal(userAddress);
    });

    it('should reject staking when the number of parameters differ', async () => {
        await expect(castledaoStaking.connect(userNFT).stakeCastleDAONFT([castlesArbi.address], [1], [30, 30])).to.be.revertedWith("Not enough data");
    });

});
