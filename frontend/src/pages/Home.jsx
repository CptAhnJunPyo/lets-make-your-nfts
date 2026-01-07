import { Link } from 'react-router-dom';
import './Home.css';

function Home({ account, darkMode }) {
  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">🎓 Certificate NFT Platform</div>
          <h1 className="hero-title">
            Transform Your Achievements
            <span className="gradient-text"> Into Digital Assets</span>
          </h1>
          <p className="hero-description">
            Secure, verifiable, and永久 blockchain-based certificates.
            Create, manage, and verify educational credentials with ease.
          </p>
          <div className="hero-buttons">
            {account ? (
              <Link to="/" className="btn-primary">
                ✨ Create NFT Certificate
              </Link>
            ) : (
              <button className="btn-primary" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
                🔗 Connect Wallet to Start
              </button>
            )}
            <Link to="/dashboard" className="btn-secondary">
              📊 View Dashboard
            </Link>
          </div>
          
          {/* Stats */}
          <div className="hero-stats">
            <div className="stat-item">
              <div className="stat-number">10K+</div>
              <div className="stat-label">NFTs Minted</div>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <div className="stat-number">5K+</div>
              <div className="stat-label">Active Users</div>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <div className="stat-number">15K+</div>
              <div className="stat-label">Verified Certs</div>
            </div>
          </div>
        </div>

        {/* Floating Cards */}
        <div className="hero-visual">
          <div className="floating-card card-1">
            <div className="card-icon">🎓</div>
            <div className="card-title">Standard Certificate</div>
            <div className="card-tag">Most Popular</div>
          </div>
          <div className="floating-card card-2">
            <div className="card-icon">🤝</div>
            <div className="card-title">Joint Contract</div>
            <div className="card-tag">Collaborative</div>
          </div>
          <div className="floating-card card-3">
            <div className="card-icon">🎟️</div>
            <div className="card-title">Voucher NFT</div>
            <div className="card-tag">Special</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="section-header">
          <h2 className="section-title">Why Choose CertiFi?</h2>
          <p className="section-subtitle">Everything you need to manage digital certificates on blockchain</p>
        </div>
        
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🔒</div>
            <h3 className="feature-title">Blockchain Security</h3>
            <p className="feature-description">
              Your certificates are stored on Ethereum blockchain, ensuring immutability and永久 preservation.
            </p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">✅</div>
            <h3 className="feature-title">Easy Verification</h3>
            <p className="feature-description">
              Verify any certificate instantly by uploading the document - no manual checking required.
            </p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">💼</div>
            <h3 className="feature-title">Portfolio Management</h3>
            <p className="feature-description">
              View all your certificates in one place, transfer ownership, or revoke when needed.
            </p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3 className="feature-title">Analytics Dashboard</h3>
            <p className="feature-description">
              Track your NFT statistics, view distribution charts, and monitor activity trends.
            </p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">📜</div>
            <h3 className="feature-title">Transaction History</h3>
            <p className="feature-description">
              Complete audit trail of all mints, transfers, and burns with Etherscan integration.
            </p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">🎨</div>
            <h3 className="feature-title">Custom Types</h3>
            <p className="feature-description">
              Create standard certificates, joint contracts, or special vouchers based on your needs.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2 className="cta-title">Ready to Get Started?</h2>
          <p className="cta-description">
            Join thousands of users who trust CertiFi for their digital credentials
          </p>
          <Link to="/" className="cta-button">
            Start Creating Now →
          </Link>
        </div>
      </section>
    </div>
  );
}

export default Home;
