import { parseEther } from "ethers/lib/utils";
import { ethers } from "hardhat";

const TOKENS = {
    ELM: "0x45d55eadf0ed5495b369e040af0717eafae3b731",
    MAGIC: "0x539bde0d7dbd336b79148aa742883198bbf60342",
};

const REWARDS = [

    {
        winner: "0x7a25af1bfe363cce64ba7b52b5170bbb5926d488",
        reward: "MAGIC",
        amount: 25,
    },
    {
        winner: "0xc033728e305f63558c87ac4deed63e0c3978f0e4",
        reward: "MAGIC",
        amount: 35,
    },
    {
        winner: "0xc033728e305f63558c87ac4deed63e0c3978f0e4",
        reward: "ELM",
        amount: 15,
    },
    {
        winner: "0x7cc353433ef9df7676fbb39da26fa0e278107409",
        reward: "MAGIC",
        amount: 20,
    },
    {
        winner: "0x7cc353433ef9df7676fbb39da26fa0e278107409",
        reward: "MAGIC",
        amount: 10,
    },
    {
        winner: "0x7cc353433ef9df7676fbb39da26fa0e278107409",
        reward: "ELM",
        amount: 10,
    },
    {
        winner: "0x20d7bfab33f4639b0f69086be85b3041cf5235ad",
        reward: "MAGIC",
        amount: 5,
    },


    {
        winner: "0x877b37d3e5467b4aae7687dd3480a46c8d3e16be",
        reward: "MAGIC",
        amount: 5,
    },

    {
        winner: "0x20d7bfab33f4639b0f69086be85b3041cf5235ad",
        reward: "MAGIC",
        amount: 15,
    },
    {
        winner: "0x559862c9ea8433e881dca82b56ac88676c7b04ae",
        reward: "ELM",
        amount: 5,
    },
    {
        winner: "0x5e8bb171efb4ef1da79479c794d5b8ec550233f1",
        reward: "ELM",
        amount: 5,
    },
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