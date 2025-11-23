// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract CertificateNFT is ERC721, ERC721URIStorage, AccessControl {
    // Định nghĩa vai trò MINTER (dành cho Backend Server)
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    
    uint256 private _nextTokenId;

    mapping(bytes32 => bool) public usedDataHashes; // Mapping để theo dõi các Hash đã được sử dụng
    mapping(bytes32 => uint256) public hashToTokenId; // Mapping để liên kết Hash với Token ID

    event CertificateMinted(address indexed to, uint256 tokenId, string dataHash);

    constructor(address defaultAdmin, address minter) ERC721("CertificateNFT", "CNFT") {
        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        _grantRole(MINTER_ROLE, minter);
    }

    /**
     * @dev Hàm Mint (Chỉ ví có quyền MINTER_ROLE mới gọi được)
     * @param to Địa chỉ ví của User nhận NFT
     * @param uri Metadata URL (IPFS link)
     * @param dataHashBytes Hash của dữ liệu gốc (SHA256) để đảm bảo tính toàn vẹn và duy nhất
     */
    function mintCertificate(address to, string memory uri, string memory dataHashBytes) public onlyRole(MINTER_ROLE) {
        bytes32 hash = keccak256(abi.encodePacked(dataHashBytes));
        
        require(!usedDataHashes[hash], "Du lieu nay da duoc cap Certificate");

        uint256 tokenId = _nextTokenId++;
        
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        usedDataHashes[hash] = true;
        hashToTokenId[hash] = tokenId; 

        emit CertificateMinted(to, tokenId, dataHashBytes);
        
    }
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }
}