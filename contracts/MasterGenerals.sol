// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.17;

import "./ManagerModifier.sol";
import "./nfts/interfaces/ICryptoGenerals.sol";
import "./nfts/interfaces/ICastlesGenOne.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";


contract MasterGenerals is ManagerModifier, ReentrancyGuard, IERC721Receiver {
    ICryptoGenerals public generalsContract;
    using SafeMath for uint256;


    // Prices store the address of the token and the price
    mapping(address => uint256) public generalPrices;
    uint256 public generalPriceETH;
    

    constructor(address _manager, address _generalsContract) ManagerModifier(_manager) {
        generalsContract = ICryptoGenerals(_generalsContract);
    }

    // Price definition functions
    // Set general prices
    function setGeneralPrices(address _token, uint256 _price) external onlyManager {
        generalPrices[_token] = _price;
    }

    // Set price in eth
    function setGeneralPriceETH(uint256 _price) external onlyManager {
        generalPriceETH = _price;
    }

    // Transfer ownership
    function transferContractOwnership(address _newOwner) external onlyAdmin {
        generalsContract.transferOwnership(_newOwner);
    }

    // General contract functions
    function mintGeneralsToken(uint256 amount, address _token) external  nonReentrant {
        // Check that the token is defined in the prices
        require(generalPrices[_token] != 0, "Invalid token prices");

        // Check that the sender has enough balance of the token
        require(IERC20(_token).balanceOf(msg.sender) >= generalPrices[_token].mul(amount), "Not enough balance");

        // Transfer the token to this contract
        IERC20(_token).transferFrom(msg.sender, address(this), generalPrices[_token].mul(amount));

        _mintGenerals(msg.sender, amount);
    }

    // Mint generals with ETH
    function mintGeneralsETH(uint256 amount) external payable  nonReentrant {
        require(msg.value >= generalPriceETH.mul(amount), "Not enough balance");

        _mintGenerals(msg.sender, amount);
    }

    // Privileged minting fnctions
    function privilegedMintGenerals(address _to, uint256 amount) external onlyMinter nonReentrant {
        _mintGenerals(_to, amount);
    }

    function _mintGenerals(address _to, uint256 amount) internal {
        for (uint256 i = 0; i < amount; i++) {
            generalsContract.ownerClaim();
            generalsContract.safeTransferFrom(address(this), _to, generalsContract.totalSupply());
        }
    }

    // Function to transfer a general to a new owner from this contract
    function transferGeneral(address _to, uint256 _id) external onlyManager {
        generalsContract.safeTransferFrom(address(this), _to, _id);
    }

    // Change base URI
    function setBaseURIGenerals(string calldata _baseURI) external onlyAdmin {
        generalsContract.setBaseURI(_baseURI);
    }

    // Withdraw tokens functions
    // Added to be able to receive ETH
    receive() external payable {
        // Do nothing or add logic as needed.
    }
    function ownerWithdraw() external onlyManager {
        generalsContract.ownerWithdraw();
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