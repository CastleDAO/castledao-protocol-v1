import { parseEther } from "ethers/lib/utils";
import { ethers } from "hardhat";
import { BigNumber, Contract, Signer } from "ethers";
import { expect } from "chai";
import { time, loadFixture, reset } from "@nomicfoundation/hardhat-network-helpers";

describe("Improved CompetitionFactory and Competition", function () {
    let competitionFactory: Contract;
    let owner: Signer;
    let user: Signer;
    let restrictedUser: Signer;
    let otherUser: Signer;
    let treasury: Signer;
    let testERC20: Contract;
    let MAGIC: Contract;

    beforeEach(async function () {
        // reset the hardhat network
        await reset();

        // get signers
        [owner, user, restrictedUser, otherUser, treasury] = await ethers.getSigners();

        // Deploy the TestERC20 contract
        const TestERC20 = await ethers.getContractFactory("TestERC20");
        testERC20 = await TestERC20.connect(owner).deploy();
        await testERC20.deployed();

        // Deploy the MAGIC contract
        const MAGICContract = await ethers.getContractFactory("TestERC20");
        MAGIC = await MAGICContract.connect(owner).deploy();
        await MAGIC.deployed();

        // deploy the factory contract
        const CompetitionFactory = await ethers.getContractFactory("Competitions");
        competitionFactory = await CompetitionFactory.deploy((await restrictedUser.getAddress()), await (treasury.getAddress()));


        // Give the owner 1000 MAGIC 
        await MAGIC
            .connect(owner)
            .mint(parseEther("1000"), await owner.getAddress());

        // Mint 1000 tokens for user
        await testERC20
            .connect(owner)
            .mint(parseEther("1000"), await user.getAddress());

        // Mint 5 tokens for otherUser
        await testERC20
            .connect(owner)
            .mint(parseEther("5"), await otherUser.getAddress());

        

    });

    it("should create a competition with correct parameters", async () => {
        const entryFeeAmount = parseEther("10");
        const percentageForOwner = 80;
        const percentageForTreasury = 5;
        const endDate = Math.floor(Date.now() / 1000) + 3600; // One hour from now
        const optionsJson = "[]";

        // Create a new competition
        const createCompetitionTx = await competitionFactory.connect(owner).createCompetition(
            "Test Competition",
            await owner.getAddress(),
            entryFeeAmount,
            testERC20.address,
            percentageForOwner,
            percentageForTreasury,
            endDate,
            optionsJson
        );

        const competitionResponse = await createCompetitionTx.wait();
        const competitionId = competitionResponse.events?.[0].args?.[0];

        const competition = await competitionFactory.competitions(competitionId);

        // Check competition parameters
        expect(competition.owner).to.equal(await owner.getAddress());
        expect(competition.name).to.equal("Test Competition");
        expect(competition.entryFeeAmount).to.equal(entryFeeAmount);
        expect(competition.entryFeeToken).to.equal(testERC20.address);
        expect(competition.percentageForOwner).to.equal(percentageForOwner);
        expect(competition.percentageForTreasury).to.equal(percentageForTreasury);
        expect(competition.endDate).to.equal(endDate);
        expect(competition.optionsJson).to.equal(optionsJson);
    });

    it("should revert if the sum of percentages for owner and treasury is greater than 100", async () => {
        const entryFeeAmount = parseEther("10");
        const percentageForOwner = 80;
        const percentageForTreasury = 21; // This should make the sum greater than 100
        const endDate = Math.floor(Date.now() / 1000) + 3600; // One hour from now
        const optionsJson = "[]";

        // Try to create a new competition with invalid percentages
        await expect(
            competitionFactory.connect(owner).createCompetition(
                "Test Competition",
                await owner.getAddress(),
                entryFeeAmount,
                testERC20.address,
                percentageForOwner,
                percentageForTreasury,
                endDate,
                optionsJson
            )
        ).to.be.revertedWith("Treasury percentage too high");
    });

    it("should revert if a user tries to join a competition without having enough entry fee", async () => {
        const entryFeeAmount = parseEther("10");
        const percentageForOwner = 80;
        const percentageForTreasury = 10;
        const endDate = Math.floor(Date.now() / 1000) + 3600; // One hour from now
        const optionsJson = "[]";

        // Create a new competition
        const createCompetitionTx = await competitionFactory.connect(owner).createCompetition(
            "Test Competition",
            await owner.getAddress(),
            entryFeeAmount,
            testERC20.address,
            percentageForOwner,
            percentageForTreasury,
            endDate,
            optionsJson
        );

        const competitionResponse = await createCompetitionTx.wait();
        const competitionId = competitionResponse.events?.[0].args?.[0];


        // Try to join the competition with insufficient funds
        await testERC20.connect(otherUser).approve(competitionFactory.address, parseEther("20"));
        await expect(
            competitionFactory.connect(otherUser).join(competitionId)
        ).to.be.revertedWith("Insufficient balance");
    });

    it("should revert if a user tries to join a competition after the end date", async () => {
        const entryFeeAmount = parseEther("10");
        const percentageForOwner = 80;
        const percentageForTreasury = 10;
        const endDate = Math.floor(Date.now() / 1000) + 3600; // One hour from now
        const optionsJson = "[]";

        // Create a new competition
        const createCompetitionTx = await competitionFactory.connect(owner).createCompetition(
            "Test Competition",
            await owner.getAddress(),
            entryFeeAmount,
            testERC20.address,
            percentageForOwner,
            percentageForTreasury,
            endDate,
            optionsJson
        );

        const competitionResponse = await createCompetitionTx.wait();
        const competitionId = competitionResponse.events?.[0].args?.[0];



        // Time travel 2 hours
        await time.increase(time.duration.hours(2));

        // Try to join the competition
        await testERC20.connect(user).approve(competitionFactory.address, parseEther("10"));
        await expect(
            competitionFactory.connect(user).join(competitionId)
        ).to.be.revertedWith("Competition ended");
    });

    it("should revert if a user tries to join a competition twice", async () => {
        const entryFeeAmount = parseEther("10");
        const percentageForOwner = 80;
        const percentageForTreasury = 10;
        const endDate = Math.floor(Date.now() / 1000) + 3600 * 24; // One day from now
        const optionsJson = "[]";

        // Create a new competition
        const createCompetitionTx = await competitionFactory.connect(owner).createCompetition(
            "Test Competition",
            await owner.getAddress(),
            entryFeeAmount,
            testERC20.address,
            percentageForOwner,
            percentageForTreasury,
            endDate,
            optionsJson
        );

        const competitionResponse = await createCompetitionTx.wait();
        const competitionId = competitionResponse.events?.[0].args?.[0];



        // Try to join the competition
        await testERC20.connect(user).approve(competitionFactory.address, parseEther("20"));

        await competitionFactory.connect(user).join(competitionId);

        // Count the number of participants
        const participantsCount = await competitionFactory.getParticipantsCount(competitionId);
        expect(participantsCount).to.equal(1);

        await expect(
            competitionFactory.connect(user).join(competitionId)
        ).to.be.revertedWith("Already joined");
    });

    it('Should allow the restricted address to set winners', async () => {
        const entryFeeAmount = parseEther("10");
        const percentageForOwner = 10;
        const percentageForTreasury = 10;
        const endDate = Math.floor(Date.now() / 1000) + 3600 * 24; // One day from now
        const optionsJson = "[]";

        // Create a new competition
        const createCompetitionTx = await competitionFactory.connect(owner).createCompetition(
            "Test Competition",
            await owner.getAddress(),
            entryFeeAmount,
            testERC20.address,
            percentageForOwner,
            percentageForTreasury,
            endDate,
            optionsJson
        );

        const competitionResponse = await createCompetitionTx.wait();
        const competitionId = competitionResponse.events?.[0].args?.[0];



        //Join the competition
        await testERC20.connect(user).approve(competitionFactory.address, parseEther("20"));


        await competitionFactory.connect(user).join(competitionId);



        // Check the rewards
        const rewards = await competitionFactory.connect(user).getTotalRewards(competitionId);

        // rewards should be 80% of the total entry fees
        expect(rewards).to.equal(parseEther("8"));

        // The owner adds additional MAGIC Rewards
        await MAGIC.connect(owner).approve(competitionFactory.address, parseEther("200"));
        await competitionFactory.connect(owner).addReward(MAGIC.address, parseEther("200"), competitionId);


        // current balance of tokens of the owner and the treasury
        const ownerBalanceBefore = await testERC20.balanceOf(await owner.getAddress());
        const treasuryBalanceBefore = await testERC20.balanceOf(await treasury.getAddress());
        const userBalanceBefore = await testERC20.balanceOf(await user.getAddress());

        // Time travel 2 days
        await time.increase(time.duration.days(2));

        // set the winners
        await competitionFactory.connect(restrictedUser).setWinners([await user.getAddress()], [100], competitionId);

        // current balance of tokens of the owner and the treasury
        const ownerBalanceAfter = await testERC20.balanceOf(await owner.getAddress());
        const treasuryBalanceAfter = await testERC20.balanceOf(await treasury.getAddress());

        // The owner should have received 10% of the total entry fees
        expect(ownerBalanceAfter.sub(ownerBalanceBefore)).to.equal(parseEther("1"));

        // The treasury should have received 10% of the total entry fees
        expect(treasuryBalanceAfter.sub(treasuryBalanceBefore)).to.equal(parseEther("1"));

        // The user should have received 80% of the total entry fees + 200 MAGIC
        expect(await testERC20.balanceOf(await user.getAddress())).to.equal((userBalanceBefore as BigNumber).add(parseEther("8")));
        expect(await MAGIC.balanceOf(await user.getAddress())).to.equal(parseEther("200"));

        // check the winner in the competitionFactory contract
        expect((await competitionFactory.connect(user).winners(competitionId, 0))).to.equal(await user.getAddress());
    });

    it("should allow to enter a competition with a 0 fee", async () => {
        const entryFeeAmount = parseEther("0");
        const percentageForOwner = 0;
        const percentageForTreasury = 10;
        const endDate = Math.floor(Date.now() / 1000) + 3600 * 24 * 10; // 10 day from now
        const optionsJson = "[]";

        // Create a new competition
        const createCompetitionTx = await competitionFactory.connect(owner).createCompetition(
            "Test Competition",
            await owner.getAddress(),
            entryFeeAmount,
            testERC20.address,
            percentageForOwner,
            percentageForTreasury,
            endDate,
            optionsJson
        );

        const competitionResponse = await createCompetitionTx.wait();
        const competitionId = competitionResponse.events?.[0].args?.[0];



        // Try to join the competition
        // await testERC20.connect(user).approve(competition.address, parseEther("20"));

        await competitionFactory.connect(user).join(competitionId);

        // Count the number of participants
        const participantsCount = await competitionFactory.getParticipantsCount(competitionId);
        expect(participantsCount).to.equal(1);


    });

});