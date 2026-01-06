import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import axios from 'axios';
import './App.css';

const CONTRACT_ADDRESS = "0x58d9A8149386b548b7e9798717C71132e5e9EF26";
const contractABI = [
  "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function safeTransferFrom(address from, address to, uint256 tokenId)",
  "function burn(uint256 tokenId)",
  "function tokenDetails(uint256 tokenId) view returns (uint8 tType, address coOwner, uint256 value, bool isRedeemed)"
];

function App() {
  const [account, setAccount] = useState(null);
  const [myNFTs, setMyNFTs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [selectedNft, setSelectedNft] = useState(null);
  const [activeTab, setActiveTab] = useState('mint');
  const [darkMode, setDarkMode] = useState(false);

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
  }, []);

  const toggleTheme = () => {
    const newTheme = !darkMode;
    setDarkMode(newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        setAccount(address);
        fetchUserNFTs(address, signer);
      } catch (error) {
        console.error(error);
        alert("Lỗi kết nối ví: " + error.message);
      }
    } else {
      alert("Vui lòng cài đặt Metamask!");
    }
  };

  const fetchUserNFTs = async (userAddress, signer) => {
    setLoading(true);
    setMyNFTs([]);
    
    try {
      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, signer);
      const balanceBigInt = await contract.balanceOf(userAddress);
      const balance = Number(balanceBigInt);

      const items = [];
      for (let i = 0; i < balance; i++) {
        try {
          const tokenId = await contract.tokenOfOwnerByIndex(userAddress, i);
          
          const tokenURI = await contract.tokenURI(tokenId);
          const httpURI = tokenURI.replace("ipfs://", "https://cloudflare-ipfs.com/ipfs/");
          
          let meta = { name: `NFT #${tokenId}`, description: "", image: "" };
          try {
             const metaRes = await axios.get(httpURI);
             meta = metaRes.data;
          } catch(e) { console.warn("Lỗi fetch meta IPFS", e); }

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
          } catch(e) { console.warn("Lỗi fetch tokenDetails", e); }

          items.push({
            tokenId: tokenId.toString(),
            name: meta.name,
            description: meta.description,
            image: meta.image ? meta.image.replace("ipfs://", "https://cloudflare-ipfs.com/ipfs/") : "",
            typeLabel,
            extraInfo
          });
        } catch (err) {
          console.error("Lỗi load item:", err);
        }
      }
      setMyNFTs(items);
    } catch (error) {
      console.error("Lỗi fetch NFT:", error);
    }
    setLoading(false);
  };

  const handleMintRequest = async () => {
    if (!account) return alert("Chưa kết nối ví!");
    if (!selectedFile) return alert("Vui lòng chọn file ảnh/PDF!");
    
    if (nftType === 'joint' && !ethers.isAddress(formData.coOwner)) return alert("Địa chỉ Co-Owner không hợp lệ!");
    if (nftType === 'voucher' && !formData.voucherValue) return alert("Vui lòng nhập giá trị Voucher!");

    setStatus("⏳ Đang xử lý Mint...");
    
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

    try {
      const response = await axios.post('https://lets-make-your-nfts.onrender.com/api/mint', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        setStatus(`Thành công! Tx Hash: ${response.data.txHash.slice(0, 10)}...`);
        setSelectedFile(null);
        fetchUserNFTs(account, new ethers.BrowserProvider(window.ethereum).getSigner());
      }
    } catch (error) {
      console.error(error);
      const errMsg = error.response?.data?.error || error.message;
      setStatus(`Thất bại: ${errMsg}`);
    }
  };

  const handleTransfer = async (tokenId) => {
    const toAddress = prompt("Nhập địa chỉ ví người nhận:");
    if (!toAddress || !ethers.isAddress(toAddress)) return alert("Địa chỉ không hợp lệ");

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, signer);
      const from = await signer.getAddress();

      const tx = await contract["safeTransferFrom(address,address,uint256)"](from, toAddress, tokenId);
      alert(`Đang chuyển NFT... Hash: ${tx.hash}`);
      await tx.wait();
      
      alert("Chuyển thành công!");
      fetchUserNFTs(account, signer);
    } catch (error) {
      console.error(error);
      alert("Chuyển nhượng thất bại!");
    }
  };

  const handleRevoke = async (tokenId) => {
    if (!confirm("Bạn có chắc chắn muốn hủy vĩnh viễn NFT này không?")) return;

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, signer);

      const tx = await contract.burn(tokenId);
      alert(`Đang hủy NFT...`);
      await tx.wait();

      alert("Đã hủy thành công!");
      fetchUserNFTs(account, signer);
    } catch (error) {
      console.error(error);
      alert("Hủy thất bại!");
    }
  };

  const handleVerifyRequest = async () => {
    if (!verifyFile) return alert("Vui lòng chọn file gốc để kiểm tra!");
    setStatus(" Đang xác thực trên Blockchain...");
    setVerifyResult(null);

    const form = new FormData();
    form.append('verifyFile', verifyFile);
    form.append('claimerAddress', account || "");

    try {
      const response = await axios.post('https://lets-make-your-nfts.onrender.com/api/verify', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setVerifyResult(response.data);
      setStatus("Đã có kết quả!");
    } catch (error) {
      console.error(error);
      setStatus("Lỗi khi xác thực.");
    }
  };
  const closeNftModal = () => setSelectedNft(null);

  return (
    <div className={`app ${darkMode ? 'dark' : 'light'}`}>
      
      <header className="navbar">
        <div className="nav-container">
          <div className="nav-left">
            <div className="logo"><span className="logo-icon">🎓</span><span className="logo-text">CertiFi</span></div>
          </div>
          <nav className="nav-center">
            <button className={`nav-link ${activeTab === 'mint' ? 'active' : ''}`} onClick={() => setActiveTab('mint')}>Create</button>
            <button className={`nav-link ${activeTab === 'portfolio' ? 'active' : ''}`} onClick={() => setActiveTab('portfolio')}>Portfolio</button>
            <button className={`nav-link ${activeTab === 'verify' ? 'active' : ''}`} onClick={() => setActiveTab('verify')}>Verify</button>
          </nav>
          <div className="nav-right">
            <button className="theme-toggle" onClick={toggleTheme}>{darkMode ? '☀️' : '🌙'}</button>
            {!account ? <button className="connect-wallet-btn" onClick={connectWallet}>Connect Wallet</button> : 
            <div className="wallet-connected"><span className="wallet-address">{account.slice(0,6)}...{account.slice(-4)}</span></div>}
          </div>
        </div>
      </header>

      <main className="main-content">
      <div className="container">
          
          {activeTab === 'mint' && (
            <section className="create-section">
              <div className="section-header">
                <h1 className="page-title">Issue New NFT</h1>
                <p className="page-subtitle">Select type: Certificate, Contract, or Voucher</p>
              </div>
              
              <div className="create-container">
                <div className="upload-area">
                    <div className="upload-zone">
                        <input type="file" id="file-upload" className="file-input-hidden" onChange={(e) => setSelectedFile(e.target.files[0])} />
                        <label htmlFor="file-upload" className="upload-label">
                            {selectedFile ? <div className="file-preview"><div className="file-name">{selectedFile.name}</div></div> : <div className="upload-placeholder">Upload File</div>}
                        </label>
                    </div>
                </div>

                <div className="form-panel">
                  <div className="form-content">
                    
                    <div className="input-group">
                        <label className="input-label">NFT Type</label>
                        <select className="input-field" value={nftType} onChange={(e) => setNftType(e.target.value)} style={{height: '45px', fontWeight: 'bold'}}>
                            <option value="standard">Standard Certificate</option>
                            <option value="joint">Joint Contract</option>
                            <option value="voucher">VIP Voucher</option>
                        </select>
                    </div>

                    
                    {nftType === 'joint' && (
                         <div className="input-group highlight-box" style={{background: '#eff6ff', padding: 15, borderRadius: 8, border: '1px solid #bfdbfe'}}>
                             <label className="input-label" style={{color: '#1d4ed8', fontWeight: 'bold'}}>Partner Wallet Address</label>
                             <input type="text" className="input-field" placeholder="0x..." value={formData.coOwner} onChange={(e) => setFormData({...formData, coOwner: e.target.value})} />
                             <small style={{color:'#64748b'}}>The person who co-owns this contract.</small>
                         </div>
                    )}

                    {nftType === 'voucher' && (
                         <div className="input-group highlight-box" style={{background: '#fffbeb', padding: 15, borderRadius: 8, border: '1px solid #fde68a'}}>
                             <label className="input-label" style={{color: '#b45309', fontWeight: 'bold'}}>Voucher Value ($)</label>
                             <input type="number" className="input-field" placeholder="50" value={formData.voucherValue} onChange={(e) => setFormData({...formData, voucherValue: e.target.value})} />
                         </div>
                    )}

                    <div className="input-group" style={{marginTop: '15px'}}>
                        <label className="input-label">Title / Name</label>
                        <input type="text" className="input-field" 
                            placeholder={nftType === 'standard' ? "Bachelor of Science" : (nftType === 'joint' ? "House Rental Agreement" : "Gift Card $50")}
                            value={formData.certName} onChange={(e) => setFormData({...formData, certName: e.target.value})} 
                        />
                    </div>
                    
                    <div className="input-group">
                      <label className="input-label">Description</label>
                      <textarea className="input-field" rows="2" placeholder="Details about this item..." value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
                    </div>

                    {nftType === 'standard' && (
                        <div style={{marginTop: '15px', padding: '15px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0'}}>
                            <h4 style={{margin: '0 0 10px 0', color: '#475569'}}>Certificate Details</h4>
                            <div className="input-group">
                                <label className="input-label">Recipient Name</label>
                                <input type="text" className="input-field" placeholder="Alice Nguyen" value={formData.studentName} onChange={(e) => setFormData({...formData, studentName: e.target.value})} />
                            </div>
                            
                            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px'}}>
                                <div className="input-group">
                                    <label className="input-label">Issuer</label>
                                    <input type="text" className="input-field" value={formData.issuerName} onChange={(e) => setFormData({...formData, issuerName: e.target.value})} />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Program</label>
                                    <input type="text" className="input-field" value={formData.programName} onChange={(e) => setFormData({...formData, programName: e.target.value})} />
                                </div>
                            </div>
                             <div className="input-group">
                                <label className="input-label">Issued At</label>
                                <input type="date" className="input-field" value={formData.issuedAt} onChange={(e) => setFormData({...formData, issuedAt: e.target.value})} />
                            </div>
                        </div>
                    )}
                    
                    <button className="create-btn" onClick={handleMintRequest} disabled={!account || !selectedFile} style={{marginTop: '20px'}}>
                      Mint {nftType.toUpperCase()}
                    </button>
                    
                    {status && <div className="status-alert">{status}</div>}
                  </div>
                </div>
              </div>
            </section>
          )}

        
{activeTab === 'portfolio' && (
            <section className="portfolio-section">
              <div className="section-header">
                <h1 className="page-title">My Collection</h1>
                <p className="page-subtitle">Manage your blockchain assets</p>
              </div>
              
              {loading ? <div className="loading-state">Loading...</div> : myNFTs.length === 0 ? (
                <div className="empty-portfolio"><h3>No items found</h3></div>
              ) : (
                <div className="certificates-grid">
                  {myNFTs.map((nft, index) => (
                    <div 
                        key={nft.tokenId || index} 
                        className="certificate-card"
                        onClick={() => setSelectedNft(nft)}
                        style={{cursor: 'pointer'}} 
                    >
                      <div className="card-media">
                        <img src={nft.image} alt="NFT" className="certificate-image" onError={(e)=>{e.target.src="https://via.placeholder.com/300?text=No+Image"}} />
                        <div className="card-overlay"><span className="token-id">#{nft.tokenId}</span></div>
                      </div>
                      <div className="card-body">
                        <div style={{display:'flex', justifyContent:'space-between'}}>
                             <h3 className="certificate-name">{nft.name}</h3>
                             <span className={`badge-type ${nft.typeLabel === 'Voucher' ? 'badge-voucher' : nft.typeLabel === 'Joint Contract' ? 'badge-joint' : 'badge-std'}`}>
                                {nft.typeLabel}
                             </span>
                        </div>
                        <p className="certificate-description">{nft.extraInfo || nft.description?.substring(0,40)}...</p>
                        
                        <div className="card-actions">
                          <button className="action-button secondary" onClick={(e) => { e.stopPropagation(); handleTransfer(nft.tokenId); }}>Transfer</button>
                          <button className="action-button danger" onClick={(e) => { e.stopPropagation(); handleRevoke(nft.tokenId); }}>Revoke</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {activeTab === 'verify' && (
            <section className="create-section">
              <div className="section-header"><h1 className="page-title">Verify Document</h1></div>
              <div className="create-container">
                <div className="upload-area">
                    <div className="upload-zone">
                        <input type="file" id="verify" className="file-input-hidden" onChange={(e)=>setVerifyFile(e.target.files[0])}/>
                        <label htmlFor="verify" className="upload-label">{verifyFile ? verifyFile.name : "Upload Original File"}</label>
                    </div>
                </div>
                <div className="form-panel">
                    <button className="create-btn" onClick={handleVerifyRequest} disabled={!verifyFile}>Verify Integrity</button>
                    {status && <div className="status-alert">{status}</div>}
                    
                    {verifyResult && (
                      <div className={`verify-result ${verifyResult.verified ? 'valid' : 'invalid'}`}>
                        <h3>{verifyResult.verified ? "VALID DOCUMENT" : "INVALID DOCUMENT"}</h3>
                        {verifyResult.verified && (
                          <div className="verify-details" style={{textAlign:'left'}}>
                            <p><strong>Name:</strong> {verifyResult.metadata?.name}</p>
                            <p><strong>Type:</strong> {verifyResult.details?.type}</p>
                            
                            {verifyResult.details?.typeCode === 1 && <p style={{color:'blue'}}><strong>Co-Owner:</strong> {verifyResult.details.coOwner}</p>}
                            {verifyResult.details?.typeCode === 2 && <p style={{color:'orange'}}><strong>Value:</strong> ${verifyResult.details.value} ({verifyResult.details.isRedeemed ? 'USED' : 'ACTIVE'})</p>}
                            
                            <hr/>
                            <p className="ownership-tag">{verifyResult.isYourCert ? "You own this!" : "You do NOT own this."}</p>
                          </div>
                        )}
                      </div>
                    )}
                </div>
              </div>
            </section>
          )}

        </div>
      </main>
      {selectedNft && (
        <div className="modal-backdrop" onClick={closeNftModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close-btn" onClick={closeNftModal}>&times;</button>
                
                <div className="modal-grid">
                    {/* Cột Trái: Ảnh Full Size */}
                    <div className="modal-image-col">
                        <img src={selectedNft.image} alt={selectedNft.name} onError={(e)=>{e.target.src="https://via.placeholder.com/600?text=No+Image"}} />
                    </div>

                    {/* Cột Phải: Metadata Tóm Tắt */}
                    <div className="modal-info-col">
                        <div className="modal-header">
                            <span className="modal-token-id">Token ID #{selectedNft.tokenId}</span>
                            <span className="modal-type-tag">{selectedNft.typeLabel}</span>
                        </div>
                        
                        <h2 className="modal-title">{selectedNft.name}</h2>
                        
                        <div className="modal-description-box">
                            <label>Description</label>
                            <p>{selectedNft.description || "No description provided."}</p>
                        </div>

                        <div className="modal-attributes">
                            {selectedNft.typeLabel === 'Joint Contract' && (
                                <div className="attr-item highlight-blue">
                                    <label>🤝 Partner / Co-Owner</label>
                                    <p>{selectedNft.extraInfo?.replace('Partner: ', '') || 'Loading...'}</p>
                                </div>
                            )}

                            {selectedNft.typeLabel === 'Voucher' && (
                                <div className="attr-item highlight-gold">
                                    <label>💰 Value & Status</label>
                                    <p>{selectedNft.extraInfo?.replace('Value: ', '') || 'Loading...'}</p>
                                </div>
                            )}

                            <div className="attr-grid">
                                <div className="attr-item">
                                    <label>Chain</label>
                                    <p>Sepolia</p>
                                </div>
                                <div className="attr-item">
                                    <label>Standard</label>
                                    <p>ERC-721</p>
                                </div>
                            </div>
                        </div>

                        <div className="modal-actions">
                             <button className="modal-action-btn" onClick={() => { alert("Chức năng Share đang phát triển!"); }}>
                                 Share Link
                             </button>
                             <button className="modal-action-btn primary" onClick={() => window.open(selectedNft.image, '_blank')}>
                                 View Original
                             </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
export default App;