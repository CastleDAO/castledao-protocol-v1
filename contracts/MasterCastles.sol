// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.17;

import "./ManagerModifier.sol";
import "./nfts/interfaces/ICastlesGenOne.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";


contract MasterCastles is ManagerModifier, ReentrancyGuard, IERC721Receiver {
    ICastleNFT public castleContract;
    using SafeMath for uint256;


    // Prices store the address of the token and the price
    mapping(address => uint256) public castlePrices;
    uint256 public castlePriceETH;
    

    constructor(address _manager, address _castlesContract) ManagerModifier(_manager) {
        castleContract = ICastleNFT(_castlesContract);
    }

    // Price definition functions
    // Set castle prices
    function setCastlePrices(address _token, uint256 _price) external onlyManager {
        castlePrices[_token] = _price;
    }

    // Set price in eth
    function setCastlePriceETH(uint256 _price) external onlyManager {
        castlePriceETH = _price;
    }

    // Transfer ownership
    function transferContractOwnership(address _newOwner) external onlyAdmin {
        castleContract.transferOwnership(_newOwner);
    }

    // Castle contract functions
    function mintCastlesToken(uint256[] memory _ids, address _token) external  nonReentrant {
        // Check that the token is defined in the prices
        require(castlePrices[_token] != 0, "Invalid token prices");

        // Check that the sender has enough balance of the token
        require(IERC20(_token).balanceOf(msg.sender) >= castlePrices[_token].mul(_ids.length), "Not enough balance");

        // Transfer the token to this contract
        IERC20(_token).transferFrom(msg.sender, address(this), castlePrices[_token].mul(_ids.length));

        _mintCastles(msg.sender, _ids);
    }

    // Mint castles with ETH
    function mintCastlesETH(uint256[] memory _ids) external payable nonReentrant {
        require(msg.value >= castlePriceETH.mul(_ids.length), "Not enough balance");

        _mintCastles(msg.sender, _ids);
    }

    // Privileged minting functions
    function privilegedMintCastles(address _to, uint256[] memory _ids) external onlyMinter nonReentrant {
        _mintCastles(_to, _ids);
    }

    // Internal minting functions
    function _mintCastles(address _to, uint256[] memory _ids) internal {
        for (uint256 i = 0; i < _ids.length; i++) {
            castleContract.ownerClaim(_ids[i]);
            castleContract.safeTransferFrom(address(this), _to, _ids[i]);
        }
    }

    // Function to transfer a castle to a new owner from this contract
    function transferCastle(address _to, uint256 _id) external onlyManager {
        castleContract.safeTransferFrom(address(this), _to, _id);
    }

    // Change base URI

    function setBaseURICastles(string calldata _baseURI) external onlyAdmin {
        castleContract.setBaseURI(_baseURI);
    }
    

    // Withdraw tokens functions
    // Added to be able to receive ETH
    receive() external payable {
        // Do nothing or add logic as needed.
    }

    function ownerWithdraw() external onlyManager {
        castleContract.ownerWithdraw();

        payable(msg.sender).transfer(address(this).balance);
    }

    function withdrawTokens(
        address token,
        uint256 amount
    )
        external
        onlyManager
    {
        IERC20(token).transfer(msg.sender, amount);
    }

    // IERC721Receiver implementation
    function onERC721Received(address, address, uint256, bytes calldata) external pure override returns (bytes4) {
        return this.onERC721Received.selector;
    }
}