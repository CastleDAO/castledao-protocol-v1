pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "./INFTMetadata.sol";

interface ICastleVerseItems {
    function initialize(
        string calldata uri,
        address manager,
        address metadataContractAddress,
        address magicTokenAddress,
        address rubyTokenAddress
    ) external;

    function setMetadataContract(address newMetadataContractAddress) external;

    function addItem(
        uint256 itemId,
        uint256 priceRuby,
        uint256 priceMagic,
        bool isMagicAllowed,
        bool isRestricted
    ) external;

    function modifyItem(
        uint256 itemId,
        uint256 newPriceRuby,
        uint256 newPriceMagic,
        bool newIsMagicAllowed,
        bool newIsRestricted
    ) external;

    function mintItem(uint256 itemId, uint256 amount, bytes calldata data) external;

    function purchaseItem(uint256 itemId, uint256 amount, bool useMagic, bytes calldata data) external;

    function managerMint(address account, uint256 id, uint256 amount, bytes calldata data) external;

    function managerMintBatch(address to, uint256[] calldata ids, uint256[] calldata amounts, bytes calldata data) external;

    function uri(uint256 tokenId) external view returns (string memory);

    function withdrawTokens(address token, uint256 amount) external;

    function withdrawETH(uint256 amount) external;

    function burn(address account, uint256 id, uint256 amount) external;

    function burnBatch(address account, uint256[] calldata ids, uint256[] calldata amounts) external;
}
