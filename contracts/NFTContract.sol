// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract JointContract is ERC1155, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    uint256 private _nextTokenId;

    // Mapping lưu URI cho từng Token ID (Custom implementation)
    mapping(uint256 => string) private _tokenURIs;
    
    // Mapping Hash để verify
    mapping(bytes32 => uint256) public hashToTokenId;

    // Mapping hỗ trợ Frontend fetch danh sách token của user
    mapping(address => uint256[]) public userTokens;

    constructor(address defaultAdmin, address minter) ERC1155("") {
        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        _grantRole(MINTER_ROLE, minter);
    }

    function mintJoint(
        address owner1,
        address owner2,
        string memory uri,
        string memory dataHashBytes
    ) public onlyRole(MINTER_ROLE) {
        bytes32 hash = keccak256(abi.encodePacked(dataHashBytes));
        require(hashToTokenId[hash] == 0, "Du lieu da ton tai (ERC1155)");

        uint256 tokenId = _nextTokenId++;

        // Mint 1 bản copy cho Owner 1
        _mint(owner1, tokenId, 1, "");
        userTokens[owner1].push(tokenId);

        // Mint 1 bản copy cho Owner 2 (nếu có)
        if (owner2 != address(0)) {
            _mint(owner2, tokenId, 1, "");
            userTokens[owner2].push(tokenId);
        }

        _tokenURIs[tokenId] = uri;
        hashToTokenId[hash] = tokenId;
    }

    // Override hàm uri để trả về link IPFS đúng
    function uri(uint256 tokenId) public view override returns (string memory) {
        return _tokenURIs[tokenId];
    }
    
    // Hàm lấy danh sách Token ID của một User (Dành cho Frontend)
    function getUserTokens(address user) public view returns (uint256[] memory) {
        return userTokens[user];
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC1155, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}