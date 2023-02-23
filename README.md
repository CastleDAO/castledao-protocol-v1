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

## Hardhat verify

```shell
npx hardhat verify --network ropsten DEPLOYED_CONTRACT_ADDRESS "Hello, Hardhat!"
```

## TODO List

- [ ] Create a bound (bound manager) ERC155Upgradeable contract for the secret keys. Give one secret key to everyone who stakes for 100 days a castle. 
- [ ] Make the smolbrawlers contract a ERC721Upgradeable , bound, and updatable metadata (see AoV). Create the questing contract and the purchasing contract to buy different armors / weapons for smolbrawlers.
- [ ] Make a contract to upgrade the generals with some special item obtained by staking a general for some time. 
- [ ] Make the inventory expandable with RUBY purchases
- [ ] Allow the use of treasure / smol treasures to purchase items, by burning them