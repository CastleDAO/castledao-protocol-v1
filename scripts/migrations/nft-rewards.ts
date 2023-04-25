// Sends crypto generals from the mint contract to addresses
import { ethers } from "hardhat";


const REWARDS = {
    "0x3571fcc803e11E2CD67EF4C880c08a50aE84971D": 1,
    "0x4682ccE5E04A9fA9d530b81f9FDEfFc58404Af54": 1,
    "0x59f2c73Bf80317E88195eB728cD66172EBbDa05a": 1
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
