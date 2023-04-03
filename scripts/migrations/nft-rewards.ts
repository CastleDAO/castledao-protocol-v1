// Sends crypto generals from the mint contract to addresses
import { ethers } from "hardhat";


const REWARDS = {
    "0x7a25af1bfe363cce64ba7b52b5170bbb5926d488": 1,
    "0xc033728e305f63558c87ac4deed63e0c3978f0e4": 4,
    "0x20d7bfab33f4639b0f69086be85b3041cf5235ad": 1
  };


  
  
const ERC721_ABI = [
    "function totalSupply() external view returns (uint256)",
    "function ownerClaim() external",
    "function transferFrom(address _from, address _to, uint256 _tokenId) external",
  ];
  
  async function sendRewards() {
    const [deployer] = await ethers.getSigners();
    const tokenContractAddress = '0x1aaec0fa487a979a3f6b46dccf0ac2648167a61e';
  
    if (!tokenContractAddress) {
      console.error("CryptoGenerals contract address not found in the tokens list.");
      return;
    }
  
    const erc721Contract = new ethers.Contract(tokenContractAddress, ERC721_ABI, deployer);
  
    for (const [winner, amount] of Object.entries(REWARDS)) {
      for (let i = 0; i < amount; i++) {
        await erc721Contract.ownerClaim();
        console.log(`Claimed CryptoGeneral for ${winner}`   )
        const tokenId = await erc721Contract.totalSupply();
        await erc721Contract.transferFrom(deployer.address, winner, tokenId);
        console.log(`Sent CryptoGeneral tokenId ${tokenId} to ${winner}`);
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
