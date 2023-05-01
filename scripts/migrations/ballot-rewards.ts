// Sends crypto generals from the mint contract to addresses
import { ethers } from "hardhat";


const REWARDS = {
    "0xc0715cb0d899d0d595e738156613972a4e354f21": 1
  };

  export function getRandomInt(min: number, max: number) {
    // min and max included
    return Math.floor(Math.random() * (max - min + 1) + min);
  }
  
const ERC721_ABI = [
    "function totalSupply() external view returns (uint256)",
    "function transferFrom(address _from, address _to, uint256 _tokenId) external",
    "function addToWhitelistMultiple(address[] memory _addresses) external",
    "function mint(uint32 _decoration, uint32 _background, uint32 _logo) external",
  ];

  
  
  async function sendRewards() {
    const [deployer] = await ethers.getSigners();
    const tokenContractAddress = '0x9fe6688e7d4bfbc69fe2727f578b1f1b8c75b930';
  
    const erc721Contract = new ethers.Contract(tokenContractAddress, ERC721_ABI, deployer);
  
    for (const [winner, amount] of Object.entries(REWARDS)) {
      for (let i = 0; i < amount; i++) {
        await erc721Contract.addToWhitelistMultiple([await deployer.getAddress()]);
        console.log('Added to whitelist')
        const background = getRandomInt(0, 5);
        const decoration = getRandomInt(0, 4);
        const logo = getRandomInt(0, 9);
        await erc721Contract.mint(decoration, background, logo);
        
        console.log(`Claimed Ballot for ${winner}`   )
        const tokenId = await erc721Contract.totalSupply();
        await erc721Contract.transferFrom(deployer.address, winner, tokenId);
        console.log(`Sent Ballot tokenId ${tokenId} to ${winner}`);
      }
    }
  }
  
  async function main() {
    await sendRewards();
    console.log("Rewards sent successfully");
  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Error sending rewards:", error);
      process.exit(1);
    });
