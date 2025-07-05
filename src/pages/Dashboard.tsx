import React, { useEffect, useState } from 'react';
import { LogOut, Settings, User, BarChart3, DollarSign, Bitcoin, Building2, Globe, TrendingUp } from 'lucide-react';
import './Dashboard.css'; // We'll add some CSS for animation and polish

const categories = [
  { id: 'forex', name: 'Forex', icon: <DollarSign size={20} />, color: '#16a34a' },
  { id: 'crypto', name: 'Crypto', icon: <Bitcoin size={20} />, color: '#fbbf24' },
  { id: 'stocks', name: 'Stocks', icon: <Building2 size={20} />, color: '#3b82f6' },
  { id: 'futures', name: 'Commodities', icon: <Globe size={20} />, color: '#f59e42' },
  { id: 'actions', name: 'Actions', icon: <TrendingUp size={20} />, color: '#a78bfa' },
];

const Dashboard = () => {
  const [activeCategory, setActiveCategory] = useState('forex');
  const [fadeIn, setFadeIn] = useState(false);

  useEffect(() => {
    setFadeIn(true);
    return () => setFadeIn(false);
  }, []);

  return (
    <div className="dashboard-root">
      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <BarChart3 size={28} color="#16a34a" />
            <span className="sidebar-title">IZYS</span>
          </div>
          <div className="sidebar-desc">Trading Dashboard</div>
        </div>
        <div className="sidebar-section">
          <div className="sidebar-section-title">Categories</div>
          <ul className="sidebar-categories">
            {categories.map(cat => (
              <li
                key={cat.id}
                className={`sidebar-category${activeCategory === cat.id ? ' active' : ''}`}
                style={{ '--cat-color': cat.color } as React.CSSProperties }
                onClick={() => setActiveCategory(cat.id)}
              >
                <span className="sidebar-category-icon">{cat.icon}</span>
                <span>{cat.name}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="sidebar-section">
          <div className="sidebar-section-title">Symbols</div>
          <div className="sidebar-symbols-empty">No symbols found</div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        <header className="dashboard-header">
          <div className="dashboard-header-left">
            <h1 className="dashboard-title">Dashboard</h1>
            <span className="dashboard-welcome">Welcome back,</span>
          </div>
          <div className="dashboard-header-actions">
            <button className="dashboard-header-btn"><Settings size={20} /></button>
            <button className="dashboard-header-btn"><User size={20} /></button>
            <button className="dashboard-header-btn"><LogOut size={20} /></button>
          </div>
        </header>
        <div className={`dashboard-cards${fadeIn ? ' fade-in' : ''}`}> 
          <div className="dashboard-card dashboard-card-wide">
            <h2>Welcome to IZYS</h2>
            <p>Your professional trading dashboard is ready. Start by adding widgets and exploring the markets.</p>
          </div>
          <div className="dashboard-card">
            <h3>Active Symbols</h3>
            <div className="dashboard-card-value">0</div>
          </div>
          <div className="dashboard-card">
            <h3>Widgets</h3>
            <div className="dashboard-card-value">0</div>
          </div>
          <div className="dashboard-card">
            <h3>News Items</h3>
            <div className="dashboard-card-value">0</div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard; 