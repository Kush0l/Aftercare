import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { prescriptionAPI, medicineAPI } from '../api/axios';
import { 
  Pill, 
  Calendar, 
  CheckCircle, 
  Clock, 
  Heart, 
  LogOut, 
  User,
  TrendingUp,
  Bell,
  Shield,
  Sparkles,
  Stethoscope,
  AlertCircle
} from 'lucide-react';

const PatientDashboard = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [todayMedicines, setTodayMedicines] = useState([]);
  const [revisits, setRevisits] = useState([]);
  const [patientName, setPatientName] = useState('');
  const [loading, setLoading] = useState(true);
  const [revisitsLoading, setRevisitsLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadingMedicineId, setLoadingMedicineId] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [greeting, setGreeting] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchPrescriptions();
    fetchRevisits();
    updateGreeting();
    const timeInterval = setInterval(() => setCurrentTime(new Date()), 1000);
    const greetingInterval = setInterval(updateGreeting, 60000);
    
    return () => {
      clearInterval(timeInterval);
      clearInterval(greetingInterval);
    };
  }, []);

  const updateGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  };

  const fetchPrescriptions = async () => {
    try {
      const response = await prescriptionAPI.getPatientPrescriptions();
      setPrescriptions(response.data.prescriptions);
      extractTodayMedicines(response.data.prescriptions);
      
      // Extract patient name from prescriptions if available
      if (response.data.prescriptions.length > 0) {
        // Assuming patient name is available in the first prescription
        // You might need to adjust this based on your API response structure
        const patientNameFromAPI = response.data.patient_name;
        setPatientName(patientNameFromAPI);
      } else {
        // Fallback to stored user data
        const userData = localStorage.getItem('user');
        if (userData) {
          const user = JSON.parse(userData);
          setPatientName(user.first_name || user.name || 'Patient');
        }
      }
    } catch (error) {
      setError('Failed to load prescriptions');
      // Fallback to stored user data on error
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        setPatientName(user.first_name || user.name || 'Patient');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchRevisits = async () => {
    try {
      setRevisitsLoading(true);
      const response = await prescriptionAPI.getPatientRevisits();
      setRevisits(response.data.revisits || []);
      
      // Extract patient name from revisits if not already set
      if (!patientName && response.data.revisits && response.data.revisits.length > 0) {
        setPatientName(response.data.revisits[0]?.patient_name || 'Patient');
      }
    } catch (error) {
      console.error('Failed to load revisits:', error);
      setRevisits([]);
    } finally {
      setRevisitsLoading(false);
    }
  };

  const extractTodayMedicines = (prescriptions) => {
    const today = new Date().toISOString().split('T')[0];
    const medicines = [];

    prescriptions.forEach((prescription) => {
      prescription.medicines.forEach((medicine) => {
        medicine.schedules.forEach((schedule) => {
          if (schedule.scheduled_date === today && !schedule.is_taken) {
            medicines.push({
              ...schedule,
              medicineName: medicine.name,
              dosage: medicine.dosage,
              instructions: medicine.instructions,
              prescriptionId: prescription.id
            });
          }
        });
      });
    });

    // Sort by time
    medicines.sort((a, b) => new Date(a.scheduled_time) - new Date(b.scheduled_time));
    setTodayMedicines(medicines);
  };

  const markMedicineTaken = async (scheduleId) => {
    try {
      setLoadingMedicineId(scheduleId);
      await medicineAPI.markTaken(scheduleId);
      
      // Animate removal
      const medicineElement = document.getElementById(`medicine-${scheduleId}`);
      if (medicineElement) {
        medicineElement.style.transform = 'translateX(100%)';
        medicineElement.style.opacity = '0';
        setTimeout(() => {
          setTodayMedicines((prev) => prev.filter((med) => med.id !== scheduleId));
        }, 300);
      } else {
        setTodayMedicines((prev) => prev.filter((med) => med.id !== scheduleId));
      }
      
      // Show success notification
      showNotification('Medicine marked as taken! 🎉', 'success');
    } catch (error) {
      showNotification('Failed to mark medicine as taken', 'error');
    } finally {
      setLoadingMedicineId(null);
    }
  };

  const showNotification = (message, type = 'info') => {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
      <span>${message}</span>
      <button onclick="this.parentElement.remove()">×</button>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (notification.parentElement) {
        notification.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => notification.remove(), 300);
      }
    }, 4000);
  };

  const getMedicationStats = () => {
    const totalToday = todayMedicines.length;
    const takenToday = todayMedicines.filter(med => med.is_taken).length;
    const upcoming = todayMedicines.filter(med => 
      new Date(med.scheduled_time) > currentTime
    ).length;
    
    return { totalToday, takenToday, upcoming };
  };

  const getUpcomingRevisits = () => {
    const today = new Date();
    return revisits.filter(revisit => new Date(revisit.revisit_date) >= today)
                  .sort((a, b) => new Date(a.revisit_date) - new Date(b.revisit_date));
  };

  const formatRevisitDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const isRevisitSoon = (revisitDate) => {
    const revisit = new Date(revisitDate);
    const today = new Date();
    const daysDifference = Math.ceil((revisit - today) / (1000 * 60 * 60 * 24));
    return daysDifference <= 7; // Within next 7 days
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const stats = getMedicationStats();
  const upcomingRevisits = getUpcomingRevisits();


  if (error) {
    return (
      <div className="dashboard">
        <div className="error-container">
          <div className="error-animation">
            <div className="pulse-circle"></div>
            <Shield size={64} />
          </div>
          <h2>Unable to Load Data</h2>
          <p>{error}</p>
          <button onClick={fetchPrescriptions} className="retry-button">
            <TrendingUp size={18} />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-main">
          <div className="welcome-section">
            <div className="greeting">
              <div className="greeting-main">
                <h1>{greeting}, {patientName}! 👋</h1>
                <div className="time-display">
                  <Clock size={16} />
                  {currentTime.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    second: '2-digit'
                  })}
                </div>
              </div>
              <p>Here's your medication schedule for today</p>
            </div>
          </div>
          
          <div className="quick-stats">
            <div className="stat-item">
              <div className="stat-icon total">
                <Pill size={20} />
              </div>
              <div className="stat-info">
                <span className="stat-number">{stats.totalToday}</span>
                <span className="stat-label">Total Today</span>
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-icon taken">
                <CheckCircle size={20} />
              </div>
              <div className="stat-info">
                <span className="stat-number">{stats.takenToday}</span>
                <span className="stat-label">Taken</span>
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-icon upcoming">
                <Bell size={20} />
              </div>
              <div className="stat-info">
                <span className="stat-number">{stats.upcoming}</span>
                <span className="stat-label">Upcoming</span>
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-icon revisits">
                <Stethoscope size={20} />
              </div>
              <div className="stat-info">
                <span className="stat-number">{upcomingRevisits.length}</span>
                <span className="stat-label">Revisits</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="header-actions">
          <Link to="/patient/health-updates" className="action-button health-updates">
            <Heart size={18} />
            <span>Health Updates</span>
          </Link>
          <button onClick={handleLogout} className="action-button logout">
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="dashboard-grid">
        {/* Today's Medicines - Main Focus */}
        <div className="main-card">
          <div className="card-header enhanced">
            <div className="header-content">
              <div className="icon-title">
                <div className="icon-container primary">
                  <Pill size={24} />
                </div>
                <div>
                  <h2>Today's Medications</h2>
                  <p className="card-subtitle">Your schedule for {currentTime.toLocaleDateString()}</p>
                </div>
              </div>
              {todayMedicines.length > 0 && (
                <div className="completion-badge">
                  <span>{Math.round((stats.takenToday / stats.totalToday) * 100)}% Complete</span>
                </div>
              )}
            </div>
          </div>
          
          {todayMedicines.length === 0 ? (
            <div className="empty-state enhanced">
              <div className="empty-animation">
                <Sparkles size={48} />
              </div>
              <h3>All Clear for Today! 🎉</h3>
              <p>You have no medications scheduled. Enjoy your day!</p>
            </div>
          ) : (
            <div className="medicines-timeline">
              {todayMedicines.map((medicine, index) => {
                const medicineTime = new Date(medicine.scheduled_time);
                const isUpcoming = medicineTime > currentTime;
                const isCurrent = !isUpcoming && !medicine.is_taken;
                
                return (
                  <div 
                    key={medicine.id}
                    id={`medicine-${medicine.id}`}
                    className={`medicine-card ${isCurrent ? 'current' : ''} ${isUpcoming ? 'upcoming' : ''}`}
                  >
                    <div className="medicine-timeline">
                      <div className="timeline-dot"></div>
                      {index < todayMedicines.length - 1 && <div className="timeline-line"></div>}
                    </div>
                    
                    <div className="medicine-content">
                      <div className="medicine-main">
                        <div className="medicine-header">
                          <h3>{medicine.medicineName}</h3>
                          <div className="medicine-meta">
                            <span className="dosage-badge">{medicine.dosage}</span>
                            <span className="time-badge">
                              <Clock size={14} />
                              {medicineTime.toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </span>
                          </div>
                        </div>
                        
                        {medicine.instructions && (
                          <p className="medicine-instructions">{medicine.instructions}</p>
                        )}
                        
                        {isCurrent && (
                          <div className="current-indicator">
                            <div className="pulse-ring"></div>
                            <span>Time to take medication</span>
                          </div>
                        )}
                      </div>
                      
                      <button
                        onClick={() => markMedicineTaken(medicine.id)}
                        className={`action-button mark-taken ${loadingMedicineId === medicine.id ? 'loading' : ''}`}
                        disabled={loadingMedicineId === medicine.id}
                      >
                        {loadingMedicineId === medicine.id ? (
                          <div className="bounce-dots">
                            <span></span>
                            <span></span>
                            <span></span>
                          </div>
                        ) : (
                          <>
                            <CheckCircle size={18} />
                            Mark Taken
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sidebar Section */}
        <div className="sidebar-section">
          {/* Upcoming Revisits Card */}
          <div className="sidebar-card revisits-card">
            <div className="card-header">
              <div className="icon-title">
                <div className="icon-container revisits">
                  <Stethoscope size={24} />
                </div>
                <div>
                  <h2>Upcoming Revisits</h2>
                  <p className="card-subtitle">Your scheduled doctor appointments</p>
                </div>
              </div>
            </div>
            
            {revisitsLoading ? (
              <div className="loading-revisits">
                <div className="small-spinner"></div>
                <span>Loading revisits...</span>
              </div>
            ) : upcomingRevisits.length === 0 ? (
              <div className="empty-state small">
                <Stethoscope size={32} />
                <h4>No Upcoming Revisits</h4>
                <p>You're all caught up!</p>
              </div>
            ) : (
              <div className="revisits-list">
                {upcomingRevisits.map((revisit, index) => (
                  <div 
                    key={index} 
                    className={`revisit-item ${isRevisitSoon(revisit.revisit_date) ? 'soon' : ''}`}
                  >
                    <div className="revisit-header">
                      <div className="revisit-doctor">
                        <User size={14} />
                        <span>Dr. {revisit.doctor_name}</span>
                      </div>
                      <div className="revisit-date">
                        {formatRevisitDate(revisit.revisit_date)}
                      </div>
                    </div>
                    <div className="revisit-condition">
                      <AlertCircle size={12} />
                      <span>{revisit.expected_condition}</span>
                    </div>
                    {isRevisitSoon(revisit.revisit_date) && (
                      <div className="revisit-soon-badge">
                        Soon
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Prescriptions Card */}
          <div className="sidebar-card">
            <div className="card-header">
              <div className="icon-title">
                <div className="icon-container secondary">
                  <Calendar size={24} />
                </div>
                <div>
                  <h2>Recent Prescriptions</h2>
                  <p className="card-subtitle">Your medical history</p>
                </div>
              </div>
            </div>
            
            {prescriptions.length === 0 ? (
              <div className="empty-state small">
                <Calendar size={32} />
                <h4>No Prescriptions</h4>
                <p>Your prescriptions will appear here</p>
              </div>
            ) : (
              <div className="prescriptions-stack">
                {prescriptions.slice(0, 3).map((prescription) => (
                  <div key={prescription.id} className="prescription-card">
                    <div className="prescription-header">
                      <div className="doctor-info">
                        <User size={16} />
                        <span>Dr. {prescription.doctor_name}</span>
                      </div>
                      <span className="prescription-date">
                        {new Date(prescription.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="diagnosis">{prescription.diagnosis}</p>
                    <div className="prescription-footer">
                      <div className="medicines-count">
                        <Pill size={14} />
                        {prescription.medicines.length} meds
                      </div>
                      {prescription.notes && (
                        <div className="notes-indicator" title={prescription.notes}>
                          📝
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default PatientDashboard;