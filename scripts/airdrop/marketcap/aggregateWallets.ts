import fs from 'fs';

const castledaoCollections = [{
    collection_name: "castles",
    address: "0x71f5c328241fc3e03a8c79edcd510037802d369c",
}
    // }, {
    //     collection_name: "defiheroes",
    //     address: "0x8ec75bc963181489d7fc1d892f687b8b0987d9ec",
    // }, {
    //     collection_name: "ballot",
    //     address: "0x9fe6688e7d4bfbc69fe2727f578b1f1b8c75b930"
    // }, {
    //     collection_name: "generals",
    //     address: "0x1aaec0fa487a979a3f6b46dccf0ac2648167a61e"
    // }]
]

function main() {
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
    fs.writeFileSync(`./wallets-castles.json`, data);
}

main()