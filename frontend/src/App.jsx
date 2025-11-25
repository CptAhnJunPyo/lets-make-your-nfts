import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import axios from 'axios';
import './App.css';

// CẬP NHẬT ĐỊA CHỈ CONTRACT MỚI CỦA BẠN VÀO ĐÂY
const CONTRACT_ADDRESS = "0x95C23FFD28612884bd47468f776849B427D77D57";

const contractABI = [
  "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function safeTransferFrom(address from, address to, uint256 tokenId)",
  "function burn(uint256 tokenId)"
];

function App() {
  const [account, setAccount] = useState(null);
  const [myNFTs, setMyNFTs] = useState([]);
  const [isDark, setIsDark] = useState(true);
  
  // State Mint
  const [formData, setFormData] = useState({ name: '', course: '' });
  const [mintFile, setMintFile] = useState(null);
  
  // State Verify
  const [verifyFile, setVerifyFile] = useState(null);
  const [verifyResult, setVerifyResult] = useState(null);
  
  const [status, setStatus] = useState('');

  // --- 1. KẾT NỐI VÍ ---
  const connectWallet = async () => {
    if (window.ethereum) {
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      setAccount(address);
      fetchUserNFTs(address, signer); // Load danh sách ngay
    } else {
      alert("Chưa cài Metamask!");
    }
  };

  // --- 2. LẤY DANH SÁCH NFT ---
  const fetchUserNFTs = async (address, signer) => {
    try {
      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, signer);
      const balanceBigInt = await contract.balanceOf(address);
      const balance = Number(balanceBigInt); // Chuyển BigInt sang Number để loop

      const loadedNFTs = [];
      for (let i = 0; i < balance; i++) {
        try {
          const tokenId = await contract.tokenOfOwnerByIndex(address, i);
          const tokenURI = await contract.tokenURI(tokenId);
          const httpURI = tokenURI.replace("ipfs://", "https://cloudflare-ipfs.com/ipfs/");
          
          const metaRes = await axios.get(httpURI);
          const meta = metaRes.data;
          
          loadedNFTs.push({
            tokenId: tokenId.toString(),
            name: meta.name,
            image: meta.image.replace("ipfs://", "https://cloudflare-ipfs.com/ipfs/")
          });
        } catch (e) {
          console.error("Lỗi load 1 NFT:", e);
        }
      }
      setMyNFTs(loadedNFTs);
    } catch (e) {
      console.error("Lỗi fetch list:", e);
    }
  };

  // --- 3. MINT (GỌI BACKEND) ---
  const handleMint = async () => {
    if (!mintFile || !account) return alert("Thiếu thông tin!");
    setStatus("Đang Mint...");
    
    const form = new FormData();
    form.append('userAddress', account);
    form.append('name', formData.name);
    form.append('course', formData.course);
    form.append('certificateFile', mintFile);

    try {
      const res = await axios.post('http://localhost:3001/api/mint', form);
      if (res.data.success) {
        setStatus("Mint thành công!");
        fetchUserNFTs(account, new ethers.BrowserProvider(window.ethereum).getSigner());
      }
    } catch (e) {
      console.error(e);
      setStatus("Lỗi Mint");
    }
  };

  // --- 4. TRANSFER (FIX LỖI ETHERS V6) ---
  const handleTransfer = async (tokenId) => {
    const to = prompt("Nhập địa chỉ ví nhận:");
    if (!ethers.isAddress(to)) return alert("Địa chỉ sai!");

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, signer);
      const from = await signer.getAddress();

      // Cú pháp đặc biệt cho Ethers v6 để gọi hàm overload
      const tx = await contract["safeTransferFrom(address,address,uint256)"](from, to, tokenId);
      
      setStatus("⏳ Đang chuyển...");
      await tx.wait();
      setStatus("Chuyển thành công!");
      fetchUserNFTs(from, signer);
    } catch (e) {
      console.error(e);
      alert("Lỗi Transfer (Xem console)");
    }
  };

  // --- 5. VERIFY (GỌI BACKEND) ---
  const handleVerify = async () => {
    if (!verifyFile) return alert("Chọn file cần check!");
    setStatus("⏳ Đang kiểm tra...");
    
    const form = new FormData();
    form.append('verifyFile', verifyFile);
    form.append('claimerAddress', account || ""); 

    try {
      const res = await axios.post('http://localhost:3001/api/verify', form);
      setVerifyResult(res.data);
      setStatus("Đã có kết quả!");
    } catch (e) {
      setStatus("Lỗi Verify");
    }
  };

  return (
    <div className={`app-container ${isDark ? 'dark' : 'light'}`}>
      <div className="header">
        <button className="theme-toggle" onClick={() => setIsDark(!isDark)}>
          {isDark ? '☀️' : '🌙'}
        </button>
        <h1>🎓 Web3 Certificate System</h1>
      </div>
      
      <div className="wallet-section">
        {!account ? (
          <button className="connect-btn" onClick={connectWallet}>
            🔗 Kết nối Ví MetaMask
          </button>
        ) : (
          <div className="wallet-info">
            <strong>💼 Ví đã kết nối:</strong><br/>
            {account.slice(0, 6)}...{account.slice(-4)}
          </div>
        )}
      </div>
      
      <div className="main-content">
        {/* FORM MINT */}
        <div className="section-card">
          <h3 className="section-title">
            <span>🛠️</span> Cấp chứng chỉ (Mint)
          </h3>
          
          <div className="form-group">
            <input 
              className="form-input"
              placeholder="Tên người nhận chứng chỉ" 
              onChange={e => setFormData({...formData, name: e.target.value})} 
            />
          </div>
          
          <div className="form-group">
            <input 
              className="form-input"
              placeholder="Tên khóa học / chương trình" 
              onChange={e => setFormData({...formData, course: e.target.value})} 
            />
          </div>
          
          <div className="form-group">
            <input 
              className="file-input"
              type="file" 
              onChange={e => setMintFile(e.target.files[0])} 
            />
          </div>
          
          <button className="action-btn" onClick={handleMint}>
            ✨ Tạo NFT Chứng chỉ
          </button>
        </div>

        {/* FORM VERIFY */}
        <div className="section-card">
          <h3 className="section-title">
            <span>🔍</span> Xác thực tài liệu
          </h3>
          
          <p style={{color: '#666', marginBottom: '20px'}}>
            Upload file gốc (.jpg, .pdf) để kiểm tra trên Blockchain
          </p>
          
          <div className="form-group">
            <input 
              className="file-input"
              type="file" 
              onChange={e => setVerifyFile(e.target.files[0])} 
            />
          </div>
          
          <button className="action-btn" onClick={handleVerify}>
            🔎 Kiểm tra ngay
          </button>
          
          {verifyResult && (
            <div className={`verify-result ${
              verifyResult.verified ? 'verify-success' : 'verify-fail'
            }`}>
              <div style={{fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '10px'}}>
                {verifyResult.verified ? '✅ HỢP LỆ' : '❌ KHÔNG TÌM THẤY'}
              </div>
              {verifyResult.verified && (
                <div style={{fontSize: '0.9rem', lineHeight: '1.6'}}>
                  <div><strong>Token ID:</strong> #{verifyResult.tokenId}</div>
                  <div><strong>Hash:</strong> {verifyResult.Hash?.slice(0, 20)}...</div>
                  <div><strong>Chủ sở hữu:</strong> {verifyResult.currentOwner?.slice(0, 10)}...{verifyResult.currentOwner?.slice(-6)}</div>
                  <div style={{marginTop: '10px', padding: '8px', background: verifyResult.isYourCert ? '#e6fffa' : '#fff5f5', borderRadius: '5px'}}>
                    {verifyResult.isYourCert ? '🎉 ĐÂY LÀ CHỨNG CHỈ CỦA BẠN!' : '⚠️ KHÔNG PHẢI CHỨNG CHỈ CỦA BẠN'}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {status && (
        <div className="status-bar">
          {status}
        </div>
      )}

      <div className="nft-gallery">
        <h3 className="gallery-title">📂 Danh sách chứng chỉ của tôi</h3>
        <div className="nft-grid">
          {myNFTs.map(nft => (
            <div key={nft.tokenId} className="nft-card">
              <img src={nft.image} className="nft-image" alt="cert" />
              <div className="nft-name">{nft.name}</div>
              <button 
                className="transfer-btn" 
                onClick={() => handleTransfer(nft.tokenId)}
              >
                📤 Transfer
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;