import { MerkleTree } from "merkletreejs";
import keccak256 from "keccak256";
import { BigNumber, ethers } from "ethers";

export function generateMerkle(balances: {
    [address: string]: BigNumber;
}): MerkleTree {
    const leafNodes = Object.keys(balances).map((address, index) => {
        return ethers.utils.solidityKeccak256(['uint256', 'address', 'uint256'], [index, address, balances[address].toString()]);
    });



    const merkletree = new MerkleTree(leafNodes, keccak256, { sortPairs: true });


    return merkletree;
}
