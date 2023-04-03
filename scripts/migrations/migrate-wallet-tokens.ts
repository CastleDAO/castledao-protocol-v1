import { ethers } from "hardhat";
import { deployed_contracts } from "../constants";

const NFT_CONTRACTS = [
    deployed_contracts.mainnet.generals,
    deployed_contracts.mainnet.castles,
    deployed_contracts.mainnet.defiheroes,
    deployed_contracts.mainnet.ballot
];

const ERC20_CONTRACTS = [
  // Add your ERC-20 contract addresses here
  ''
];

const ERC721_ABI = [
  // ERC-721 ABI
  "function balanceOf(address _owner) external view returns (uint256)",
  "function tokenOfOwnerByIndex(address _owner, uint256 _index) external view returns (uint256)",
  "function safeTransferFrom(address _from, address _to, uint256 _tokenId) external",
];

const ERC20_ABI = [
  // ERC-20 ABI
  "function balanceOf(address _owner) external view returns (uint256)",
  "function transfer(address _to, uint256 _value) external returns (bool)",
];

async function transferTokens(privateKey: string, destination: string) {

    const network = await ethers.provider.getNetwork();
    const networkName = (network.name == 'unknown' ? 'localhost' : network.name);
  
    console.log(`Network: ${networkName} (chainId=${network.chainId})`);

  const provider = new ethers.providers.JsonRpcProvider('ALCHEMY_API_URL');
  const wallet = new ethers.Wallet(privateKey, provider);

  for (const nftContractAddress of NFT_CONTRACTS) {
    const nftContract = new ethers.Contract(nftContractAddress, ERC721_ABI, wallet);
    const balance = await nftContract.balanceOf(wallet.address);

    for (let i = 0; i < balance; i++) {
      const tokenId = await nftContract.tokenOfOwnerByIndex(wallet.address, i);
      await nftContract.safeTransferFrom(wallet.address, destination, tokenId);
      console.log(`Transferred NFT with tokenId ${tokenId} to ${destination}`);
    }
  }

  for (const erc20ContractAddress of ERC20_CONTRACTS) {
    const erc20Contract = new ethers.Contract(erc20ContractAddress, ERC20_ABI, wallet);
    const balance = await erc20Contract.balanceOf(wallet.address);

    if (balance.gt(0)) {
      await erc20Contract.transfer(destination, balance);
      console.log(`Transferred ${balance.toString()} ERC-20 tokens to ${destination}`);
    }
  }
}

const privateKey = "INSERT_PRIVATE_KEY";
const destination = "INSERT_DESTINY_ADDRESS";

transferTokens(privateKey, destination)
  .then(() => console.log("Transfer complete"))
  .catch((error) => console.error("Error transferring tokens:", error));