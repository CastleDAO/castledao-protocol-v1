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
        masterCastles: '0x385f3036C00FCAEc2583D73Ef8ef244EEC38DF7E',

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
        manager: '',
        masterCastles: '',

        // Other
        magic: '0x539bde0d7dbd336b79148aa742883198bbf60342',

        // Managers
        managers_addresses: {
            // Key address, value ROLE
            '': ROLES.MANAGER,
        }
    }
}