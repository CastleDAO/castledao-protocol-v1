pragma solidity ^0.8.4;
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

pragma solidity ^0.8.4;

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
    // Mapping to track the number of staked tokens for each user and collection
    mapping(address => mapping(address => mapping(uint256 => uint256)))
        public stakedTokens;

    // Mapping to track the number of staked tokens per collection
    mapping(address => uint256) public collectionsStakedTokensCount;

    /**
     * Function to stake ERC721 tokens
     *
     * @param _collection The address of the collection the tokens belong to
     * @param _tokenId The token id of the token to stake
     */
    function stakeERC721(address _collection, uint256 _tokenId) public {
        ERC721 tokenContract = ERC721(_collection);
        tokenContract.safeTransferFrom(msg.sender, address(this), _tokenId);

        // Update the staked tokens mapping
        stakedTokens[_collection][msg.sender][_tokenId] += 1;

        // Update the staked tokens count mapping
        collectionsStakedTokensCount[_collection] += 1;
    }

    /**
     * Function to stake ERC1155 tokens
     *
     * @param _collection The address of the collection the tokens belong to
     * @param _tokenId The token id of the token to stake
     */
    function stakeERC1155(
        address _collection,
        uint256 _tokenId,
        uint256 _amount
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
        stakedTokens[_collection][msg.sender][_tokenId] += _amount;

        // Update the staked tokens count mapping
        collectionsStakedTokensCount[_collection] += _amount;
    }

    /**
     * Function to stake fungible tokens without token id
     *
     * @param _collection The address of the collection the tokens belong to
     * @param _amount The number of tokens to stake
     */
    function stakeFungible(address _collection, uint256 _amount) public {
        // Call the transfer function of the specified transfer contract
        ERC20 tokenContract = ERC20(_collection);

        tokenContract.transferFrom(msg.sender, address(this), _amount);

        // Update the staked tokens mapping
        stakedTokens[_collection][msg.sender][0] += _amount;

        // Update the staked tokens count mapping
        collectionsStakedTokensCount[_collection] += _amount;
    }

    /**
     * Function to unstake tokens
     *
     * @param _collection The address of the collection the tokens belong to
     * @param _tokenId The token id of the token to unstake
     */
    function unstakeERC721(address _collection, uint256 _tokenId) public {
        require(
            stakedTokens[_collection][msg.sender][_tokenId] >= 1,
            "Not enough tokens staked"
        );

        ERC721 tokenContract = ERC721(_collection);
        tokenContract.safeTransferFrom(address(this), msg.sender, _tokenId);

        // Update the staked tokens mapping
        stakedTokens[_collection][msg.sender][_tokenId] -= 1;

        // Update the staked tokens count mapping
        collectionsStakedTokensCount[_collection] -= 1;
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
            stakedTokens[_collection][msg.sender][_tokenId] >= _amount,
            "Not enough tokens staked"
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
        stakedTokens[_collection][msg.sender][_tokenId] -= _amount;

        // Update the staked tokens count mapping
        collectionsStakedTokensCount[_collection] -= _amount;
    }

    /**
     * Function to unstake fungible tokens without token id
     *
     * @param _collection The address of the collection the tokens belong to
     * @param _amount The number of tokens to unstake
     */
    function unstakeFungible(address _collection, uint256 _amount) public {
        require(
            stakedTokens[_collection][msg.sender][0] >= _amount,
            "Not enough tokens staked"
        );

        // Call the transfer function of the specified transfer contract
        ERC20 tokenContract = ERC20(_collection);
        tokenContract.transferFrom(address(this), msg.sender, _amount);
        // Update the staked tokens mapping
        stakedTokens[_collection][msg.sender][0] -= _amount;

        // Update the staked tokens count mapping
        collectionsStakedTokensCount[_collection] -= _amount;
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
        return stakedTokens[_collection][_user][_tokenId];
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
}
