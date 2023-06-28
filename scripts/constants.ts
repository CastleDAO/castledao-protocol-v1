export const ROLES = {
    MANAGER: '0',
    MINTER: '1',
    TOKENMINTER: '2',
    BINDER: '3',
    ORACLE: '4',
}

export const deployed_contracts = {
    arbitrumgoerli: {
        castles: '0x887bD304b57d1daF5BC6075Df728bBE27852C713',
        defiheroes: '0x5B706a68077690E5648Df00939543b18B5412149',
        generals: '0x284d29b06CDF38043cca6FD7b229739e377523E3',
        ballot: '0xA86F02D8854e6c1dB41eB3308138D0473250CAF5',
        manager: '0xb41a1D1fCff8b00d1342881561BFa3Edb495f748',
        masterCastles: '0x474D5fBafda609670fBe96D92dcd90Ec5F02b9B4',
        generalsAmulet: '0x5CFCA09928afC89be9c118E35b81c78E9443D4b8',

        // Other
        magic: '0x2D110bF8fd17b514CbdCa025a97AAeb5E463AF4E',

        // Managers
        managers_addresses: {
            // Key address, value ROLE
            '': ROLES.MANAGER,
        }
    },
    mainnet: {
        castles: '0x71f5c328241fc3e03a8c79edcd510037802d369c',
        generals: '0x1aaec0fa487a979a3f6b46dccf0ac2648167a61e',
        ballot: '0x9fe6688e7d4bfbc69fe2727f578b1f1b8c75b930',
        defiheroes: '0x8ec75bc963181489d7fc1d892f687b8b0987d9ec',
        manager: '0x8937fF68da18e97B58109b598a6f0EbbF82DA3E2',
        masterCastles: '0xfc7590e2d9226327FF9D517F2D3653C05b7f625E',
        generalsAmulet: '0x1DF62622F2FA840eD0708a52B67b89f48bAD806b',
        competitions: '0x2a8847a86840E465040D6c77d2e63548786ff633',

        // Other
        magic: '0x539bde0d7dbd336b79148aa742883198bbf60342',

        // Managers
        managers_addresses: {
            // Key address, value ROLE
            '': ROLES.MANAGER,
        }
    }
}