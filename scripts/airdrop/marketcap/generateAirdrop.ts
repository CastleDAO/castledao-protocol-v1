import { BigNumber } from "ethers"
import { formatUnits, parseEther } from "ethers/lib/utils"
import { ethers } from "hardhat";
import fs from 'fs';
const allowedExternalCollections = [{
    collection_name: "arbidudes",
    address: "0x1ac7a2fc7f66fa4edf2713a88cd4bad24220c86c",
}, {
    collection_name: "smolbrains",
    address: "0x6325439389e0797ab35752b4f43a14c004f22a9c",
}, {
    collection_name: "realmer",
    address: "0x4de95c1e202102e22e801590c51d7b979f167fbb"
}, {
    collection_name: "footy",
    address: "0x4c96226495e28ae2772cd5134608ba6efbf88169"
}, {
    collection_name: "blueberry",
    address: "0x17f4BAa9D35Ee54fFbCb2608e20786473c7aa49f"
}, {
    collection_name: "farmland",
    address: "0xe16321aAE3a6333033d96fA02785813eA2412334"
}, {
    collection_name: "egg",
    address: '0xa0dc9e505373e92ede773de021444ae251f9c171'
},
// {
//     collection_name: "talesofelleria",
//     address: '0x7480224ec2b98f28cee3740c80940a2f489bf352'

// },
{
    collection_name: "the lost donkeys",
    address: '0x5e84c1a06e6ad1a8ed66bc48dbe5eb06bf2fe4aa'
},
//{
//     collection_name: "imbued souls",
//     address: '0xDc758b92c7311280aeeB48096a3bf4D1C1f936d4'
// }, 
{
    collection_name: "toadz",
    address: "0x09cae384c6626102abe47ff50588a1dbe8432174"
}, {
    collection_name: "arbibots",
    address: "0xc1fcf330b4b4c773fa7e6835f681e8f798e9ebff"
}, {
    collection_name: "diamond pepes",
    address: "0xede855ceD3e5A59Aaa267aBdDdB0dB21CCFE5072"
}, {
    collection_name: "mithical",
    address: "0xD3976f93Ac8bFC32568FBFcAEdAfFc3f96E67D5c"
}, {
    collection_name: "battlefly",
    address: "0x0aF85A5624D24E2C6e7Af3c0a0b102a28E36CeA3"
}]

const externalCollections2 = [{
    collection_name: "smolbrains",
    address: "0xa7f1462e0ecdeebdee4faf6681148ca96db78777",
}]

const castledaoCollections = [{
    collection_name: "castles",
    address: "0x71f5c328241fc3e03a8c79edcd510037802d369c",
}, {
    collection_name: "defiheroes",
    address: "0x8ec75bc963181489d7fc1d892f687b8b0987d9ec",
}, {
    collection_name: "ballot",
    address: "0x9fe6688e7d4bfbc69fe2727f578b1f1b8c75b930"
}, {
    collection_name: "generals",
    address: "0x1aaec0fa487a979a3f6b46dccf0ac2648167a61e"
}]

const layer1Collections = [{
    collection_name: "milady",
    address: "0x5af0d9827e0c53e4799bb226655a1de152a425a5",
}]

async function getOwnersCollection(collectionAddress: string, collectionName: string, start: number, end: number, acc: any) {
    try {
        const TestERC721 = await ethers.getContractFactory("TestERC721");
        console.log('Getting balance for', collectionName, collectionAddress)
        const contract = new ethers.Contract(collectionAddress, TestERC721.interface, ethers.provider);
        for (var i = start; i < end; i++) {
            try {
                const owner = await contract.ownerOf(i);
                console.log(`Token ${i} owner: ${owner}`)
                if (acc[owner]) {
                    acc[owner].push(i)
                } else {
                    acc[owner] = [i]
                }
            } catch (e) {
                console.log(`Error getting owner for ${i}`, e)
            }


        }

    } catch (e) {
        console.log('Error getting owners for', collectionName, e)
    }
}

async function main() {
    const currentNetwork = await ethers.provider.getNetwork();
    console.log(`Current network: ${currentNetwork.name}`)

    for (var i = 0; i < layer1Collections.length; i++) {
        const collection = layer1Collections[i];
        const collectionName = collection.collection_name;
        const collectionAddress = collection.address;
        console.log(`Getting owners for ${collectionName}...`)

        let acc = {}
        // Read the owners if previous file exist
        if (fs.existsSync(`./${collectionName}.json`)) {
            const data = fs.readFileSync(`./${collectionName}.json`, 'utf8');
            acc = JSON.parse(data);

        }

        // We do by batches of 100
        const batches = 100;
        for (var j = 0; j < batches; j++) {
            console.log(`Getting owners for ${collectionName} batch ${j}...`)
            const start = j * 100;
            const end = start + 100;
            await getOwnersCollection(collectionAddress, collectionName, start, end, acc)

            // Write the file with the acc 
            const data = JSON.stringify(acc, null, 2);
            fs.writeFileSync(`./${collectionName}.json`, data);
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