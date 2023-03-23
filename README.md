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

Proceed to deploy the manager and the master

```shell
npx hardhat run scripts/04-deploy-manager.ts --network arbitrumgoerli
npx hardhat run scripts/05-deploy-master-castles.ts --network arbitrumgoerli
```

## Hardhat verify

```shell
npx hardhat verify --network arbitrumgoerli DEPLOYED_CONTRACT_ADDRESS "Hello, Hardhat!"
```

## TODO List

- [ ] Create a bound (bound manager) ERC155Upgradeable contract for the secret keys. Give one secret key to everyone who stakes for 100 days a castle. 
- [ ] Make the smolbrawlers contract a ERC721Upgradeable , bound, and updatable metadata (see AoV). Create the questing contract and the purchasing contract to buy different armors / weapons for smolbrawlers.
- [ ] Make a contract to upgrade the generals with some special item obtained by staking a general for some time. 
- [ ] Make the inventory expandable with RUBY purchases
- [ ] Allow the use of treasure / smol treasures to purchase items, by burning them