import React, { useState, useEffect } from 'react';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Customers from './pages/Customers';
import Orders from './pages/Orders';
import Login from './pages/Login';
import Signup from './pages/Signup';
import api from './utils/api';

export default function App() {
  const [user, setUser] = useState(null);
  const [authView, setAuthView] = useState('login'); // 'login' or 'signup'
  const [activeTab, setActiveTab] = useState('dashboard');
  const [toasts, setToasts] = useState([]);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    // Check if token and user exist in local storage on load
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setCheckingAuth(false);
  }, []);

  useEffect(() => {
    const handleAuthChange = () => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      } else {
        setUser(null);
        setAuthView('login');
      }
    };
    window.addEventListener('auth-change', handleAuthChange);
    return () => window.removeEventListener('auth-change', handleAuthChange);
  }, []);

  // Trigger global glass-toast notifications
  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Automatically fade out toast after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const handleAuthSuccess = (authUser) => {
    setUser(authUser);
    setActiveTab('dashboard');
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      setAuthView('login');
      showToast('Logged out successfully!', 'success');
    }
  };

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard user={user} showToast={showToast} />;
      case 'products':
        return <Products user={user} showToast={showToast} />;
      case 'customers':
        return <Customers user={user} showToast={showToast} />;
      case 'orders':
        return <Orders user={user} showToast={showToast} />;
      default:
        return <Dashboard user={user} showToast={showToast} />;
    }
  };

  if (checkingAuth) {
    return (
      <div className="auth-container">
        <div className="spinner"></div>
      </div>
    );
  }

  // Centered Auth pages when unauthenticated
  if (!user) {
    return (
      <div className="auth-container">
        {authView === 'login' ? (
          <Login
            onAuthSuccess={handleAuthSuccess}
            onNavigateToSignup={() => setAuthView('signup')}
            showToast={showToast}
          />
        ) : (
          <Signup
            onSignupSuccess={() => setAuthView('login')}
            onNavigateToLogin={() => setAuthView('login')}
            showToast={showToast}
          />
        )}

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

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <nav className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <span className="brand-logo">📦</span>
          <span className="brand-name">Antigravity Stock</span>
        </div>
        
        <div className="sidebar-links">
          <button
            className={`sidebar-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }}
          >
            <span className="nav-icon">📊</span>
            <span className="nav-text">Dashboard</span>
          </button>
          <button
            className={`sidebar-btn ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => { setActiveTab('products'); setIsSidebarOpen(false); }}
          >
            <span className="nav-icon">📦</span>
            <span className="nav-text">Products</span>
          </button>
          <button
            className={`sidebar-btn ${activeTab === 'customers' ? 'active' : ''}`}
            onClick={() => { setActiveTab('customers'); setIsSidebarOpen(false); }}
          >
            <span className="nav-icon">👤</span>
            <span className="nav-text">Customers</span>
          </button>
          <button
            className={`sidebar-btn ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => { setActiveTab('orders'); setIsSidebarOpen(false); }}
          >
            <span className="nav-icon">🛒</span>
            <span className="nav-text">Orders</span>
          </button>
        </div>

        <div className="sidebar-profile">
          <div className="profile-info">
            <div className="profile-details">
              <span className="profile-name">{user.full_name}</span>
              <span className="profile-role">{user.role}</span>
            </div>
          </div>
          <button onClick={handleLogout} className="btn-logout-sidebar">
            🚪 Logout
          </button>
        </div>
      </nav>

      {/* Backdrop overlay for mobile drawer */}
      {isSidebarOpen && (
        <div className="sidebar-backdrop" onClick={() => setIsSidebarOpen(false)}></div>
      )}

      {/* Main Wrapper */}
      <div className="main-wrapper">
        {/* Mobile Header Bar */}
        <header className="mobile-header glass">
          <button className="hamburger-btn" onClick={() => setIsSidebarOpen(true)}>
            ☰
          </button>
          <div className="mobile-brand">
            <span>📦</span>
            <span>Antigravity Stock</span>
          </div>
        </header>

        {/* Primary Page Canvas */}
        <main className="main-content">
          {renderActiveView()}
        </main>
      </div>

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

