import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { eventsAPI } from '../services/api';
import { format } from 'date-fns';
import { EVENT_CATEGORIES } from '../utils/constants';

const EventList = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    minPrice: '',
    maxPrice: '',
    startDate: '',
    endDate: '',
    status: 'active',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0,
  });

  useEffect(() => {
    fetchEvents();
  }, [filters, pagination.page]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const params = {
        ...filters,
        page: pagination.page,
        limit: pagination.limit,
      };
      // Remove empty filters
      Object.keys(params).forEach((key) => {
        if (params[key] === '') {
          delete params[key];
        }
      });

      const response = await eventsAPI.getAll(params);
      setEvents(response.data.data.events);
      setPagination((prev) => ({
        ...prev,
        ...response.data.data.pagination,
      }));
    } catch (error) {
      console.error('Error fetching events:', error);
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

  const clearFilters = () => {
    setFilters({
      search: '',
      category: '',
      minPrice: '',
      maxPrice: '',
      startDate: '',
      endDate: '',
      status: 'active',
    });
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  return (
    <div className="container mt-4">
      <h2 className="mb-4">All Events</h2>

      {/* Filters */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-3">
              <input
                type="text"
                className="form-control"
                placeholder="Search events..."
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
              />
            </div>
            <div className="col-md-2">
              <select
                className="form-select"
                name="category"
                value={filters.category}
                onChange={handleFilterChange}
              >
                <option value="">All Categories</option>
                {EVENT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <input
                type="number"
                className="form-control"
                placeholder="Min Price"
                name="minPrice"
                value={filters.minPrice}
                onChange={handleFilterChange}
              />
            </div>
            <div className="col-md-2">
              <input
                type="number"
                className="form-control"
                placeholder="Max Price"
                name="maxPrice"
                value={filters.maxPrice}
                onChange={handleFilterChange}
              />
            </div>
            <div className="col-md-2">
              <input
                type="date"
                className="form-control"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
              />
            </div>
            <div className="col-md-1">
              <button
                className="btn btn-secondary w-100"
                onClick={clearFilters}
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : events.length === 0 ? (
        <p className="text-center text-muted">No events found</p>
      ) : (
        <>
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
                    <p className="card-text">
                      <strong>${event.price}</strong> • {event.category}
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

          {/* Pagination */}
          {pagination.pages > 1 && (
            <nav className="mt-4">
              <ul className="pagination justify-content-center">
                <li className={`page-item ${pagination.page === 1 ? 'disabled' : ''}`}>
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
                    key={i + 1}
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
  );
};

export default EventList;

