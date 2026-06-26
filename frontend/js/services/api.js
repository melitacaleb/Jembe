// js/services/api.js
// Encapsulates every call to the Farmers Connect backend behind one class.
// Swap BASE_URL for your Render backend URL once deployed.

const BASE_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:4000/api'
  : 'https://jembe-inxu.onrender.com'; // <-- replace after deploying backend to Render

class ApiService {
  constructor() {
    this.token = localStorage.getItem('fc_token') || null;
  }

  setToken(token) {
    this.token = token;
    if (token) localStorage.setItem('fc_token', token);
    else localStorage.removeItem('fc_token');
  }

  async request(path, { method = 'GET', body = null, auth = true } = {}) {
    const headers = { 'Content-Type': 'application/json' };
    if (auth && this.token) headers.Authorization = `Bearer ${this.token}`;

    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    let data = {};
    try { data = await res.json(); } catch (_) { /* no body */ }

    if (!res.ok) {
      throw new Error(data.error || `Request failed (${res.status})`);
    }
    return data;
  }

  // ---- Auth ----
  register(payload) { return this.request('/auth/register', { method: 'POST', body: payload, auth: false }); }
  login(payload) { return this.request('/auth/login', { method: 'POST', body: payload, auth: false }); }
  me() { return this.request('/auth/me'); }

  // ---- Users ----
  getProfile(id) { return this.request(`/users/${id}`); }
  updateProfile(id, data) { return this.request(`/users/${id}`, { method: 'PUT', body: data }); }
  searchUsers(q) { return this.request(`/users/search?q=${encodeURIComponent(q)}`); }
  follow(id) { return this.request(`/users/${id}/follow`, { method: 'POST' }); }
  unfollow(id) { return this.request(`/users/${id}/follow`, { method: 'DELETE' }); }

  // ---- Posts (feed) ----
  getFeed(limit = 20, offset = 0) { return this.request(`/posts/feed?limit=${limit}&offset=${offset}`); }
  createPost(payload) { return this.request('/posts', { method: 'POST', body: payload }); }
  deletePost(id) { return this.request(`/posts/${id}`, { method: 'DELETE' }); }
  likePost(id) { return this.request(`/posts/${id}/like`, { method: 'POST' }); }
  unlikePost(id) { return this.request(`/posts/${id}/like`, { method: 'DELETE' }); }
  getComments(id) { return this.request(`/posts/${id}/comments`); }
  addComment(id, body) { return this.request(`/posts/${id}/comments`, { method: 'POST', body: { body } }); }

  // ---- Marketplace ----
  getProducts(params = '') { return this.request(`/products${params}`); }
  createProduct(payload) { return this.request('/products', { method: 'POST', body: payload }); }
  myProducts() { return this.request('/products/mine'); }
  updateProduct(id, data) { return this.request(`/products/${id}`, { method: 'PUT', body: data }); }
  deleteProduct(id) { return this.request(`/products/${id}`, { method: 'DELETE' }); }
  orderProduct(id, quantity) { return this.request(`/products/${id}/order`, { method: 'POST', body: { quantity } }); }
  myOrders() { return this.request('/products/orders/mine'); }
  updateOrderStatus(id, status) { return this.request(`/products/orders/${id}/status`, { method: 'PUT', body: { status } }); }

  // ---- Education ----
  getCourses(params = '') { return this.request(`/courses${params}`); }
  createCourse(payload) { return this.request('/courses', { method: 'POST', body: payload }); }
  myCourses() { return this.request('/courses/mine'); }
  enrollCourse(id) { return this.request(`/courses/${id}/enroll`, { method: 'POST' }); }
  myEnrollments() { return this.request('/courses/enrollments/mine'); }
  updateCourseProgress(id, progress) { return this.request(`/courses/${id}/progress`, { method: 'PUT', body: { progress } }); }
}

export const api = new ApiService();
