import { ethers } from 'ethers';
import axios from 'axios';
import { CONTRACT_ADDRESS, contractABI, API_BASE_URL } from './constants';
import { generateKeyFromWallet, encryptFile, decryptContent, verifyIntegrity } from './security';

export const ipfsToHttp = (uri) => {
  if (!uri) return "";
  return uri.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/");
};

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

export const fetchUserNFTs = async (userAddress, signer) => {
  const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, signer);
  const items = [];
  const addedTokenIds = new Set();

  const processToken = async (tokenId, role) => {
      try {
          const tokenURI = await contract.tokenURI(tokenId);
          const httpURI = ipfsToHttp(tokenURI);
          
          let meta = { name: `NFT #${tokenId}`, description: "", image: "" };
          let certHash = ""; // Biến lưu hash
          
          try {
            const metaRes = await axios.get(httpURI);
            meta = metaRes.data;
            certHash = meta.certificate_hash ? meta.certificate_hash.replace("0x", "") : "";
          } catch(e) {
            console.warn(`Lỗi fetch metadata token ${tokenId}`);
          }

          let typeLabel = "Standard";
          let extraInfo = "";
          try {
            const details = await contract.tokenDetails(tokenId);
            const typeCode = Number(details[0]);
            
            if (typeCode === 1) {
              typeLabel = "Joint Contract";
              extraInfo = role === "Co-Owner" 
                  ? `Owner: ...` 
                  : `Partner: ${details[1].slice(0,6)}...`;
            } else if (typeCode === 2) {
              typeLabel = "Voucher";
              extraInfo = `Value: $${details[2]} ${details[3] ? '(Used)' : ''}`;
            }
          } catch(e) {}

          return {
            tokenId: tokenId.toString(),
            name: meta.name,
            description: meta.description,
            image: ipfsToHttp(meta.image),
            certificateHash: certHash,
            typeLabel,
            extraInfo,
            role // "Owner" hoặc "Co-Owner"
          };
      } catch (err) {
          console.error(`Lỗi xử lý token ${tokenId}:`, err);
          return null;
      }
  };
  const balance = Number(await contract.balanceOf(userAddress));
  for (let i = 0; i < balance; i++) {
    try {
      const tokenId = await contract.tokenOfOwnerByIndex(userAddress, i);
      if (!addedTokenIds.has(tokenId)) {
          const item = await processToken(tokenId, "Owner");
          if (item) items.push(item);
          addedTokenIds.add(tokenId);
      }
    } catch (e) {}
  }
  try {
      if (contract.getCoOwnedTokens) {
          const coOwnedIds = await contract.getCoOwnedTokens(userAddress);
          for (let tokenId of coOwnedIds) {
              if (!addedTokenIds.has(tokenId)) {
                  try {
                      await contract.ownerOf(tokenId); 
                      const item = await processToken(tokenId, "Co-Owner");
                      if (item) items.push(item);
                      addedTokenIds.add(tokenId);
                  } catch (e) {}
              }
          }
      }
  } catch (err) {
      console.warn("Contract chưa hỗ trợ getCoOwnedTokens hoặc lỗi mạng");
  }
  
  return items;
};

export const mintNFT = async (signer, account, nftType, selectedFile, formData) => {
  if (!account || !signer) throw new Error("Chưa kết nối ví!");
  if (!selectedFile) throw new Error("Vui lòng chọn file!");
  
  // Validate Form
  if (nftType === 'joint' && !ethers.isAddress(formData.coOwner)) {
    throw new Error("Địa chỉ Co-Owner không hợp lệ!");
  }
  if (nftType === 'voucher' && !formData.voucherValue) {
    throw new Error("Vui lòng nhập giá trị Voucher!");
  }

  // --- BẮT ĐẦU QUY TRÌNH BẢO MẬT ---
  // 1. Tạo Key từ ví
  const key = await generateKeyFromWallet(signer);
  
  // 2. Mã hóa file gốc (Client-Side Encryption)
  const secureFile = await encryptFile(selectedFile, key);


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
  form.append('certificateFile', secureFile);

  if (nftType === 'joint') form.append('coOwner', formData.coOwner);
  if (nftType === 'voucher') form.append('voucherValue', formData.voucherValue);

  const response = await axios.post(`${API_BASE_URL}/mint`, form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

  return response.data;
};

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
export const unlockAndVerifyNFT = async (signer, nft) => {
  if (!signer || !nft) throw new Error("Thiếu thông tin");

  // 1. Tạo lại Key từ ví
  const key = await generateKeyFromWallet(signer);
  
  // 2. Giải mã ảnh
  const decryptedImg = await decryptContent(nft.image, key);
  
  // 3. Verify Integrity (nếu có hash gốc)
  let isVerified = null;
  if (nft.certificateHash) {
      isVerified = await verifyIntegrity(decryptedImg, nft.certificateHash);
  } else {
      // Với NFT cũ không có hash, mặc định true (hoặc null tùy logic UI)
      isVerified = true; 
  }
  return {
      decryptedImage: decryptedImg,
      isVerified: isVerified
  };
};
export const revokeNFT = async (tokenId) => {
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, signer);

  const tx = await contract.burn(tokenId);
  await tx.wait();
  
  return tx.hash;
};

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
