// Test to veriy the manager implementationtsimport { ethers } from "hardhat";
import { Contract, Signer } from "ethers";
import { expect } from "chai";


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
    ruby = await Ruby.deploy(manager.address, bound.address, 10000);
    await ruby.deployed();

    // Set the token minter
    tokenMinter = ruby.connect(owner);
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

    await expect(
      ruby.connect(user).mintFor(await owner.getAddress(), amount)
    ).to.be.revertedWith("Manager: Not token minter");
  });

  it("should not mint tokens if the cap is exceeded", async function () {
    const amount = 10001;

    await expect(
      tokenMinter.mintFor(await owner.getAddress(), amount)
    ).to.be.revertedWith("Ruby: Cap exceeded");
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

  it("should not set the cap if the total supply is more than the cap is exceeded", async function () {
    const newCap = 5000;

    await tokenMinter.mintFor(await owner.getAddress(), 9000);

    await expect(ruby.connect(owner).setCap(newCap)).to.be.revertedWith(
      "Ruby: Cap exceeded"
    );
  });

  it("should not transfer tokens if the contract is paused", async function () {
    const amount = 100;
    await tokenMinter.mintFor(await owner.getAddress(), amount);

    await ruby.connect(owner).pause();

    await expect(
      ruby.connect(owner).transfer(await user.getAddress(), amount)
    ).to.be.revertedWith("Ruby: Paused");
  });

  it("should not transfer unbound tokens for non-manager", async function () {
    const amount = 100;
    // Mint tokens for user
    await tokenMinter.mintFor(await user.getAddress(), amount);

    // Try to transfer unbound tokens
    await expect(
      ruby
        .connect(user)
        .transfer(await otherUser.getAddress(), amount)
    ).to.be.revertedWith("Ruby: Token not unbound")
  });

  it("Should allow to transfer unbound tokens for user", async function () {
    const amount = 100;
    // Mint tokens for user
    await tokenMinter.mintFor(await user.getAddress(), amount);

    // Unbind tokens
    await bound.unbind(ruby.address);

    // Transfer unbound tokens
    await ruby
      .connect(user)
      .transfer(await otherUser.getAddress(), amount);

    // Verify balance
    expect(await ruby.balanceOf(await otherUser.getAddress())).to.equal(amount);
  });

  it("should not allow transfer when paused, even when unbound", async function () {
    const amount = 100;
    // Mint tokens for user
    await tokenMinter.mintFor(await user.getAddress(), amount);

    // Unbind tokens
    await bound.unbind(ruby.address);

    // Try to transfer while paused
    await ruby.pause();

    await expect(
      ruby.connect(user).transfer(await otherUser.getAddress(), amount)
    ).to.be.revertedWith("Ruby: Paused");
    await ruby.unpause();
  });

  it("should update totalSupply when minting", async function () {
    const amount = 100;
    // Get initial total supply
    const initialTotalSupply = await ruby.totalSupply();

    // Mint tokens for user
    await tokenMinter.mintFor(await user.getAddress(), amount);

    // Get updated total supply
    const updatedTotalSupply = await ruby.totalSupply();

    // Verify total supply has increased by the minted amount
    expect(updatedTotalSupply).to.equal(initialTotalSupply.add(amount));
  });


  it("should update totalSupply when burning", async function () {
    const amount = 100;
    // Mint tokens for user
    await tokenMinter.mintFor(await user.getAddress(), amount);

    // Get initial total supply
    const initialTotalSupply = await ruby.totalSupply();

    // Burn tokens for user
    await ruby.connect(user).burn(amount);

    // Get updated total supply
    const updatedTotalSupply = await ruby.totalSupply();

    // Verify total supply has decreased by the burned amount
    expect(updatedTotalSupply).to.equal(initialTotalSupply.sub(amount));
  });

  it("should not allow burning more than balance", async function () {
    const amount = 100;
    // Mint tokens for user
    await tokenMinter.mintFor(await user.getAddress(), amount);

    // Try to burn more than balance
    await expect(
      ruby.connect(user).burn(101)
    ).to.be.revertedWith("ERC20: burn amount exceeds balance");
  });

  
});
