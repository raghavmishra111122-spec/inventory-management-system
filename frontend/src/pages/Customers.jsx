import React, { useEffect, useState } from 'react';
import api from '../utils/api';

export default function Customers({ user, showToast }) {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.role === 'Admin';
  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone_number: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const data = await api.getCustomers();
      setCustomers(data);
    } catch (err) {
      showToast(err.message || 'Failed to fetch registered customers', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const openAddModal = () => {
    setFormData({ full_name: '', email: '', phone_number: '' });
    setFormErrors({});
    setModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.full_name.trim()) errors.full_name = 'Full name is required';
    
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      errors.email = 'Email address is required';
    } else if (!emailPattern.test(formData.email.trim())) {
      errors.email = 'Enter a valid email address';
    }
    
    if (!formData.phone_number.trim()) {
      errors.phone_number = 'Phone contact number is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      const payload = {
        full_name: formData.full_name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone_number: formData.phone_number.trim()
      };

      await api.createCustomer(payload);
      showToast('New customer profile registered successfully!', 'success');
      setModalOpen(false);
      fetchCustomers();
    } catch (err) {
      showToast(err.message || 'Email registration failed or duplicate profile', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (customerId) => {
    if (!window.confirm('Are you sure you want to delete this customer account? All associated orders will be deleted!')) return;
    try {
      await api.deleteCustomer(customerId);
      showToast('Customer profile deleted', 'success');
      fetchCustomers();
    } catch (err) {
      showToast(err.message || 'Failed to delete customer profile', 'error');
    }
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.full_name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Customer Register</h1>
          <p className="muted-text">Track accounts, emails, and active phone contacts</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={openAddModal}>
            👤 Register Customer
          </button>
        )}
      </div>

      {/* Filter and Search */}
      <div className="search-container">
        <input
          type="text"
          placeholder="🔍 Search customers by email or full name..."
          className="form-input search-input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="empty-state">
          <h3 style={{ color: 'var(--color-primary)' }}>Synchronizing Customers database...</h3>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="glass-card empty-state">
          <h3>No customers found</h3>
          <p className="muted-text">Try modifying your search or register a new customer above.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="glass-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Full Name</th>
                <th>Email Address</th>
                <th>Phone Number</th>
                <th>Joined Date</th>
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((customer) => (
                <tr key={customer.id}>
                  <td>#{customer.id}</td>
                  <td style={{ fontWeight: '600', color: 'var(--color-primary)' }}>{customer.full_name}</td>
                  <td style={{ fontStyle: 'italic' }}>{customer.email}</td>
                  <td>{customer.phone_number}</td>
                  <td className="muted-text">{new Date(customer.created_at).toLocaleDateString()}</td>
                  {isAdmin && (
                    <td>
                      <button
                        className="btn btn-danger"
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                        onClick={() => handleDelete(customer.id)}
                      >
                        🗑️ Remove
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Form */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 style={{ fontFamily: 'Outfit' }}>👤 Register Customer Account</h2>
              <button
                className="btn btn-secondary"
                style={{ padding: '0.25rem 0.5rem' }}
                onClick={() => setModalOpen(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="glass-form">
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input
                      type="text"
                      name="full_name"
                      className="form-input"
                      value={formData.full_name}
                      onChange={handleInputChange}
                      placeholder="e.g. Alexander Mercer"
                    />
                    {formErrors.full_name && <span className="form-error">{formErrors.full_name}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input
                      type="email"
                      name="email"
                      className="form-input"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="e.g. alex.mercer@corporate.com"
                    />
                    {formErrors.email && <span className="form-error">{formErrors.email}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <input
                      type="text"
                      name="phone_number"
                      className="form-input"
                      value={formData.phone_number}
                      onChange={handleInputChange}
                      placeholder="e.g. +1 (555) 019-2834"
                    />
                    {formErrors.phone_number && (
                      <span className="form-error">{formErrors.phone_number}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Registering...' : 'Register Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
