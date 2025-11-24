// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract CertificateNFT is ERC721, ERC721URIStorage, ERC721Burnable, ERC721Enumerable, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    uint256 private _nextTokenId;

    // Mapping liên kết Hash -> TokenID (Phục vụ xác thực)
    mapping(bytes32 => uint256) public hashToTokenId;
    mapping(uint256 => bytes32) public tokenIdToHash; // Mapping ngược để xóa hash khi burn

    constructor(address defaultAdmin, address minter) ERC721("CertificateNFT", "CERF") {
        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        _grantRole(MINTER_ROLE, minter);
    }

    function mintCertificate(address to, string memory uri, string memory dataHashString) public onlyRole(MINTER_ROLE) {
        // Hash chuỗi string đầu vào
        bytes32 hash = keccak256(abi.encodePacked(dataHashString));
        // Kiểm tra xem hash này đã có token ID chưa
        require(hashToTokenId[hash] == 0, "Du lieu nay da duoc cap Certificate");

        uint256 tokenId = _nextTokenId++;
        
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        
        // Lưu trữ liên kết
        hashToTokenId[hash] = tokenId;
        tokenIdToHash[tokenId] = hash;
    }

    // Override hàm burn để xóa dữ liệu hash khi NFT bị hủy (Revoke)
    function burn(uint256 tokenId) public override {
        // Chủ sở hữu hoặc người được ủy quyền mới được burn
        super.burn(tokenId);
        // Xóa thông tin mapping để hash này có thể được mint lại
        bytes32 hash = tokenIdToHash[tokenId];
        delete hashToTokenId[hash];
        delete tokenIdToHash[tokenId];
    }

    //Override functions
    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage, ERC721Enumerable, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}