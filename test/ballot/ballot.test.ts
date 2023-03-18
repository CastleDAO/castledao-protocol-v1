import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { Contract } from "ethers";
import { ethers } from "hardhat";

describe("CastleDAOBallot", function () {
  let myContract:Contract;
  let owner: SignerWithAddress;
  let address1: SignerWithAddress;
  let address2: SignerWithAddress;
  let address3: SignerWithAddress;
  this.beforeAll(async () => {
    // deploy seeder

    // deploy main contract with descriptor address as argument
    const CastleDAOBallot = await ethers.getContractFactory("CastleDAOBallot");
    myContract = await CastleDAOBallot.deploy();
    [owner, address1, address2, address3] = await ethers.getSigners();

    console.log("CastleDAOBallot deployed to:", myContract.address);
  });

  it("Should add an account to the whitelist", async () => {
    await myContract.connect(owner).addToWhitelistMultiple([address1.address]);

    expect(
      await myContract.connect(owner).whitelisted(address1.address)
    ).to.be.equal(true);
    expect(
      await myContract.connect(owner).whitelisted(address2.address)
    ).to.be.equal(false);
  });

  it("Should not allow to mint if not whitelisted,", async function () {
    await expect(myContract.connect(address2).mint(1, 2, 3)).to.be.revertedWith(
      "Not allowed to mint"
    );
  });

  it("Should call mint correctly", async function () {
    await myContract
      .connect(owner)
      .addToWhitelistMultiple([address1.address, owner.address]);
    const result = await myContract.mint(0, 0 , 0);

    expect(result).to.emit(myContract, "Transfer");

    const receipt = await result.wait();

    const gasUsed = receipt.gasUsed.toNumber();
    console.log({ gasUsed });

    const transferEvent = receipt.events.find((i) => i.event === "Transfer");
    console.log(transferEvent);
    expect(transferEvent.args["tokenId"].toNumber()).to.equal(1);

    const tokenURI = await myContract.tokenURI(1);
    console.log(tokenURI);
    const json = Buffer.from(
      tokenURI.replace("data:application/json;base64,", ""),
      "base64"
    ).toString();
    console.log(json);
    const parsed = JSON.parse(json);
    console.log({ parsed });
    expect(parsed).to.haveOwnProperty("image");
    expect(parsed.image).to.include("data:image/svg+xml;base64");
  });
});
