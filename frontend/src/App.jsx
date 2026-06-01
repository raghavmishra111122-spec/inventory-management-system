import React, { useState } from 'react';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Customers from './pages/Customers';
import Orders from './pages/Orders';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [toasts, setToasts] = useState([]);

  // Trigger global glass-toast notifications
  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Automatically fade out toast after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard showToast={showToast} />;
      case 'products':
        return <Products showToast={showToast} />;
      case 'customers':
        return <Customers showToast={showToast} />;
      case 'orders':
        return <Orders showToast={showToast} />;
      default:
        return <Dashboard showToast={showToast} />;
    }
  };

  return (
    <div className="app-container">
      {/* Navigation Header */}
      <nav className="navbar">
        <div className="brand">
          <span>📦</span>
          <span>Antigravity Stock</span>
        </div>
        <div className="nav-links">
          <button
            className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            📊 Dashboard
          </button>
          <button
            className={`nav-btn ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => setActiveTab('products')}
          >
            📦 Products
          </button>
          <button
            className={`nav-btn ${activeTab === 'customers' ? 'active' : ''}`}
            onClick={() => setActiveTab('customers')}
          >
            👤 Customers
          </button>
          <button
            className={`nav-btn ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            🛒 Orders
          </button>
        </div>
      </nav>

      {/* Primary Page Canvas */}
      <main className="main-content">
        {renderActiveView()}
      </main>

      {/* Global Toast Alert Layer */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast ${toast.type}`}>
            <span>
              {toast.type === 'success' ? '⚡' : toast.type === 'error' ? '❌' : '⚠️'}
            </span>
            <div className="toast-message">{toast.message}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
