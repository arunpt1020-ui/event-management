import React, { useEffect, useState } from 'react';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const { user: contextUser } = useAuth();
  const [user, setUser] = useState(contextUser || null);
  const [loading, setLoading] = useState(!contextUser);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    name: contextUser?.name || '',
    email: contextUser?.email || '',
    password: '',
    profileImage: null,
    coverImage: null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Always fetch latest profile on mount
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const res = await authAPI.getMe();
        if (res.data && res.data.success && mounted) {
          setUser(res.data.data.user);
        }
      } catch (e) {
        console.error('Failed to load profile:', e);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (user) {
      setForm((f) => ({ ...f, name: user.name || '', email: user.email || '' }));
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      setForm((prev) => ({ ...prev, [name]: files }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        name: form.name,
        email: form.email,
      };
      if (form.password) payload.password = form.password;
      if (form.profileImage && form.profileImage[0]) payload.profileImage = form.profileImage[0];
      if (form.coverImage && form.coverImage[0]) payload.coverImage = form.coverImage[0];

      const res = await authAPI.updateProfile(payload);
      if (res.data && res.data.success) {
        // Refetch profile to ensure images are up to date
        const fresh = await authAPI.getMe();
        if (fresh.data && fresh.data.success) {
          setUser(fresh.data.data.user);
          setForm({
            name: fresh.data.data.user.name,
            email: fresh.data.data.user.email,
            password: '',
            profileImage: null,
            coverImage: null,
          });
          localStorage.setItem('user', JSON.stringify(fresh.data.data.user));
        }
        setEditMode(false);
      } else {
        setError('Update failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed');
    } finally {
      setSubmitting(false);
    }
  };

  // Conditional rendering inside returned JSX only
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  const BACKEND_ORIGIN = API_URL.replace(/\/api$/, '');

  const profileImage = user && user.profileImage ? (user.profileImage.startsWith('http') ? user.profileImage : `${BACKEND_ORIGIN}${user.profileImage}`) : null;
  const coverImage = user && user.coverImage ? (user.coverImage.startsWith('http') ? user.coverImage : `${BACKEND_ORIGIN}${user.coverImage}`) : null;

  return (
    <div className="container mt-4">
      {loading ? (
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : !user ? (
        <div>
          <h3>Profile</h3>
          <p>User not found.</p>
        </div>
      ) : (
        <>
          <div className="card mb-4">
            {coverImage && (
              <img src={coverImage} className="card-img-top" alt="cover" style={{ maxHeight: 250, objectFit: 'cover' }} />
            )}
            <div className="card-body d-flex align-items-center">
              <div style={{ width: 120, height: 120, marginRight: 20 }}>
                {profileImage ? (
                  <img src={profileImage} alt="profile" className="rounded-circle" style={{ width: 120, height: 120, objectFit: 'cover' }} />
                ) : (
                  <div className="rounded-circle bg-secondary d-flex justify-content-center align-items-center text-white" style={{ width: 120, height: 120 }}>
                    <strong>{(user.name || '').slice(0, 1).toUpperCase()}</strong>
                  </div>
                )}
              </div>
              <div>
                <h4>{user.name}</h4>
                <p className="mb-1">{user.email}</p>
                <p className="text-muted">Role: {user.role}</p>
                <button className="btn btn-outline-primary btn-sm mt-2" onClick={() => setEditMode((m) => !m)}>
                  {editMode ? 'Cancel' : 'Edit Profile'}
                </button>
              </div>
            </div>
          </div>
          {editMode && (
            <div className="card p-3 mb-4">
              <h5>Edit Profile</h5>
              <form onSubmit={handleSubmit} encType="multipart/form-data">
                <div className="mb-3">
                  <label className="form-label">Name</label>
                  <input type="text" className="form-control" name="name" value={form.name} onChange={handleChange} required />
                </div>
                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <input type="email" className="form-control" name="email" value={form.email} onChange={handleChange} required />
                </div>
                <div className="mb-3">
                  <label className="form-label">New Password</label>
                  <input type="password" className="form-control" name="password" value={form.password} onChange={handleChange} autoComplete="new-password" />
                  <div className="form-text">Leave blank to keep current password.</div>
                </div>
                {/* Profile Image field is always visible for all roles */}
                <div className="mb-3">
                  <label className="form-label">Profile Image</label>
                  <input type="file" className="form-control" name="profileImage" accept="image/*" onChange={handleChange} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Cover Image</label>
                  <input type="file" className="form-control" name="coverImage" accept="image/*" onChange={handleChange} />
                </div>
                {error && <div className="alert alert-danger">{error}</div>}
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Profile;
