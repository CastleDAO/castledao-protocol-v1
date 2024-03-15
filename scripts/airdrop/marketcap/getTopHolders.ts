// Dot env
import axios from "axios";
import { BigNumber } from "ethers"
import { formatUnits, parseEther } from "ethers/lib/utils"
import { ethers } from "hardhat";
import fs from 'fs';

const topCollectionsBase = [{
    address: "0x532f27101965dd16442E59d40670FaF5eBB142E4",
    name: "brett",
    networkId: "8453"
}, {
    address: "0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed",
    name: "degen",
    networkId: "8453"
}, {
    address: "0xFe20C1B85ABa875EA8cecac8200bF86971968F3A",
    name: "bald",
    networkId: "8453"
}]

const topCollectionsArbitrum = [{
    address: "0x155f0DD04424939368972f4e1838687d6a831151",
    name: "adoge",
    networkId: "42161"
}, {
    address: "0x09E18590E8f76b6Cf471b3cd75fE1A1a9D2B2c2b",
    name: "aidoge",
    networkId: "42161"
}]

const topCollectionsEth = [{
    address: "0x6982508145454Ce325dDbE47a25d4ec3d2311933",
    name: "pepe",
    networkId: "1"
}, {
    address: "0xaaeE1A9723aaDB7afA2810263653A34bA2C21C7a",
    name: "mog",
    networkId: "1"
}]

async function getOwnersCollection(tokenAddress: string, networkId: string, name: string, page: number) {
    const options = {
        url: `https://api.chainbase.online/v1/token/top-holders?chain_id=${networkId}&contract_address=${tokenAddress}&page=${page}&limit=20`,
        method: 'GET',
        headers: {
            'x-api-key': "xxxx", // Replace the field with your API key.
            'accept': 'application/json'
        }
    };
    return axios(options)
        .then(response => (response.data.data.map((i: any) => i.wallet_address)))
        .catch(error => console.log(error));
}

async function main() {
    const currentNetwork = await ethers.provider.getNetwork();
    console.log(`Current network: ${currentNetwork.name}`)

    for (var i = 0; i < topCollectionsEth.length; i++) {

        const collection = topCollectionsEth[i];
        const name = collection.name;
        const tokenAddress = collection.address;
        const networkId = collection.networkId;
        console.log(`Getting owners for ${name}...`)
        try {


            let acc: any = []
            // Read the owners if previous file exist
            // if (fs.existsSync(`./${name}.json`)) {
            //     const data = fs.readFileSync(`./${name}.json`, 'utf8');
            //     acc = JSON.parse(data);

            // }

            // We do by batches of 100
            const batches = 10;
            for (var j = 0; j < batches; j++) {
                console.log(`Getting owners for ${name} batch ${j}...`)
                const page = j + 1;
                const resp = await getOwnersCollection(tokenAddress, networkId, name, page)
                acc = resp && resp.length > 0 && [...acc, ...resp]
                // Write the file with the acc 
                const data = JSON.stringify(acc, null, 2);
                fs.writeFileSync(`./${name}.json`, data);

                // wait 1 second
                await new Promise(r => setTimeout(r, 1000));
            }
        } catch (e) {
            console.log('Error getting owners for', name, e)
        }
    }


}

function aggregateWallets() {
    // Reads all the files generated, and gets all the unique wallets, with a number of the NFTs they have
    let wallets = {} as any
    let uniqueWallets = []
    for (var i = 0; i < castledaoCollections.length; i++) {
        const collection = castledaoCollections[i];
        const collectionName = collection.collection_name;
        console.log(`Aggregating wallets for ${collectionName}...`)

        if (fs.existsSync(`./${collectionName}.json`)) {
            const data = fs.readFileSync(`./${collectionName}.json`, 'utf8');
            const acc = JSON.parse(data);
            for (var wallet in acc) {
                const lowercase = wallet.toLowerCase()
                if (wallets[lowercase]) {
                    wallets[lowercase] += acc[wallet].length
                } else {
                    wallets[lowercase] = acc[wallet].length
                }
            }
        }
    }

    for (var wallet in wallets) {
        uniqueWallets.push(wallet)
    }

    // Write the file with the acc
    const data = JSON.stringify(wallets, null, 2);
    fs.writeFileSync(`./wallets.json`, data);
}

main()