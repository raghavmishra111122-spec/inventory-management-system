import React, { useEffect, useState } from 'react';
import api from '../utils/api';

export default function Orders({ user, showToast }) {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.role === 'Admin';


  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // New Order Builder State
  const [orderCustomer, setOrderCustomer] = useState('');
  const [orderItems, setOrderItems] = useState([
    { product_id: '', quantity: 1, maxStock: 0, price: 0 }
  ]);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [orderData, productData, customerData] = await Promise.all([
        api.getOrders(),
        api.getProducts(),
        api.getCustomers()
      ]);
      setOrders(orderData);
      setProducts(productData);
      setCustomers(customerData);
    } catch (err) {
      showToast(err.message || 'Failed to fetch sales and inventory records', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    if (customers.length === 0) {
      showToast('You must register at least one customer before launching an order.', 'warning');
      return;
    }
    if (products.length === 0) {
      showToast('You must add products to the catalog before launching an order.', 'warning');
      return;
    }
    setOrderCustomer(customers[0].id.toString());
    setOrderItems([{ product_id: products[0].id.toString(), quantity: 1, maxStock: products[0].quantity_in_stock, price: parseFloat(products[0].price) }]);
    setCreateModalOpen(true);
  };

  const handleAddItem = () => {
    const defaultProduct = products[0];
    setOrderItems((prev) => [
      ...prev,
      {
        product_id: defaultProduct.id.toString(),
        quantity: 1,
        maxStock: defaultProduct.quantity_in_stock,
        price: parseFloat(defaultProduct.price)
      }
    ]);
  };

  const handleRemoveItem = (index) => {
    if (orderItems.length === 1) return;
    setOrderItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    setOrderItems((prev) => {
      const copy = [...prev];
      const current = { ...copy[index] };
      
      if (field === 'product_id') {
        const prod = products.find((p) => p.id.toString() === value);
        current.product_id = value;
        current.maxStock = prod ? prod.quantity_in_stock : 0;
        current.price = prod ? parseFloat(prod.price) : 0;
      } else if (field === 'quantity') {
        const parsed = parseInt(value, 10);
        current.quantity = isNaN(parsed) ? '' : parsed;
      }
      
      copy[index] = current;
      return copy;
    });
  };

  const calculateRunningTotal = () => {
    return orderItems.reduce((acc, item) => {
      const q = typeof item.quantity === 'number' ? item.quantity : 0;
      return acc + q * item.price;
    }, 0);
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    if (!orderCustomer) {
      showToast('Customer selection is required.', 'error');
      return;
    }

    // Client-side validations
    for (let i = 0; i < orderItems.length; i++) {
      const item = orderItems[i];
      if (!item.product_id) {
        showToast('Please select a product for all item rows.', 'error');
        return;
      }
      if (item.quantity === '' || item.quantity <= 0) {
        showToast('Quantity ordered must be greater than zero.', 'error');
        return;
      }
      if (item.quantity > item.maxStock) {
        const prod = products.find((p) => p.id.toString() === item.product_id);
        showToast(`Insufficient stock for product '${prod ? prod.name : 'Unknown'}'. Available: ${item.maxStock}, Requested: ${item.quantity}`, 'error');
        return;
      }
    }

    try {
      setSubmitting(true);
      const payload = {
        customer_id: parseInt(orderCustomer, 10),
        items: orderItems.map((item) => ({
          product_id: parseInt(item.product_id, 10),
          quantity: parseInt(item.quantity, 10)
        }))
      };

      await api.createOrder(payload);
      showToast('Order calculated and placed successfully!', 'success');
      setCreateModalOpen(false);
      fetchData();
    } catch (err) {
      showToast(err.message || 'Failed to finalize purchase order.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel and delete this order? All inventory stock will be fully restored!')) return;
    try {
      await api.deleteOrder(orderId);
      showToast('Order successfully deleted. Stock volumes restored.', 'success');
      fetchData();
    } catch (err) {
      showToast(err.message || 'Failed to cancel order.', 'error');
    }
  };

  const handleViewDetails = async (order) => {
    setSelectedOrder(order);
    setDetailModalOpen(true);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Processed Orders</h1>
          <p className="muted-text">Manage customer orders, track payments, and audit inventory transactions</p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}>
          🛒 Create New Order
        </button>
      </div>

      {loading ? (
        <div className="empty-state">
          <h3 style={{ color: 'var(--color-primary)' }}>Loading sales ledgers...</h3>
        </div>
      ) : orders.length === 0 ? (
        <div className="glass-card empty-state">
          <h3>No transactions recorded</h3>
          <p className="muted-text">Create a customer profile and launch a purchase order above.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="glass-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Order Date</th>
                <th>Total Bill</th>
                <th>Status Pill</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td><code style={{ color: 'var(--color-primary)', fontWeight: '700' }}>ORD-{order.id.toString().padStart(5, '0')}</code></td>
                  <td style={{ fontWeight: '600' }}>{order.customer_name}</td>
                  <td className="muted-text">{new Date(order.created_at).toLocaleString()}</td>
                  <td style={{ fontWeight: '700', color: 'var(--color-primary)' }}>
                    ${parseFloat(order.total_amount).toFixed(2)}
                  </td>
                  <td>
                    <span className="badge badge-success">{order.status}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                        onClick={() => handleViewDetails(order)}
                      >
                        👁️ Invoice Details
                      </button>
                      {isAdmin && (
                        <button
                          className="btn btn-danger"
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                          onClick={() => handleCancelOrder(order.id)}
                        >
                          ✕ Cancel / Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Invoice Details Modal */}
      {detailModalOpen && selectedOrder && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '650px' }}>
            <div className="modal-header">
              <h2 style={{ fontFamily: 'Outfit' }}>
                📄 Invoice Detail: ORD-{selectedOrder.id.toString().padStart(5, '0')}
              </h2>
              <button
                className="btn btn-secondary"
                style={{ padding: '0.25rem 0.5rem' }}
                onClick={() => setDetailModalOpen(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div>
                  <div className="detail-label">BILL TO CUSTOMER</div>
                  <div className="detail-value" style={{ color: 'var(--color-primary)' }}>
                    {selectedOrder.customer_name}
                  </div>
                </div>
                <div>
                  <div className="detail-label">TRANSACTION TIMESPAMP</div>
                  <div className="detail-value">
                    {new Date(selectedOrder.created_at).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="detail-label">ORDER STATUS</div>
                  <div className="detail-value">
                    <span className="badge badge-success">{selectedOrder.status}</span>
                  </div>
                </div>
                <div>
                  <div className="detail-label">GRAND TOTAL BILL</div>
                  <div className="detail-value" style={{ fontSize: '1.2rem', color: 'var(--color-success)', fontWeight: '800' }}>
                    ${parseFloat(selectedOrder.total_amount).toFixed(2)}
                  </div>
                </div>
              </div>

              <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', fontFamily: 'Outfit' }}>
                Itemized Breakdowns
              </h3>
              <table className="glass-table" style={{ fontSize: '0.85rem' }}>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th>Qty</th>
                    <th>Unit Price</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.items.map((item) => (
                    <tr key={item.id}>
                      <td style={{ fontWeight: '600' }}>{item.product_name}</td>
                      <td><code>{item.product_sku}</code></td>
                      <td>{item.quantity}</td>
                      <td>${parseFloat(item.unit_price).toFixed(2)}</td>
                      <td style={{ fontWeight: '600', color: 'var(--color-primary)' }}>
                        ${parseFloat(item.line_total).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDetailModalOpen(false)}>
                Close Invoice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Order Modal */}
      {createModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h2 style={{ fontFamily: 'Outfit' }}>🛒 Compile Purchase Order</h2>
              <button
                className="btn btn-secondary"
                style={{ padding: '0.25rem 0.5rem' }}
                onClick={() => setCreateModalOpen(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateOrder}>
              <div className="modal-body">
                <div className="glass-form">
                  <div className="form-group">
                    <label className="form-label">Assign Customer Account</label>
                    <select
                      className="form-select"
                      value={orderCustomer}
                      onChange={(e) => setOrderCustomer(e.target.value)}
                    >
                      {customers.map((c) => (
                        <option key={c.id} value={c.id.toString()}>
                          {c.full_name} ({c.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
                      <label className="form-label">Order Items Ledger</label>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                        onClick={handleAddItem}
                      >
                        ➕ Add Another Item
                      </button>
                    </div>

                    {orderItems.map((item, index) => {
                      return (
                        <div className="order-builder-row" key={index}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Product</span>
                            <select
                              className="form-select"
                              style={{ padding: '0.5rem', fontSize: '0.85rem' }}
                              value={item.product_id}
                              onChange={(e) => handleItemChange(index, 'product_id', e.target.value)}
                            >
                              {products.map((p) => (
                                <option key={p.id} value={p.id.toString()}>
                                  {p.name} (${parseFloat(p.price).toFixed(2)} - Stock: {p.quantity_in_stock})
                                </option>
                              ))}
                            </select>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Qty</span>
                            <input
                              type="number"
                              min="1"
                              className="form-input"
                              style={{ padding: '0.5rem', fontSize: '0.85rem' }}
                              value={item.quantity}
                              onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                            />
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', justifyContent: 'center' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Subtotal</span>
                            <span style={{ fontWeight: '700', color: 'var(--color-primary)', padding: '0.5rem 0', fontSize: '0.9rem' }}>
                              ${((typeof item.quantity === 'number' ? item.quantity : 0) * item.price).toFixed(2)}
                            </span>
                          </div>

                          <button
                            type="button"
                            className="btn btn-danger"
                            style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}
                            disabled={orderItems.length === 1}
                            onClick={() => handleRemoveItem(index)}
                          >
                            🗑️
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  <div
                    className="flex-between"
                    style={{
                      borderTop: '1px solid var(--glass-border)',
                      paddingTop: '1.25rem',
                      marginTop: '0.5rem'
                    }}
                  >
                    <div>
                      <span className="muted-text">Grand Billing Total:</span>
                      <h2 style={{ color: 'var(--color-success)', fontSize: '1.8rem', fontFamily: 'Outfit' }}>
                        ${calculateRunningTotal().toFixed(2)}
                      </h2>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setCreateModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Processing Transaction...' : 'Place Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
