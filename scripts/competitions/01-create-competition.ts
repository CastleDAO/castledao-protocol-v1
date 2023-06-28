import { ethers } from "hardhat";
import { deployed_contracts } from "../constants";

function getMonthInfo() {
    const currentMonth = new Date();
    const nextMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December'
    ];
  
    
    return {
        monthName: monthNames[nextMonth.getMonth()],
        year: nextMonth.getFullYear(),
        timestampStartMonth: new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 1, 0, 0, 0).getTime(),
        timestampEndMonth: new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0, 23, 59, 59).getTime()
      }
  }
  

async function main() {
    const network = await ethers.provider.getNetwork();
    // Deploy the Manager contract
    const competitionFactoryAddress =  network.chainId === 42161 ?  "0x63003d20B84176067Dc0b67988178E69A80CfF22": '0x8B9dD854D7e65DaF4E6B1622d1C8D0BeAf45BDD1';
    const restrictedAddress = '0x846FF49d72F4e3CA7a3D318820C6C2debe23c68A';
    const treasuryAddress = '0xeEfC874aC40BCF8A00b4484F26F599d0CE6c0F47';
    const CompetitionFactory = await ethers.getContractFactory("CompetitionFactory");
    const competitionFactory = await CompetitionFactory.attach(competitionFactoryAddress);


    // Get the signer
    const [signer] = await ethers.getSigners();

    // Define the competition parameters
    const name = "Treasure - June";
    const owner = '0x846FF49d72F4e3CA7a3D318820C6C2debe23c68A'; // TODO Replace with the actual owner address
    const entryFeeAmount = ethers.utils.parseEther("5");
    const magicContractAddress = network.chainId === 42161 ? deployed_contracts.mainnet.magic : deployed_contracts.arbitrumgoerli.magic;

    const entryFeeToken = magicContractAddress; // Replace with the actual token address
    const percentageForOwner = 0;
    const percentageForTreasury = 10;

    const monthInfo = getMonthInfo();
    const endDate =  Math.floor(monthInfo.timestampEndMonth / 1000);
    // const endDate = Math.floor((new Date().getTime() + 3600000) / 1000); 

    const optionsJson = "{}"; // Replace with the actual options JSON

    // Call the createCompetition() function
    const createCompetitionTx = await competitionFactory.createCompetition(
        name,
        owner,
        entryFeeAmount,
        entryFeeToken,
        percentageForOwner,
        percentageForTreasury,
        endDate,
        optionsJson
    );

    // Wait for the transaction to be mined
    await createCompetitionTx.wait();

    console.log("Competition created successfully");
    const networkName = (network.name == 'unknown' ? 'localhost' : network.name);

    const competitionResponse = await createCompetitionTx.wait();
    const competitionId = competitionResponse.events?.[0].args?.[0];

    const competitionAddress = await competitionFactory.competitions(competitionId);
    // const CompetitionItem = await ethers.getContractFactory("Competition");

    // const competition = new ethers.Contract(competitionAddress, CompetitionItem.interface, signer);


    console.log(`Network: ${networkName} (chainId=${network.chainId})`);
    console.log("Competition created successfully with ID:", competitionId);
    console.log("Competition contract instance address:", competitionAddress);
    
    if (networkName != "localhost") {
      console.log("");
      console.log("To verify the individual Competition contract on Etherscan, you'll need the constructor arguments used when the contract was created through the factory. You can retrieve these from the 'CompetitionCreated' event emitted by the factory.");
      console.log("Once you have the constructor arguments, you can use the following command to verify the Competition contract:");
      console.log(`npx hardhat verify --network ${networkName} ${competitionAddress} ${competitionId} ${owner} "${name}" ${entryFeeAmount} ${entryFeeToken} ${percentageForOwner} ${percentageForTreasury} ${endDate} "${optionsJson}" ${restrictedAddress} ${treasuryAddress}`);
    }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });