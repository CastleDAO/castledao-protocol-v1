// Test to veriy the manager implementationtsimport { ethers } from "hardhat";
import { Contract, Signer } from "ethers";
import { expect } from "chai";
import { expectRevert } from '@openzeppelin/test-helpers'
import { parseUnits } from "ethers/lib/utils";

describe("Ruby contract", function () {
  let ruby: Contract;
  let manager: Contract;
  let tokenMinter: Contract;
  let owner: Signer;
  let user: Signer;
  let bound: Contract;
  let otherUser: Signer;

  beforeEach(async function () {
    [owner, user, otherUser] = await ethers.getSigners();

    // Deploy the manager contract
    const Manager = await ethers.getContractFactory("TokenManager");
    manager = await Manager.deploy();
    await manager.initialize();


    // Add the owner as an admin and manager
    await manager.addAdmin(await owner.getAddress());
    await manager.addManager(await owner.getAddress(), 0);
    await manager.addManager(await owner.getAddress(), 1);
    await manager.addManager(await owner.getAddress(), 2);
    await manager.addManager(await owner.getAddress(), 3);

    //  Deploy the Bound contract
    const Bound = await ethers.getContractFactory("ERC20Bound");
    bound = await Bound.deploy(manager.address)
    await bound.deployed();

    // Deploy the Ruby contract
    const Ruby = await ethers.getContractFactory("Ruby");
    ruby = await Ruby.deploy(manager.address, bound.address, 10000);
    await ruby.deployed();

    // Set the token minter
    tokenMinter = ruby.connect(owner);
    await manager.addManager(await tokenMinter.getAddress(), 2);


  });

  it("should have the correct name and symbol", async function () {
    expect(await ruby.name()).to.equal("Ruby");
    expect(await ruby.symbol()).to.equal("RUBY");
  });

  it("should mint tokens for the token minter", async function () {
    const amount = 100;

    await tokenMinter.mintFor(await owner.getAddress(), amount);

    expect(await ruby.balanceOf(await owner.getAddress())).to.equal(amount);
  });

  it("should not mint tokens for non-token minter", async function () {
    const amount = 100;

    await expect(ruby.connect(user).mintFor(await owner.getAddress(), amount)).to.be.revertedWith("Manager: Not token minter");
  });

  it("should not mint tokens if the cap is exceeded", async function () {
    const amount = 10000;

    await expect(tokenMinter.mintFor(await owner.getAddress(), amount)).to.be.revertedWith("Ruby: Cap exceeded");
  });

  it("should pause and unpause the contract", async function () {
    await ruby.connect(owner).pause();

    expect(await ruby.paused()).to.be.true;

    await ruby.connect(owner).unpause();

    expect(await ruby.paused()).to.be.false;
  });

  it("should set the cap", async function () {
    const newCap = 20000;

    await ruby.connect(owner).setCap(newCap);

    expect(await ruby.CAP()).to.equal(newCap);
  });

  it("should not set the cap if the cap is exceeded", async function () {
    const newCap = 5000;

    await expect(ruby.connect(owner).setCap(newCap)).to.be.revertedWith("Ruby: Cap exceeded");
  });

  it("should not transfer tokens if the contract is paused", async function () {
    const amount = 100;
    await tokenMinter.mintFor(await owner.getAddress(), amount);

    await ruby.connect(owner).pause();

    await expect(ruby.connect(user).transfer(await user.getAddress(), amount)).to.be.revertedWith("Ruby: Paused");
  });

  it("should not transfer unbound tokens for non-manager", async function () {
    const amount = 100;
    // Mint tokens for user
    await ruby.mintFor(user, amount);

    // Try to transfer unbound tokens
    await expectRevert(
      ruby.connect(user).transfer(otherUser, amount, { from: user }),
      "Ruby: Token not unbound"
    );
  });

  it('Should allow to transfer unbound tokens for user', async function () {
    const amount = 100;
    // Mint tokens for user
    await ruby.mintFor(user, amount);

    // Unbind tokens
    await bound.unbind(await user.getAddress())

    // Transfer unbound tokens
    await ruby.connect(user).transfer(otherUser, amount, { from: user })

    // Verify balance
    expect(await ruby.balanceOf(await otherUser.getAddress())).to.equal(amount);
    });

  it("should not allow transfer when paused", async function () {
    const amount = 100;
    // Mint tokens for user
    await ruby.mintFor(user, amount);

    // Try to transfer while paused
    await ruby.pause();
    await expectRevert(
      ruby.transfer(otherUser, amount, { from: user }),
      "Ruby: Paused"
    );
    await ruby.unpause();
  });

  it("should update totalSupply when minting", async function () {
    const amount = 100;
    // Get initial total supply
    const initialTotalSupply = await ruby.totalSupply();

    // Mint tokens for user
    await ruby.mintFor(user, amount);

    // Get updated total supply
    const updatedTotalSupply = await ruby.totalSupply();

    // Verify total supply has increased by the minted amount
    expect(updatedTotalSupply).to.equal(initialTotalSupply.add(amount));
  });

  it("should not exceed the token cap", async function () {
    const cap = parseUnits('10000')
    const amount = parseUnits('1000')
    // Mint tokens for user
    await ruby.mintFor(user, cap.sub(amount));

    // Try to mint exceeding the cap
    await expectRevert(
      ruby.mintFor(user, amount.add(1)),
      "Ruby: Cap exceeded"
    );
  });

  it("should update totalSupply when burning", async function () {
    const amount = 100;
    // Mint tokens for user
    await ruby.mintFor(user, amount);

    // Get initial total supply
    const initialTotalSupply = await ruby.totalSupply();

    // Burn tokens for user
    await ruby.burn(amount, { from: user });

    // Get updated total supply
    const updatedTotalSupply = await ruby.totalSupply();

    // Verify total supply has decreased by the burned amount
    expect(updatedTotalSupply).to.equal(initialTotalSupply.sub(amount));
  });

  it("should not allow burning more than balance", async function () {
    const amount = 100;
    // Mint tokens for user
    await ruby.mintFor(user, amount);

    // Try to burn more than balance
    await expectRevert(
      ruby.burn(101, { from: user }),
      "ERC20: burn amount exceeds balance"
    );
  });

  it("should update the token cap", async function () {
    // Get initial cap
    const initialCap = await ruby.CAP();

    // Update cap
    await ruby.setCap(initialCap.add(1));

    // Verify the new cap has been set
    expect(await ruby.CAP()).to.equal(initialCap.add(1));
  });
  it("should not set the cap below the total supply", async function () {
    const amount = parseUnits('100')
    // Mint tokens for user
    await ruby.mintFor(user, amount);

    // Try to set the cap below the total supply
    await expectRevert(
      ruby.setCap(amount.sub(1)),
      "Ruby: Cap exceeded"
    );
  });
});