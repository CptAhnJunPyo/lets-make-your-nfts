import { ethers } from 'ethers';
import axios from 'axios';
import { CONTRACT_ADDRESS, contractABI, API_BASE_URL } from './constants';

// Chuyển đổi IPFS URI sang HTTP URL
export const ipfsToHttp = (uri) => {
  if (!uri) return "";
  return uri.replace("ipfs://", "https://cloudflare-ipfs.com/ipfs/");
};

// Kết nối ví
export const connectWallet = async () => {
  if (!window.ethereum) {
    throw new Error("Vui lòng cài đặt Metamask!");
  }
  
  const provider = new ethers.BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  const signer = await provider.getSigner();
  const address = await signer.getAddress();
  
  return { provider, signer, address };
};

// Lấy danh sách NFT của user
export const fetchUserNFTs = async (userAddress, signer) => {
  const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, signer);
  const balanceBigInt = await contract.balanceOf(userAddress);
  const balance = Number(balanceBigInt);

  const items = [];
  for (let i = 0; i < balance; i++) {
    try {
      const tokenId = await contract.tokenOfOwnerByIndex(userAddress, i);
      
      const tokenURI = await contract.tokenURI(tokenId);
      const httpURI = ipfsToHttp(tokenURI);
      
      let meta = { name: `NFT #${tokenId}`, description: "", image: "" };
      try {
        const metaRes = await axios.get(httpURI);
        meta = metaRes.data;
      } catch(e) { 
        console.warn("Lỗi fetch meta IPFS", e); 
      }

      let typeLabel = "Standard";
      let extraInfo = "";
      try {
        const details = await contract.tokenDetails(tokenId);
        const typeCode = Number(details[0]);
        
        if (typeCode === 1) {
          typeLabel = "Joint Contract";
          extraInfo = `Co-Owner: ${details[1].slice(0,6)}...`;
        } else if (typeCode === 2) {
          typeLabel = "Voucher";
          extraInfo = `Value: $${details[2]} ${details[3] ? '(Used)' : ''}`;
        }
      } catch(e) { 
        console.warn("Lỗi fetch tokenDetails", e); 
      }

      items.push({
        tokenId: tokenId.toString(),
        name: meta.name,
        description: meta.description,
        image: ipfsToHttp(meta.image),
        typeLabel,
        extraInfo
      });
    } catch (err) {
      console.error("Lỗi load item:", err);
    }
  }
  
  return items;
};

// Mint NFT mới
export const mintNFT = async (account, nftType, selectedFile, formData) => {
  if (!account) throw new Error("Chưa kết nối ví!");
  if (!selectedFile) throw new Error("Vui lòng chọn file ảnh/PDF!");
  
  if (nftType === 'joint' && !ethers.isAddress(formData.coOwner)) {
    throw new Error("Địa chỉ Co-Owner không hợp lệ!");
  }
  if (nftType === 'voucher' && !formData.voucherValue) {
    throw new Error("Vui lòng nhập giá trị Voucher!");
  }

  const form = new FormData();
  form.append('userAddress', account);
  form.append('type', nftType);
  form.append('studentName', formData.studentName);
  form.append('certName', formData.certName);
  form.append('issuerName', formData.issuerName);
  form.append('programName', formData.programName);
  form.append('description', formData.description);
  form.append('issuedAt', formData.issuedAt);
  form.append('externalUrl', formData.externalUrl);
  form.append('certificateFile', selectedFile);

  if (nftType === 'joint') form.append('coOwner', formData.coOwner);
  if (nftType === 'voucher') form.append('voucherValue', formData.voucherValue);

  const response = await axios.post(`${API_BASE_URL}/mint`, form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

  return response.data;
};

// Transfer NFT
export const transferNFT = async (tokenId, toAddress) => {
  if (!toAddress || !ethers.isAddress(toAddress)) {
    throw new Error("Địa chỉ không hợp lệ");
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, signer);
  const from = await signer.getAddress();

  const tx = await contract["safeTransferFrom(address,address,uint256)"](from, toAddress, tokenId);
  await tx.wait();
  
  return tx.hash;
};

// Revoke (Burn) NFT
export const revokeNFT = async (tokenId) => {
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, signer);

  const tx = await contract.burn(tokenId);
  await tx.wait();
  
  return tx.hash;
};

// Verify document
export const verifyDocument = async (verifyFile, account) => {
  if (!verifyFile) throw new Error("Vui lòng chọn file gốc để kiểm tra!");

  const form = new FormData();
  form.append('verifyFile', verifyFile);
  form.append('claimerAddress', account || "");

  const response = await axios.post(`${API_BASE_URL}/verify`, form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  
  return response.data;
};
