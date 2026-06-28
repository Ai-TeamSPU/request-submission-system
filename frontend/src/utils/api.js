const API_URL = import.meta.env.VITE_API_URL || '';

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }

  return res.json();
}

export const api = {
  getRequests: () => request('/api/requests'),

  getAttachment: (requestId) => request(`/api/requests/${requestId}/attachment`),

  submitRequest: (data) =>
    request('/api/requests', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateRequestStatus: (requestId, status, managerNote, approverEmail) =>
    request(`/api/requests/${requestId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, managerNote, approverEmail }),
    }),

  login: (email) =>
    request('/api/users/login', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  getUsersList: () => request('/api/users'),

  addUser: (email, role, faculty) =>
    request('/api/users', {
      method: 'POST',
      body: JSON.stringify({ email, role, faculty }),
    }),

  updateUserRole: (email, role, faculty) =>
    request(`/api/users/${encodeURIComponent(email)}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role, faculty }),
    }),

  completeRequest: (requestId) =>
    request(`/api/requests/${requestId}/complete`, {
      method: 'PATCH',
    }),

  getCourses: () => request('/api/courses'),

  importCourses: (courses) =>
    request('/api/courses/import', {
      method: 'POST',
      body: JSON.stringify({ courses }),
    }),

  addCourse: (courseCode) =>
    request('/api/courses/add', {
      method: 'POST',
      body: JSON.stringify({ courseCode }),
    }),

  updateCourse: (id, courseCode) =>
    request(`/api/courses/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ courseCode }),
    }),

  deleteCourse: (id) =>
    request(`/api/courses/${id}`, { method: 'DELETE' }),

  clearCourses: () =>
    request('/api/courses/all', { method: 'DELETE' }),

  getFaculties: () => request('/api/faculties'),

  getTeachers: () => request('/api/faculties/teachers'),

  getFacultyByEmail: (email) =>
    request(`/api/faculties/by-email/${encodeURIComponent(email)}`),
};
