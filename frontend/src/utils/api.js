const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function request(path, options = {}) {
  const url = `${API_BASE_URL}${path}`;
  
  // Retrieve token from local storage
  const token = localStorage.getItem('token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Inject JWT Bearer Token if present
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);
    
    // Auto-logout if unauthorized/token expired
    if (response.status === 401 && path !== '/auth/login' && path !== '/auth/signup') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.dispatchEvent(new Event('auth-change'));
      // Only redirect if we are not already on the login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
      throw new Error('Session expired. Please log in again.');
    }

    // Handled HTTP 204 No Content
    if (response.status === 204) {
      return { success: true };
    }

    const data = await response.json();

    if (!response.ok) {
      // Map standard FastAPI structured validation errors or customized database conflicts
      const errorMsg = data.detail 
        ? (typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail))
        : 'An unexpected response error occurred.';
      throw new Error(errorMsg);
    }

    return data;
  } catch (error) {
    console.error(`API Request Error [${options.method || 'GET'} ${path}]:`, error);
    throw error;
  }
}

export const api = {
  // Auth
  login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  signup: (userData) => request('/auth/signup', { method: 'POST', body: JSON.stringify(userData) }),
  getProfile: () => request('/auth/profile'),
  logout: () => request('/auth/logout', { method: 'POST' }),

  // Products
  getProducts: () => request('/products'),
  getProduct: (id) => request(`/products/${id}`),
  createProduct: (product) => request('/products', { method: 'POST', body: JSON.stringify(product) }),
  updateProduct: (id, product) => request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(product) }),
  deleteProduct: (id) => request(`/products/${id}`, { method: 'DELETE' }),

  // Customers
  getCustomers: () => request('/customers'),
  getCustomer: (id) => request(`/customers/${id}`),
  createCustomer: (customer) => request('/customers', { method: 'POST', body: JSON.stringify(customer) }),
  deleteCustomer: (id) => request(`/customers/${id}`, { method: 'DELETE' }),

  // Orders
  getOrders: () => request('/orders'),
  getOrder: (id) => request(`/orders/${id}`),
  createOrder: (order) => request('/orders', { method: 'POST', body: JSON.stringify(order) }),
  deleteOrder: (id) => request(`/orders/${id}`, { method: 'DELETE' }),

  // Dashboard
  getDashboardSummary: () => request('/dashboard/summary'),
};
export default api;

