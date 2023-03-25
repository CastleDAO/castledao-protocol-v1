import { ethers } from "hardhat";
import { Contract, Signer } from "ethers";
import { expect } from "chai";

describe("GeneralsAmuletStaker contract", function () {
    let generalsAmuletStaker: Contract;
    let owner: Signer;
    let admin: Signer;
    let nonAdmin: Signer;
    let ballotContract: Contract;
    let generalContract: Contract;
    let manager: Contract;

    beforeEach(async function () {
        [owner, admin, nonAdmin] = await ethers.getSigners();

        // Deploy the Manager contract
        const Manager = await ethers.getContractFactory("Manager");
        manager = await Manager.deploy();
        await manager.deployed();

        // Add admin as an admin in the Manager contract
        await manager.addManager(await admin.getAddress(), 0);

        // Deploy the Ballot contract (Mock ERC721)
        const Ballot = await ethers.getContractFactory("TestERC721");
        ballotContract = await Ballot.deploy();
        await ballotContract.deployed();

        // Deploy the General contract (Mock ERC721)
        const General = await ethers.getContractFactory("TestERC721");
        generalContract = await General.deploy();
        await generalContract.deployed();

        // Deploy the GeneralsAmuletStaker contract
        const GeneralsAmuletStaker = await ethers.getContractFactory("GeneralsAmuletStaker");
        generalsAmuletStaker = await GeneralsAmuletStaker.deploy(manager.address, ballotContract.address, generalContract.address);
        await generalsAmuletStaker.deployed();
        await generalsAmuletStaker.connect(admin).addAmulet(
            1,
            'sea'
        )
       
    });

    it("should allow the manager to set allowUnstake", async () => {
        await generalsAmuletStaker.connect(admin).setAllowUnstake(true);
        expect(await generalsAmuletStaker.allowUnstake()).to.equal(true);
    });

    it("should allow a user to stake a ballot with a valid amulet", async () => {
        await ballotContract.connect(owner).mint(await owner.getAddress());
        await generalContract.connect(owner).mint(await owner.getAddress());

        await ballotContract.connect(owner).approve(generalsAmuletStaker.address, 1);
        await generalsAmuletStaker.connect(owner).stakeBallot(1, 1, 1);

        expect(await generalsAmuletStaker.generalAmulet(1)).to.equal(1);
    });

    it("should not allow a user to stake a ballot with an invalid amulet", async () => {
        await ballotContract.connect(owner).mint(await owner.getAddress());
        await generalContract.connect(owner).mint(await owner.getAddress());

        await ballotContract.connect(owner).approve(generalsAmuletStaker.address, 1);

        await expect(
            generalsAmuletStaker.connect(owner).stakeBallot(1, 1, 999)
        ).to.be.revertedWith("Invalid amulet ID");
    });

    it("should allow a user to unstake a ballot if allowed", async () => {
        await ballotContract.connect(owner).mint(await owner.getAddress());
        await generalContract.connect(owner).mint(await owner.getAddress());

        await ballotContract.connect(owner).approve(generalsAmuletStaker.address, 1);
        await generalsAmuletStaker.connect(owner).stakeBallot(1, 1, 1);

        await generalsAmuletStaker.connect(admin).setAllowUnstake(true);
        await generalsAmuletStaker.connect(owner).unstakeBallot(1);

        expect(await ballotContract.ownerOf(1)).to.equal(await owner.getAddress());
    });

    it("should not allow a user to unstake a ballot if not allowed", async () => {
        await ballotContract.connect(owner).mint(await owner.getAddress());
        await generalContract.connect(owner).mint(await owner.getAddress());

        await ballotContract.connect(owner).approve(generalsAmuletStaker.address, 1);
        await generalsAmuletStaker.connect(owner).stakeBallot(1, 1, 1);

        await expect(generalsAmuletStaker.connect(owner).unstakeBallot(1)).to.be.revertedWith("Unstaking not allowed");
    });

    it("should allow the manager to add, remove, and change amulets", async () => {
        await generalsAmuletStaker.connect(admin).addAmulet(5, "air");
        expect(await generalsAmuletStaker.amulets(5)).to.equal("air");

        await generalsAmuletStaker.connect(admin).removeAmulet(5);
        expect(await generalsAmuletStaker.amulets(5)).to.equal("");

        await generalsAmuletStaker.connect(admin).changeAmulet(1, "volcano");
        expect(await generalsAmuletStaker.amulets(1)).to.equal("volcano");
    });

    it("should not allow a non-manager to set allowUnstake", async () => {
        await expect(generalsAmuletStaker.connect(nonAdmin).setAllowUnstake(true)).to.be.revertedWith("Manager: Not manager");
    });

    it("should not allow a non-manager to add, remove, or change amulets", async () => {
        await expect(generalsAmuletStaker.connect(nonAdmin).addAmulet(5, "air")).to.be.revertedWith("Manager: Not manager");
        await expect(generalsAmuletStaker.connect(nonAdmin).removeAmulet(5)).to.be.revertedWith("Manager: Not manager");
        await expect(generalsAmuletStaker.connect(nonAdmin).changeAmulet(1, "volcano")).to.be.revertedWith("Manager: Not manager");
    });

    it('Shoudl return the text for the amulet', async () => {
        await ballotContract.connect(owner).mint(await owner.getAddress());
        await generalContract.connect(owner).mint(await owner.getAddress());

        await generalsAmuletStaker.connect(admin).addAmulet(5, "air");

        await ballotContract.connect(owner).approve(generalsAmuletStaker.address, 1);
        await generalsAmuletStaker.connect(owner).stakeBallot(1, 1, 5);

        expect(await generalsAmuletStaker.getGeneralAmulet(1)).to.equal("air");
    })
});