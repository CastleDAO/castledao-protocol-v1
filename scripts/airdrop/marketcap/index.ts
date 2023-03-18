import { BigNumber } from "ethers"
import { formatUnits, parseEther } from "ethers/lib/utils"

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
}, {
    collection_name: "talesofelleria",
    address: '0x7480224ec2b98f28cee3740c80940a2f489bf352'

}, {
    collection_name: "the lost donkeys",
    address: '0x5e84c1a06e6ad1a8ed66bc48dbe5eb06bf2fe4aa'
}, {
    collection_name: "imbued souls",
    address: '0xDc758b92c7311280aeeB48096a3bf4D1C1f936d4'
}, {
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
  }  ]

function getCommunityAirdropAmount() {
    const airdropPerCollectionItem = parseEther("50")
    return allowedExternalCollections.reduce((prev, next) => {
        return prev.add(airdropPerCollectionItem.mul(10000))
    }, BigNumber.from(0))
}

function getCastlesAirdrop() {
    return parseEther('200').mul(3000).add(parseEther('100').mul(5000))
}

const communityAirdrop = getCommunityAirdropAmount();
const castlesAirdrop = getCastlesAirdrop();
const treasury = communityAirdrop.add(castlesAirdrop);

const team = treasury.div(4);


const total = formatUnits(treasury.mul(2).add(team))

console.log('total initial Mcap: ', total, 'RUBY')
console.log('Team allocation: ', formatUnits(team), 'RUBY')
console.log('Treasury allocation: ', formatUnits(treasury), 'RUBY')
console.log('Community airdrop: ', formatUnits(communityAirdrop), 'RUBY')
console.log('Castles airdrop: ', formatUnits(castlesAirdrop), 'RUBY')