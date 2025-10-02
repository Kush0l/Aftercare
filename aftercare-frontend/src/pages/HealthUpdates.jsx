import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { healthUpdateAPI } from '../api/axios';
import { Plus, MessageCircle, Calendar } from 'lucide-react';

const HealthUpdates = () => {
  const navigate = useNavigate();
  const [updates, setUpdates] = useState([]);
  const [newUpdate, setNewUpdate] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchHealthUpdates();
  }, []);

  const fetchHealthUpdates = async () => {
    setLoading(true);
    try {
      const response = await healthUpdateAPI.getAll();
      setUpdates(response.data.health_updates);
    } catch (error) {
      setError('Failed to load health updates');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitUpdate = async (e) => {
    e.preventDefault();
    if (!newUpdate.trim()) return;

    setSubmitting(true);
    try {
      await healthUpdateAPI.create({ update_text: newUpdate });
      setNewUpdate('');
      fetchHealthUpdates(); // Refresh the list
    } catch (error) {
      setError('Failed to post health update');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading health updates...</div>;
  }

  return (
    <div className="health-updates">
      <div className="page-header">
        <h1>Health Updates</h1>
        <button onClick={() => navigate('/patient/dashboard')} className="secondary-button">
          Back to Dashboard
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* New Update Form */}
      <div className="card">
        <form onSubmit={handleSubmitUpdate} className="update-form">
          <div className="form-group">
            <label>Share how you're feeling</label>
            <textarea
              value={newUpdate}
              onChange={(e) => setNewUpdate(e.target.value)}
              placeholder="Describe your current health status, symptoms, or how you're feeling today..."
              rows="4"
              maxLength="500"
            />
            <div className="char-count">
              {newUpdate.length}/500 characters
            </div>
          </div>
          <button
            type="submit"
            className="primary-button"
            disabled={!newUpdate.trim() || submitting}
          >
            <Plus size={18} />
            {submitting ? 'Posting...' : 'Post Update'}
          </button>
        </form>
      </div>

      {/* Updates List */}
      <div className="card">
        <div className="card-header">
          <MessageCircle className="card-icon" />
          <h2>Your Health Updates</h2>
        </div>
        
        {updates.length === 0 ? (
          <p className="no-data">No health updates yet. Share how you're feeling!</p>
        ) : (
          <div className="updates-list">
            {updates.map((update) => (
              <div key={update.id} className="update-item">
                <div className="update-content">
                  <p>{update.update_text}</p>
                  <div className="update-meta">
                    <Calendar size={14} />
                    {new Date(update.created_at).toLocaleString()}
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

export default HealthUpdates;