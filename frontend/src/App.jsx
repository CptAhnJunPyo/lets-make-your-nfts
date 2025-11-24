import { useState } from 'react';
import { ethers } from 'ethers';
import axios from 'axios';
import './App.css';
const contractABI = [
  "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function safeTransferFrom(address from, address to, uint256 tokenId)",
  "function burn(uint256 tokenId)"
];
const CONTRACT_ADDRESS = "0xc175142dD7a8a888f328a5D44d0499260Ba8c186";
function App() {
  const [account, setAccount] = useState(null);
  const [myNFTs, setMyNFTs] = useState([]); // State lưu danh sách NFT
  const [loading, setLoading] = useState(false);

  //connectWallet
  const connectWallet = async () => {
    if (window.ethereum) {
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      setAccount(address);
      
      // Gọi hàm fetch ngay khi kết nối
      fetchUserNFTs(address, signer);
    }
  };
  const fetchUserNFTs = async (userAddress, signer) => {
    setLoading(true);
    try {
      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, signer);
      // Lấy số lượng NFT user đang sở hữu
      const balance = await contract.balanceOf(userAddress);
      
      const items = [];
      // Duyệt qua từng NFT để lấy Token ID và Metadata
      for (let i = 0; i < balance; i++) {
        const tokenId = await contract.tokenOfOwnerByIndex(userAddress, i);
        const tokenURI = await contract.tokenURI(tokenId);
        
        // Fetch dữ liệu từ IPFS
        // Chuyển ipfs:// thành https://ipfs.io/ipfs/
        const httpURI = tokenURI.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/");
        const meta = await axios.get(httpURI);

        items.push({
          tokenId: tokenId.toString(),
          name: meta.data.name,
          description: meta.data.description,
          image: meta.data.image.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/")
        });
      }
      setMyNFTs(items);
    } catch (error) {
      console.error("Lỗi fetch NFT:", error);
    }
    setLoading(false);
  };
  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  // 3. Hàm gửi yêu cầu Mint
  const handleMintRequest = async () => {
    if (!account) return alert("Chưa kết nối ví!");
    if (!selectedFile) return alert("Vui lòng chọn file chứng chỉ!");
    
    setStatus("Đang chuẩn bị dữ liệu...");

    // 4. Tạo FormData để gửi
    const formDataObj = new FormData();
    formDataObj.append('userAddress', account);
    formDataObj.append('name', formData.name);
    formDataObj.append('course', formData.course);
    formDataObj.append('certificateFile', selectedFile);

    try {
      setStatus("Đang upload file và mint...");
      
      // 5. Gửi request POST với FormData
      const response = await axios.post('http://localhost:3001/api/mint', formDataObj, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        setStatus(`Thành công! Tx Hash: ${response.data.txHash}`);
      } else {
        setStatus("Thất bại!");
      }
    } catch (error) {
      console.error(error);
      setStatus("Có lỗi xảy ra khi gọi Server.");
    }
  };
  const handleTransfer = async (tokenId) => {
    const toAddress = prompt("Nhập địa chỉ ví người nhận:");
    if (!toAddress || !ethers.isAddress(toAddress)) return alert("Địa chỉ không hợp lệ");

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, signer);

      // Gọi hàm safeTransferFrom
      const tx = await contract.safeTransferFrom(account, toAddress, tokenId);
      alert(`Đang chuyển NFT... Hash: ${tx.hash}`);
      await tx.wait();
      
      alert("Chuyển thành công!");
      fetchUserNFTs(account, signer); // Load lại danh sách
    } catch (error) {
      console.error(error);
      alert("Chuyển nhượng thất bại!");
    }
  };
  const handleRevoke = async (tokenId) => {
    if (!confirm("Bạn có chắc chắn muốn hủy (xóa vĩnh viễn) chứng chỉ này không?")) return;

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, signer);

      const tx = await contract.burn(tokenId);
      alert(`Đang hủy NFT... Hash: ${tx.hash}`);
      await tx.wait();

      alert("Đã hủy chứng chỉ thành công!");
      fetchUserNFTs(account, signer); // Load lại danh sách
    } catch (error) {
      console.error(error);
      alert("Hủy thất bại!");
    }
  };
  return (
    <div className="App">
      <h1>Hệ thống Cấp Chứng Chỉ Web3</h1>
        {/* Nút kết nối ví */}
        {!account ? (
        <button onClick={connectWallet}>🔗 Kết nối Metamask</button>
        ) : (
            <p>Xin chào: <strong>{account}</strong></p>
            )}
      <hr />
      <div className="form-section">
        <h3>Nhập thông tin để cấp chứng chỉ</h3>
        <input 
          type="text" 
          placeholder="Họ và tên" 
          onChange={(e) => setFormData({...formData, name: e.target.value})}
        />
        <br /><br />
        <input 
          type="text" 
          placeholder="Khóa học / Tài sản" 
          onChange={(e) => setFormData({...formData, course: e.target.value})}
        />
        <br /><br />
        <label>Chọn file chứng chỉ (Ảnh/PDF):</label>
        <br />
        <input 
          type="file" 
          onChange={handleFileChange}
        />
        <br /><br />
        <button onClick={handleMintRequest} disabled={!account}>
          🛠️ Đóng dấu (Mint Certificate)
        </button>
      </div>
      <p style={{ marginTop: "80px", color: "white" }}>{status}</p>
      {/* PHẦN HIỂN THỊ DANH SÁCH */}
      <h2>📂 Tài sản của tôi</h2>
      {loading ? <p>Đang tải danh sách...</p> : (
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          {myNFTs.map((nft) => (
            <div key={nft.tokenId} style={{ border: '1px solid #ddd', padding: '10px', borderRadius: '8px', width: '200px' }}>
              <img src={nft.image} alt={nft.name} style={{ width: '100%' }} />
              <h4>{nft.name}</h4>
              <p>ID: #{nft.tokenId}</p>
              
              <div style={{ display: 'flex', gap: '5px' }}>
                <button onClick={() => handleTransfer(nft.tokenId)} style={{ backgroundColor: '#4CAF50' }}>
                  Transfer
                </button>
                <button onClick={() => handleRevoke(nft.tokenId)} style={{ backgroundColor: '#f44336' }}>
                  Revoke
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
export default App;