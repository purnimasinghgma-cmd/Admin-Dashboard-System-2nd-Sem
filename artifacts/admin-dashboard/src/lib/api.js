async function request(method, path, body) {
  const res = await fetch(`/api${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status} ${text}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  // auth
  me: () => request("GET", "/auth/me"),
  switchRole: (role) => request("POST", "/auth/switch-role", { role }),

  // users
  listUsers: (params = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v),
    ).toString();
    return request("GET", `/users${qs ? `?${qs}` : ""}`);
  },
  createUser: (data) => request("POST", "/users", data),
  updateUser: (id, data) => request("PATCH", `/users/${id}`, data),
  deleteUser: (id) => request("DELETE", `/users/${id}`),

  // products
  listProducts: (params = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v),
    ).toString();
    return request("GET", `/products${qs ? `?${qs}` : ""}`);
  },
  createProduct: (data) => request("POST", "/products", data),
  updateProduct: (id, data) => request("PATCH", `/products/${id}`, data),
  deleteProduct: (id) => request("DELETE", `/products/${id}`),

  // orders
  listOrders: (params = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v),
    ).toString();
    return request("GET", `/orders${qs ? `?${qs}` : ""}`);
  },
  createOrder: (data) => request("POST", "/orders", data),
  updateOrder: (id, data) => request("PATCH", `/orders/${id}`, data),
  deleteOrder: (id) => request("DELETE", `/orders/${id}`),

  // dashboard
  summary: () => request("GET", "/dashboard/summary"),
  salesByDay: () => request("GET", "/dashboard/sales-by-day"),
  usersByDay: () => request("GET", "/dashboard/users-by-day"),
  salesByCategory: () => request("GET", "/dashboard/sales-by-category"),
  topProducts: () => request("GET", "/dashboard/top-products"),
  recentActivity: () => request("GET", "/dashboard/recent-activity"),
  orderStatusBreakdown: () =>
    request("GET", "/dashboard/order-status-breakdown"),
};
