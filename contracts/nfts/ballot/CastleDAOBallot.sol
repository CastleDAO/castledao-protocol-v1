// SPDX-License-Identifier: GPL-3.0

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

import "./Base64.sol";

pragma solidity ^0.8.0;

contract CastleDAOBallot is ERC721Enumerable, Ownable, ReentrancyGuard {
    using Strings for uint256;
    event Mint(address indexed owner, uint256 indexed tokenId, uint256 price);
    using Counters for Counters.Counter;
    Counters.Counter _tokenIds;

    // Colors and items
    string[] public palette = [
           "#000000",
    "#291A72",
    "#240553",
    "#2F4091",
    "#1F0C2C",
    "#142029",
    "#FFEF57",
    "#92E5E8",
    "#B76D3B",
    "#DC5D86",
    "#F9DAA2",
    "#006045",
    "#004538",
    "#F0F4F7",
    "#A20000",
    "#C4398B",
    "#F48D8A",
    "#822F22",
    "#7495A8",
    "#58788D",
    "#651415",
    "#810000",
    "#F7AC38",
    "#7A0475",
    "#28465A",
    "#3D5C74",
    "#50B04A",
    "#007B46",
    "#CDDDE5",
    "#47094D",
    "#F48925"
    ];

    string[] public backgroundNames = ["blue", "matrix", "light", "purple", "red", "yellow"];

    bytes[] public backgrounds = [
        bytes(
            hex"0000100003000a060300020001060a1901060200020001060a1901060200020001060a1901060200020001060a1901060200020001060a1a01060200020001060a1a01060200020001060a1a01060200020001060a1a01060200020001060a1a01060200020001060a1901060200020001060a1901060200020001060a190106020003000a060300"
        ),
        bytes(
            hex"0000100003000a06030002000106011b011c011b011c011b011c011b011c011b011c0106020002000106011c011b011c011b011c011b011c011b011c011b0106020002000106011b011c011b011c011b011c011b011c011b011c0106020002000106011c011b011c011b011c011b011c011b011c011b0106020002000106011b011c011b011c011b011c011b011c011b010d0106020002000106011c011b011c011b011c011b011c011b010d011c0106020002000106011b011c011b011c011b011c011b010d011c010d0106020002000106011c011b011c011b011c011b010d011c010d011c0106020002000106011b011c011b011c011b010d011c010d011c010d0106020002000106011c011b011c011b010d011c010d011c010d011c0106020002000106011b011c011b010d011c010d011c010d011c010d0106020002000106011c011b010d011c010d011c010d011c010d011c0106020003000a060300"
        ),
        bytes(
            hex"0000100003000a060300020001060a1401060200020001060a1401060200020001060a1401060200020001060a1401060200020001060a1d01060200020001060a1d01060200020001060a1d01060200020001060a1d01060200020001060a1d01060200020001060a1401060200020001060a1401060200020001060a140106020003000a060300"
        ),
        bytes(
            hex"0000100003000a060300020001060a1e01060200020001060a1e01060200020001060a1e01060200020001060a1e01060200020001060a1801060200020001060a1801060200020001060a1801060200020001060a1801060200020001060a1801060200020001060a1e01060200020001060a1e01060200020001060a1e0106020003000a060300"
        ),
        bytes(
            hex"0000100003000a060300020001060a1701060200020001060a1701060200020001060a1701060200020001060a1701060200020001060a0f01060200020001060a0f01060200020001060a0f01060200020001060a0f01060200020001060a0f01060200020001060a1701060200020001060a1701060200020001060a170106020003000a060300"
        ),
        bytes(
            hex"0000100003000a060300020001060a0701060200020001060a0701060200020001060a0701060200020001060a0701060200020001060a0801060200020001060a0801060200020001060a0801060200020001060a0801060200020001060a0801060200020001060a0701060200020001060a0701060200020001060a070106020003000a060300"
        )
    ];

    string[] public signatureNames = [
        "blueberry",
        "castle",
        "circle",
        "cross",
        "egg",
        "pepe",
        "pig",
        "sword",
        "treasure"
    ];

    bytes[] public signatures = [
        bytes(
            hex"000010001000100006000102010302040600040001040103020401030104020204000400020402030204020204000300070402020105030003000202040403020105030003000302020403020205030004000702010504000400050203050400060004050600100010001000"
        ),
        bytes(
            hex"0000100010001000040002060100020601000206040004000106010701060207010601070106040004000206040702060400040001060108010602080106010801060400040001060108010602080106010801060400040001060208020602080106040004000106020802060208010604000400010601070106020701060107010604000400020604070206040004000806040010001000"
        ),
        bytes(
            hex"00001000100010001000040001090600010904000500010904060109050005000106010902000109010605000500010601000209010001060500050001060100020901000106050005000106010902000109010605000500010904060109050004000109060001090400100010001000"
        ),
        bytes(
            hex"00001000100010001000060001060200010606000600010602000106060005000206020002060500070002060700070002060700050002060200020605000600010602000106060006000106020001060600100010001000"
        ),
        bytes(
            hex"00001000100010000700010a010b07000600030a010b06000500040a010b010c05000500050a010b05000400060a010b010c04000400060a010b010c04000400060a010b010c04000500040a010b010c05000600010a020b010c0600100010001000"
        ),
        bytes(
            hex"00001000100010000600010d0200010d06000400020e020d020e060004000106010a020d0106010a06000400060d06000400030f030d06000500060405000400010d010004040100010d04000600040406000600040d06000600010d0200010d060010001000"
        ),
        bytes(
            hex"000010001000100005000210020002100500050006110500040001110612011104000400011101120113021201130112011104000400011102120211021201110400040001110212021102120111040004000111061201110400040001110612011104000500061105000500021302000213050010001000"
        ),
        bytes(
            hex"00001000100010000a00011405000a00011405000900011401150500090001140115050008000114021505000400010602000114021506000500010601140215070005000113010601150800040001130216010608000400021602000106070010001000"
        ), 
        bytes(
            hex"0000100010001000060004170600040002170400021704000400080f040003000117080f01170300030001170300020f030001170300030001170300020f030001170300040001170200020f020001170400040002170100020f010002170400060004170600100010001000"
        )
    ];

    string[] public stampNames = ["fancy", "green marks", "none", "red marks", "yellow marks"];

    bytes[] public stamps = [
        bytes(
            hex"00000117010f0100010f0118010f0118020f0118010f0118010f0100010f0117010f011701180a0001180117010f0100010f0c00010f0100010f01180c000118010f0100010f0c00010f0100010f01180c000118010f010f01180c000118010f02180c00021802180c000218010f01180c000118010f010f01180c000118010f0100010f0c00010f0100010f01180c000118010f0100010f0c00010f0100010f011701180a0001180117010f0117010f0100010f0118010f0118020f0118010f0118010f0100010f"
        ),
        bytes(
            hex"000010000200040c0400040c02000200010c0a00010c02000200010c0a00010c0200100010001000100010001000100010000200010c0a00010c02000200010c0a00010c02000200040c0400040c0200"
        ),
        bytes(
            hex"0000100010001000100010001000100010001000100010001000100010001000"
        ),
        bytes(
            hex"000010000200040f0400040f02000200010f0a00010f02000200010f0a00010f0200100010001000100010001000100010000200010f0a00010f02000200010f0a00010f02000200040f0400040f0200"
        ), 
        bytes(
            hex"00001000020001170100021704000217010001170200100010001000100010001000100010001000100010001000020001170100021704000217010001170200"
        )
    ];

    // Seeds
    struct BallotSeed {
        uint32 background;
        uint32 signature;
        uint32 stamp;
    }

    mapping(uint256 => BallotSeed) public seeds;

    // Mint info
    bool public isLive = true;

    mapping(address => bool) public whitelisted;

    function addToWhitelistMultiple(address[] memory _accounts)
        public
        onlyOwner
    {
        uint256 size = _accounts.length;

        for (uint256 i = 0; i < size; i++) {
            address account = _accounts[i];
            whitelisted[account] = true;
        }
    }

    constructor() ERC721("CastleDAOBallot", "CASTLEBALLOT") {}

    function toggleLive() external onlyOwner {
        isLive = !isLive;
    }

    function _internalMint(
        address _address,
        uint32 _stamp,
        uint32 _background,
        uint32 _signature
    ) internal returns (uint256) {
        require(isLive == true, "Minting is not live");
        // minting logic
        _tokenIds.increment();
        uint256 tokenId = _tokenIds.current();

        // Check that the parts are correct and exist
        require(_stamp < stamps.length && _stamp >= 0, "Invalid data");
        require(
            _signature < signatures.length && _signature >= 0,
            "Invalid data"
        );
        require(
            _background < backgrounds.length && _background >= 0,
            "Invalid data"
        );
        // Store the seed
        seeds[tokenId] = BallotSeed({
            background: _background,
            stamp: _stamp,
            signature: _signature
        });

        _safeMint(_address, tokenId);
        emit Mint(_address, tokenId, msg.value);
        return tokenId;
    }

    function mint(
        uint32 _stamp,
        uint32 _background,
        uint32 _signature
    ) public payable nonReentrant {
        require(whitelisted[msg.sender], "Not allowed to mint");
        _internalMint(_msgSender(), _stamp, _background, _signature);
        whitelisted[msg.sender] = false;
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override
        returns (string memory)
    {
        require(_exists(tokenId), "URI query for nonexistent token");

        string memory data = _render(tokenId, seeds[tokenId]);
        return data;
    }

    // owner functions
    function ownerWithdraw() external onlyOwner nonReentrant {
        payable(owner()).transfer(address(this).balance);
    }

    function _render(uint256 tokenId, BallotSeed memory seed)
        internal
        view
        returns (string memory)
    {
        string memory image = string(
            abi.encodePacked(
                '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" shape-rendering="crispEdges" width="256" height="256">'
                '<rect width="100%" height="100%" fill="transparent" />',
                _renderRects(backgrounds[seed.background]),
                _renderRects(signatures[seed.signature]),
                _renderRects(stamps[seed.stamp]),
                "</svg>"
            )
        );

        return
            string(
                abi.encodePacked(
                    "data:application/json;base64,",
                    Base64.encode(
                        bytes(
                            abi.encodePacked(
                                '{"image": "data:image/svg+xml;base64,',
                                Base64.encode(bytes(image)),
                                '", "name": "CastleDAO Ballot #',
                                tokenId.toString(),
                                '", "stamp":"',
                                stampNames[seed.stamp],
                                '", "background":"',
                                backgroundNames[seed.background],
                                '", "signature":"',
                                signatureNames[seed.signature],
                                '", "description": "A memory for helping CastleDAO in the urnes. 16/04/2022"}'
                            )
                        )
                    )
                )
            );
    }

    function _renderRects(bytes memory data)
        private
        view
        returns (string memory)
    {
        string[17] memory lookup = [
            "0",
            "1",
            "2",
            "3",
            "4",
            "5",
            "6",
            "7",
            "8",
            "9",
            "10",
            "11",
            "12",
            "13",
            "14",
            "15",
            "16"
        ];

        string memory rects;
        uint256 drawIndex = 0;

        for (uint256 i = 0; i < data.length; i = i + 2) {
            uint8 runLength = uint8(data[i]); // we assume runLength of any non-transparent segment cannot exceed image width (16px)


            uint8 colorIndex = uint8(data[i + 1]);

            if (colorIndex != 0 && colorIndex != 1) {
                // transparent
                uint8 x = uint8(drawIndex % 16);
                uint8 y = uint8(drawIndex / 16);
                string memory color = "#000000";
                if (colorIndex > 1) {
                    color = palette[colorIndex - 1];
                }
                rects = string(
                    abi.encodePacked(
                        rects,
                        '<rect width="',
                        lookup[runLength],
                        '" height="1" x="',
                        lookup[x],
                        '" y="',
                        lookup[y],
                        '" fill="',
                        color,
                        '" />'
                    )
                );
            }
            drawIndex += runLength;
        }

        return rects;
    }
}
