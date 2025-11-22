import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { eventsAPI, registrationsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import { toast } from 'react-toastify';

const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    fetchEvent();
    if (isAuthenticated) {
      checkRegistration();
    }
  }, [id, isAuthenticated]);

  const fetchEvent = async () => {
    try {
      const response = await eventsAPI.getById(id);
      setEvent(response.data.data.event);
    } catch (error) {
      toast.error('Event not found');
      navigate('/events');
    } finally {
      setLoading(false);
    }
  };

  const checkRegistration = async () => {
    try {
      const response = await registrationsAPI.getMyRegistrations();
      const registrations = response.data.data.registrations;
      const registered = registrations.some(
        (reg) => reg.eventId._id === id && reg.status === 'confirmed'
      );
      setIsRegistered(registered);
    } catch (error) {
      console.error('Error checking registration:', error);
    }
  };

  const handleRegister = async () => {
    if (!isAuthenticated) {
      toast.info('Please login to register for events');
      navigate('/login');
      return;
    }

    if (user.role !== 'user') {
      toast.error('Only users can register for events');
      return;
    }

    setRegistering(true);
    try {
      await registrationsAPI.create({ eventId: id });
      toast.success('Successfully registered for event!');
      setIsRegistered(true);
      fetchEvent(); // Refresh event data
    } catch (error) {
      toast.error(
        error.response?.data?.message || 'Failed to register for event'
      );
    } finally {
      setRegistering(false);
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

  if (!event) {
    return null;
  }

  const canEdit =
    isAuthenticated &&
    (user.role === 'siteAdmin' ||
      (user.role === 'artist' && 
        (event.createdBy?._id === user.id || event.createdBy?.id === user.id)));

  return (
    <div className="container mt-4">
      <div className="row">
        <div className="col-md-8">
          {event.image && (
            <img
              src={`http://localhost:5000${event.image}`}
              className="img-fluid rounded mb-4"
              alt={event.title}
            />
          )}
          <h1>{event.title}</h1>
          <p className="text-muted">
            {format(new Date(event.date), 'MMMM dd, yyyy')} • {event.venue}
          </p>
          <div className="mb-3">
            <span className="badge bg-primary me-2">{event.category}</span>
            <span
              className={`badge ${event.status === 'active' ? 'bg-success' : 'bg-danger'}`}
            >
              {event.status}
            </span>
          </div>
          <hr />
          <h4>Description</h4>
          <p>{event.description}</p>
          <hr />
          <h4>Event Details</h4>
          <ul className="list-unstyled">
            <li>
              <strong>Date:</strong> {format(new Date(event.date), 'MMMM dd, yyyy')}
            </li>
            <li>
              <strong>Time:</strong> {format(new Date(event.date), 'h:mm a')}
            </li>
            <li>
              <strong>Venue:</strong> {event.venue}
            </li>
            <li>
              <strong>Price:</strong> ${event.price}
            </li>
            <li>
              <strong>Capacity:</strong> {event.capacity} people
            </li>
            <li>
              <strong>Available Spots:</strong> {event.availableSpots || event.capacity}
            </li>
          </ul>
        </div>
        <div className="col-md-4">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Event Information</h5>
              <p className="card-text">
                <strong>Organized by:</strong> {event.createdBy?.name || 'Unknown'}
              </p>
              {isAuthenticated && user.role === 'user' && (
                <div className="mt-3">
                  {isRegistered ? (
                    <div className="alert alert-success">
                      You are registered for this event
                    </div>
                  ) : (
                    <button
                      className="btn btn-primary w-100"
                      onClick={handleRegister}
                      disabled={registering || (event.availableSpots !== undefined && event.availableSpots === 0)}
                    >
                      {registering
                        ? 'Registering...'
                        : (event.availableSpots !== undefined && event.availableSpots === 0)
                        ? 'Event Full'
                        : 'Register for Event'}
                    </button>
                  )}
                </div>
              )}
              {canEdit && (
                <div className="mt-3">
                  <Link
                    to={`/events/${event._id}/edit`}
                    className="btn btn-warning w-100"
                  >
                    Edit Event
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetails;

