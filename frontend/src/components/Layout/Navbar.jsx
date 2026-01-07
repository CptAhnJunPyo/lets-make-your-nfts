import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

function Navbar({ account, connectWallet, activeTab, setActiveTab, darkMode, toggleTheme }) {
  const location = useLocation();
  
  return (
    <header className="navbar">
      <div className="nav-container">
        <div className="nav-left">
          <Link to="/" className="logo" style={{ textDecoration: 'none' }}>
            <span className="logo-icon">🎓</span>
            <span className="logo-text">CertiFi</span>
          </Link>
        </div>
        <nav className="nav-center">
          <Link 
            to="/home" 
            className={`nav-link ${location.pathname === '/home' ? 'active' : ''}`}
            style={{ textDecoration: 'none' }}
          >
            🏠 Home
          </Link>
          <button 
            className={`nav-link ${activeTab === 'mint' ? 'active' : ''}`} 
            onClick={() => setActiveTab('mint')}
            data-tab="mint"
          >
            ✨ Create
          </button>
          <button 
            className={`nav-link ${activeTab === 'portfolio' ? 'active' : ''}`} 
            onClick={() => setActiveTab('portfolio')}
            data-tab="portfolio"
          >
            💼 Portfolio
          </button>
          <button 
            className={`nav-link ${activeTab === 'verify' ? 'active' : ''}`} 
            onClick={() => setActiveTab('verify')}
            data-tab="verify"
          >
            ✅ Verify
          </button>
          <Link 
            to="/dashboard" 
            className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}
            style={{ textDecoration: 'none' }}
          >
            📊 Dashboard
          </Link>
          <Link 
            to="/history" 
            className={`nav-link ${location.pathname === '/history' ? 'active' : ''}`}
            style={{ textDecoration: 'none' }}
          >
            📜 History
          </Link>
        </nav>
        <div className="nav-right">
          <button className="theme-toggle" onClick={toggleTheme}>
            {darkMode ? '☀️' : '🌙'}
          </button>
          {!account ? (
            <button className="connect-wallet-btn" onClick={connectWallet}>
              Connect Wallet
            </button>
          ) : (
            <div className="wallet-connected">
              <span className="wallet-address">
                {account.slice(0, 6)}...{account.slice(-4)}
              </span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;
