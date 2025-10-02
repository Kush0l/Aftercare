import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { doctorAPI } from '../api/axios';
import { 
  Users, 
  FileText, 
  Activity,
  Calendar,
  Pill
} from 'lucide-react';

const DoctorDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Doctor Dashboard</h1>
        <p>Welcome to your medical dashboard</p>
      </div>

      {/* Quick Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <Users className="stat-icon" />
          <div className="stat-content">
            <h3>{dashboardData?.patient_activities?.length || 0}</h3>
            <p>Total Patients</p>
          </div>
        </div>
        
        <div className="stat-card">
          <FileText className="stat-icon" />
          <div className="stat-content">
            <h3>{dashboardData?.recent_prescriptions?.length || 0}</h3>
            <p>Recent Prescriptions</p>
          </div>
        </div>
        
        <div className="stat-card">
          <Activity className="stat-icon" />
          <div className="stat-content">
            <h3>
              {dashboardData?.patient_activities?.reduce((acc, patient) => 
                acc + (patient.adherence_rate || 0), 0) / (dashboardData?.patient_activities?.length || 1)
              .toFixed(1)}%
            </h3>
            <p>Avg. Adherence</p>
          </div>
        </div>
      </div>

      {/* Recent Prescriptions */}
      <div className="card">
        <div className="card-header">
          <FileText size={20} className="card-icon" />
          <h2>Recent Prescriptions</h2>
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
        </div>
      </div>

      {/* Patient Activities */}
      <div className="card">
        <div className="card-header">
          <Activity size={20} className="card-icon" />
          <h2>Patient Activities</h2>
          <Link to="/doctor/register-patient" className="secondary-button small">
            Register Patient
          </Link>
        </div>
        <div className="patients-grid">
          {dashboardData?.patient_activities?.map((patient) => (
            <div key={patient.patient_id} className="patient-card">
              <div className="patient-header">
                <Users size={20} className="patient-icon" />
                <div>
                  <h3>{patient.patient_name}</h3>
                  <p>{patient.email}</p>
                </div>
              </div>
              
              <div className="patient-stats">
                <div className="stat">
                  <Pill size={16} />
                  <span>Adherence: {patient.adherence_rate}%</span>
                </div>
                <div className="stat">
                  <FileText size={16} />
                  <span>Prescriptions: {patient.total_prescriptions}</span>
                </div>
              </div>

              {patient.recent_updates.length > 0 && (
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
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;