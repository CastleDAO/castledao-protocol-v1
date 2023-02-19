//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "./BaseStaker.sol";

/**
 * Staking contract
 *
 * This contract allows users to stake their ERC721 and ERC1155 tokens by specifying the address of the
 * Transfer contract for each collection and the number of tokens to stake. The staked tokens are tracked
 * for each user and collection.
 *
 * The contract provides methods for staking, unstaking, and checking the number of staked tokens for each
 * collection and user.
 *
 * The transfer contract addresses are specified as parameters in the stake and unstake methods and are used
 * to call the transfer functions for the corresponding collections.
 *
 * Note: The transfer contract address must be an address that implements the Transfer interface.
 */

contract Staker is BaseStaker {
    /**
     * Function to stake ERC1155 tokens
     *
     * @param _collection The address of the collection the tokens belong to
     * @param _tokenId The token id of the token to stake
     * @param _amount The number of tokens to stake
     * @param _lockDays The number of days the tokens should be locked
     */
    function stakeERC1155(
        address _collection,
        uint256 _tokenId,
        uint256 _amount,
        uint256 _lockDays
    ) public {
        _stakeERC1155ForUser(
            _collection,
            _tokenId,
            _amount,
            _lockDays,
            msg.sender
        );
    }

    /**
     * Function to stake fungible tokens without token id
     *
     * @param _collection The address of the collection the tokens belong to
     * @param _amount The number of tokens to stake
     * @param _lockDays The number of days the tokens should be locked
     */
    function stakeFungible(
        address _collection,
        uint256 _amount,
        uint256 _lockDays
    ) public {
        _stakeFungibleForUser(_collection, _amount, _lockDays, msg.sender);
    }

    /**
     * Function to stake ERC721 tokens
     *
     * @param _collection The address of the collection the tokens belong to
     * @param _tokenId The token id of the token to stake
     * @param _lockDays The number of days the tokens should be locked
     */
    function stakeERC721(
        address _collection,
        uint256 _tokenId,
        uint256 _lockDays
    ) public {
        _stakeERC721ForUser(_collection, _tokenId, _lockDays, msg.sender);
    }

    /**
     * Function to unstake tokens
     *
     * @param _collection The address of the collection the tokens belong to
     * @param _tokenId The token id of the token to unstake
     */
    function unstakeERC721(address _collection, uint256 _tokenId) public {
        _unstakeERC721(_collection, _tokenId);
    }

    /**
     * Function to unstake tokens
     *
     * @param _collection The address of the collection the tokens belong to
     * @param _tokenId The token id of the token to unstake
     * @param _amount The number of tokens to unstake
     */
    function unstakeERC1155(
        address _collection,
        uint256 _tokenId,
        uint256 _amount
    ) public {
        _unstakeERC1155(_collection, _tokenId, _amount);
    }

    /**
     * Function to unstake fungible tokens without token id
     *
     * @param _collection The address of the collection the tokens belong to
     * @param _amount The number of tokens to unstake
     */
    function unstakeFungible(address _collection, uint256 _amount) public {
        _unstakeFungible(_collection, _amount);
    }
}
