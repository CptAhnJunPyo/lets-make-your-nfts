// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract CertificateNFT is ERC721, ERC721URIStorage, ERC721Burnable, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    uint256 private _nextTokenId;

    // Enum chỉ còn 2 loại (Joint đã chuyển sang contract kia)
    enum TokenType { STANDARD, VOUCHER }

    struct TokenDetails {
        TokenType tType;
        uint256 value;
    }

    mapping(uint256 => TokenDetails) public tokenDetails;
    mapping(bytes32 => uint256) public hashToTokenId;
    mapping(uint256 => bytes32) public tokenIdToHash;
    
    constructor(address defaultAdmin, address minter) ERC721("CertificateNFT", "CERF") {
        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        _grantRole(MINTER_ROLE, minter);
    }

    function mint721(
        address to, 
        string memory uri, 
        string memory dataHashBytes,
        TokenType _type,   // 0: STANDARD, 1: VOUCHER
        uint256 _value 
    ) public onlyRole(MINTER_ROLE) {
        bytes32 hash = keccak256(abi.encodePacked(dataHashBytes));
        require(hashToTokenId[hash] == 0, "Du lieu da ton tai (ERC721)");

        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);

        tokenDetails[tokenId] = TokenDetails({
            tType: _type,
            value: _value
        });
        
        hashToTokenId[hash] = tokenId;
    }
    function redeemVoucher(uint256 tokenId) public {
        require(ownerOf(tokenId) == msg.sender, "Ban khong phai chu so huu Voucher nay");
        require(tokenDetails[tokenId].tType == TokenType.VOUCHER, "Day khong phai la Voucher");

        // Gọi hàm burn (sẽ kích hoạt logic xóa data bên dưới)
        burn(tokenId);
    }
    function burn(uint256 tokenId) public override {
        super.burn(tokenId); // Hủy token chuẩn ERC721
        
        // Xóa thông tin chi tiết
        delete tokenDetails[tokenId];

        // Xóa Hash map (để sau này có thể mint lại nếu cần, hoặc giữ sạch bộ nhớ)
        bytes32 hash = tokenIdToHash[tokenId];
        if (hash != 0) {
            delete hashToTokenId[hash];
            delete tokenIdToHash[tokenId];
        }
    }
    // --- LOGIC SOULBOUND (CHẶN CHUYỂN NHƯỢNG VĂN BẰNG) ---
    function _update(address to, uint256 tokenId, address auth) internal override(ERC721) returns (address) {
        address from = _ownerOf(tokenId);
        
        if (from != address(0) && to != address(0)) {
            require(tokenDetails[tokenId].tType == TokenType.VOUCHER, "Soulbound: Khong the chuyen nhuong Van bang!");
        }
        return super._update(to, tokenId, auth);
    }

    // Các hàm override bắt buộc
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}