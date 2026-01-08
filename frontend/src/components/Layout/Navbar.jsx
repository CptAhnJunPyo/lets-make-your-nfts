import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './Navbar.css';

function Navbar({ account, connectWallet, activeTab, setActiveTab, darkMode, toggleTheme }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };
  
  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };
  
  // Handle tab click - navigate to home and set active tab
  const handleTabClick = (tab) => {
    setActiveTab(tab);
    navigate('/');
    closeMobileMenu();
  };
  
  // Auto close menu when route changes
  useEffect(() => {
    closeMobileMenu();
  }, [location.pathname]);
  
  return (
    <header className="navbar">
      <div className="nav-container">
        <div className="nav-left">
          <Link to="/home" className="logo" style={{ textDecoration: 'none' }} onClick={closeMobileMenu}>
            <span className="logo-icon">🎓</span>
            <span className="logo-text">CertiFi</span>
          </Link>
        </div>
        <nav className={`nav-center ${mobileMenuOpen ? 'mobile-open' : ''}`}>
          <Link 
            to="/home" 
            className={`nav-link ${location.pathname === '/home' ? 'active' : ''}`}
            style={{ textDecoration: 'none' }}
            onClick={closeMobileMenu}
          >
            🏠 Home
          </Link>
          <button 
            className={`nav-link ${activeTab === 'mint' && location.pathname === '/' ? 'active' : ''}`} 
            onClick={() => handleTabClick('mint')}
            data-tab="mint"
          >
            ✨ Create
          </button>
          <button 
            className={`nav-link ${activeTab === 'portfolio' && location.pathname === '/' ? 'active' : ''}`} 
            onClick={() => handleTabClick('portfolio')}
            data-tab="portfolio"
          >
            💼 Portfolio
          </button>
          <button 
            className={`nav-link ${activeTab === 'verify' && location.pathname === '/' ? 'active' : ''}`} 
            onClick={() => handleTabClick('verify')}
            data-tab="verify"
          >
            ✅ Verify
          </button>
          <Link 
            to="/dashboard" 
            className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}
            style={{ textDecoration: 'none' }}
            onClick={closeMobileMenu}
          >
            📊 Dashboard
          </Link>
          <Link 
            to="/history" 
            className={`nav-link ${location.pathname === '/history' ? 'active' : ''}`}
            style={{ textDecoration: 'none' }}
            onClick={closeMobileMenu}
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
          <button className="mobile-menu-toggle" onClick={toggleMobileMenu}>
            <span className={`hamburger ${mobileMenuOpen ? 'open' : ''}`}>
              <span></span>
              <span></span>
              <span></span>
            </span>
          </button>
        </div>
      </div>
      {mobileMenuOpen && <div className="mobile-overlay" onClick={closeMobileMenu}></div>}
    </header>
  );
}

export default Navbar;
