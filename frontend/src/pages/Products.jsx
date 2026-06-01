import React, { useEffect, useState } from 'react';
import api from '../utils/api';

export default function Products({ showToast }) {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    price: '',
    quantity_in_stock: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await api.getProducts();
      setProducts(data);
    } catch (err) {
      showToast(err.message || 'Failed to fetch products catalogue', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({ name: '', sku: '', price: '', quantity_in_stock: '0' });
    setFormErrors({});
    setModalOpen(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku,
      price: product.price.toString(),
      quantity_in_stock: product.quantity_in_stock.toString()
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Product name is required';
    if (!formData.sku.trim()) errors.sku = 'SKU code is required';
    
    const priceVal = parseFloat(formData.price);
    if (isNaN(priceVal) || priceVal < 0) {
      errors.price = 'Price must be a non-negative number';
    }
    
    const qtyVal = parseInt(formData.quantity_in_stock, 10);
    if (isNaN(qtyVal) || qtyVal < 0) {
      errors.quantity_in_stock = 'Quantity must be a non-negative integer';
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
        name: formData.name.trim(),
        sku: formData.sku.trim(),
        price: parseFloat(formData.price),
        quantity_in_stock: parseInt(formData.quantity_in_stock, 10)
      };

      if (editingProduct) {
        await api.updateProduct(editingProduct.id, payload);
        showToast('Product updated successfully!', 'success');
      } else {
        await api.createProduct(payload);
        showToast('Product registered successfully!', 'success');
      }
      setModalOpen(false);
      fetchProducts();
    } catch (err) {
      showToast(err.message || 'Operation failed. Check details.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await api.deleteProduct(productId);
      showToast('Product deleted from catalog', 'success');
      fetchProducts();
    } catch (err) {
      showToast(err.message || 'Failed to delete product', 'error');
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Product Catalog</h1>
          <p className="muted-text">Track materials, pricing structures, and inventory levels</p>
        </div>
        <button className="btn btn-primary" onClick={openAddModal}>
          ➕ Add New Product
        </button>
      </div>

      {/* Filter and Search */}
      <div className="search-container">
        <input
          type="text"
          placeholder="🔍 Search catalog by SKU or product name..."
          className="form-input search-input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="empty-state">
          <h3 style={{ color: 'var(--color-primary)' }}>Loading Products catalog...</h3>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="glass-card empty-state">
          <h3>No products match search filters</h3>
          <p className="muted-text">Try modifying your query or insert a new product entry.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="glass-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Product Name</th>
                <th>SKU Code</th>
                <th>Unit Price</th>
                <th>Stock Level</th>
                <th>Status Pill</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id}>
                  <td>#{product.id}</td>
                  <td style={{ fontWeight: '600' }}>{product.name}</td>
                  <td><code style={{ color: 'var(--color-primary)' }}>{product.sku}</code></td>
                  <td style={{ fontWeight: '600' }}>${parseFloat(product.price).toFixed(2)}</td>
                  <td style={{ fontWeight: '700' }}>{product.quantity_in_stock}</td>
                  <td>
                    <span
                      className={`badge ${
                        product.quantity_in_stock === 0
                          ? 'badge-danger'
                          : product.quantity_in_stock < 10
                          ? 'badge-warning'
                          : 'badge-success'
                      }`}
                    >
                      {product.quantity_in_stock === 0
                        ? 'Out of Stock'
                        : product.quantity_in_stock < 10
                        ? 'Low Stock'
                        : 'Secure'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                        onClick={() => openEditModal(product)}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        className="btn btn-danger"
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                        onClick={() => handleDelete(product.id)}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </td>
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
              <h2 style={{ fontFamily: 'Outfit' }}>
                {editingProduct ? '✏️ Edit Product Details' : '📦 Create New Product'}
              </h2>
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
                    <label className="form-label">Product Name</label>
                    <input
                      type="text"
                      name="name"
                      className="form-input"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="e.g. Pro-Gaming Mechanical Keyboard"
                    />
                    {formErrors.name && <span className="form-error">{formErrors.name}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">SKU / Catalog Code</label>
                    <input
                      type="text"
                      name="sku"
                      className="form-input"
                      value={formData.sku}
                      onChange={handleInputChange}
                      placeholder="e.g. KB-MECH-G89"
                      disabled={!!editingProduct} // Block SKU modifications in edit to respect uniqueness easily
                    />
                    {formErrors.sku && <span className="form-error">{formErrors.sku}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Price ($ USD)</label>
                    <input
                      type="number"
                      name="price"
                      step="0.01"
                      className="form-input"
                      value={formData.price}
                      onChange={handleInputChange}
                      placeholder="0.00"
                    />
                    {formErrors.price && <span className="form-error">{formErrors.price}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Quantity in Stock</label>
                    <input
                      type="number"
                      name="quantity_in_stock"
                      className="form-input"
                      value={formData.quantity_in_stock}
                      onChange={handleInputChange}
                      placeholder="0"
                    />
                    {formErrors.quantity_in_stock && (
                      <span className="form-error">{formErrors.quantity_in_stock}</span>
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
                  {submitting ? 'Saving...' : editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
