pragma solidity ^0.8.4;

import "./interfaces/ITransfer.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

contract ERC1155Wrapper is ITransfer {
    ERC1155 public tokenContract;

    constructor(address _contractAddress) {
        tokenContract = ERC1155(_contractAddress);
    }

    function transfer(address _to, uint256 _tokenId) external {
        tokenContract.safeTransferFrom(address(this), _to, _tokenId, 1, "");
    }
}
