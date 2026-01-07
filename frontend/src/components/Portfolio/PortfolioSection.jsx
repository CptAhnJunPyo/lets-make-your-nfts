import NFTCard from './NFTCard';
import './PortfolioSection.css';

function PortfolioSection({ loading, myNFTs, onCardClick, onTransfer, onRevoke }) {
  return (
    <section className="portfolio-section">
      <div className="section-header">
        <h1 className="page-title">My Collection</h1>
        <p className="page-subtitle">Manage your blockchain assets</p>
      </div>
      
      {loading ? (
        <div className="loading-state">Loading...</div>
      ) : myNFTs.length === 0 ? (
        <div className="empty-portfolio">
          <h3>No items found</h3>
        </div>
      ) : (
        <div className="certificates-grid">
          {myNFTs.map((nft, index) => (
            <NFTCard 
              key={nft.tokenId || index}
              nft={nft}
              onCardClick={onCardClick}
              onTransfer={onTransfer}
              onRevoke={onRevoke}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default PortfolioSection;
