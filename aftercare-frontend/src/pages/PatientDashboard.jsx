import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { prescriptionAPI, medicineAPI } from '../api/axios';
import { Pill, Calendar, CheckCircle, Clock, Heart } from 'lucide-react';

const PatientDashboard = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [todayMedicines, setTodayMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    try {
      const response = await prescriptionAPI.getPatientPrescriptions();
      setPrescriptions(response.data.prescriptions);
      extractTodayMedicines(response.data.prescriptions);
    } catch (error) {
      setError('Failed to load prescriptions');
    } finally {
      setLoading(false);
    }
  };

  const extractTodayMedicines = (prescriptions) => {
    const today = new Date().toISOString().split('T')[0];
    const medicines = [];

    prescriptions.forEach(prescription => {
      prescription.medicines.forEach(medicine => {
        medicine.schedules.forEach(schedule => {
          if (schedule.scheduled_date === today && !schedule.is_taken) {
            medicines.push({
              ...schedule,
              medicineName: medicine.name,
              dosage: medicine.dosage,
              instructions: medicine.instructions
            });
          }
        });
      });
    });

    setTodayMedicines(medicines);
  };

  const markMedicineTaken = async (scheduleId) => {
    try {
      await medicineAPI.markTaken(scheduleId);
      // Update local state
      setTodayMedicines(prev => 
        prev.filter(med => med.id !== scheduleId)
      );
      alert('Medicine marked as taken!');
    } catch (error) {
      alert('Failed to mark medicine as taken');
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Patient Dashboard</h1>
        <Link to="/patient/health-updates" className="primary-button">
          <Heart size={18} />
          Health Updates
        </Link>
      </div>

      {/* Today's Medicines */}
      <div className="card">
        <div className="card-header">
          <Pill className="card-icon" />
          <h2>Today's Medications</h2>
        </div>
        {todayMedicines.length === 0 ? (
          <p className="no-data">No medications scheduled for today.</p>
        ) : (
          <div className="medicines-list">
            {todayMedicines.map((medicine) => (
              <div key={medicine.id} className="medicine-item">
                <div className="medicine-info">
                  <h3>{medicine.medicineName}</h3>
                  <p>{medicine.dosage}</p>
                  {medicine.instructions && (
                    <small>{medicine.instructions}</small>
                  )}
                  <div className="medicine-time">
                    <Clock size={14} />
                    {new Date(medicine.scheduled_time).toLocaleTimeString()}
                  </div>
                </div>
                <button
                  onClick={() => markMedicineTaken(medicine.id)}
                  className="success-button"
                >
                  <CheckCircle size={18} />
                  Mark Taken
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Prescriptions */}
      <div className="card">
        <div className="card-header">
          <Calendar className="card-icon" />
          <h2>Recent Prescriptions</h2>
        </div>
        {prescriptions.length === 0 ? (
          <p className="no-data">No prescriptions found.</p>
        ) : (
          <div className="prescriptions-list">
            {prescriptions.slice(0, 5).map((prescription) => (
              <div key={prescription.id} className="prescription-item">
                <div className="prescription-header">
                  <h3>Dr. {prescription.doctor_name}</h3>
                  <span className="date">
                    {new Date(prescription.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="diagnosis">{prescription.diagnosis}</p>
                <div className="medicines-count">
                  <Pill size={14} />
                  {prescription.medicines.length} medications
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientDashboard;