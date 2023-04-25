import { ethers } from "hardhat";

async function main() {

    // Deploy the Manager contract
    const competitionFactoryAddress = "0x1234567890abcdef1234567890abcdef12345678";

    const CompetitionFactory = await ethers.getContractFactory("CompetitionFactory");
    const competitionContract = await CompetitionFactory.attach(competitionFactoryAddress);


    // Get the signer
    const [signer] = await ethers.getSigners();

    // Define the competition parameters
    const name = "Example Competition";
    const owner = "DEFINE OWNER";
    const entryFeeAmount = ethers.utils.parseEther("1");
    const entryFeeToken = "0x1234567890abcdef1234567890abcdef12345678"; // Replace with the actual token address
    const percentageForOwner = 10;
    const percentageForTreasury = 5;
    const endDate = Math.floor(Date.now() / 1000) + 86400; // Set the end date to 24 hours from now
    const optionsJson = "{}"; // Replace with the actual options JSON

    // Call the createCompetition() function
    const createCompetitionTx = await competitionContract.createCompetition(
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

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });