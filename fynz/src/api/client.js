// ═══════════════════════════════════════════════════════════════
// Fynz API Client
// Wrapper sobre fetch para comunicación con el backend
// ═══════════════════════════════════════════════════════════════

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

class ApiError extends Error {
    constructor(message, status, data) {
        super(message);
        this.status = status;
        this.data = data;
    }
}

async function request(endpoint, options = {}) {
    const token = localStorage.getItem('fynz_token');

    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
            ...options.headers,
        },
        ...options,
    };

    const response = await fetch(`${BASE_URL}${endpoint}`, config);
    const data = await response.json().catch(() => null);

    if (!response.ok) {
        throw new ApiError(
            data?.message || 'Error de servidor',
            response.status,
            data
        );
    }

    return data;
}

// ─── Auth ─────────────────────────────────────────────────────
export const auth = {
    register: (body) =>
        request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),

    login: (body) =>
        request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
};

// ─── Users ────────────────────────────────────────────────────
export const users = {
    me: () => request('/users/me'),
};

// ─── Categories ───────────────────────────────────────────────
export const categories = {
    list: () => request('/categories'),

    create: (body) =>
        request('/categories', { method: 'POST', body: JSON.stringify(body) }),

    update: (id, body) =>
        request(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(body) }),

    remove: (id) =>
        request(`/categories/${id}`, { method: 'DELETE' }),
};

// ─── Pockets ──────────────────────────────────────────────────
export const pockets = {
    list: () => request('/pockets'),

    get: (id) => request(`/pockets/${id}`),

    create: (body) =>
        request('/pockets', { method: 'POST', body: JSON.stringify(body) }),

    update: (id, body) =>
        request(`/pockets/${id}`, { method: 'PUT', body: JSON.stringify(body) }),

    remove: (id) =>
        request(`/pockets/${id}`, { method: 'DELETE' }),
};

// ─── Transactions ─────────────────────────────────────────────
export const transactions = {
    list: (params = {}) => {
        const query = new URLSearchParams();
        Object.entries(params).forEach(([k, v]) => {
            if (v !== undefined && v !== null && v !== '') query.append(k, v);
        });
        const qs = query.toString();
        return request(`/transactions${qs ? `?${qs}` : ''}`);
    },

    get: (id) => request(`/transactions/${id}`),

    create: (body) =>
        request('/transactions', { method: 'POST', body: JSON.stringify(body) }),

    remove: (id) =>
        request(`/transactions/${id}`, { method: 'DELETE' }),

    summary: () => request('/transactions/summary'),
};

// ─── Admin ────────────────────────────────────────────────────
export const admin = {
    users: {
        list: () => request('/admin/users'),
        updateRole: (id, role) =>
            request(`/admin/users/${id}/role`, { method: 'PUT', body: JSON.stringify({ role }) }),
        remove: (id) =>
            request(`/admin/users/${id}`, { method: 'DELETE' }),
    },
};

export { ApiError };
