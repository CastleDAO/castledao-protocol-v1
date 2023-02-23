// Tests for the castledao staking contract
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber, Contract } from "ethers";
import { parseEther } from "ethers/lib/utils";
import { expect } from "chai";
import { ethers } from "hardhat";
import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { generateMerkle } from "./merkle";


// Contracts used in the tests
let airdrop: Contract; let manager: Contract;
let bound: Contract;
let ruby: Contract;
let magicContract: Contract;

let owner: SignerWithAddress;
let magicSigner: SignerWithAddress;
let userWithMagic: SignerWithAddress;
let userWithoutMagic: SignerWithAddress;
let otherUser: SignerWithAddress;
let merkle: any;
let rootHash : string;
let balancesAirdrop: any;

describe("Airdrop", function () {
    before(async () => {
        [owner, magicSigner, userWithMagic, userWithoutMagic, otherUser] =
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


    });


    beforeEach(async () => {
        // Deploy the Ruby contract
        const Ruby = await ethers.getContractFactory("Ruby");
        ruby = await Ruby.deploy(manager.address, bound.address, parseEther('21000000000'));
        await ruby.deployed();

        // Deploy the test ERC20 and ERC721 contracts
        const TestERC20 = await ethers.getContractFactory("TestERC20");
        const testERC20 = await TestERC20.connect(magicSigner).deploy();
        magicContract = await testERC20.deployed();

        
        // Deploy the airdrop contract
        const Airdrop = await ethers.getContractFactory("Airdrop");
        airdrop = (await Airdrop.deploy(
            manager.address,
            ruby.address,
            magicContract.address,
            true,
            parseEther('5')
        ));

        await airdrop.deployed();

        console.log('Airdrop address: ', airdrop.address);

        // Add the airdrop contract the ability to mint tokens
        await manager.addManager(airdrop.address, 2);

        console.log('Manager address: ', manager.address);

        // Mint 1000 tokens to the user with magic
        await magicContract.connect(magicSigner).mint(parseEther('1000'), await userWithMagic.getAddress());

        console.log('Tokens minted to user with magic');

        // Generate the merkle root with 100 RUBY tokens for the userWithMagic and userWithoutMagic
        balancesAirdrop = {
            [await userWithMagic.getAddress()]: parseEther('100'),
            [await userWithoutMagic.getAddress()]: parseEther('100')
        }

        merkle = generateMerkle(balancesAirdrop);
        rootHash = merkle.getRoot();
        console.log('Root hash: ', rootHash);

        // Set the merkle root
        //await airdrop.setRootHash(rootHash);


    });

    it('should not allow redemption before root hash is set', async () => {
        const merkleProof = merkle.getHexProof(`${0}${await userWithMagic.getAddress()}${parseEther('100').toString()}`);
        await expect(airdrop.redeem(0, await userWithMagic.getAddress(), parseEther('100'), merkleProof)).to.be.revertedWith('Root hash not set');
    });

    it('should allow the manager to redeem tokens', async () => {
        await airdrop.connect(owner).setRootHash(rootHash);
        const leaf = ethers.utils.solidityKeccak256(['uint256', 'address', 'uint256'], [0, await userWithMagic.getAddress(), parseEther('100').toString()]);

        const merkleProof = merkle.getHexProof(leaf);
        console.log('Merkle proof: ', merkleProof);

        await airdrop.redeem(0, await userWithMagic.getAddress(), parseEther('100'), merkleProof);

        expect(await airdrop.balanceOf(await userWithMagic.getAddress())).to.equal(parseEther('100'));
        expect(await airdrop.totalSupply()).to.equal(parseEther('100'));

        // Check ruby balance of user with magic
        expect(await ruby.balanceOf(await userWithMagic.getAddress())).to.equal(parseEther('100'));
    });

    it('should fail to redeem more tokens than allowed', async () => {
        await airdrop.connect(owner).setRootHash(rootHash);
        const leaf = ethers.utils.solidityKeccak256(['uint256', 'address', 'uint256'], [0, await userWithMagic.getAddress(), parseEther('100').toString()]);

        const merkleProof = merkle.getHexProof(leaf);
        console.log('Merkle proof: ', merkleProof);

        await expect(airdrop.redeem(0, await userWithMagic.getAddress(), parseEther('101'), merkleProof)).to.be.revertedWith('Invalid proof');
    })

    it('should fail to redeem less tokens than allowed if leaf is wrong', async () => {
        await airdrop.connect(owner).setRootHash(rootHash);
        const leaf = ethers.utils.solidityKeccak256(['uint256', 'address', 'uint256'], [0, await userWithMagic.getAddress(), parseEther('50').toString()]);

        const merkleProof = merkle.getHexProof(leaf);
        console.log('Merkle proof: ', merkleProof);

        await expect(airdrop.redeem(0, await userWithMagic.getAddress(), parseEther('50'), merkleProof)).to.be.revertedWith('Invalid proof');
    })

    it('should fail if contract is paused', async () => {
        await airdrop.connect(owner).setRootHash(rootHash);
        const leaf = ethers.utils.solidityKeccak256(['uint256', 'address', 'uint256'], [0, await userWithMagic.getAddress(), parseEther('100').toString()]);
        const merkleProof = merkle.getHexProof(leaf);
        console.log('Merkle proof: ', merkleProof);

        await airdrop.connect(owner).pause();

        await expect(airdrop.redeem(0, await userWithMagic.getAddress(), parseEther('100'), merkleProof)).to.be.revertedWith('Pausable: paused');
    })

    it('Should not allow to redem for free once the free flag is turned off', async() => {
        await airdrop.connect(owner).setRootHash(rootHash);
        const leaf = ethers.utils.solidityKeccak256(['uint256', 'address', 'uint256'], [0, await userWithMagic.getAddress(), parseEther('100').toString()]);
        const merkleProof = merkle.getHexProof(leaf);
        console.log('Merkle proof: ', merkleProof);

        await airdrop.connect(owner).setFree(false);

        await expect(airdrop.redeem(0, await userWithMagic.getAddress(), parseEther('100'), merkleProof)).to.be.revertedWith('Airdrop is not free right now');
    })

    it('should allow to mint by paying Magic', async () => {
        await airdrop.connect(owner).setRootHash(rootHash);
        const leaf = ethers.utils.solidityKeccak256(['uint256', 'address', 'uint256'], [0, await userWithMagic.getAddress(), parseEther('100').toString()]);
        const merkleProof = merkle.getHexProof(leaf);
        console.log('Merkle proof: ', merkleProof);

        await airdrop.connect(owner).setFree(false);

       
        // Approve the airdrop contract to spend the magic
        await magicContract.connect(userWithMagic).approve(airdrop.address, parseEther('10'));

        await airdrop.connect(userWithMagic).redeemForMagic(0, await userWithMagic.getAddress(), parseEther('100'), merkleProof, parseEther('10'));


        expect(await airdrop.balanceOf(await userWithMagic.getAddress())).to.equal(parseEther('100'));
        expect(await airdrop.totalSupply()).to.equal(parseEther('100'));

        // Check ruby balance of user with magic
        expect(await ruby.balanceOf(await userWithMagic.getAddress())).to.equal(parseEther('100'));

        // Check magic balance of user with magic
        expect(await magicContract.balanceOf(await userWithMagic.getAddress())).to.equal(parseEther('990'));

        // Check magic balance of the airdrop contract
        console.log('Airdrop magic balance: ', await magicContract.balanceOf(airdrop.address));
        expect(await magicContract.balanceOf(airdrop.address)).to.equal(parseEther('10'));

        // Allows manager to withdraw magic
        await airdrop.connect(owner).withdrawMagic(parseEther('10'));

        // Check magic balance of the airdrop contract
        expect(await magicContract.balanceOf(airdrop.address)).to.equal(parseEther('0'));

        console.log('Owner magic balance: ', await magicContract.balanceOf(await owner.getAddress()));
        // Check magic balance of the owner
        expect(await magicContract.balanceOf(await owner.getAddress())).to.equal(parseEther('10'));

    })

});
