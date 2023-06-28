import { ethers } from "hardhat";
import { BigNumber, Contract, Signer } from "ethers";
import { expect } from "chai";
import { parseEther } from "ethers/lib/utils";
import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("CompetitionFactory and Competition", function () {
    let competitionFactory: Contract;
    let owner: Signer;
    let user: Signer;
    let restrictedUser: Signer;
    let otherUser: Signer;
    let treasury: Signer;
    let testERC20: Contract;
    let MAGIC: Contract;

    beforeEach(async function () {
        [owner, user, restrictedUser, treasury, otherUser] = await ethers.getSigners();

        // Deploy the TestERC20 contract
        const TestERC20 = await ethers.getContractFactory("TestERC20");
        testERC20 = await TestERC20.connect(owner).deploy();
        await testERC20.deployed();

        // Deploy the MAGIC contract
        const MAGICContract = await ethers.getContractFactory("TestERC20");
        MAGIC = await MAGICContract.connect(owner).deploy();
        await MAGIC.deployed();

        // Give the owner 1000 MAGIC 
        await MAGIC
            .connect(owner)
            .mint(parseEther("1000"), await owner.getAddress());

        // Deploy the CompetitionFactory contract
        const CompetitionFactory = await ethers.getContractFactory("CompetitionFactory");
        competitionFactory = await CompetitionFactory.deploy((await restrictedUser.getAddress()), await (treasury.getAddress()));
        await competitionFactory.deployed();


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

        const competitionAddress = await competitionFactory.competitions(competitionId);
        const CompetitionItem = await ethers.getContractFactory("Competition");

        const competition = new ethers.Contract(competitionAddress, CompetitionItem.interface, owner);

        // Check competition parameters
        expect(await competition.owner()).to.equal(await owner.getAddress());
        expect(await competition.name()).to.equal("Test Competition");
        expect(await competition.entryFeeAmount()).to.equal(entryFeeAmount);
        expect(await competition.entryFeeToken()).to.equal(testERC20.address);
        expect(await competition.percentageForOwner()).to.equal(percentageForOwner);
        expect(await competition.percentageForTreasury()).to.equal(percentageForTreasury);
        expect(await competition.endDate()).to.equal(endDate);
        expect(await competition.optionsJson()).to.equal(optionsJson);
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

        const competitionAddress = await competitionFactory.competitions(competitionId);
        const CompetitionItem = await ethers.getContractFactory("Competition");

        const competition = new ethers.Contract(competitionAddress, CompetitionItem.interface, owner);
    
        // Try to join the competition with insufficient funds
        await testERC20.connect(otherUser).approve(competition.address, parseEther("20"));
        await expect(
            competition.connect(otherUser).join()
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

        const competitionAddress = await competitionFactory.competitions(competitionId);
        const CompetitionItem = await ethers.getContractFactory("Competition");

        const competition = new ethers.Contract(competitionAddress, CompetitionItem.interface, owner);

        // Time travel 2 hours
        await time.increase(time.duration.hours(2));

        // Try to join the competition
        await testERC20.connect(user).approve(competition.address, parseEther("10"));
        await expect(
            competition.connect(user).join()
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

        const competitionAddress = await competitionFactory.competitions(competitionId);
        const CompetitionItem = await ethers.getContractFactory("Competition");

        const competition = new ethers.Contract(competitionAddress, CompetitionItem.interface, owner);


        // Try to join the competition
        await testERC20.connect(user).approve(competition.address, parseEther("20"));

        await competition.connect(user).join();

        // Count the number of participants
        const participantsCount = await competition.getParticipantsCount();
        expect(participantsCount).to.equal(1);

        await expect(
            competition.connect(user).join()
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

        const competitionAddress = await competitionFactory.competitions(competitionId);
        const CompetitionItem = await ethers.getContractFactory("Competition");

        const competition = new ethers.Contract(competitionAddress, CompetitionItem.interface, owner);


        //Join the competition
        await testERC20.connect(user).approve(competition.address, parseEther("20"));
            

        await competition.connect(user).join();

   

        // Check the rewards
        const rewards = await competition.connect(user).getTotalRewards();

        // rewards should be 80% of the total entry fees
        expect(rewards).to.equal(parseEther("8"));

        // The owner adds additional MAGIC Rewards
        await MAGIC.connect(owner).approve(competition.address, parseEther("200"));
        await competition.connect(owner).addReward(MAGIC.address, parseEther("200"));


        // current balance of tokens of the owner and the treasury
        const ownerBalanceBefore = await testERC20.balanceOf(await owner.getAddress());
        const treasuryBalanceBefore = await testERC20.balanceOf(await treasury.getAddress());
        const userBalanceBefore = await testERC20.balanceOf(await user.getAddress());

        // Time travel 2 days
        await time.increase(time.duration.days(2));

        // set the winners
        await competition.connect(restrictedUser).setWinners([await user.getAddress()], [100]);

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

        // check the winner in the competition contract
        expect(await competition.connect(user).winners(0)).to.equal(await user.getAddress());
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

        const competitionAddress = await competitionFactory.competitions(competitionId);
        const CompetitionItem = await ethers.getContractFactory("Competition");

        const competition = new ethers.Contract(competitionAddress, CompetitionItem.interface, owner);


        // Try to join the competition
        // await testERC20.connect(user).approve(competition.address, parseEther("20"));

        await competition.connect(user).join();

        // Count the number of participants
        const participantsCount = await competition.getParticipantsCount();
        expect(participantsCount).to.equal(1);

        
    });

    // Add more test cases as needed
});