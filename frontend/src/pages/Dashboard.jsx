import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { eventsAPI, registrationsAPI, usersAPI } from '../services/api';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import { ROLES } from '../utils/constants';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalUsers: 0,
    totalRegistrations: 0,
    myEvents: 0,
    myRegistrations: 0,
  });
  const [events, setEvents] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      if (user.role === ROLES.SITE_ADMIN) {
        // Site Admin dashboard
        const [eventsRes, usersRes, registrationsRes] = await Promise.all([
          eventsAPI.getAll({ limit: 5 }),
          usersAPI.getAll({ limit: 1 }),
          registrationsAPI.getMyRegistrations(),
        ]);

        setEvents(eventsRes.data.data.events);
        setStats({
          totalEvents: eventsRes.data.data.pagination.total,
          totalUsers: usersRes.data.data.pagination.total,
          totalRegistrations: registrationsRes.data.data.registrations.length,
          myEvents: 0,
          myRegistrations: 0,
        });
      } else if (user.role === ROLES.ARTIST) {
        // Artist dashboard
        const [eventsRes, registrationsRes] = await Promise.all([
          eventsAPI.getAll({ limit: 10 }),
          registrationsAPI.getMyRegistrations(),
        ]);

        const myEvents = eventsRes.data.data.events.filter(
          (e) => e.createdBy?._id === user.id || e.createdBy?.id === user.id
        );

        setEvents(myEvents);
        setStats({
          totalEvents: 0,
          totalUsers: 0,
          totalRegistrations: 0,
          myEvents: myEvents.length,
          myRegistrations: registrationsRes.data.data.registrations.length,
        });
      } else {
        // User dashboard
        const registrationsRes = await registrationsAPI.getMyRegistrations();
        setRegistrations(registrationsRes.data.data.registrations);
        setStats({
          totalEvents: 0,
          totalUsers: 0,
          totalRegistrations: registrationsRes.data.data.registrations.length,
          myEvents: 0,
          myRegistrations: registrationsRes.data.data.registrations.length,
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event?')) {
      return;
    }

    try {
      await eventsAPI.delete(eventId);
      toast.success('Event deleted successfully');
      fetchDashboardData();
    } catch (error) {
      toast.error('Failed to delete event');
    }
  };

  if (loading) {
    return (
      <div className="container mt-4">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <h2>Dashboard</h2>
      <p className="text-muted">Welcome, {user?.name}!</p>

      {/* Statistics Cards */}
      <div className="row mb-4">
        {user.role === ROLES.SITE_ADMIN && (
          <>
            <div className="col-md-3 mb-3">
              <div className="card text-center">
                <div className="card-body">
                  <h5 className="card-title">Total Events</h5>
                  <h3>{stats.totalEvents}</h3>
                </div>
              </div>
            </div>
            <div className="col-md-3 mb-3">
              <div className="card text-center">
                <div className="card-body">
                  <h5 className="card-title">Total Users</h5>
                  <h3>{stats.totalUsers}</h3>
                </div>
              </div>
            </div>
            <div className="col-md-3 mb-3">
              <div className="card text-center">
                <div className="card-body">
                  <h5 className="card-title">Total Registrations</h5>
                  <h3>{stats.totalRegistrations}</h3>
                </div>
              </div>
            </div>
          </>
        )}
        {user.role === ROLES.ARTIST && (
          <>
            <div className="col-md-6 mb-3">
              <div className="card text-center">
                <div className="card-body">
                  <h5 className="card-title">My Events</h5>
                  <h3>{stats.myEvents}</h3>
                </div>
              </div>
            </div>
            <div className="col-md-6 mb-3">
              <div className="card text-center">
                <div className="card-body">
                  <h5 className="card-title">Total Registrations</h5>
                  <h3>{stats.totalRegistrations}</h3>
                </div>
              </div>
            </div>
          </>
        )}
        {user.role === ROLES.USER && (
          <div className="col-md-12 mb-3">
            <div className="card text-center">
              <div className="card-body">
                <h5 className="card-title">My Registrations</h5>
                <h3>{stats.myRegistrations}</h3>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      {(user.role === ROLES.SITE_ADMIN || user.role === ROLES.ARTIST) && (
        <div className="mb-4">
          <Link to="/events/create" className="btn btn-primary">
            Create New Event
          </Link>
        </div>
      )}

      {/* Events List */}
      {(user.role === ROLES.SITE_ADMIN || user.role === ROLES.ARTIST) && (
        <div className="card">
          <div className="card-header">
            <h5>
              {user.role === ROLES.SITE_ADMIN ? 'All Events' : 'My Events'}
            </h5>
          </div>
          <div className="card-body">
            {events.length === 0 ? (
              <p className="text-muted">No events found</p>
            ) : (
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Date</th>
                      <th>Venue</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((event) => (
                      <tr key={event._id}>
                        <td>
                          <Link to={`/events/${event._id}`}>{event.title}</Link>
                        </td>
                        <td>{format(new Date(event.date), 'MMM dd, yyyy')}</td>
                        <td>{event.venue}</td>
                        <td>
                          <span
                            className={`badge ${event.status === 'active' ? 'bg-success' : 'bg-danger'}`}
                          >
                            {event.status}
                          </span>
                        </td>
                        <td>
                          <Link
                            to={`/events/${event._id}/edit`}
                            className="btn btn-sm btn-warning me-2"
                          >
                            Edit
                          </Link>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDeleteEvent(event._id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* User Registrations */}
      {user.role === ROLES.USER && (
        <div className="card">
          <div className="card-header">
            <h5>My Registrations</h5>
          </div>
          <div className="card-body">
            {registrations.length === 0 ? (
              <p className="text-muted">You haven't registered for any events yet</p>
            ) : (
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Event</th>
                      <th>Date</th>
                      <th>Venue</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registrations.map((reg) => (
                      <tr key={reg._id}>
                        <td>
                          <Link to={`/events/${reg.eventId._id}`}>
                            {reg.eventId.title}
                          </Link>
                        </td>
                        <td>
                          {format(new Date(reg.eventId.date), 'MMM dd, yyyy')}
                        </td>
                        <td>{reg.eventId.venue}</td>
                        <td>
                          <span
                            className={`badge ${reg.status === 'confirmed' ? 'bg-success' : 'bg-danger'}`}
                          >
                            {reg.status}
                          </span>
                        </td>
                        <td>
                          {reg.status === 'confirmed' && (
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={async () => {
                                if (
                                  window.confirm(
                                    'Are you sure you want to cancel this registration?'
                                  )
                                ) {
                                  try {
                                    await registrationsAPI.cancel(reg._id);
                                    toast.success('Registration cancelled');
                                    fetchDashboardData();
                                  } catch (error) {
                                    toast.error('Failed to cancel registration');
                                  }
                                }
                              }}
                            >
                              Cancel
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

