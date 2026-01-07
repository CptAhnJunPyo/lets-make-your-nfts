import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, contractABI } from '../utils/constants';
import './History.css';

function History({ account, darkMode }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // all, mint, transfer, burn

  useEffect(() => {
    if (account && window.ethereum) {
      fetchTransactionHistory();
    }
  }, [account]);

  const fetchTransactionHistory = async () => {
    setLoading(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, provider);
      
      // Fetch các events
      const mintFilter = contract.filters.NFTMinted();
      const transferFilter = contract.filters.Transfer();
      
      const mintEvents = await contract.queryFilter(mintFilter);
      const transferEvents = await contract.queryFilter(transferFilter);
      
      const allTxs = [];
      
      // Process mint events
      for (const event of mintEvents) {
        const block = await event.getBlock();
        allTxs.push({
          type: 'Mint',
          tokenId: event.args.tokenId?.toString(),
          from: 'Contract',
          to: event.args.to,
          timestamp: block.timestamp,
          txHash: event.transactionHash,
          blockNumber: event.blockNumber
        });
      }
      
      // Process transfer events
      for (const event of transferEvents) {
        if (event.args.from !== ethers.ZeroAddress) { // Không phải mint
          const block = await event.getBlock();
          allTxs.push({
            type: 'Transfer',
            tokenId: event.args.tokenId?.toString(),
            from: event.args.from,
            to: event.args.to,
            timestamp: block.timestamp,
            txHash: event.transactionHash,
            blockNumber: event.blockNumber
          });
        }
      }
      
      // Sort by timestamp desc
      allTxs.sort((a, b) => b.timestamp - a.timestamp);
      setTransactions(allTxs);
      
    } catch (error) {
      console.error('Error fetching transaction history:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTxs = transactions.filter(tx => {
    if (filter === 'all') return true;
    if (filter === 'mint') return tx.type === 'Mint';
    if (filter === 'transfer') return tx.type === 'Transfer';
    return true;
  });

  const formatAddress = (addr) => {
    if (addr === 'Contract') return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const getEtherscanLink = (txHash) => {
    return `https://sepolia.etherscan.io/tx/${txHash}`;
  };

  if (!account) {
    return (
      <div className="history-page">
        <div className="connect-prompt">
          <div className="prompt-icon">🔗</div>
          <h2>Connect Your Wallet</h2>
          <p>Please connect your wallet to view transaction history</p>
        </div>
      </div>
    );
  }

  return (
    <div className="history-page">
      <div className="history-header">
        <div>
          <h1 className="history-title">📜 Transaction History</h1>
          <p className="history-subtitle">Complete audit trail of all your NFT activities</p>
        </div>
        <button onClick={fetchTransactionHistory} className="refresh-btn" disabled={loading}>
          🔄 {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {/* Filters */}
      <div className="filter-tabs">
        <button 
          className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All ({transactions.length})
        </button>
        <button 
          className={`filter-tab ${filter === 'mint' ? 'active' : ''}`}
          onClick={() => setFilter('mint')}
        >
          🎨 Mints ({transactions.filter(tx => tx.type === 'Mint').length})
        </button>
        <button 
          className={`filter-tab ${filter === 'transfer' ? 'active' : ''}`}
          onClick={() => setFilter('transfer')}
        >
          🔄 Transfers ({transactions.filter(tx => tx.type === 'Transfer').length})
        </button>
      </div>

      {/* Transaction List */}
      <div className="transactions-container">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading transaction history...</p>
          </div>
        ) : filteredTxs.length > 0 ? (
          <div className="transactions-list">
            {filteredTxs.map((tx, index) => (
              <div key={index} className="transaction-card">
                <div className="tx-icon">
                  {tx.type === 'Mint' ? '🎨' : '🔄'}
                </div>
                <div className="tx-content">
                  <div className="tx-header">
                    <span className={`tx-type ${tx.type.toLowerCase()}`}>{tx.type}</span>
                    <span className="tx-token">Token #{tx.tokenId}</span>
                  </div>
                  <div className="tx-addresses">
                    <span className="address-label">From:</span>
                    <span className="address-value">{formatAddress(tx.from)}</span>
                    <span className="arrow">→</span>
                    <span className="address-label">To:</span>
                    <span className="address-value">{formatAddress(tx.to)}</span>
                  </div>
                  <div className="tx-meta">
                    <span className="tx-date">📅 {formatDate(tx.timestamp)}</span>
                    <span className="tx-block">Block #{tx.blockNumber}</span>
                  </div>
                </div>
                <a 
                  href={getEtherscanLink(tx.txHash)} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="etherscan-link"
                  title="View on Etherscan"
                >
                  🔍
                </a>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h3>No Transactions Found</h3>
            <p>Start creating NFTs to see your transaction history here</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default History;
