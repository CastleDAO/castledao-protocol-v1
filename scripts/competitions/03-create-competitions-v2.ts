import { ethers } from "hardhat";
import { deployed_contracts } from "../constants";
import { COMPETITIONS } from "./competitions.constants";

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
    const competitionFactoryAddress =  network.chainId === 42161 ?  "0x2a8847a86840E465040D6c77d2e63548786ff633": '0x3178538194afb9E756839695d412A418a6b82c1a';
    const restrictedAddress = '0x846FF49d72F4e3CA7a3D318820C6C2debe23c68A';
    const treasuryAddress = '0xeEfC874aC40BCF8A00b4484F26F599d0CE6c0F47';
    const CompetitionFactory = await ethers.getContractFactory("Competitions");
    const competitionFactory = await CompetitionFactory.attach(competitionFactoryAddress);


    // Get the signer
    const [signer] = await ethers.getSigners();

    // So far is hardcoded to magic
    const magicContractAddress = network.chainId === 42161 ? deployed_contracts.mainnet.magic : deployed_contracts.arbitrumgoerli.magic;
    const animaContractAddress = network.chainId === 42161 ? deployed_contracts.mainnet.anima : deployed_contracts.arbitrumgoerli.anima;
    const monthInfo = getMonthInfo();
    const endDate =  Math.floor(monthInfo.timestampEndMonth / 1000);

    // Define the competition parameters
    for(var i = 0; i < COMPETITIONS.length; i++) {
        const competition = COMPETITIONS[i];
         // Call the createCompetition() function
        const createCompetitionTx = await competitionFactory.createCompetition(
            competition.name,
            competition.owner,
            competition.entryFeeAmount,
            competition.entryFeeToken === 'magic' ? magicContractAddress: animaContractAddress,
            competition.entryFeePercentageOwner,
            competition.entryFeePercentageTreasury,
            endDate,
            competition.optionsJson
        );

        // Wait for the transaction to be mined
        await createCompetitionTx.wait();

        console.log("Competition created successfully");
        const networkName = (network.name == 'unknown' ? 'localhost' : network.name);
    
        const competitionResponse = await createCompetitionTx.wait();
        const competitionId = competitionResponse.events?.[0].args?.[0];
        console.log(`Network: ${networkName} (chainId=${network.chainId})`);
        console.log(`Competition: ${competition.name} created  with ID ${competitionId}`);
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