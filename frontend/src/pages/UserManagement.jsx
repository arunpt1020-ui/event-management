import React, { useEffect, useState } from 'react';
import { usersAPI } from '../services/api';
import { toast } from 'react-toastify';
import { ROLES } from '../utils/constants';
import { format } from 'date-fns';

// Safe date formatter — returns '-' when value is missing or invalid
const safeFormatDate = (value, fmt = 'MMM dd, yyyy') => {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  try {
    return format(d, fmt);
  } catch (e) {
    return '-';
  }
};

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [filters, setFilters] = useState({
    search: '',
    role: '',
  });
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    role: '',
  });

  useEffect(() => {
    fetchUsers();
  }, [pagination.page, filters]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters,
      };
      Object.keys(params).forEach((key) => {
        if (params[key] === '') {
          delete params[key];
        }
      });

      const response = await usersAPI.getAll(params);
      setUsers(response.data.data.users);
      setPagination((prev) => ({
        ...prev,
        ...response.data.data.pagination,
      }));
    } catch (error) {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value,
    });
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleEdit = (user) => {
    setEditingUser(user._id);
    setEditForm({
      name: user.name,
      email: user.email,
      role: user.role,
    });
  };

  const handleUpdate = async (userId) => {
    try {
      await usersAPI.update(userId, editForm);
      toast.success('User updated successfully');
      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update user');
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      await usersAPI.delete(userId);
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete user');
    }
  };

  return (
    <div className="container mt-4">
      <h2>User Management</h2>

      {/* Filters */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-6">
              <input
                type="text"
                className="form-control"
                placeholder="Search by name or email..."
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
              />
            </div>
            <div className="col-md-3">
              <select
                className="form-select"
                name="role"
                value={filters.role}
                onChange={handleFilterChange}
              >
                <option value="">All Roles</option>
                <option value={ROLES.SITE_ADMIN}>Site Admin</option>
                <option value={ROLES.ARTIST}>Artist</option>
                <option value={ROLES.USER}>User</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="card">
        <div className="card-body">
          {loading ? (
            <div className="text-center">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : users.length === 0 ? (
            <p className="text-muted text-center">No users found</p>
          ) : (
            <>
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Created At</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user, idx) => (
                      <tr key={user._id || user.id || idx}>
                        {editingUser === user._id ? (
                          <>
                            <td>
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                value={editForm.name}
                                onChange={(e) =>
                                  setEditForm({ ...editForm, name: e.target.value })
                                }
                              />
                            </td>
                            <td>
                              <input
                                type="email"
                                className="form-control form-control-sm"
                                value={editForm.email}
                                onChange={(e) =>
                                  setEditForm({ ...editForm, email: e.target.value })
                                }
                              />
                            </td>
                            <td>
                              <select
                                className="form-select form-select-sm"
                                value={editForm.role}
                                onChange={(e) =>
                                  setEditForm({ ...editForm, role: e.target.value })
                                }
                              >
                                <option value={ROLES.USER}>User</option>
                                <option value={ROLES.ARTIST}>Artist</option>
                                <option value={ROLES.SITE_ADMIN}>Site Admin</option>
                              </select>
                            </td>
                            <td>{safeFormatDate(user.createdAt)}</td>
                            <td>
                              <button
                                className="btn btn-sm btn-success me-2"
                                onClick={() => handleUpdate(user._id)}
                              >
                                Save
                              </button>
                              <button
                                className="btn btn-sm btn-secondary"
                                onClick={() => setEditingUser(null)}
                              >
                                Cancel
                              </button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td>{user.name}</td>
                            <td>{user.email}</td>
                            <td>
                              <span className="badge bg-primary">{user.role}</span>
                            </td>
                            <td>{safeFormatDate(user.createdAt)}</td>
                            <td>
                              <button
                                className="btn btn-sm btn-warning me-2"
                                onClick={() => handleEdit(user)}
                              >
                                Edit
                              </button>
                              <button
                                className="btn btn-sm btn-danger"
                                onClick={() => handleDelete(user._id)}
                              >
                                Delete
                              </button>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <nav className="mt-4">
                  <ul className="pagination justify-content-center">
                    <li
                      className={`page-item ${pagination.page === 1 ? 'disabled' : ''}`}
                    >
                      <button
                        className="page-link"
                        onClick={() =>
                          setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
                        }
                      >
                        Previous
                      </button>
                    </li>
                    {[...Array(pagination.pages)].map((_, i) => (
                      <li
                        key={i}
                        className={`page-item ${pagination.page === i + 1 ? 'active' : ''}`}
                      >
                        <button
                          className="page-link"
                          onClick={() =>
                            setPagination((prev) => ({ ...prev, page: i + 1 }))
                          }
                        >
                          {i + 1}
                        </button>
                      </li>
                    ))}
                    <li
                      className={`page-item ${pagination.page === pagination.pages ? 'disabled' : ''}`}
                    >
                      <button
                        className="page-link"
                        onClick={() =>
                          setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
                        }
                      >
                        Next
                      </button>
                    </li>
                  </ul>
                </nav>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserManagement;

