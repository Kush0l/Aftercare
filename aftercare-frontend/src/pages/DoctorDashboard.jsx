
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { doctorAPI } from '../api/axios';
import {
  Users,
  FileText,
  Activity,
  Calendar,
  Pill,
  ArrowRight
} from 'lucide-react';

const DoctorDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await doctorAPI.getDashboard();
      setDashboardData(response.data);
    } catch (error) {
      setError('Failed to load dashboard data');
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewAnalytics = (patient) => {
    navigate(`/doctor/analytics/${patient.patient_id}`, { state: { patient } });
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


  if (error) {
    return (
      <div className="error-message">
        <p>{error}</p>
        <button onClick={fetchDashboardData} className="retry-button">
          Retry
        </button>
      </div>
    );
  }

  const averageAdherence = dashboardData?.patient_activities?.length
    ? (dashboardData.patient_activities.reduce((acc, patient) =>
      acc + (patient.adherence_rate || 0), 0) / dashboardData.patient_activities.length
    ).toFixed(1)
    : '0.0';

  return (
    <div className="dashboard">
      
     

      {/* Quick Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper">
            <Users className="stat-icon" />
          </div>
          <div className="stat-content">
            <h3>{dashboardData?.patient_activities?.length || 0}</h3>
            <p>Total Patients</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper">
            <FileText className="stat-icon" />
          </div>
          <div className="stat-content">
            <h3>{dashboardData?.recent_prescriptions?.length || 0}</h3>
            <p>Recent Prescriptions</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper">
            <Activity className="stat-icon" />
          </div>
          <div className="stat-content">
            <h3>{averageAdherence}%</h3>
            <p>Avg. Adherence</p>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="dashboard-content">
        {/* Recent Prescriptions Section */}
        <div className="dashboard-card">
          <div className="card-header">
            <div className="card-title">
              <FileText size={20} className="card-icon" />
              <h2>Recent Prescriptions</h2>
            </div>
            <Link to="/doctor/create-prescription" className="primary-button small">
              Create New
            </Link>
          </div>
          <div className="prescriptions-list">
            {dashboardData?.recent_prescriptions?.map((prescription) => (
              <div key={prescription.id} className="prescription-item">
                <div className="prescription-info">
                  <h3>{prescription.patient_name}</h3>
                  <p>{prescription.diagnosis}</p>
                  <small>
                    <Calendar size={14} />
                    {new Date(prescription.created_at).toLocaleDateString()}
                  </small>
                </div>
                
              </div>
            ))}
            {(!dashboardData?.recent_prescriptions || dashboardData.recent_prescriptions.length === 0) && (
              <div className="empty-state">
                <FileText size={48} className="empty-icon" />
                <p>No recent prescriptions</p>
                <Link to="/doctor/create-prescription" className="primary-button">
                  Create First Prescription
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Patient Activities Section */}
        <div className="dashboard-card">
          <div className="card-header">
            <div className="card-title">
              <Activity size={20} className="card-icon" />
              <h2>Patient Activities</h2>
            </div>
            <Link to="/doctor/register-patient" className="secondary-button small">
              Register Patient
            </Link>
          </div>
          <div className="patients-grid">
            {dashboardData?.patient_activities?.map((patient) => (
              <div key={patient.patient_id} className="patient-card">
                <div className="patient-header">
                  <div className="patient-avatar">
                    <Users size={20} />
                  </div>
                  <div className="patient-info">
                    <h3>{patient.patient_name}</h3>
                    <p>{patient.email}</p>
                  </div>
                </div>

                <div className="patient-stats">
                  <div className={`stat ${patient.adherence_rate >= 80 ? 'good' : 'warning'}`}>
                    <Pill size={16} />
                    <span>Adherence: {patient.adherence_rate}%</span>
                  </div>
                  <div className="stat">
                    <FileText size={16} />
                    <span>Prescriptions: {patient.total_prescriptions}</span>
                  </div>
                </div>

                {patient.recent_updates && patient.recent_updates.length > 0 && (
                  <div className="recent-updates">
                    <h4>Recent Updates:</h4>
                    {patient.recent_updates.slice(0, 2).map((update, index) => (
                      <div key={index} className="update-item">
                        <p>{update.text}</p>
                        <small>{new Date(update.created_at).toLocaleDateString()}</small>
                      </div>
                    ))}
                  </div>
                )}

                <div className="patient-actions">
                  <button
                    onClick={() => handleViewAnalytics(patient)}
                    className="analytics-button"
                  >
                    <Activity size={16} />
                    View Analytics
                  </button>
                </div>
              </div>
            ))}
            {(!dashboardData?.patient_activities || dashboardData.patient_activities.length === 0) && (
              <div className="empty-state">
                <Users size={48} className="empty-icon" />
                <p>No patients registered yet</p>
                <Link to="/doctor/register-patient" className="primary-button">
                  Register First Patient
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .dashboard {
          padding: 20px;
       
          margin: 0 auto;
        }

        .dashboard-header {
          text-align: center;
          margin-bottom: 40px;
        }

        .dashboard-header h1 {
          color: #2c3e50;
          margin-bottom: 8px;
          font-size: 2.5rem;
        }

        .dashboard-header p {
          color: #7f8c8d;
          font-size: 1.2rem;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-bottom: 40px;
        }

        .stat-card {
          background: white;
          padding: 25px;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          display: flex;
          align-items: center;
          gap: 20px;
          transition: transform 0.2s ease;
        }

        .stat-card:hover {
          transform: translateY(-2px);
        }

        .stat-icon-wrapper {
          background: #3498db;
          padding: 15px;
          border-radius: 10px;
          color: white;
        }

        .stat-icon {
          width: 24px;
          height: 24px;
        }

        .stat-content h3 {
          font-size: 2rem;
          color: #2c3e50;
          margin: 0;
        }

        .stat-content p {
          color: #7f8c8d;
          margin: 0;
          font-weight: 500;
        }

        .dashboard-content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
        }

        @media (max-width: 968px) {
          .dashboard-content {
            grid-template-columns: 1fr;
          }
        }

        .dashboard-card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }

        .card-header {
          padding: 25px;
          border-bottom: 1px solid #ecf0f1;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .card-title {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .card-title h2 {
          margin: 0;
          color: #2c3e50;
          font-size: 1.4rem;
        }

        .card-icon {
          color: #3498db;
        }

        .primary-button {
          background: #3498db;
          color: white;
          padding: 10px 20px;
          border-radius: 6px;
          text-decoration: none;
          font-weight: 500;
          transition: background 0.2s ease;
        }

        .primary-button:hover {
          background: #2980b9;
        }

        .primary-button.small {
          padding: 8px 16px;
          font-size: 0.9rem;
        }

        .secondary-button {
          background: transparent;
          color: #3498db;
          border: 1px solid #3498db;
          padding: 10px 20px;
          border-radius: 6px;
          text-decoration: none;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .secondary-button:hover {
          background: #3498db;
          color: white;
        }

        .secondary-button.small {
          padding: 8px 16px;
          font-size: 0.9rem;
        }

        .prescriptions-list {
          padding: 0;
        }

        .prescription-item {
          padding: 20px 25px;
          border-bottom: 1px solid #ecf0f1;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: background 0.2s ease;
        }

        .prescription-item:hover {
          background: #f8f9fa;
        }

        .prescription-item:last-child {
          border-bottom: none;
        }

        .prescription-info h3 {
          margin: 0 0 5px 0;
          color: #2c3e50;
        }

        .prescription-info p {
          margin: 0 0 8px 0;
          color: #7f8c8d;
        }

        .prescription-info small {
          color: #95a5a6;
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .arrow-icon {
          color: #bdc3c7;
        }

        .patients-grid {
          padding: 25px;
          display: grid;
          gap: 20px;
        }

        .patient-card {
          border: 1px solid #ecf0f1;
          border-radius: 8px;
          padding: 20px;
          transition: box-shadow 0.2s ease;
        }

        .patient-card:hover {
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .patient-header {
          display: flex;
          align-items: center;
          gap: 15px;
          margin-bottom: 15px;
        }

        .patient-avatar {
          background: #3498db;
          color: white;
          padding: 10px;
          border-radius: 8px;
        }

        .patient-info h3 {
          margin: 0 0 5px 0;
          color: #2c3e50;
        }

        .patient-info p {
          margin: 0;
          color: #7f8c8d;
          font-size: 0.9rem;
        }

        .patient-stats {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 15px;
        }

        .stat {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: #f8f9fa;
          border-radius: 6px;
          font-size: 0.9rem;
        }

        .stat.good {
          background: #d4edda;
          color: #155724;
        }

        .stat.warning {
          background: #fff3cd;
          color: #856404;
        }

        .recent-updates {
          margin-bottom: 15px;
        }

        .recent-updates h4 {
          margin: 0 0 10px 0;
          color: #2c3e50;
          font-size: 0.9rem;
        }

        .update-item {
          padding: 8px 0;
          border-bottom: 1px solid #ecf0f1;
        }

        .update-item:last-child {
          border-bottom: none;
        }

        .update-item p {
          margin: 0 0 5px 0;
          font-size: 0.9rem;
          color: #2c3e50;
        }

        .update-item small {
          color: #95a5a6;
          font-size: 0.8rem;
        }

        .patient-actions {
          display: flex;
          justify-content: flex-end;
        }

        .analytics-button {
          background: #27ae60;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 0.9rem;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .analytics-button:hover {
          background: #219a52;
        }

        .empty-state {
          text-align: center;
          padding: 40px 20px;
          color: #7f8c8d;
        }

        .empty-icon {
          margin-bottom: 15px;
          color: #bdc3c7;
        }

        .empty-state p {
          margin-bottom: 20px;
        }

        .dashboard-loading {
          text-align: center;
          padding: 60px 20px;
        }

        .loading-spinner {
          border: 3px solid #f3f3f3;
          border-top: 3px solid #3498db;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
          margin: 0 auto 20px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .error-message {
          text-align: center;
          padding: 40px 20px;
          color: #e74c3c;
        }

        .retry-button {
          background: #3498db;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          cursor: pointer;
          margin-top: 15px;
        }
      `}</style>
    </div>
  );
};

export default DoctorDashboard;