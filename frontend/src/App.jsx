import { useState } from 'react';
import { ethers } from 'ethers';
import axios from 'axios';
import './App.css';

function App() {
  const [account, setAccount] = useState(null);
  const [formData, setFormData] = useState({ name: '', course: '' });
  const [selectedFile, setSelectedFile] = useState(null); // 1. State cho file
  const [status, setStatus] = useState('');

  //connectWallet
  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        setAccount(await signer.getAddress());
      } catch (error) {
        console.error("Lỗi kết nối ví:", error);
      }
    } else {
      alert("Vui lòng cài đặt Metamask!");
    }
  };
  // 2. Hàm xử lý khi chọn file
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
  const handleTransfer = async (tokenId, recipientAddress) => {
    try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        
        // ABI của contract (cần thêm hàm transfer)
        const contractABI = [
            "function safeTransferFrom(address from, address to, uint256 tokenId) public",
        ];
        
        const contract = new ethers.Contract(YOUR_CONTRACT_ADDRESS, contractABI, signer);

        const userAddress = await signer.getAddress();
        
        // Gọi hàm trên contract
        const tx = await contract.safeTransferFrom(userAddress, recipientAddress, tokenId);
        
        setStatus(`Đang chuyển NFT ${tokenId} đến ${recipientAddress}...`);
        await tx.wait();
        
        setStatus(`Chuyển thành công!`);

    } catch (error) {
        console.error("Lỗi chuyển nhượng:", error);
        setStatus("Chuyển nhượng thất bại.");
    }
};
  return (
    <div className="App" style={{ padding: "20px" }}>
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

        {/* 6. Thêm ô input file */}
        <label>Chọn file chứng chỉ (Ảnh/PDF):</label>
        <br />
        <input 
          type="file" 
          onChange={handleFileChange}
        />
        <br /><br />
        
        <button onClick={handleMintRequest} disabled={!account}>
          Đóng dấu (Mint Certificate)
        </button>
      </div>

      <p style={{ marginTop: "20px", color: "blue" }}>{status}</p>
    </div>
  );
}

export default App;