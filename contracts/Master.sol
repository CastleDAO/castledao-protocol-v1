// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.17;

import "./ManagerModifier.sol";
import "./nfts/interfaces/ICryptoGenerals.sol";
import "./nfts/interfaces/ICastlesGenOne.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";


contract Master is ManagerModifier {
    ICryptoGenerals public generalsContract;
    ICastleNFT public castleContract;

    struct Prices {
        uint256 ETH;
        uint256 RUBY;
        uint256 ARB;
        uint256 MAGIC;
    }

    Prices public castlePrices;
    Prices public generalPrices;


    constructor(address _manager, address _generalsContract, address _castlesContract) ManagerModifier(_manager) {
        generalsContract = ICryptoGenerals(_generalsContract);
        castleContract = ICastleNFT(_castlesContract);
    }

    // Price definition functions
    // Set castle prices
    function setCastlePrices(uint256 _eth, uint256 _ruby, uint256 _arb, uint256 _magic) external onlyManager {
        castlePrices = Prices(_eth, _ruby, _arb, _magic);
    }

    // Set general prices
    function setGeneralPrices(uint256 _eth, uint256 _ruby, uint256 _arb, uint256 _magic) external onlyManager {
        generalPrices = Prices(_eth, _ruby, _arb, _magic);
    }

    // Transfer ownership
    function transferContractOwnership(address _newOwner) external onlyAdmin {
        generalsContract.transferOwnership(_newOwner);
        castleContract.transferOwnership(_newOwner);
    }

    // General contract functions

    function mintGenerals(address _to, string[] memory _names, uint256 _tokenId) external onlyMinter {
        require(castlePrices.ETH != 0, "Invalid token prices");
        for (uint256 i = 0; i < _names.length; i++) {
            generalsContract.ownerClaim();
            generalsContract.safeTransferFrom(address(this), _to, generalsContract.totalSupply());
        }
    }

    
    // Castle contract functions

    function mintCastles(address _to, uint256[] memory _ids, uint256 _tokenId) external onlyMinter {
        require(castlePrices.ETH != 0, "Invalid token prices");
        for (uint256 i = 0; i < _ids.length; i++) {
            castleContract.ownerClaim(_ids[0]);
            castleContract.safeTransferFrom(address(this), _to, _ids[0]);
        }
    }

    // Function to transfer a castle to a new owner from this contract
    function transferCastle(address _to, uint256 _id) external onlyManager {
        castleContract.safeTransferFrom(address(this), _to, _id);
    }

    // Function to transfer a general to a new owner from this contract
    function transferGeneral(address _to, uint256 _id) external onlyManager {
        generalsContract.safeTransferFrom(address(this), _to, _id);
    }

    // Change base URI
    function setBaseURIGenerals(string calldata _baseURI) external onlyAdmin {
        generalsContract.setBaseURI(_baseURI);
    }

    function setBaseURICastles(string calldata _baseURI) external onlyAdmin {
        castleContract.setBaseURI(_baseURI);
    }
    

    // Withdraw tokens functions
    function ownerWithdraw() external onlyManager {
        generalsContract.ownerWithdraw();
        castleContract.ownerWithdraw();
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
}