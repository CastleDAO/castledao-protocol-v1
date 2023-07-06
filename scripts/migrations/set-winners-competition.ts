import { parseEther } from "ethers/lib/utils";
import { ethers } from "hardhat";

const competitionAddress = '0x8Dde2569d7B6f2AF50E8856A2D88a9Dc98207Da3';

const winners = [
    "0xcd0eb48851856f64b7c3e0644c08c252876e6b05",
    "0xe47a238367162e597e93aff689c54555d350d455",
    "0xa4c4141637eac06d6ad22d9e354058eabdca684a"
]

const winnerPercentages = [70, 20, 10]

async function sendRewards() {
    const [deployer] = await ethers.getSigners();

    const CompetitionItem = await ethers.getContractFactory("Competition");
    const competition = new ethers.Contract(competitionAddress, CompetitionItem.interface, deployer);


    const network = await ethers.provider.getNetwork();
    const networkName = (network.name == 'unknown' ? 'localhost' : network.name);

    console.log(`Network: ${networkName} (chainId=${network.chainId})`);
    await competition.setWinners(winners, winnerPercentages);
}


sendRewards()
    .then(() => console.log("Rewards sent successfully"))
    .catch((error) => console.error("Error sending rewards:", error));