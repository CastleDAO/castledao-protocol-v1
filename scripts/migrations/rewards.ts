import { parseEther } from "ethers/lib/utils";
import { ethers } from "hardhat";

const TOKENS = {
    ELM: "0x45d55eadf0ed5495b369e040af0717eafae3b731",
    MAGIC: "0x539bde0d7dbd336b79148aa742883198bbf60342",
};

const REWARDS = [
    // beacon royale 150 magic top 3
    {
        winner: "0xcd0eb48851856f64b7c3e0644c08c252876e6b05",
        reward: "MAGIC",
        amount: 100,
    },
    {
        winner: "0x7cc353433ef9df7676fbb39da26fa0e278107409",
        reward: "MAGIC",
        amount: 50,
    },
    {
        winner: "0xfde5dee1158f2e51dde568b5c7035bff9a54df42",
        reward: "MAGIC",
        amount: 50,
    },
// classic & modenr



];

const ERC20_ABI = [
    "function balanceOf(address _owner) external view returns (uint256)",
    "function transfer(address _to, uint256 _value) external returns (bool)",
];

async function sendRewards() {
    const [deployer] = await ethers.getSigners();


    const network = await ethers.provider.getNetwork();
    const networkName = (network.name == 'unknown' ? 'localhost' : network.name);

    console.log(`Network: ${networkName} (chainId=${network.chainId})`);



    for (const reward of REWARDS) {
        const tokenContractAddress = TOKENS[reward.reward as "ELM" | "MAGIC"] as string;
        if (!tokenContractAddress) {
            console.error(`Token ${reward.reward} not found in the tokens list.`);
            continue;
        }

        const erc20Contract = new ethers.Contract(tokenContractAddress, ERC20_ABI, deployer);
        const balance = await erc20Contract.balanceOf(deployer.address);
        // log balance
        console.log('Balance', balance.toString());


        const amount = parseEther(reward.amount.toString());

        if (balance.lt(amount)) {
            console.error(`Insufficient balance to send ${reward.amount} ${reward.reward}`);
            continue;
        }

        console.log('Transfering', amount.toString(), 'to', reward.winner);

        await erc20Contract.transfer(reward.winner, amount);
        console.log(`Sent ${reward.amount} ${reward.reward} to ${reward.winner}`);
    }
}


sendRewards()
    .then(() => console.log("Rewards sent successfully"))
    .catch((error) => console.error("Error sending rewards:", error));