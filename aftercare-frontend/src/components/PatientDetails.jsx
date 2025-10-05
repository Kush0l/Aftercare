import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { doctorAPI } from "../api/axios";
import { User, Mail, Phone, Calendar, ArrowLeft, Pill, Activity, Clock, BarChart3 } from "lucide-react";

const PatientsPage = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Fetch all patients from dashboard
  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const response = await doctorAPI.getDashboard();
      setPatients(response.data.patient_activities || []);
    } catch (error) {
      console.error("Error fetching patients:", error);
    } finally {
      setLoading(false);
    }
  };

  // Navigate to patient analytics page
  const handlePatientClick = (patientId, patientData) => {
    navigate(`/doctor/analytics/${patientId}`, { 
      state: { patient: patientData } 
    });
  };

  if (loading) {
    return (
      <div className="patients-page">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading patients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="patients-page">
      {/* ===== Patient List View ===== */}
      <div className="patients-list">
        <div className="page-header">
          <h1>Patients</h1>
          <p className="subtitle">Manage and view patient analytics</p>
        </div>
        
        <div className="patients-grid">
          {patients.length > 0 ? (
            patients.map((patient) => (
              <div
                key={patient.patient_id}
                className="patient-card"
                onClick={() => handlePatientClick(patient.patient_id, patient)}
              >
                <div className="patient-card-header">
                  <div className="patient-avatar">
                    <User size={24} />
                  </div>
                  <div className="patient-info">
                    <h3 className="patient-name">{patient.patient_name}</h3>
                    <p className="patient-id">ID: {patient.patient_id?.slice(0, 8)}...</p>
                  </div>
                  <div className="analytics-icon">
                    <BarChart3 size={18} />
                  </div>
                </div>
                
                {/* Quick stats */}
                <div className="patient-stats">
                  <div className="stat-item">
                    <Pill size={14} />
                    <span>Prescriptions: {patient.total_prescriptions || 0}</span>
                  </div>
                  <div className="stat-item">
                    <Activity size={14} />
                    <span>Adherence: {patient.medication_adherence?.overall_rate || 0}%</span>
                  </div>
                  <div className="stat-item">
                    <Clock size={14} />
                    <span>Updates: {patient.total_health_updates || 0}</span>
                  </div>
                </div>

                {/* View Analytics CTA */}
                <div className="view-analytics-cta">
                  <span>View Analytics</span>
                  <BarChart3 size={16} />
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <User size={48} className="empty-icon" />
              <h3>No Patients Found</h3>
              <p>There are no patients in your care list yet.</p>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .patients-page {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
          min-height: 100vh;
          background: #f8f9fa;
        }

        .page-header {
          margin-bottom: 30px;
        }

        .page-header h1 {
          font-size: 2rem;
          font-weight: 700;
          color: #2c3e50;
          margin: 0 0 8px 0;
        }

        .subtitle {
          color: #7f8c8d;
          font-size: 1.1rem;
          margin: 0;
        }

        .patients-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 20px;
        }

        .patient-card {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          cursor: pointer;
          transition: all 0.3s ease;
          border: 1px solid #e9ecef;
          position: relative;
          overflow: hidden;
        }

        .patient-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
          border-color: #3498db;
        }

        .patient-card:hover .view-analytics-cta {
          background: #3498db;
          color: white;
        }

        .patient-card-header {
          display: flex;
          align-items: center;
          gap: 15px;
          margin-bottom: 15px;
        }

        .patient-avatar {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: #3498db;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          flex-shrink: 0;
        }

        .patient-info {
          flex: 1;
          min-width: 0;
        }

        .patient-name {
          font-size: 1.2rem;
          font-weight: 600;
          color: #2c3e50;
          margin: 0 0 4px 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .patient-id {
          color: #7f8c8d;
          font-size: 0.85rem;
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .analytics-icon {
          color: #3498db;
          opacity: 0.7;
          transition: opacity 0.3s ease;
        }

        .patient-card:hover .analytics-icon {
          opacity: 1;
        }

        .patient-stats {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 15px;
        }

        .stat-item {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #5a6c7d;
          font-size: 0.9rem;
          padding: 4px 0;
        }

        .stat-item:nth-child(1) {
          color: #e74c3c;
        }

        .stat-item:nth-child(2) {
          color: #27ae60;
        }

        .stat-item:nth-child(3) {
          color: #9b59b6;
        }

        .view-analytics-cta {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px;
          background: #f8f9fa;
          border-radius: 8px;
          color: #3498db;
          font-weight: 600;
          font-size: 0.9rem;
          transition: all 0.3s ease;
          border: 1px solid #e9ecef;
        }

        .empty-state {
          grid-column: 1 / -1;
          text-align: center;
          padding: 60px 20px;
          color: #95a5a6;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .empty-icon {
          margin-bottom: 15px;
          color: #bdc3c7;
        }

        .empty-state h3 {
          margin: 0 0 10px 0;
          color: #7f8c8d;
          font-size: 1.3rem;
        }

        .empty-state p {
          margin: 0;
          font-size: 1rem;
        }

        .loading-state {
          text-align: center;
          padding: 60px 20px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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

        /* Performance optimizations */
        .patient-card {
          will-change: transform;
          backface-visibility: hidden;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .patients-page {
            padding: 15px;
          }

          .patients-grid {
            grid-template-columns: 1fr;
          }

          .page-header h1 {
            font-size: 1.6rem;
          }

          .subtitle {
            font-size: 1rem;
          }
        }

        @media (max-width: 480px) {
          .patient-card {
            padding: 15px;
          }

          .patient-card-header {
            gap: 12px;
          }

          .patient-avatar {
            width: 45px;
            height: 45px;
          }

          .patient-name {
            font-size: 1.1rem;
          }
        }

        @media (max-width: 360px) {
          .patients-grid {
            grid-template-columns: 1fr;
          }
          
          .patient-stats {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default PatientsPage;