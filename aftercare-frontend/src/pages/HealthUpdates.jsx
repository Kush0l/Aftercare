import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { healthUpdateAPI } from '../api/axios';
import { 
  Plus, 
  MessageCircle, 
  Calendar, 
  Heart, 
  TrendingUp, 
  Clock,
  User,
  Sparkles,
  Send,
  Edit3,
  Trash2,
  Smile,
  Frown,
  Meh,
  Activity
} from 'lucide-react';

const HealthUpdates = () => {
  const navigate = useNavigate();
  const [updates, setUpdates] = useState([]);
  const [newUpdate, setNewUpdate] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [mood, setMood] = useState('neutral');
  const [charCount, setCharCount] = useState(0);
  const textareaRef = useRef(null);

  const moods = [
    { id: 'great', icon: Smile, label: 'Great', color: '#10b981' },
    { id: 'good', icon: TrendingUp, label: 'Good', color: '#3b82f6' },
    { id: 'neutral', icon: Meh, label: 'Neutral', color: '#f59e0b' },
    { id: 'bad', icon: Frown, label: 'Not Well', color: '#ef4444' },
    { id: 'sick', icon: Activity, label: 'Sick', color: '#dc2626' }
  ];

  useEffect(() => {
    fetchHealthUpdates();
    autoResizeTextarea();
  }, []);

  useEffect(() => {
    autoResizeTextarea();
  }, [newUpdate]);

  const autoResizeTextarea = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  };

  const fetchHealthUpdates = async () => {
    setLoading(true);
    try {
      const response = await healthUpdateAPI.getAll();
      setUpdates(response.data.health_updates);
    } catch (error) {
      setError('Failed to load health updates');
      showNotification('Failed to load updates', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitUpdate = async (e) => {
    e.preventDefault();
    if (!newUpdate.trim()) return;

    setSubmitting(true);
    try {
      await healthUpdateAPI.create({ 
        update_text: newUpdate,
        mood: mood
      });
      setNewUpdate('');
      setMood('neutral');
      setCharCount(0);
      fetchHealthUpdates();
      showNotification('Health update posted successfully!', 'success');
    } catch (error) {
      setError('Failed to post health update');
      showNotification('Failed to post update', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUpdate = async (updateId) => {
    if (window.confirm('Are you sure you want to delete this update?')) {
      try {
        await healthUpdateAPI.delete(updateId);
        setUpdates(updates.filter(update => update.id !== updateId));
        showNotification('Update deleted successfully', 'success');
      } catch (error) {
        showNotification('Failed to delete update', 'error');
      }
    }
  };

  const showNotification = (message, type = 'info') => {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notif => notif.remove());

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <span>${message}</span>
        <button onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 4000);
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInHours < 168) {
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getMoodIcon = (moodType) => {
    const moodConfig = moods.find(m => m.id === moodType) || moods[2]; // Default to neutral
    const IconComponent = moodConfig.icon;
    return <IconComponent size={16} color={moodConfig.color} />;
  };

  const getMoodLabel = (moodType) => {
    const moodConfig = moods.find(m => m.id === moodType) || moods[2];
    return moodConfig.label;
  };
  if (loading) {
    return (
      <div className="patients-page">
        <div className="fast-loader">
          <div className="ring"></div>
          <div className="ring"></div>
          <div className="ring"></div>
          <span className="loading-text"></span>
        </div>
  
        <style jsx>{`
          .patients-page {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background: #f8f9fa;
          }
  
          .fast-loader {
            position: relative;
            width: 80px;
            height: 80px;
            display: flex;
            justify-content: center;
            align-items: center;
          }
  
          .ring {
            position: absolute;
            border: 3px solid transparent;
            border-top: 3px solid #3498db;
            border-radius: 50%;
            animation: spin 0.5s linear infinite;
          }
  
          .ring:nth-child(1) {
            width: 80px;
            height: 80px;
            animation-delay: 0s;
          }
  
          .ring:nth-child(2) {
            width: 60px;
            height: 60px;
            animation-delay: 0.1s;
          }
  
          .ring:nth-child(3) {
            width: 40px;
            height: 40px;
            animation-delay: 0.2s;
          }
  
          @keyframes spin {
            0% {
              transform: rotate(0deg);
            }
            100% {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    );
  }
  return (
    <div className="health-updates">
      {/* Header */}
      <div className="page-header enhanced">
        <div className="header-left">
          <button 
            onClick={() => navigate('/patient/dashboard')} 
            className="back-button"
          >
            ← Back to Dashboard
          </button>
          <div className="header-content">
            <div className="icon-title">
              <div className="icon-container health">
                <Heart size={28} />
              </div>
              <div>
                <h1>Health Updates</h1>
                <p className="page-subtitle">Track and share your health journey</p>
              </div>
            </div>
          </div>
        </div>
        <div className="header-stats">
          <div className="stat-badge">
            <MessageCircle size={16} />
            <span>{updates.length} Updates</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="error-message enhanced">
          <div className="error-icon">⚠️</div>
          <div>
            <strong>Unable to load updates</strong>
            <p>{error}</p>
          </div>
          <button onClick={fetchHealthUpdates} className="retry-button small">
            Try Again
          </button>
        </div>
      )}

      <div className="health-updates-grid">
        {/* Left Column - New Update Form */}
        <div className="main-content">
          {/* New Update Form */}
          <div className="card update-form-card">
            <div className="card-header enhanced">
              <div className="icon-title">
                <div className="icon-container primary">
                  <Edit3 size={24} />
                </div>
                <div>
                  <h2>How are you feeling today?</h2>
                  <p className="card-subtitle">Share your current health status</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmitUpdate} className="update-form enhanced">
              
              {/* Update Text */}
              <div className="form-section">
                <label className="section-label">Describe how you're feeling</label>
                <div className="textarea-container">
                  <textarea
                    ref={textareaRef}
                    value={newUpdate}
                    onChange={(e) => {
                      setNewUpdate(e.target.value);
                      setCharCount(e.target.value.length);
                    }}
                    placeholder="Share your symptoms, how you're feeling, any changes in your condition, or questions for your doctor..."
                    maxLength="500"
                    className="enhanced-textarea"
                  />
                  <div className="textarea-footer">
                    <div className="char-count">
                      {charCount}/500 characters
                    </div>
                    <div className="writing-tips">
                      💡 Be specific about symptoms and timing
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="submit-button primary"
                disabled={!newUpdate.trim() || submitting || charCount > 500}
              >
                {submitting ? (
                  <div className="button-loading">
                    <div className="spinner"></div>
                    <span>Posting...</span>
                  </div>
                ) : (
                  <>
                    <Send size={18} />
                    <span>Share Update</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column - Updates List */}
        <div className="sidebar-content">
          {/* Updates List */}
          <div className="card updates-list-card">
            <div className="card-header enhanced">
              <div className="icon-title">
                <div className="icon-container secondary">
                  <MessageCircle size={24} />
                </div>
                <div>
                  <h2>Your Health Journey</h2>
                  <p className="card-subtitle">Recent updates and history</p>
                </div>
              </div>
            </div>
            
            {updates.length === 0 ? (
              <div className="empty-state enhanced">
                <div className="empty-animation">
                  <Sparkles size={48} color="#cbd5e1" />
                </div>
                <h3>No updates yet</h3>
                <p>Share your first health update to start tracking your journey</p>
                <div className="empty-tips">
                  <div className="tip-item">
                    <span>📝</span>
                    <span>Describe symptoms clearly</span>
                  </div>
                  <div className="tip-item">
                    <span>⏰</span>
                    <span>Note when symptoms occur</span>
                  </div>
                  <div className="tip-item">
                    <span>🎯</span>
                    <span>Be specific about severity</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="updates-timeline">
                {updates.map((update, index) => (
                  <div key={update.id} className="update-item enhanced">
                    <div className="timeline-indicator">
                      <div className="timeline-dot"></div>
                      {index < updates.length - 1 && <div className="timeline-line"></div>}
                    </div>
                    
                    <div className="update-content">
                      <div className="update-header">
                      
                        <div className="update-actions">
                         
                        </div>
                      </div>
                      
                      <p className="update-text">{update.update_text}</p>
                      
                      <div className="update-footer">
                        <div className="update-meta">
                          <Clock size={14} />
                          <span>{formatTime(update.created_at)}</span>
                          <span className="meta-separator">•</span>
                          <Calendar size={14} />
                          <span>{new Date(update.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Stats */}
          {updates.length > 0 && (
            <div className="card stats-card">
              <div className="card-header">
                <h3>Update Insights</h3>
              </div>
              <div className="stats-grid">
                <div className="stat-item small">
                  <div className="stat-icon">
                    <MessageCircle size={16} />
                  </div>
                  <div className="stat-info">
                    <span className="stat-number">{updates.length}</span>
                    <span className="stat-label">Total Updates</span>
                  </div>
                </div>
                <div className="stat-item small">
                  <div className="stat-icon">
                    <Clock size={16} />
                  </div>
                  <div className="stat-info">
                    <span className="stat-number">
                      {updates.length > 0 ? formatTime(updates[0].created_at) : '--'}
                    </span>
                    <span className="stat-label">Last Update</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Notification Container */}
      <div className="notification-container"></div>

      <style jsx>{`
        .health-updates {
          min-height: 100vh;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          padding: 20px;
        }

        /* Enhanced Header */
        .page-header.enhanced {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 30px;
          gap: 20px;
        }

        .header-left {
          display: flex;
          align-items: flex-start;
          gap: 20px;
        }

        .back-button {
          background: white;
          border: 1px solid #e2e8f0;
          padding: 8px 16px;
          border-radius: 8px;
          cursor: pointer;
          color: #64748b;
          font-weight: 500;
          transition: all 0.2s ease;
          margin-top: 8px;
        }

        .back-button:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
        }

        .header-content {
          flex: 1;
        }

        .icon-title {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .icon-container {
          width: 60px;
          height: 60px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .icon-container.health {
          background: linear-gradient(135deg, #ec4899 0%, #f472b6 100%);
        }

        .icon-container.primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .icon-container.secondary {
          background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%);
        }

        .page-header h1 {
          font-size: 2.5rem;
          font-weight: 800;
          color: #1e293b;
          margin: 0 0 4px 0;
        }

        .page-subtitle {
          color: #64748b;
          font-size: 1.1rem;
          margin: 0;
        }

        .header-stats {
          display: flex;
          gap: 10px;
        }

        .stat-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          background: white;
          padding: 8px 16px;
          border-radius: 20px;
          border: 1px solid #e2e8f0;
          color: #64748b;
          font-weight: 600;
          font-size: 0.9rem;
        }

        /* Grid Layout */
        .health-updates-grid {
          display: grid;
          grid-template-columns: 1fr 400px;
          gap: 25px;
          align-items: start;
        }

        /* Cards */
        .card {
          background: white;
          border-radius: 20px;
          padding: 25px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          border: 1px solid #f1f5f9;
        }

        .update-form-card {
          margin-bottom: 25px;
        }

        .card-header.enhanced {
          margin-bottom: 25px;
          padding-bottom: 20px;
          border-bottom: 2px solid #f1f5f9;
        }

        .card-header h2 {
          font-size: 1.4rem;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 4px 0;
        }

        .card-subtitle {
          color: #64748b;
          margin: 0;
          font-size: 0.95rem;
        }

        /* Enhanced Form */
        .update-form.enhanced {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .form-section {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .section-label {
          font-weight: 600;
          color: #374151;
          font-size: 0.95rem;
        }

        /* Mood Selector */
        .mood-selector {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 8px;
        }

        .mood-option {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          padding: 12px 8px;
          border: 2px solid transparent;
          border-radius: 12px;
          background: #f8fafc;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 0.8rem;
          font-weight: 500;
        }

        .mood-option:hover {
          background: #f1f5f9;
          transform: translateY(-1px);
        }

        .mood-option.selected {
          background: white;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        /* Enhanced Textarea */
        .textarea-container {
          position: relative;
        }

        .enhanced-textarea {
          width: 100%;
          padding: 16px;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          font-size: 1rem;
          line-height: 1.5;
          resize: none;
          transition: all 0.2s ease;
          background: #f8fafc;
          font-family: inherit;
        }

        .enhanced-textarea:focus {
          outline: none;
          border-color: #667eea;
          background: white;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .textarea-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 8px;
        }

        .char-count {
          font-size: 0.8rem;
          color: #64748b;
        }

        .writing-tips {
          font-size: 0.75rem;
          color: #94a3b8;
        }

        /* Submit Button */
        .submit-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 14px 24px;
          border: none;
          border-radius: 12px;
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.3s ease;
          justify-content: center;
        }

        .submit-button.primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .submit-button.primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
        }

        .submit-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none !important;
        }

        .button-loading {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid transparent;
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        /* Updates Timeline */
        .updates-timeline {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .update-item.enhanced {
          display: flex;
          gap: 16px;
          padding: 20px;
          background: #f8fafc;
          border-radius: 16px;
          border-left: 4px solid #667eea;
          transition: all 0.2s ease;
        }

        .update-item.enhanced:hover {
          transform: translateX(4px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .timeline-indicator {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex-shrink: 0;
        }

        .timeline-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #667eea;
          border: 2px solid white;
          box-shadow: 0 0 0 2px #e2e8f0;
        }

        .timeline-line {
          flex: 1;
          width: 2px;
          background: #e2e8f0;
          margin: 8px 0;
        }

        .update-content {
          flex: 1;
          min-width: 0;
        }

        .update-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }

        .update-mood {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .mood-label {
          font-weight: 600;
          font-size: 0.9rem;
          color: #374151;
        }

        .update-actions {
          display: flex;
          gap: 4px;
        }

        .icon-button {
          padding: 6px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
          background: transparent;
        }

        .icon-button.danger {
          color: #ef4444;
        }

        .icon-button.danger:hover {
          background: #fef2f2;
        }

        .update-text {
          color: #374151;
          line-height: 1.6;
          margin: 0 0 12px 0;
          white-space: pre-wrap;
        }

        .update-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .update-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #64748b;
          font-size: 0.8rem;
        }

        .meta-separator {
          color: #cbd5e1;
        }

        /* Empty State */
        .empty-state.enhanced {
          text-align: center;
          padding: 40px 20px;
        }

        .empty-animation {
          margin-bottom: 20px;
        }

        .empty-state h3 {
          font-size: 1.3rem;
          color: #1e293b;
          margin-bottom: 8px;
        }

        .empty-state p {
          color: #64748b;
          margin-bottom: 20px;
        }

        .empty-tips {
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-width: 300px;
          margin: 0 auto;
        }

        .tip-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: #f8fafc;
          border-radius: 8px;
          font-size: 0.85rem;
          color: #475569;
        }

        /* Stats Card */
        .stats-card {
          margin-top: 20px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .stat-item.small {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px;
          background: #f8fafc;
          border-radius: 12px;
        }

        .stat-item.small .stat-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #e0e7ff;
          color: #4f46e5;
        }

        .stat-number {
          font-size: 1.1rem;
          font-weight: 700;
          color: #1e293b;
          line-height: 1;
        }

        .stat-label {
          font-size: 0.75rem;
          color: #64748b;
          font-weight: 500;
        }

        /* Loading State */
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 60vh;
          gap: 20px;
          text-align: center;
        }

        .pulse-animation {
          animation: pulse 2s ease-in-out infinite;
        }

        .loading-container h2 {
          font-size: 1.5rem;
          color: #1e293b;
          margin: 0;
        }

        .loading-container p {
          color: #64748b;
          margin: 0;
        }

        /* Error State */
        .error-message.enhanced {
          display: flex;
          align-items: center;
          gap: 12px;
          background: #fef2f2;
          color: #dc2626;
          padding: 16px 20px;
          border-radius: 12px;
          border: 1px solid #fecaca;
          margin-bottom: 20px;
        }

        .error-icon {
          font-size: 1.2rem;
        }

        .retry-button.small {
          padding: 6px 12px;
          background: #dc2626;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.8rem;
          font-weight: 500;
        }

        /* Notifications */
        .notification {
          position: fixed;
          top: 20px;
          right: 20px;
          background: white;
          padding: 16px 20px;
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
          border-left: 4px solid #10b981;
          z-index: 1000;
          animation: slideIn 0.3s ease;
        }

        .notification.error {
          border-left-color: #ef4444;
        }

        .notification-content {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .notification button {
          background: none;
          border: none;
          font-size: 1.2rem;
          cursor: pointer;
          color: #64748b;
          padding: 0;
        }

        /* Animations */
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.05); }
        }

        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        /* Responsive Design */
        @media (max-width: 1024px) {
          .health-updates-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .health-updates {
            padding: 15px;
          }

          .page-header.enhanced {
            flex-direction: column;
            gap: 15px;
          }

          .header-left {
            flex-direction: column;
            gap: 15px;
          }

          .page-header h1 {
            font-size: 2rem;
          }

          .mood-selector {
            grid-template-columns: repeat(3, 1fr);
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 480px) {
          .card {
            padding: 20px;
          }

          .mood-selector {
            grid-template-columns: repeat(2, 1fr);
          }

          .update-item.enhanced {
            flex-direction: column;
            gap: 12px;
          }

          .timeline-indicator {
            flex-direction: row;
            align-items: center;
          }

          .timeline-line {
            width: auto;
            height: 2px;
            margin: 0 8px;
            flex: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default HealthUpdates;