import React, { useEffect, useState } from 'react';
import api from '../utils/api';

export default function Dashboard({ showToast }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const data = await api.getDashboardSummary();
      setSummary(data);
    } catch (err) {
      showToast(err.message || 'Failed to load dashboard summary data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  if (loading) {
    return (
      <div className="empty-state">
        <h3 style={{ color: 'var(--color-primary)' }}>Synchronizing Enterprise Metrics...</h3>
        <p className="muted-text">Fetching latest inventory levels from the database</p>
      </div>
    );
  }

  const { total_products, total_customers, total_orders, low_stock_products } = summary || {
    total_products: 0,
    total_customers: 0,
    total_orders: 0,
    low_stock_products: []
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Operational Summary</h1>
          <p className="muted-text">Real-time indicators and critical alerts</p>
        </div>
        <button className="btn btn-secondary" onClick={fetchSummary}>
          🔄 Refresh Summary
        </button>
      </div>

      {/* Aggregate Cards */}
      <div className="dashboard-grid">
        <div className="glass-card primary">
          <div className="card-title">Catalog Inventory</div>
          <div className="card-value">{total_products}</div>
          <p className="muted-text" style={{ marginTop: '0.5rem' }}>Total unique products tracked</p>
        </div>

        <div className="glass-card success">
          <div className="card-title">Registered Accounts</div>
          <div className="card-value">{total_customers}</div>
          <p className="muted-text" style={{ marginTop: '0.5rem' }}>Active client listings</p>
        </div>

        <div className="glass-card primary">
          <div className="card-title">Processed Orders</div>
          <div className="card-value">{total_orders}</div>
          <p className="muted-text" style={{ marginTop: '0.5rem' }}>Sales records calculated</p>
        </div>

        <div className={`glass-card ${low_stock_products.length > 0 ? 'danger glow-card-danger' : 'success'}`}>
          <div className="card-title">Low Stock Alert</div>
          <div className="card-value">{low_stock_products.length}</div>
          <p className="muted-text" style={{ marginTop: '0.5rem' }}>
            {low_stock_products.length > 0 ? 'Urgent attention required' : 'All stock levels secure'}
          </p>
        </div>
      </div>

      {/* Low Stock Grid */}
      <h2 style={{ marginBottom: '1.25rem', fontFamily: 'Outfit' }}>Low Stock Monitoring (&lt; 10 items)</h2>
      {low_stock_products.length === 0 ? (
        <div className="glass-card" style={{ padding: '2rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--color-success)', fontWeight: '600' }}>✓ Safe Environment Status</p>
          <p className="muted-text" style={{ marginTop: '0.25rem' }}>All active product quantities are currently above the critical threshold.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="glass-table">
            <thead>
              <tr>
                <th>Product ID</th>
                <th>Product Name</th>
                <th>SKU Code</th>
                <th>Current Stock</th>
                <th>Status Pill</th>
              </tr>
            </thead>
            <tbody>
              {low_stock_products.map((prod) => (
                <tr key={prod.id}>
                  <td>#{prod.id}</td>
                  <td style={{ fontWeight: '600' }}>{prod.name}</td>
                  <td><code style={{ color: 'var(--color-primary)' }}>{prod.sku}</code></td>
                  <td style={{ fontWeight: '700', color: 'var(--color-danger)' }}>{prod.quantity_in_stock} units</td>
                  <td>
                    <span className={`badge ${prod.quantity_in_stock === 0 ? 'badge-danger' : 'badge-warning'}`}>
                      {prod.quantity_in_stock === 0 ? 'Out of Stock' : 'Low Stock'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
