import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ethers } from 'ethers';
import './styles/theme.css';
import './styles/global.css';
import './components/Layout/TutorialOverlay.css';
import Navbar from './components/Layout/Navbar';
import MintSection from './components/Mint/MintSection';
import PortfolioSection from './components/Portfolio/PortfolioSection';
import VerifySection from './components/Verify/VerifySection';
import NFTModal from './components/Portfolio/NFTModal';
import TutorialOverlay from './components/Layout/TutorialOverlay';

// Import các trang mới
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import History from './pages/History';

import { 
  connectWallet as connectWalletHelper, 
  fetchUserNFTs as fetchUserNFTsHelper,
  mintNFT,
  transferNFT,
  revokeNFT,
  verifyDocument
} from './utils/helpers';

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
      const items = await fetchUserNFTsHelper(userAddress, signer);
      setMyNFTs(items);
    } catch (error) {
      console.error("Lỗi fetch NFT:", error);
    }
    setLoading(false);
  };

  const handleMintRequest = async () => {
    setStatus("⏳ Đang xử lý Mint...");
    
    try {
      const response = await mintNFT(account, nftType, selectedFile, formData);
      
      if (response.success) {
        setStatus(`Thành công! Tx Hash: ${response.txHash.slice(0, 10)}...`);
        setSelectedFile(null);
        const { signer } = await connectWalletHelper();
        fetchUserNFTs(account, signer);
      }
    } catch (error) {
      console.error(error);
      const errMsg = error.response?.data?.error || error.message;
      setStatus(`Thất bại: ${errMsg}`);
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
      const result = await verifyDocument(verifyFile, account);
      setVerifyResult(result);
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

      <Routes>
        {/* Trang Home mới */}
        <Route path="/home" element={<Home account={account} darkMode={darkMode} />} />
        
        {/* Trang Dashboard mới */}
        <Route path="/dashboard" element={<Dashboard account={account} myNFTs={myNFTs} darkMode={darkMode} />} />
        
        {/* Trang History mới */}
        <Route path="/history" element={<History account={account} darkMode={darkMode} />} />
        
        {/* Trang chính - GIỮ NGUYÊN LOGIC CŨ */}
        <Route path="/*" element={
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
        } />
      </Routes>

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