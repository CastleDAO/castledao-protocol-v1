pragma solidity ^0.8.4;

import "./interfaces/ITransfer.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract ERC721Wrapper is ITransfer {
    ERC721 public tokenContract;

    constructor(address _contractAddress) {
        tokenContract = ERC721(_contractAddress);
    }

    function transfer(address _to, uint256 _tokenId) public {
        tokenContract.safeTransferFrom(address(this), _to, _tokenId);
    }
}
