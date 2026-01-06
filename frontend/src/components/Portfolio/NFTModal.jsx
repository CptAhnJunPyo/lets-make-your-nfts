import './NFTModal.css';

function NFTModal({ nft, onClose }) {
  if (!nft) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>&times;</button>
        
        <div className="modal-grid">
          {/* Cột Trái: Ảnh Full Size */}
          <div className="modal-image-col">
            <img 
              src={nft.image} 
              alt={nft.name} 
              onError={(e) => {e.target.src = "https://via.placeholder.com/600?text=No+Image"}} 
            />
          </div>

          {/* Cột Phải: Metadata Tóm Tắt */}
          <div className="modal-info-col">
            <div className="modal-header">
              <span className="modal-token-id">Token ID #{nft.tokenId}</span>
              <span className="modal-type-tag">{nft.typeLabel}</span>
            </div>
            
            <h2 className="modal-title">{nft.name}</h2>
            
            <div className="modal-description-box">
              <label>Description</label>
              <p>{nft.description || "No description provided."}</p>
            </div>

            <div className="modal-attributes">
              {nft.typeLabel === 'Joint Contract' && (
                <div className="attr-item highlight-blue">
                  <label>🤝 Partner / Co-Owner</label>
                  <p>{nft.extraInfo?.replace('Partner: ', '') || 'Loading...'}</p>
                </div>
              )}

              {nft.typeLabel === 'Voucher' && (
                <div className="attr-item highlight-gold">
                  <label>💰 Value & Status</label>
                  <p>{nft.extraInfo?.replace('Value: ', '') || 'Loading...'}</p>
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
              <button 
                className="modal-action-btn" 
                onClick={() => { alert("Chức năng Share đang phát triển!"); }}
              >
                Share Link
              </button>
              <button 
                className="modal-action-btn primary" 
                onClick={() => window.open(nft.image, '_blank')}
              >
                View Original
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NFTModal;
