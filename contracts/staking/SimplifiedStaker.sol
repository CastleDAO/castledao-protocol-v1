// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

contract SimplifiedStaker is ERC1155Holder, ERC721Holder {
    using EnumerableSet for EnumerableSet.UintSet;

    // The address of the allowed NFT collection
    address public allowedCollection;

    // Mapping to hold the staked tokens for a user, per collection
    mapping(address => EnumerableSet.UintSet) internal userToTokensStaked;

    constructor(address _allowedCollection) {
        allowedCollection = _allowedCollection;
    }

    function stake(uint256 _tokenId) external {
        _stakeERC721ForUser(allowedCollection, _tokenId, msg.sender);
    }

    function stakeMany(uint256[] calldata _tokenIds) external {
        for (uint256 i = 0; i < _tokenIds.length; i++) {
            _stakeERC721ForUser(allowedCollection, _tokenIds[i], msg.sender);
        }
    }

    function unstake(uint256 _tokenId) external {
        _unstakeERC721(allowedCollection, _tokenId);
    }

    function unstakeMany(uint256[] calldata _tokenIds) external {
        for (uint256 i = 0; i < _tokenIds.length; i++) {
            _unstakeERC721(allowedCollection, _tokenIds[i]);
        }
    }

    function _stakeERC721ForUser(
        address _collection,
        uint256 _tokenId,
        address _user
    ) internal {
        ERC721 tokenContract = ERC721(_collection);
        tokenContract.safeTransferFrom(msg.sender, address(this), _tokenId);

        // Update the staked tokens mapping
        userToTokensStaked[_user].add(_tokenId);

        emit Staked(_collection, _user, _tokenId, 1);
    }

    function _unstakeERC721(address _collection, uint256 _tokenId) internal {
        require(
            userToTokensStaked[msg.sender].contains(_tokenId),
            "Not enough tokens staked"
        );

        ERC721 tokenContract = ERC721(_collection);
        tokenContract.safeTransferFrom(address(this), msg.sender, _tokenId);

        // Update the staked tokens mapping
        userToTokensStaked[msg.sender].remove(_tokenId);

        emit Unstaked(_collection, msg.sender, _tokenId, 1);
    }

    function getAllStakedTokenIds(
        address _user
    ) public view returns (uint256[] memory) {
        uint256 length = userToTokensStaked[_user].length();
        uint256[] memory tokenIds = new uint256[](length);
        for (uint256 i = 0; i < length; i++) {
            tokenIds[i] = userToTokensStaked[_user].at(i);
        }
        return tokenIds;
    }

    event Unstaked(
        address indexed _collection,
        address indexed _owner,
        uint256 _tokenId,
        uint256 _amount
    );

    event Staked(
        address indexed _collection,
        address indexed _owner,
        uint256 _tokenId,
        uint256 _amount
    );
}
