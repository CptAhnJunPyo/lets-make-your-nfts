import { useState } from 'react';
import { unlockAndVerifyNFT, connectWallet } from '../../utils/helpers'; 
import './NFTModal.css'; // Nếu có file css

const NFTModal = ({ nft, onClose }) => {
    const [decryptedImg, setDecryptedImg] = useState(null);
    const [status, setStatus] = useState('locked'); // 'locked', 'unlocking', 'verified', 'failed'
    const [integrity, setIntegrity] = useState(null);

    if (!nft) return null;

    const handleUnlockClick = async () => {
        try {
            setStatus('unlocking');

            const { signer } = await connectWallet();
            
            const result = await unlockAndVerifyNFT(signer, nft);
            
            setDecryptedImg(result.decryptedImage);
            setIntegrity(result.isVerified);
            setStatus('verified');

        } catch (error) {
            console.error(error);
            alert("Lỗi: " + error.message);
            setStatus('failed');
        }
    };

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <button className="close-btn" onClick={onClose}>&times;</button>
                
                <div className="modal-grid">
                    <div className="modal-image-col">
                        {decryptedImg ? (
                            <div className="image-wrapper">
                                <img src={decryptedImg} alt="Decrypted Content" />                                
                                <div className={`integrity-badge ${integrity ? 'valid' : 'invalid'}`}>
                                    {integrity ? "✅ Verified Original" : "⚠️ File Corrupted"}
                                </div>
                            </div>
                        ) : (
                            <div className="locked-state">
                                <div style={{fontSize: '4rem'}}>🔐</div>
                                <h3>Encrypted Content</h3>
                                <p>Nội dung đã được mã hóa bảo mật.</p>
                                <button 
                                    className="unlock-btn" 
                                    onClick={handleUnlockClick} // Gọi hàm ở đây
                                    disabled={status === 'unlocking'}
                                >
                                    {status === 'unlocking' ? "Decrypting..." : "Ký để Xem & Xác thực"}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* --- CỘT PHẢI: THÔNG TIN --- */}
                    <div className="modal-info-col">
                        <span className="token-id">Token ID #{nft.tokenId}</span>
                        <h2>{nft.name}</h2>
                        <div className="info-box">
                            <p><strong>Type:</strong> {nft.typeLabel}</p>
                            <p><strong>Desc:</strong> {nft.description}</p>
                            {nft.extraInfo && <p className="highlight-info">{nft.extraInfo}</p>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NFTModal;