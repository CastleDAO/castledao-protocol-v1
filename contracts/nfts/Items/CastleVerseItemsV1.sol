pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
import "../../ManagerModifier.sol";

contract MyItems is ERC1155Upgradeable, ManagerModifier {
    mapping(uint256 => string) private _itemTypes;

    constructor() ERC1155Upgradeable("https://example.com/items/{id}.json") {
        
    }

    function addItemType(uint256 typeId, string memory typeUri) public onlyAdmin {
        _itemTypes[typeId] = typeUri;
    }

    function itemType(uint256 typeId) public view returns (string memory) {
        return _itemTypes[typeId];
    }

    function mint(address account, uint256 id, uint256 amount, bytes memory data) public onlyOwner {
        _mint(account, id, amount, data);
    }

    function mintBatch(address to, uint256[] memory ids, uint256[] memory amounts, bytes memory data) public onlyOwner {
        _mintBatch(to, ids, amounts, data);
    }

    function burn(address account, uint256 id, uint256 amount) public {
        require(msg.sender == account || isApprovedForAll(account, msg.sender), "ERC1155: caller is not owner nor approved");
        _burn(account, id, amount);
    }

    function burnBatch(address account, uint256[] memory ids, uint256[] memory amounts) public {
        require(msg.sender == account || isApprovedForAll(account, msg.sender), "ERC1155: caller is not owner nor approved");
        _burnBatch(account, ids, amounts);
    }
}