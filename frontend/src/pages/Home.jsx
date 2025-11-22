import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { eventsAPI } from '../services/api';
import { format } from 'date-fns';

const Home = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await eventsAPI.getAll({ limit: 6, status: 'active' });
      setEvents(response.data.data.events);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="jumbotron bg-primary text-white py-5 mb-4">
        <div className="container text-center">
          <h1 className="display-4">Welcome to Event Management System</h1>
          <p className="lead">Discover and manage amazing events</p>
          <Link to="/events" className="btn btn-light btn-lg mt-3">
            Browse All Events
          </Link>
        </div>
      </div>

      <div className="container">
        <h2 className="mb-4">Featured Events</h2>
        {loading ? (
          <div className="text-center">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : events.length === 0 ? (
          <p className="text-center text-muted">No events available</p>
        ) : (
          <div className="row">
            {events.map((event) => (
              <div key={event._id} className="col-md-4 mb-4">
                <div className="card h-100">
                  {event.image && (
                    <img
                      src={`http://localhost:5000${event.image}`}
                      className="card-img-top"
                      alt={event.title}
                      style={{ height: '200px', objectFit: 'cover' }}
                    />
                  )}
                  <div className="card-body">
                    <h5 className="card-title">{event.title}</h5>
                    <p className="card-text text-muted">
                      {event.description.substring(0, 100)}...
                    </p>
                    <p className="card-text">
                      <small className="text-muted">
                        {format(new Date(event.date), 'MMM dd, yyyy')} • {event.venue}
                      </small>
                    </p>
                    <Link
                      to={`/events/${event._id}`}
                      className="btn btn-primary"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;

