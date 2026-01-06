export const CONTRACT_ADDRESS = "0x58d9A8149386b548b7e9798717C71132e5e9EF26";

export const contractABI = [
  "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function safeTransferFrom(address from, address to, uint256 tokenId)",
  "function burn(uint256 tokenId)",
  "function tokenDetails(uint256 tokenId) view returns (uint8 tType, address coOwner, uint256 value, bool isRedeemed)"
];

export const API_BASE_URL = "https://lets-make-your-nfts.onrender.com/api";
