import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
<<<<<<< HEAD
import axios from 'axios';
import './App.css';

const CONTRACT_ADDRESS = "0xe648858D19C0A71A8581d3B6A9DfeC9b10307B77";
const contractABI = [
  "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function safeTransferFrom(address from, address to, uint256 tokenId)",
  "function burn(uint256 tokenId)",
  "function tokenDetails(uint256 tokenId) view returns (uint8 tType, address coOwner, uint256 value, bool isRedeemed)",
  "function getCoOwnedTokens(address user) view returns (uint256[])",
  "function getCoOwner(uint256 tokenId) public view returns (address)"
];
const ipAddress = 'localhost:3001'; // Example IP address, use your target IP
const port = '3001';
const endpoint = '/api/mint';
const endpoint2 = '/api/verify';
const url = `${ipAddress}${endpoint}`;
const url2 = `${ipAddress}${endpoint2}`;
=======
import './styles/theme.css';
import './styles/global.css';
import './components/Layout/TutorialOverlay.css';
import Navbar from './components/Layout/Navbar';
import MintSection from './components/Mint/MintSection';
import PortfolioSection from './components/Portfolio/PortfolioSection';
import VerifySection from './components/Verify/VerifySection';
import NFTModal from './components/Portfolio/NFTModal';
import TutorialOverlay from './components/Layout/TutorialOverlay';
import { 
  connectWallet as connectWalletHelper, 
  fetchUserNFTs as fetchUserNFTsHelper,
  mintNFT,
  transferNFT,
  revokeNFT,
  verifyDocument
} from './utils/helpers';

>>>>>>> origin/tai-huongdan
function App() {
  const [account, setAccount] = useState(null);
  const [myNFTs, setMyNFTs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [selectedNft, setSelectedNft] = useState(null);
  const [activeTab, setActiveTab] = useState('mint');
  const [darkMode, setDarkMode] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  const [nftType, setNftType] = useState('standard'); 
  const [selectedFile, setSelectedFile] = useState(null);
  
  const [formData, setFormData] = useState({ 
      studentName: '', 
      certName: 'Certificate of Achievement', 
      issuerName: 'ABC Organization',
      programName: '',
      description: '',
      issuedAt: new Date().toISOString().split('T')[0],
      externalUrl: '',
      coOwner: '',
      voucherValue: ''
  });

  const [verifyFile, setVerifyFile] = useState(null);
  const [verifyResult, setVerifyResult] = useState(null);
  
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setDarkMode(savedTheme === 'dark');
    } else {
      setDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches);
    }

    // Check if user is first time visitor
    const hasSeenTutorial = localStorage.getItem('hasSeenTutorial');
    if (!hasSeenTutorial) {
      setShowTutorial(true);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !darkMode;
    setDarkMode(newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  const connectWallet = async () => {
    try {
      const { signer, address } = await connectWalletHelper();
      setAccount(address);
      fetchUserNFTs(address, signer);
    } catch (error) {
      console.error(error);
      alert("Lỗi kết nối ví: " + error.message);
    }
  };

  const fetchUserNFTs = async (userAddress, signer) => {
    setLoading(true);
    setMyNFTs([]);
    
    try {
<<<<<<< HEAD
      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, signer);
      const items = [];
      const addedTokenIds = new Set();

      const balance = Number(await contract.balanceOf(userAddress));
      for (let i = 0; i < balance; i++) {
        try {
          const tokenId = await contract.tokenOfOwnerByIndex(userAddress, i);
          if (!addedTokenIds.has(tokenId)) {
              items.push(await processToken(contract, tokenId, "Owner"));
              addedTokenIds.add(tokenId);
          }
        } catch (err) {}
      }
      
      try {
          const coOwnedIds = await contract.getCoOwnedTokens(userAddress);
          for (let tokenId of coOwnedIds) {
              if (!addedTokenIds.has(tokenId)) {
                  try {
                      await contract.ownerOf(tokenId);
                      items.push(await processToken(contract, tokenId, "Co-Owner"));
                      addedTokenIds.add(tokenId);
                  } catch (e) { console.log("Token burned:", tokenId); }
              }
          }
      } catch (err) { console.warn("Lỗi fetch Co-Owner:", err); }

=======
      const items = await fetchUserNFTsHelper(userAddress, signer);
>>>>>>> origin/tai-huongdan
      setMyNFTs(items);
    } catch (error) { console.error(error); }
    setLoading(false);
  };
  const processToken = async (contract, tokenId, role) => {
    const tokenURI = await contract.tokenURI(tokenId);
    const httpURI = tokenURI.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/");
    
    let meta = { name: `NFT #${tokenId}`, description: "", image: "" };
    try { const res = await axios.get(httpURI); meta = res.data; } catch(e){}

    let typeLabel = "Standard";
    let extraInfo = "";
    try {
        const details = await contract.tokenDetails(tokenId);
        const typeCode = Number(details[0]);
        if (typeCode === 1) { 
            typeLabel = "Joint Contract"; 
            // Nếu mình là Co-Owner thì hiện thông tin Owner chính
            extraInfo = role === "Co-Owner" ? `Owner: ...` : `Partner: ${details[1].slice(0,6)}...`;
        } else if (typeCode === 2) { 
            typeLabel = "Voucher"; 
            extraInfo = `Value: $${details[2]}`; 
        }
    } catch(e){}

    return {
      tokenId: tokenId.toString(),
      name: meta.name,
      description: meta.description,
      image: meta.image?.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/"),
      typeLabel,
      extraInfo,
      role // Lưu thêm vai trò để hiển thị UI nếu cần
    };
  }
  const handleMintRequest = async () => {
    setStatus("⏳ Đang xử lý Mint...");
    
    try {
<<<<<<< HEAD
      const response = await axios.post('http://localhost:3001/api/mint', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        setStatus(`Thành công! Tx Hash: ${response.data.txHash.slice(0, 10)}...`);
=======
      const response = await mintNFT(account, nftType, selectedFile, formData);
      
      if (response.success) {
        setStatus(`Thành công! Tx Hash: ${response.txHash.slice(0, 10)}...`);
>>>>>>> origin/tai-huongdan
        setSelectedFile(null);
        const { signer } = await connectWalletHelper();
        fetchUserNFTs(account, signer);
      }
    } catch (error) {
      console.error(error);
      const errMsg = error.response?.data?.error || error.message;
      setStatus(`Lỗi: ${errMsg.slice(0, 50)}...`);
    }
  };

  const handleTransfer = async (tokenId) => {
    const toAddress = prompt("Nhập địa chỉ ví người nhận:");
    if (!toAddress) return;

    try {
      const txHash = await transferNFT(tokenId, toAddress);
      alert(`Đang chuyển NFT... Hash: ${txHash}`);
      
      const { signer } = await connectWalletHelper();
      fetchUserNFTs(account, signer);
    } catch (error) {
      console.error(error);
      alert("Chuyển nhượng thất bại! " + error.message);
    }
  };

  const handleRevoke = async (tokenId) => {
    if (!confirm("Bạn có chắc chắn muốn hủy vĩnh viễn NFT này không?")) return;

    try {
      await revokeNFT(tokenId);
      alert("Đã hủy thành công!");
      
      const { signer } = await connectWalletHelper();
      fetchUserNFTs(account, signer);
    } catch (error) {
      console.error(error);
      alert("Hủy thất bại!");
    }
  };

  const handleVerifyRequest = async () => {
    setStatus("⏳ Đang xác thực trên Blockchain...");
    setVerifyResult(null);

    try {
<<<<<<< HEAD
      const response = await axios.post('http://localhost:3001/api/verify', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setVerifyResult(response.data);
=======
      const result = await verifyDocument(verifyFile, account);
      setVerifyResult(result);
>>>>>>> origin/tai-huongdan
      setStatus("Đã có kết quả!");
    } catch (error) {
      console.error(error);
      setStatus("Lỗi khi xác thực: " + error.message);
    }
  };

  const handleTutorialComplete = () => {
    setShowTutorial(false);
    localStorage.setItem('hasSeenTutorial', 'true');
  };

  const handleStartTutorial = () => {
    setShowTutorial(true);
  };
  
  const closeNftModal = () => setSelectedNft(null);

  return (
    <div className={`app ${darkMode ? 'dark' : 'light'}`}>
      <Navbar 
        account={account}
        connectWallet={connectWallet}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        darkMode={darkMode}
        toggleTheme={toggleTheme}
      />

      <main className="main-content">
        <div className="container">
          {activeTab === 'mint' && (
            <MintSection
              account={account}
              nftType={nftType}
              setNftType={setNftType}
              selectedFile={selectedFile}
              setSelectedFile={setSelectedFile}
              formData={formData}
              setFormData={setFormData}
              handleMintRequest={handleMintRequest}
              status={status}
            />
          )}

          {activeTab === 'portfolio' && (
            <PortfolioSection
              loading={loading}
              myNFTs={myNFTs}
              onCardClick={setSelectedNft}
              onTransfer={handleTransfer}
              onRevoke={handleRevoke}
            />
          )}

          {activeTab === 'verify' && (
            <VerifySection
              verifyFile={verifyFile}
              setVerifyFile={setVerifyFile}
              handleVerifyRequest={handleVerifyRequest}
              status={status}
              verifyResult={verifyResult}
            />
          )}
        </div>
      </main>

      <NFTModal nft={selectedNft} onClose={closeNftModal} />

      <TutorialOverlay 
        isVisible={showTutorial} 
        onComplete={handleTutorialComplete} 
      />

      {!showTutorial && (
        <button className="welcome-tutorial-btn" onClick={handleStartTutorial}>
          📖 Help Tour
        </button>
      )}
    </div>
  );
}
export default App;