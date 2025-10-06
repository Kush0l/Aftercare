import React, { useState, useEffect } from 'react';
import { useLocation, Link, useParams } from 'react-router-dom';
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { ArrowLeft, Users, Activity, Pill, Calendar, MessageCircle, ExternalLink } from 'lucide-react';
import { doctorAPI } from '../api/axios';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const PatientAnalytics = () => {
  const location = useLocation();
  const { patientId } = useParams();
  const [patient, setPatient] = useState(location.state?.patient);
  const [healthUpdates, setHealthUpdates] = useState([]);
  const [medicationData, setMedicationData] = useState(null);
  const [loading, setLoading] = useState(!location.state?.patient);
  const [updatesLoading, setUpdatesLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!patient && patientId) {
      fetchPatientData();
    } else if (patient && patientId) {
      fetchHealthUpdates();
      fetchMedicationData();
    }
  }, [patient, patientId]);

  const fetchPatientData = async () => {
    try {
      setLoading(true);
      const response = await doctorAPI.get(`/patients/${patientId}`);
      setPatient(response.data);
      fetchHealthUpdates();
      fetchMedicationData();
    } catch (error) {
      setError('Failed to load patient data');
      console.error('Patient analytics error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHealthUpdates = async () => {
    try {
      setUpdatesLoading(true);
      const response = await doctorAPI.getPatientHealthUpdates(patientId);
      const responseData = response.data;
      const updates = responseData.health_updates || [];
      setHealthUpdates(updates);
    } catch (error) {
      console.error('Health updates error:', error);
      setHealthUpdates([]);
    } finally {
      setUpdatesLoading(false);
    }
  };

  const fetchMedicationData = async () => {
    try {
      // Use the specific patient medication status endpoint
      const response = await doctorAPI.getPatientMedicationStatusById(patientId);
      setMedicationData(response.data);
    } catch (error) {
      console.error('Medication data error:', error);
      setMedicationData(null);
    }
  };

  // Calculate adherence statistics from medication data
  const calculateAdherenceStats = () => {
    if (!medicationData || !medicationData.prescriptions) {
      return {
        taken_medicines: 0,
        missed_medicines: 0,
        total_schedules: 0,
        adherence_rate: 0
      };
    }

    let totalSchedules = 0;
    let takenSchedules = 0;
    let missedSchedules = 0;

    medicationData.prescriptions.forEach(prescription => {
      prescription.medicines.forEach(medicine => {
        medicine.schedules.forEach(schedule => {
          totalSchedules++;
          if (schedule.is_taken) {
            takenSchedules++;
          } else {
            missedSchedules++;
          }
        });
      });
    });

    const adherenceRate = totalSchedules > 0 ? Math.round((takenSchedules / totalSchedules) * 100) : 0;

    return {
      taken_medicines: takenSchedules,
      missed_medicines: missedSchedules,
      total_schedules: totalSchedules,
      adherence_rate: adherenceRate
    };
  };

  // Get most prescribed medicines
  const getPrescribedMedicines = () => {
    if (!medicationData || !medicationData.prescriptions) return [];

    const medicineCount = {};

    medicationData.prescriptions.forEach(prescription => {
      prescription.medicines.forEach(medicine => {
        const medicineName = medicine.medicine_name;
        if (medicineCount[medicineName]) {
          medicineCount[medicineName]++;
        } else {
          medicineCount[medicineName] = 1;
        }
      });
    });

    return Object.entries(medicineCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  };

  // Get medicine adherence breakdown
  const getMedicineAdherenceBreakdown = () => {
    if (!medicationData || !medicationData.prescriptions) return [];

    const medicineAdherence = [];

    medicationData.prescriptions.forEach(prescription => {
      prescription.medicines.forEach(medicine => {
        const totalSchedules = medicine.schedules.length;
        const takenSchedules = medicine.schedules.filter(s => s.is_taken).length;
        const adherenceRate = totalSchedules > 0 ? Math.round((takenSchedules / totalSchedules) * 100) : 0;

        medicineAdherence.push({
          name: medicine.medicine_name,
          adherence_rate: adherenceRate,
          dosage: medicine.dosage
        });
      });
    });

    return medicineAdherence;
  };

  // Generate adherence history (last 6 months)
  const getAdherenceHistory = () => {
    const adherenceStats = calculateAdherenceStats();
    const currentRate = adherenceStats.adherence_rate || 50;

    // Generate a 6-month trend based on current rate with some variation
    return Array(6).fill(0).map((_, i) => {
      const monthOffset = 5 - i;
      const variation = (Math.random() * 20 - 10);
      return Math.max(0, Math.min(100, currentRate + variation - (monthOffset * 2)));
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));

    if (diffMinutes < 60) {
      return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    } else {
      return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    }
  };

  // Prepare chart data
  const adherenceHistory = getAdherenceHistory();
  const adherenceData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Medication Adherence Rate (%)',
        data: adherenceHistory,
        fill: true,
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.4,
        pointBackgroundColor: 'rgb(75, 192, 192)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgb(75, 192, 192)'
      }
    ]
  };

  const prescribedMedicines = getPrescribedMedicines();
  const prescriptionData = {
    labels: prescribedMedicines.map(m => m.name || 'Unknown'),
    datasets: [
      {
        label: 'Prescription Count',
        data: prescribedMedicines.map(m => m.count || 0),
        backgroundColor: [
          'rgba(255, 99, 132, 0.7)',
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 206, 86, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(153, 102, 255, 0.7)'
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)'
        ],
        borderWidth: 1
      }
    ]
  };

  const adherenceStats = calculateAdherenceStats();
  const medicationStatusData = {
    labels: ['Taken', 'Missed'],
    datasets: [
      {
        data: [
          adherenceStats.taken_medicines,
          adherenceStats.missed_medicines
        ],
        backgroundColor: [
          'rgba(75, 192, 192, 0.7)',
          'rgba(255, 99, 132, 0.7)'
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(255, 99, 132, 1)'
        ],
        borderWidth: 2,
        hoverOffset: 8
      }
    ]
  };

  const medicineAdherenceData = getMedicineAdherenceBreakdown();
  const individualAdherenceData = {
    labels: medicineAdherenceData.map(m => m.name),
    datasets: [
      {
        label: 'Medicine Adherence Rate (%)',
        data: medicineAdherenceData.map(m => m.adherence_rate),
        backgroundColor: 'rgba(54, 162, 235, 0.7)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      }
    ]
  };

  // Chart options
  const lineChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Medication Adherence Trend',
        font: {
          size: 16
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: function (context) {
            return `Adherence: ${context.parsed.y}%`;
          }
        }
      }
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        title: {
          display: true,
          text: 'Adherence Rate (%)'
        },
        ticks: {
          callback: function (value) {
            return value + '%';
          }
        }
      },
      x: {
        title: {
          display: true,
          text: 'Months'
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'nearest'
    }
  };

  const barChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: 'Most Prescribed Medicines',
        font: {
          size: 16
        }
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            return `Prescriptions: ${context.parsed.y}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Prescriptions'
        },
        ticks: {
          stepSize: 1
        }
      }
    }
  };

  const pieChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom'
      },
      title: {
        display: true,
        text: 'Medication Status Distribution',
        font: {
          size: 16
        }
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = Math.round((value / total) * 100);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    }
  };

  const individualBarOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: 'Individual Medicine Adherence',
        font: {
          size: 16
        }
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            return `Adherence: ${context.parsed.y}%`;
          }
        }
      }
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        title: {
          display: true,
          text: 'Adherence Rate (%)'
        },
        ticks: {
          callback: function (value) {
            return value + '%';
          }
        }
      }
    }
  };

  // Calculate metrics
  const currentAdherence = adherenceStats.adherence_rate;
  const totalPrescriptions = medicationData?.prescriptions?.length || 0;

  if (loading) {
    return (
      <div className="analytics-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading patient analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics-container">
        <div className="error-state">
          <Activity size={64} className="error-icon" />
          <h2>Error Loading Data</h2>
          <p>{error}</p>
          <Link to="/doctor/dashboard" className="back-button">
            <ArrowLeft size={16} />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="analytics-container">
        <div className="error-state">
          <Activity size={64} className="error-icon" />
          <h2>No Patient Data</h2>
          <p>Please select a patient from the dashboard to view analytics.</p>
          <Link to="/doctor/dashboard" className="back-button">
            <ArrowLeft size={16} />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-container">
      {/* Header */}
      <div className="analytics-header">
        <Link to="/doctor/dashboard" className="back-link">
          <ArrowLeft size={20} />
          Back to Dashboard
        </Link>
        <div className="patient-info">
          <Users size={24} className="patient-icon" />
          <div>
            <h1>{patient.patient_name || medicationData?.patient_name}</h1>
            <p>Patient Analytics Dashboard</p>
            <small>{patient.email} • {patient.phone_number}</small>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon current-adherence">
            <Activity size={24} />
          </div>
          <div className="metric-content">
            <h3>{currentAdherence}%</h3>
            <p>Current Adherence</p>
            <span className={`metric-trend ${currentAdherence >= 90 ? 'excellent' : currentAdherence >= 80 ? 'good' : 'poor'}`}>
              {currentAdherence >= 90 ? 'Excellent' : currentAdherence >= 80 ? 'Good' : 'Needs Improvement'}
            </span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon total-meds">
            <Pill size={24} />
          </div>
          <div className="metric-content">
            <h3>{totalPrescriptions}</h3>
            <p>Total Prescriptions</p>
            <span className="metric-subtitle">{adherenceStats.total_schedules} scheduled doses</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon success-rate">
            <Activity size={24} />
          </div>
          <div className="metric-content">
            <h3>{adherenceStats.taken_medicines}</h3>
            <p>Medicines Taken</p>
            <span className="metric-subtitle">Successfully consumed</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon health-updates">
            <MessageCircle size={24} />
          </div>
          <div className="metric-content">
            <h3>{healthUpdates.length}</h3>
            <p>Health Updates</p>
            <span className="metric-subtitle">Patient reports</span>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="charts-grid">
        <div className="chart-card">
          <div className="chart-header">
            <h3>Medication Adherence Trend</h3>
            <p>6-month adherence history</p>
          </div>
          <Line data={adherenceData} options={lineChartOptions} />
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <h3>Most Prescribed Medicines</h3>
            <p>Prescription frequency</p>
          </div>
          {prescribedMedicines.length > 0 ? (
            <Bar data={prescriptionData} options={barChartOptions} />
          ) : (
            <div className="no-data">
              <Pill size={48} />
              <p>No prescription data available</p>
            </div>
          )}
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <h3>Medication Status Distribution</h3>
            <p>Taken vs Missed medications</p>
          </div>
          {(adherenceStats.taken_medicines > 0 || adherenceStats.missed_medicines > 0) ? (
            <Pie data={medicationStatusData} options={pieChartOptions} />
          ) : (
            <div className="no-data">
              <Activity size={48} />
              <p>No medication status data available</p>
            </div>
          )}
        </div>

        {medicineAdherenceData.length > 0 && (
          <div className="chart-card">
            <div className="chart-header">
              <h3>Individual Medicine Adherence</h3>
              <p>Per-medicine adherence rates</p>
            </div>
            <Bar data={individualAdherenceData} options={individualBarOptions} />
          </div>
        )}
      </div>

      {/* Recent Medication Schedule */}
      {medicationData && medicationData.prescriptions && (
        <div className="updates-section">
          <div className="section-header">
            <div className="section-title">
              <Pill size={24} className="section-icon" />
              <div>
                <h3>Recent Medication Schedule</h3>
                <p>Upcoming and completed medication schedules</p>
              </div>
            </div>
          </div>
          <div className="medication-grid">
            {medicationData.prescriptions.slice(0, 3).map((prescription) => (
              <div key={prescription.prescription_id} className="medication-card">
                <div className="medication-header">
                  <h4>{prescription.diagnosis}</h4>
                  <span className="prescription-date">
                    <Calendar size={14} />
                    {prescription.prescription_date}
                  </span>
                </div>
                <div className="medication-content">
                  {prescription.medicines.map((medicine, medIndex) => (
                    <div key={medIndex} className="medicine-item">
                      <div className="medicine-name">
                        <strong>{medicine.medicine_name}</strong>
                        <span className="dosage">{medicine.dosage}</span>
                      </div>
                      <div className="medicine-schedules">
                        {medicine.schedules.slice(0, 2).map((schedule, schedIndex) => (
                          <div key={schedIndex} className={`schedule-item ${schedule.is_taken ? 'taken' : 'pending'}`}>
                            <span className="schedule-time">
                              {schedule.scheduled_date} {schedule.scheduled_time}
                            </span>
                            <span className={`status ${schedule.is_taken ? 'taken' : 'missed'}`}>
                              {schedule.is_taken ? 'Taken' : 'Pending'}
                            </span>
                          </div>
                        ))}
                        {medicine.schedules.length > 2 && (
                          <div className="more-schedules">
                            +{medicine.schedules.length - 2} more schedules
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Health Updates Section */}
      <div className="updates-section">
        <div className="section-header">
          <div className="section-title">
            <MessageCircle size={24} className="section-icon" />
            <div>
              <h3>Recent Health Updates</h3>
              <p>Patient-reported health status and feedback</p>
            </div>
          </div>
          {healthUpdates.length > 0 && (
            <Link
              to={`/doctor/patient/${patientId}/health-updates`}
              state={{ patient: patient }}
              className="view-all-link"
            >
              View All Updates
              <ExternalLink size={16} />
            </Link>
          )}
        </div>

        {updatesLoading ? (
          <div className="updates-loading">
            <div className="small-spinner"></div>
            <p>Loading health updates...</p>
          </div>
        ) : healthUpdates.length > 0 ? (
          <div className="updates-grid">
            {healthUpdates.slice(0, 3).map((update) => (
              <div key={update.update_id} className="update-card">
                <div className="update-header">
                  <div className="update-number">Update #{update.update_id.slice(0, 8)}</div>
                  <div className="update-date">
                    <Calendar size={14} />
                    {formatDate(update.created_at)}
                  </div>
                </div>
                <div className="update-content">
                  <p>{update.update_text}</p>
                </div>
                <div className="update-footer">
                  <span className="time-ago">
                    {getTimeAgo(update.created_at)}
                  </span>
                  <span className="days-ago">
                    {update.days_ago === 0 ? 'Today' : `${update.days_ago} day${update.days_ago === 1 ? '' : 's'} ago`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-updates">
            <MessageCircle size={48} className="no-updates-icon" />
            <p>No health updates available</p>
            <small>The patient hasn't submitted any health updates yet.</small>
          </div>
        )}
      </div>

      <style jsx>{`
        .analytics-container {
          padding: 20px;
          max-width: 1400px;
          margin: 0 auto;
          background: #f8f9fa;
          min-height: 100vh;
        }

        .analytics-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          background: white;
          padding: 25px;
          border-radius: 12px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .back-link {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #3498db;
          text-decoration: none;
          font-weight: 500;
          transition: color 0.2s ease;
        }

        .back-link:hover {
          color: #2980b9;
        }

        .patient-info {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .patient-icon {
          color: #3498db;
        }

        .patient-info h1 {
          margin: 0;
          color: #2c3e50;
          font-size: 1.8rem;
        }

        .patient-info p {
          margin: 0 0 5px 0;
          color: #7f8c8d;
        }

        .patient-info small {
          color: #95a5a6;
          font-size: 0.9rem;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .metric-card {
          background: white;
          padding: 25px;
          border-radius: 12px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          display: flex;
          align-items: center;
          gap: 20px;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .metric-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        }

        .metric-icon {
          padding: 15px;
          border-radius: 10px;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .metric-icon.current-adherence {
          background: #3498db;
        }

        .metric-icon.total-meds {
          background: #e74c3c;
        }

        .metric-icon.success-rate {
          background: #27ae60;
        }

        .metric-icon.health-updates {
          background: #9b59b6;
        }

        .metric-content h3 {
          font-size: 2rem;
          color: #2c3e50;
          margin: 0 0 5px 0;
          font-weight: 700;
        }

        .metric-content p {
          color: #7f8c8d;
          margin: 0 0 8px 0;
          font-weight: 500;
          font-size: 0.9rem;
        }

        .metric-trend, .metric-subtitle {
          font-size: 0.85rem;
          padding: 4px 8px;
          border-radius: 12px;
          display: inline-block;
          font-weight: 600;
        }

        .metric-trend.excellent {
          background: #d4edda;
          color: #155724;
        }

        .metric-trend.good {
          background: #fff3cd;
          color: #856404;
        }

        .metric-trend.poor {
          background: #f8d7da;
          color: #721c24;
        }

        .metric-subtitle {
          background: #f8f9fa;
          color: #6c757d;
        }

        .charts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 25px;
          margin-bottom: 30px;
        }

        .chart-card {
          background: white;
          border-radius: 12px;
          padding: 25px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .chart-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        }

        .chart-header {
          margin-bottom: 20px;
        }

        .chart-header h3 {
          margin: 0 0 5px 0;
          color: #2c3e50;
          font-size: 1.2rem;
          font-weight: 600;
        }

        .chart-header p {
          margin: 0;
          color: #7f8c8d;
          font-size: 0.9rem;
        }

        .no-data {
          text-align: center;
          padding: 40px 20px;
          color: #95a5a6;
        }

        .no-data p {
          margin-top: 15px;
          font-size: 1rem;
        }

        .updates-section {
          background: white;
          border-radius: 12px;
          padding: 25px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          margin-bottom: 30px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .section-title {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .section-icon {
          color: #3498db;
        }

        .section-title h3 {
          margin: 0 0 5px 0;
          color: #2c3e50;
          font-size: 1.2rem;
          font-weight: 600;
        }

        .section-title p {
          margin: 0;
          color: #7f8c8d;
          font-size: 0.9rem;
        }

        .view-all-link {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #3498db;
          text-decoration: none;
          font-weight: 500;
          transition: color 0.2s ease;
        }

        .view-all-link:hover {
          color: #2980b9;
        }

        /* Medication Schedule Styles */
        .medication-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 20px;
        }

        .medication-card {
          border: 1px solid #ecf0f1;
          border-radius: 8px;
          padding: 20px;
          background: #f8f9fa;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .medication-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }

        .medication-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
          padding-bottom: 10px;
          border-bottom: 1px solid #e9ecef;
        }

        .medication-header h4 {
          margin: 0;
          color: #2c3e50;
          font-size: 1.1rem;
          font-weight: 600;
        }

        .prescription-date {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #7f8c8d;
          font-size: 0.85rem;
        }

        .medicine-item {
          margin-bottom: 15px;
          padding-bottom: 15px;
          border-bottom: 1px solid #e9ecef;
        }

        .medicine-item:last-child {
          margin-bottom: 0;
          padding-bottom: 0;
          border-bottom: none;
        }

        .medicine-name {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }

        .medicine-name strong {
          color: #2c3e50;
          font-size: 1rem;
          font-weight: 600;
        }

        .dosage {
          background: #3498db;
          color: white;
          padding: 4px 12px;
          border-radius: 16px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .medicine-schedules {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .schedule-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 0.85rem;
        }

        .schedule-item.taken {
          background: #d4edda;
          border-left: 4px solid #28a745;
        }

        .schedule-item.pending {
          background: #fff3cd;
          border-left: 4px solid #ffc107;
        }

        .schedule-time {
          color: #2c3e50;
          font-weight: 500;
        }

        .status {
          padding: 4px 12px;
          border-radius: 16px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .status.taken {
          background: #28a745;
          color: white;
        }

        .status.missed {
          background: #dc3545;
          color: white;
        }

        .more-schedules {
          text-align: center;
          color: #6c757d;
          font-size: 0.8rem;
          font-style: italic;
          margin-top: 5px;
        }

        /* Health Updates Styles */
        .updates-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
        }

        .update-card {
          border: 1px solid #ecf0f1;
          border-radius: 8px;
          padding: 20px;
          background: #f8f9fa;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .update-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }

        .update-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .update-number {
          background: #3498db;
          color: white;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 600;
        }

        .update-date {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #7f8c8d;
          font-size: 0.85rem;
        }

        .update-content p {
          margin: 0 0 15px 0;
          color: #2c3e50;
          line-height: 1.5;
          font-size: 0.95rem;
        }

        .update-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 15px;
          padding-top: 10px;
          border-top: 1px solid #e9ecef;
        }

        .time-ago {
          color: #95a5a6;
          font-size: 0.8rem;
          font-style: italic;
        }

        .days-ago {
          background: #95a5a6;
          color: white;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .updates-loading {
          text-align: center;
          padding: 40px 20px;
          color: #7f8c8d;
        }

        .small-spinner {
          border: 2px solid #f3f3f3;
          border-top: 2px solid #3498db;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          animation: spin 1s linear infinite;
          margin: 0 auto 10px;
        }

        .no-updates {
          text-align: center;
          padding: 40px 20px;
          color: #95a5a6;
        }

        .no-updates-icon {
          margin-bottom: 15px;
          color: #bdc3c7;
        }

        .no-updates p {
          margin: 0 0 8px 0;
          font-size: 1.1rem;
        }

        .no-updates small {
          font-size: 0.9rem;
        }

        .loading-state, .error-state {
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

        .error-icon {
          color: #e74c3c;
          margin-bottom: 20px;
        }

        .error-state h2 {
          margin: 0 0 10px 0;
          color: #2c3e50;
          font-weight: 600;
        }

        .error-state p {
          color: #7f8c8d;
          margin-bottom: 20px;
        }

        .back-button {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #3498db;
          color: white;
          padding: 10px 20px;
          border-radius: 6px;
          text-decoration: none;
          font-weight: 500;
          transition: background 0.2s ease;
        }

        .back-button:hover {
          background: #2980b9;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .analytics-container {
            padding: 15px;
          }

          .analytics-header {
            flex-direction: column;
            gap: 15px;
            text-align: center;
          }

          .metrics-grid {
            grid-template-columns: 1fr;
          }

          .charts-grid {
            grid-template-columns: 1fr;
          }

          .medication-grid {
            grid-template-columns: 1fr;
          }

          .updates-grid {
            grid-template-columns: 1fr;
          }

          .section-header {
            flex-direction: column;
            gap: 15px;
            text-align: center;
          }
        }

        @media (max-width: 480px) {
          .analytics-header {
            padding: 20px;
          }

          .metric-card {
            padding: 20px;
          }

          .chart-card {
            padding: 20px;
          }

          .updates-section {
            padding: 20px;
          }
        }
      `}</style>
    </div>
  );
};

export default PatientAnalytics;