//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

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

contract Staker is ERC1155Holder, ERC721Holder {
    struct LockInfo {
        uint256 lockStart;
        uint256 lockEnd;
        uint256 lockDaysDuration;
    }

    // Mapping to track the number of staked tokens for each user and collection
    mapping(address => mapping(address => mapping(uint256 => uint256)))
        public stakedTokens;

    // Mapping to track the number of staked tokens per collection
    mapping(address => uint256) public collectionsStakedTokensCount;

    // Mapping to track the lock time for staked tokens
    mapping(address => mapping(address => mapping(uint256 => LockInfo)))
        public lockTime;

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

    function _stakeERC1155ForUser(
        address _collection,
        uint256 _tokenId,
        uint256 _amount,
        uint256 _lockDays,
        address _user
    ) public {
        ERC1155 tokenContract = ERC1155(_collection);
        tokenContract.safeTransferFrom(
            msg.sender,
            address(this),
            _tokenId,
            _amount,
            ""
        );

        // Update the staked tokens mapping
        stakedTokens[_user][_collection][_tokenId] += _amount;

        // Update the lock time mapping
        lockTime[_user][_collection][_tokenId] = LockInfo(
            block.timestamp,
            block.timestamp + (_lockDays * 1 days),
            _lockDays
        );

        // Update the staked tokens count mapping
        collectionsStakedTokensCount[_collection] += _amount;

        emit Staked(
            _collection,
            _user,
            _tokenId,
            _amount,
            lockTime[_user][_collection][_tokenId].lockDaysDuration
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

    function _stakeFungibleForUser(
        address _collection,
        uint256 _amount,
        uint256 _lockDays,
        address _user
    ) public {
        // Call the transfer function of the specified transfer contract
        ERC20 tokenContract = ERC20(_collection);

        tokenContract.transferFrom(msg.sender, address(this), _amount);

        // Update the staked tokens mapping
        stakedTokens[_user][_collection][0] += _amount;

        // Update the lock time mapping
        lockTime[_user][_collection][0]  = LockInfo(
            block.timestamp,
            block.timestamp + (_lockDays * 1 days),
            _lockDays
        );
        // Update the staked tokens count mapping
        collectionsStakedTokensCount[_collection] += _amount;

        emit Staked(
            _collection,
            _user,
            0,
            _amount,
            lockTime[_user][_collection][0].lockDaysDuration
        );
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

    function _stakeERC721ForUser(
        address _collection,
        uint256 _tokenId,
        uint256 _lockDays,
        address _user
    ) public {
        ERC721 tokenContract = ERC721(_collection);
        tokenContract.safeTransferFrom(msg.sender, address(this), _tokenId);

        // Update the staked tokens mapping
        stakedTokens[_user][_collection][_tokenId] = 1;

        // Update the lock time mapping
        lockTime[_user][_collection][_tokenId] =  LockInfo(
            block.timestamp,
            block.timestamp + (_lockDays * 1 days),
            _lockDays
        );

        // Update the staked tokens count mapping
        collectionsStakedTokensCount[_collection] += 1;

        emit Staked(
            _collection,
            _user,
            _tokenId,
            1,
            lockTime[_user][_collection][_tokenId].lockDaysDuration
        );
    }

    /**
     * Function to unstake tokens
     *
     * @param _collection The address of the collection the tokens belong to
     * @param _tokenId The token id of the token to unstake
     */
    function unstakeERC721(address _collection, uint256 _tokenId) public {
        require(
            stakedTokens[msg.sender][_collection][_tokenId] == 1,
            "Not enough tokens staked"
        );

        require(
            block.timestamp >= lockTime[msg.sender][_collection][_tokenId].lockEnd,
            "Lock time has not passed yet"
        );

        ERC721 tokenContract = ERC721(_collection);
        tokenContract.safeTransferFrom(address(this), msg.sender, _tokenId);

        // Update the staked tokens mapping
        stakedTokens[msg.sender][_collection][_tokenId] = 0;

        // Update the staked tokens count mapping
        collectionsStakedTokensCount[_collection] -= 1;

        emit Unstaked(
            _collection,
            msg.sender,
            _tokenId,
            1,
            lockTime[msg.sender][_collection][_tokenId].lockDaysDuration
        );
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
        require(
            stakedTokens[msg.sender][_collection][_tokenId] >= _amount,
            "Not enough tokens staked"
        );

        require(
            block.timestamp >= lockTime[msg.sender][_collection][_tokenId].lockEnd,
            "Lock time has not passed yet"
        );

        ERC1155 tokenContract = ERC1155(_collection);
        tokenContract.safeTransferFrom(
            address(this),
            msg.sender,
            _tokenId,
            _amount,
            ""
        );

        // Update the staked tokens mapping
        stakedTokens[msg.sender][_collection][_tokenId] -= _amount;

        // Update the staked tokens count mapping
        collectionsStakedTokensCount[_collection] -= _amount;

        emit Unstaked(
            _collection,
            msg.sender,
            _tokenId,
            _amount,
            lockTime[_collection][msg.sender][_tokenId].lockDaysDuration
        );
    }

    /**
     * Function to unstake fungible tokens without token id
     *
     * @param _collection The address of the collection the tokens belong to
     * @param _amount The number of tokens to unstake
     */
    function unstakeFungible(address _collection, uint256 _amount) public {
        require(
            stakedTokens[msg.sender][_collection][0] >= _amount,
            "Not enough tokens staked"
        );

        require(
            block.timestamp >= lockTime[msg.sender][_collection][0].lockEnd,
            "Lock time has not passed yet"
        );

        // Call the transfer function of the specified transfer contract
        ERC20 tokenContract = ERC20(_collection);
        tokenContract.transferFrom(address(this), msg.sender, _amount);
        // Update the staked tokens mapping
        stakedTokens[msg.sender][_collection][0] -= _amount;

        // Update the staked tokens count mapping
        collectionsStakedTokensCount[_collection] -= _amount;

        emit Unstaked(
            _collection,
            msg.sender,
            0,
            _amount,
            lockTime[msg.sender][_collection][0].lockDaysDuration
        );
    }

    /**
     * Function to check the number of staked tokens for a user and collection
     *
     * @param _collection The address of the collection to check
     * @param _user The address of the user to check
     * @param _tokenId The token id to check
     *
     * @return The number of staked tokens for the user and collection
     */
    function checkStakedTokens(
        address _collection,
        address _user,
        uint256 _tokenId
    ) public view returns (uint256) {
        return stakedTokens[_user][_collection][_tokenId];
    }

    /**
     * Function to check the lock time for a user and collection
     *
     * @param _collection The address of the collection to check
     * @param _user The address of the user to check
     * @param _tokenId The token id to check
     *
     * @return The lock time for the user and collection
     */
    function checkLockTime(
        address _collection,
        address _user,
        uint256 _tokenId
    ) public view returns (LockInfo memory) {
        return lockTime[_user][_collection][_tokenId];
    }

    /**
     * Function to check the total number of staked tokens for a collection
     *
     * @param _collection The address of the collection to check the total number of staked tokens
     * @return The total number of staked tokens for the collection
     */
    function getCollectionStakedTokensCount(address _collection)
        public
        view
        returns (uint256)
    {
        return collectionsStakedTokensCount[_collection];
    }

    event Unstaked(
        address indexed _collection,
        address indexed _owner,
        uint256 _tokenId,
        uint256 _amount,
        uint256 _lockDays
    );

    event Staked(
        address indexed _collection,
        address indexed _owner,
        uint256 _tokenId,
        uint256 _amount,
        uint256 _lockDays
    );
}
