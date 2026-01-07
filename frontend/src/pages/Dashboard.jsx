import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, LineChart, Line } from 'recharts';
import './Dashboard.css';

function Dashboard({ account, myNFTs, darkMode }) {
  const [stats, setStats] = useState({
    total: 0,
    standard: 0,
    joint: 0,
    voucher: 0,
  });

  useEffect(() => {
    if (myNFTs && myNFTs.length > 0) {
      const standard = myNFTs.filter(nft => nft.typeLabel === 'Standard').length;
      const joint = myNFTs.filter(nft => nft.typeLabel === 'Joint Contract').length;
      const voucher = myNFTs.filter(nft => nft.typeLabel === 'Voucher').length;
      
      setStats({
        total: myNFTs.length,
        standard,
        joint,
        voucher,
      });
    }
  }, [myNFTs]);

  const pieData = [
    { name: 'Standard', value: stats.standard, color: '#10b981' },
    { name: 'Joint Contract', value: stats.joint, color: '#3b82f6' },
    { name: 'Voucher', value: stats.voucher, color: '#f59e0b' }
  ];

  const monthlyData = [
    { month: 'Jan', mints: 12, transfers: 5 },
    { month: 'Feb', mints: 19, transfers: 8 },
    { month: 'Mar', mints: 15, transfers: 6 },
    { month: 'Apr', mints: 25, transfers: 12 },
    { month: 'May', mints: 22, transfers: 10 },
    { month: 'Jun', mints: 30, transfers: 15 },
  ];

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b'];

  if (!account) {
    return (
      <div className="dashboard-page">
        <div className="connect-prompt">
          <div className="prompt-icon">🔗</div>
          <h2>Connect Your Wallet</h2>
          <p>Please connect your wallet to view your dashboard analytics</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1 className="dashboard-title">📊 Analytics Dashboard</h1>
        <p className="dashboard-subtitle">Overview of your NFT certificate activity</p>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            📦
          </div>
          <div className="stat-info">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total NFTs</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
            🎓
          </div>
          <div className="stat-info">
            <div className="stat-value">{stats.standard}</div>
            <div className="stat-label">Standard Certs</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }}>
            🤝
          </div>
          <div className="stat-info">
            <div className="stat-value">{stats.joint}</div>
            <div className="stat-label">Joint Contracts</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
            🎟️
          </div>
          <div className="stat-info">
            <div className="stat-value">{stats.voucher}</div>
            <div className="stat-label">Vouchers</div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-grid">
        {/* Pie Chart */}
        <div className="chart-card">
          <h3 className="chart-title">NFT Distribution by Type</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="chart-legend">
            {pieData.map((item, index) => (
              <div key={index} className="legend-item">
                <div className="legend-color" style={{ background: item.color }}></div>
                <span>{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bar Chart */}
        <div className="chart-card">
          <h3 className="chart-title">Monthly Activity</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <XAxis dataKey="month" stroke={darkMode ? '#9ca3af' : '#6b7280'} />
              <YAxis stroke={darkMode ? '#9ca3af' : '#6b7280'} />
              <Tooltip 
                contentStyle={{ 
                  background: darkMode ? '#1f2937' : '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Bar dataKey="mints" fill="#667eea" radius={[8, 8, 0, 0]} />
              <Bar dataKey="transfers" fill="#10b981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Line Chart */}
        <div className="chart-card chart-card-wide">
          <h3 className="chart-title">Growth Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <XAxis dataKey="month" stroke={darkMode ? '#9ca3af' : '#6b7280'} />
              <YAxis stroke={darkMode ? '#9ca3af' : '#6b7280'} />
              <Tooltip 
                contentStyle={{ 
                  background: darkMode ? '#1f2937' : '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="mints" 
                stroke="#667eea" 
                strokeWidth={3}
                dot={{ fill: '#667eea', r: 5 }}
              />
              <Line 
                type="monotone" 
                dataKey="transfers" 
                stroke="#10b981" 
                strokeWidth={3}
                dot={{ fill: '#10b981', r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="recent-activity">
        <h3 className="section-title">Recent NFTs</h3>
        <div className="activity-list">
          {myNFTs && myNFTs.length > 0 ? (
            myNFTs.slice(0, 5).map((nft, index) => (
              <div key={index} className="activity-item">
                <div className="activity-icon">
                  {nft.typeLabel === 'Standard' ? '🎓' : 
                   nft.typeLabel === 'Joint Contract' ? '🤝' : '🎟️'}
                </div>
                <div className="activity-content">
                  <div className="activity-title">{nft.metadata?.studentName || 'NFT Certificate'}</div>
                  <div className="activity-meta">
                    <span className="activity-type">{nft.typeLabel}</span>
                    <span className="activity-id">Token #{nft.tokenId}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <p>No NFTs found. Start creating your first certificate!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
