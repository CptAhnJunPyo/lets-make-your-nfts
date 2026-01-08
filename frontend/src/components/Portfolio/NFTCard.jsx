import './NFTCard.css';

function NFTCard({ nft, onCardClick, onTransfer, onRevoke }) {
  return (
    <div 
      className="certificate-card"
      onClick={() => onCardClick(nft)}
      style={{cursor: 'pointer'}} 
    >
      <div className="card-media">
        <img 
          src="/assets/lock.png" 
          alt="NFT" 
          className="certificate-image"  
        />
        <div className="card-overlay">
          <span className="token-id">#{nft.tokenId}</span>
        </div>
      </div>
      <div className="card-body">
        <div style={{display:'flex', justifyContent:'space-between'}}>
          <h3 className="certificate-name">{nft.name}</h3>
          <span className={`badge-type ${nft.typeLabel === 'Voucher' ? 'badge-voucher' : nft.typeLabel === 'Joint Contract' ? 'badge-joint' : 'badge-std'}`}>
            {nft.typeLabel}
          </span>
        </div>
        <p className="certificate-description">
          {nft.extraInfo || nft.description?.substring(0,40)}...
        </p>
        
        <div className="card-actions">
          <button 
            className="action-button secondary" 
            onClick={(e) => { 
              e.stopPropagation(); 
              onTransfer(nft.tokenId); 
            }}
          >
            Transfer
          </button>
          <button 
            className="action-button danger" 
            onClick={(e) => { 
              e.stopPropagation(); 
              onRevoke(nft.tokenId); 
            }}
          >
            Revoke
          </button>
        </div>
      </div>
    </div>
  );
}

export default NFTCard;
