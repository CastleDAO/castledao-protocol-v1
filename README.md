# Sample Hardhat Project

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, and a script that deploys that contract.

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat run scripts/deploy.ts
```

## Deploy on testnet:

Optional: Deploy mock token contracts

```shell
npx hardhat run scripts/demoTokens/deploy-mock-magic.ts --network arbitrumgoerli
npx hardhat run scripts/demoTokens/mint-magic-tokens.ts --network arbitrumgoerli
```

Deploy the NFTS

```shell
npx hardhat run scripts/00-deploy-castles.ts --network arbitrumgoerli
npx hardhat run scripts/01-deploy-defiheroes.ts --network arbitrumgoerli
npx hardhat run scripts/02-deploy-generals.ts --network arbitrumgoerli
npx hardhat run scripts/03-deploy-ballot.ts --network arbitrumgoerli

```

Then set the appropiate values under the "constants" file. (scripts/constants.ts).

### Manager - In charge of role management for the protocol

```shell
npx hardhat run scripts/04-deploy-manager.ts --network arbitrumgoerli
```

### Master contract - Allows to mint castles with other tokens

Proceed to deploy the manager and the master

```shell
npx hardhat run scripts/05-deploy-master-castles.ts --network arbitrumgoerli
```

### Generals amulet - Stakes ballots and allows generals to have a special amulet

```shell
npx hardhat run scripts/06-deploy-generals-amulet.ts --network arbitrumgoerli
```

## Hardhat verify

```shell
npx hardhat verify --network arbitrumgoerli DEPLOYED_CONTRACT_ADDRESS "Hello, Hardhat!"
```

## Deploy competitions

```shell
npx hardhat run scripts/competitions/02-deploy-competitions-v2.ts --network arbitrumgoerli
npx hardhat run scripts/competitions/03-create-competitions-v2.ts --network arbitrumgoerli
```

## Deploy simple staking

```shell
npx hardhat run scripts/staking/00-deploy-simple-staker.ts --network arbitrumgoerli
```

## Distribute rewards

```shell
npx hardhat run scripts/migrations/set-winners-competition.ts --network arbitrummainnet
npx hardhat run scripts/migrations/nft-rewards.ts --network arbitrummainnet

```

## Items

- Item metadata: holds the metadata for the items
- Item: ERC1155 for items
- Blacksmith: Contract that allows to call the mint function on the ERC1155 items contract to mint new items, it holds the price definitions.
  It has the roles of minter
- Crafting: Contract that allows to define recipes and to craft items. It also calls the mint function on the ERC1155 of items.

## Bank

- Bank receives the tokens from Blacksmith
- Bank receives the tokens from mints
- Bank receives the tokens from crafting

What else a bank can do?

- Maybe: If you deposit ruby you get some %APY
- Maybe: you can get a loan

## Smol Brawlers

## TODO List

- [ ] Create a bound (bound manager) ERC155Upgradeable contract for the secret keys. Give one secret key to everyone who stakes for 100 days a castle.
- [ ] Make the smolbrawlers contract a ERC721Upgradeable , bound, and updatable metadata (see AoV). Create the questing contract and the purchasing contract to buy different armors / weapons for smolbrawlers.
- [ ] Make a contract to upgrade the generals with some special item obtained by staking a general for some time.
- [ ] Make the inventory expandable with RUBY purchases
- [ ] Allow the use of treasure / smol treasures to purchase items, by burning them

- Items: https://tokenbound.org/ use ERC 6551 for creating backpacks

## New crafting:

- Recipes:
  - Recipes can be a combination of any kind of tokens ERC721, erc1155, erc20
  - Recipes can output any kind of token ERC721, erc1155, erc20
- Crafting:
  - Crafting contract takes care of the recipes and the crafting process
  - Crafting contract has a function to craft a recipe, which takes as input the recipe id, and the tokens to be used for crafting
  - Crafting has a success rate that we dont know yet how is determined
- Items:
  - Items are erc1155 tokens
  - Items are burnable
- Smolbrawlers:
  - Smolbrawlers are erc6551 tokens
  - Smolbrawlers can hold other items (erc1155)
  - Smolbrawlers metadata is another contract that can be updated
  - Smolbrawlers have to store the activity and progress in quests, that can reflect on the metadata of the smolbrawler updating

## New quests:

- In the game the player will receive points that will be used to craft items, and to upgrade the smolbrawlers. Those points can be in the shape of Ruby tokens, or any other token that we want to use.
