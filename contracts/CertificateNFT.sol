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
    
    enum TokenType { STANDARD, JOINT, VOUCHER }

    struct TokenDetails {
        TokenType tType;   // Loại: 0, 1, hay 2
        address coOwner;   // Chỉ dùng cho JOINT (người sở hữu thứ 2)
        uint256 value;     // Chỉ dùng cho VOUCHER (giá trị voucher, vd: 50$)
        bool isRedeemed;   // Trạng thái đã dùng voucher chưa
    }
    mapping(uint256 => TokenDetails) public tokenDetails;
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
    function mintExtended(
        address to, 
        string memory uri, 
        string memory dataHashBytes,
        uint8 _type,       // 0: Standard, 1: Joint, 2: Voucher
        address _coOwner,  // Neu type != JOINT -> 0x0
        uint256 _value     // Neu la voucher -> value cua voucher
    ) public onlyRole(MINTER_ROLE) {
        
        bytes32 hash = keccak256(abi.encodePacked(dataHashBytes));
        require(hashToTokenId[hash] == 0, "Du lieu nay da ton tai!");

        uint256 tokenId = _nextTokenId++;
        
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        
        // Lưu Hash
        hashToTokenId[hash] = tokenId;

        // Lưu thông tin mở rộng (Classifying)
        tokenDetails[tokenId] = TokenDetails({
            tType: TokenType(_type),
            coOwner: _coOwner,
            value: _value,
            isRedeemed: false
        });
    }
    function redeemVoucher(uint256 tokenId) public {
        require(ownerOf(tokenId) == msg.sender, "Khong phai chu so huu");
        require(tokenDetails[tokenId].tType == TokenType.VOUCHER, "Khong phai Voucher");
        require(!tokenDetails[tokenId].isRedeemed, "Voucher da su dung roi");

        // Đánh dấu đã dùng
        tokenDetails[tokenId].isRedeemed = true;
        
        // (Tùy chọn) Burn luôn NFT nếu muốn nó biến mất
        _burn(tokenId); 
    }
    function getCoOwner(uint256 tokenId) public view returns (address) {
        return tokenDetails[tokenId].coOwner;
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