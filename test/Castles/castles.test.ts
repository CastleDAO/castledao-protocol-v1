const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CastlesArbi", function () {

  let castlesArbi;

  this.beforeAll(async () => {
    const CastlesArbi = await ethers.getContractFactory("CastlesArbi");
   castlesArbi = await CastlesArbi.deploy();
    await castlesArbi.deployed();
  });

  it("Should do a get defense of the angels", async function () {
   

    const price = await castlesArbi.price();

    console.log("price", price);

    expect(
      await castlesArbi.mint(8764, {
        value: price,
      })
    ).to.emit(castlesArbi, "Transfer");

    const name = await castlesArbi.getName(8764);
    const defense = await castlesArbi.getDefense(8764);
    const rarityNumber = await castlesArbi.getRarityNumber(8764);
    const skillAmount = await castlesArbi.getSkillAmount(8764);
    const capacity = await castlesArbi.getCapacity(8764);
    const warrior = await castlesArbi.getWarrior(8764);
    console.log(name, defense.toNumber(), rarityNumber.toNumber(), skillAmount.toNumber(), capacity.toNumber());

    expect(name.length).to.be.greaterThan(0);
    expect(name).to.equal("Defense of the Angels");
    expect(warrior).to.equal("none");

    expect(rarityNumber.toNumber()).to.be.greaterThan(0);
    expect(skillAmount.toNumber()).to.be.greaterThan(0);
    expect(capacity.toNumber()).to.be.greaterThan(0);
    expect(defense.toNumber()).to.be.greaterThan(0);
    // .withArgs(ethers.constants.AddressZero, owner.address, tokenId);

    // wait until the transaction is mined
    // await setGreetingTx.wait();

    // expect(await castlesArbi.greet()).to.equal('Hola, mundo!');
  });

  it("Should get the right one", async function () {


    const price = await castlesArbi.price();

    console.log("price", price);

    expect(
      await castlesArbi.mint(3333, {
        value: price,
      })
    ).to.emit(castlesArbi, "Transfer");

    const name = await castlesArbi.getName(3333);
    const defense = await castlesArbi.getDefense(3333);
    const rarityNumber = await castlesArbi.getRarityNumber(3333);
    const skillAmount = await castlesArbi.getSkillAmount(3333);
    const goldGeneration = await castlesArbi.getGoldGeneration(3333);
    const capacity = await castlesArbi.getCapacity(3333);
    const skillType = await castlesArbi.getSkillType(3333);

    const warrior = await castlesArbi.getWarrior(3333);
    const warriorName = await castlesArbi.getWarriorName(3333);

    console.log(name, defense.toNumber(), rarityNumber.toNumber(), skillAmount.toNumber(), capacity.toNumber(), warrior);

    expect(name.length).to.be.greaterThan(0);
    expect(name).to.equal("Hardened Castle of the Healer Barbarian");
    expect(warriorName).to.equal("Healer Barbarian");
    expect(warrior).to.equal("Barbarian");

    expect(rarityNumber.toNumber()).to.be.equal(5);
    expect(skillAmount.toNumber()).to.be.equal(23);
    expect(skillType).to.be.equal("defense");

    expect(capacity.toNumber()).to.be.equal(161);
    expect(goldGeneration.toNumber()).to.be.equal(24);

    
  });
  
});