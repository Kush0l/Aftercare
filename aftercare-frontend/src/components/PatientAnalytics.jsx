// import React, { useState, useEffect } from 'react';
// import { useLocation, Link, useParams } from 'react-router-dom';
// import { Line, Bar, Pie } from 'react-chartjs-2';
// import {
//   Chart as ChartJS,
//   CategoryScale,
//   LinearScale,
//   PointElement,
//   LineElement,
//   BarElement,
//   ArcElement,
//   Title,
//   Tooltip,
//   Legend
// } from 'chart.js';
// import { ArrowLeft, Users, Activity, Pill, Calendar, MessageCircle, ExternalLink } from 'lucide-react';
// import { doctorAPI } from '../api/axios';

// ChartJS.register(
//   CategoryScale,
//   LinearScale,
//   PointElement,
//   LineElement,
//   BarElement,
//   ArcElement,
//   Title,
//   Tooltip,
//   Legend
// );

// const PatientAnalytics = () => {
//   const location = useLocation();
//   const { patientId } = useParams();
//   const [patient, setPatient] = useState(location.state?.patient);
//   const [healthUpdates, setHealthUpdates] = useState([]);
//   const [loading, setLoading] = useState(!location.state?.patient);
//   const [updatesLoading, setUpdatesLoading] = useState(false);
//   const [error, setError] = useState('');

//   useEffect(() => {
//     // If patient data wasn't passed via state, fetch it using the patientId from URL
//     if (!patient && patientId) {
//       fetchPatientData();
//     } else if (patient && patientId) {
//       // If we have patient data but no health updates, fetch them
//       fetchHealthUpdates();
//     }
//   }, [patient, patientId]);

//   const fetchPatientData = async () => {
//     try {
//       setLoading(true);
//       const response = await doctorAPI.get(`/patients/${patientId}`);
//       setPatient(response.data);
//       console.log(patient);

//       // After fetching patient data, fetch health updates
//       fetchHealthUpdates();
//     } catch (error) {
//       setError('Failed to load patient data');
//       console.error('Patient analytics error:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchHealthUpdates = async () => {
//     try {
//       setUpdatesLoading(true);
//       const response = await doctorAPI.get(`/patient/${patientId}/health-updates`);
//       setHealthUpdates(response.data.health_updates || []);
//       console.log('Health updates fetched:', healthUpdates);

//     } catch (error) {
//       console.error('Health updates error:', error);
//       // Don't set main error for health updates failure, just log it
//     } finally {
//       setUpdatesLoading(false);
//     }
//   };

//   // Transform API data to match component expectations
//   const getAdherenceHistory = () => {
//     if (!patient) return [0, 0, 0, 0, 0, 0];

//     // Use recent_rate from medication_adherence and create a trend
//     const recentRate = patient.medication_adherence?.recent_rate || 50;

//     // Generate a 6-month trend based on recent rate with some variation
//     return Array(6).fill(0).map((_, i) => {
//       const monthOffset = 5 - i; // Most recent month last
//       const variation = (Math.random() * 20 - 10); // -10 to +10 variation
//       return Math.max(0, Math.min(100, recentRate + variation - (monthOffset * 2)));
//     });
//   };

//   const getPrescribedMedicines = () => {
//     if (!patient) return [];

//     // Use most_prescribed_medicines from API
//     return patient.most_prescribed_medicines || [];
//   };

//   const getMedicationAdherence = () => {
//     if (!patient) return { taken_medicines: 0, missed_medicines: 0 };

//     // Use medication_adherence data from API
//     const medAdherence = patient.medication_adherence;
//     return {
//       taken_medicines: medAdherence?.taken_medicines || 0,
//       missed_medicines: medAdherence?.missed_medicines || 0
//     };
//   };

//   const getMedicineAdherenceBreakdown = () => {
//     if (!patient || !patient.prescriptions) return [];

//     // Extract medicine adherence from prescriptions
//     const medicineAdherence = [];
//     patient.prescriptions.forEach(prescription => {
//       prescription.medicines.forEach(medicine => {
//         medicineAdherence.push({
//           name: medicine.name,
//           adherence_rate: medicine.adherence_rate,
//           dosage: medicine.dosage
//         });
//       });
//     });
//     return medicineAdherence;
//   };

//   const formatDate = (dateString) => {
//     const date = new Date(dateString);
//     return date.toLocaleDateString('en-US', {
//       year: 'numeric',
//       month: 'short',
//       day: 'numeric',
//       hour: '2-digit',
//       minute: '2-digit'
//     });
//   };

//   const getTimeAgo = (daysAgo) => {
//     if (daysAgo === 0) return 'Today';
//     if (daysAgo === 1) return 'Yesterday';
//     return `${daysAgo} days ago`;
//   };

//   // Prepare data for adherence trend chart
//   const adherenceHistory = getAdherenceHistory();
//   const adherenceData = {
//     labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
//     datasets: [
//       {
//         label: 'Medication Adherence Rate (%)',
//         data: adherenceHistory,
//         fill: true,
//         backgroundColor: 'rgba(75, 192, 192, 0.2)',
//         borderColor: 'rgb(75, 192, 192)',
//         tension: 0.4,
//         pointBackgroundColor: 'rgb(75, 192, 192)',
//         pointBorderColor: '#fff',
//         pointHoverBackgroundColor: '#fff',
//         pointHoverBorderColor: 'rgb(75, 192, 192)'
//       }
//     ]
//   };

//   // Prepare data for prescription statistics
//   const prescribedMedicines = getPrescribedMedicines();
//   const prescriptionData = {
//     labels: prescribedMedicines.map(m => m.name || 'Unknown'),
//     datasets: [
//       {
//         label: 'Prescription Count',
//         data: prescribedMedicines.map(m => m.count || 0),
//         backgroundColor: [
//           'rgba(255, 99, 132, 0.7)',
//           'rgba(54, 162, 235, 0.7)',
//           'rgba(255, 206, 86, 0.7)',
//           'rgba(75, 192, 192, 0.7)',
//           'rgba(153, 102, 255, 0.7)'
//         ],
//         borderColor: [
//           'rgba(255, 99, 132, 1)',
//           'rgba(54, 162, 235, 1)',
//           'rgba(255, 206, 86, 1)',
//           'rgba(75, 192, 192, 1)',
//           'rgba(153, 102, 255, 1)'
//         ],
//         borderWidth: 1
//       }
//     ]
//   };

//   // Prepare data for medication status distribution
//   const adherenceStats = getMedicationAdherence();
//   const medicationStatusData = {
//     labels: ['Taken', 'Missed'],
//     datasets: [
//       {
//         data: [
//           adherenceStats.taken_medicines,
//           adherenceStats.missed_medicines
//         ],
//         backgroundColor: [
//           'rgba(75, 192, 192, 0.7)',
//           'rgba(255, 99, 132, 0.7)'
//         ],
//         borderColor: [
//           'rgba(75, 192, 192, 1)',
//           'rgba(255, 99, 132, 1)'
//         ],
//         borderWidth: 2,
//         hoverOffset: 8
//       }
//     ]
//   };

//   // Prepare data for individual medicine adherence
//   const medicineAdherenceData = getMedicineAdherenceBreakdown();
//   const individualAdherenceData = {
//     labels: medicineAdherenceData.map(m => m.name),
//     datasets: [
//       {
//         label: 'Medicine Adherence Rate (%)',
//         data: medicineAdherenceData.map(m => m.adherence_rate),
//         backgroundColor: 'rgba(54, 162, 235, 0.7)',
//         borderColor: 'rgba(54, 162, 235, 1)',
//         borderWidth: 1
//       }
//     ]
//   };

//   // Chart options
//   const lineChartOptions = {
//     responsive: true,
//     plugins: {
//       legend: {
//         position: 'top',
//       },
//       title: {
//         display: true,
//         text: 'Medication Adherence Trend',
//         font: {
//           size: 16
//         }
//       },
//       tooltip: {
//         mode: 'index',
//         intersect: false,
//         callbacks: {
//           label: function (context) {
//             return `Adherence: ${context.parsed.y}%`;
//           }
//         }
//       }
//     },
//     scales: {
//       y: {
//         min: 0,
//         max: 100,
//         title: {
//           display: true,
//           text: 'Adherence Rate (%)'
//         },
//         ticks: {
//           callback: function (value) {
//             return value + '%';
//           }
//         }
//       },
//       x: {
//         title: {
//           display: true,
//           text: 'Months'
//         }
//       }
//     },
//     interaction: {
//       intersect: false,
//       mode: 'nearest'
//     }
//   };

//   const barChartOptions = {
//     responsive: true,
//     plugins: {
//       legend: {
//         display: false
//       },
//       title: {
//         display: true,
//         text: 'Most Prescribed Medicines',
//         font: {
//           size: 16
//         }
//       },
//       tooltip: {
//         callbacks: {
//           label: function (context) {
//             return `Prescriptions: ${context.parsed.y}`;
//           }
//         }
//       }
//     },
//     scales: {
//       y: {
//         beginAtZero: true,
//         title: {
//           display: true,
//           text: 'Number of Prescriptions'
//         },
//         ticks: {
//           stepSize: 1
//         }
//       }
//     }
//   };

//   const pieChartOptions = {
//     responsive: true,
//     plugins: {
//       legend: {
//         position: 'bottom'
//       },
//       title: {
//         display: true,
//         text: 'Medication Status Distribution',
//         font: {
//           size: 16
//         }
//       },
//       tooltip: {
//         callbacks: {
//           label: function (context) {
//             const label = context.label || '';
//             const value = context.parsed || 0;
//             const total = context.dataset.data.reduce((a, b) => a + b, 0);
//             const percentage = Math.round((value / total) * 100);
//             return `${label}: ${value} (${percentage}%)`;
//           }
//         }
//       }
//     }
//   };

//   const individualBarOptions = {
//     responsive: true,
//     plugins: {
//       legend: {
//         display: false
//       },
//       title: {
//         display: true,
//         text: 'Individual Medicine Adherence',
//         font: {
//           size: 16
//         }
//       },
//       tooltip: {
//         callbacks: {
//           label: function (context) {
//             return `Adherence: ${context.parsed.y}%`;
//           }
//         }
//       }
//     },
//     scales: {
//       y: {
//         min: 0,
//         max: 100,
//         title: {
//           display: true,
//           text: 'Adherence Rate (%)'
//         },
//         ticks: {
//           callback: function (value) {
//             return value + '%';
//           }
//         }
//       }
//     }
//   };

//   // Calculate metrics from API data
//   const totalMedications = prescribedMedicines.reduce((sum, med) => sum + (med.count || 0), 0);
//   const currentAdherence = patient?.medication_adherence?.recent_rate || 0;
//   const overallAdherence = patient?.medication_adherence?.overall_rate || 0;
//   const successRate = adherenceStats.taken_medicines + adherenceStats.missed_medicines > 0
//     ? Math.round((adherenceStats.taken_medicines / (adherenceStats.taken_medicines + adherenceStats.missed_medicines)) * 100)
//     : 0;

//   if (loading) {
//     return (
//       <div className="analytics-container">
//         <div className="loading-state">
//           <div className="loading-spinner"></div>
//           <p>Loading patient analytics...</p>
//         </div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="analytics-container">
//         <div className="error-state">
//           <Activity size={64} className="error-icon" />
//           <h2>Error Loading Data</h2>
//           <p>{error}</p>
//           <Link to="/doctor/dashboard" className="back-button">
//             <ArrowLeft size={16} />
//             Back to Dashboard
//           </Link>
//         </div>
//       </div>
//     );
//   }

//   if (!patient) {
//     return (
//       <div className="analytics-container">
//         <div className="error-state">
//           <Activity size={64} className="error-icon" />
//           <h2>No Patient Data</h2>
//           <p>Please select a patient from the dashboard to view analytics.</p>
//           <Link to="/doctor/dashboard" className="back-button">
//             <ArrowLeft size={16} />
//             Back to Dashboard
//           </Link>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="analytics-container">
//       {/* Header */}
//       <div className="analytics-header">
//         <Link to="/doctor/dashboard" className="back-link">
//           <ArrowLeft size={20} />
//           Back to Dashboard
//         </Link>
//         <div className="patient-info">
//           <Users size={24} className="patient-icon" />
//           <div>
//             <h1>{patient.patient_name}</h1>
//             <p>Patient Analytics Dashboard</p>
//             <small>{patient.email} • {patient.phone_number}</small>
//           </div>
//         </div>
//       </div>

//       {/* Key Metrics */}
//       <div className="metrics-grid">
//         <div className="metric-card">
//           <div className="metric-icon current-adherence">
//             <Activity size={24} />
//           </div>
//           <div className="metric-content">
//             <h3>{currentAdherence}%</h3>
//             <p>Current Adherence</p>
//             <span className={`metric-trend ${currentAdherence >= 90 ? 'excellent' : currentAdherence >= 80 ? 'good' : 'poor'}`}>
//               {currentAdherence >= 90 ? 'Excellent' : currentAdherence >= 80 ? 'Good' : 'Needs Improvement'}
//             </span>
//           </div>
//         </div>

//         <div className="metric-card">
//           <div className="metric-icon total-meds">
//             <Pill size={24} />
//           </div>
//           <div className="metric-content">
//             <h3>{patient.total_prescriptions || 0}</h3>
//             <p>Total Prescriptions</p>
//             <span className="metric-subtitle">{patient.active_prescriptions || 0} active</span>
//           </div>
//         </div>

//         <div className="metric-card">
//           <div className="metric-icon success-rate">
//             <Activity size={24} />
//           </div>
//           <div className="metric-content">
//             <h3>{overallAdherence}%</h3>
//             <p>Overall Adherence</p>
//             <span className="metric-subtitle">All time average</span>
//           </div>
//         </div>

//         <div className="metric-card">
//           <div className="metric-icon health-updates">
//             <MessageCircle size={24} />
//           </div>
//           <div className="metric-content">
//             <h3>{healthUpdates.length}</h3>
//             <p>Health Updates</p>
//             <span className="metric-subtitle">Patient reports</span>
//           </div>
//         </div>
//       </div>

//       {/* Charts Grid */}
//       <div className="charts-grid">
//         <div className="chart-card">
//           <div className="chart-header">
//             <h3>Medication Adherence Trend</h3>
//             <p>6-month adherence history</p>
//           </div>
//           <Line data={adherenceData} options={lineChartOptions} />
//         </div>

//         <div className="chart-card">
//           <div className="chart-header">
//             <h3>Most Prescribed Medicines</h3>
//             <p>Prescription frequency</p>
//           </div>
//           {prescribedMedicines.length > 0 ? (
//             <Bar data={prescriptionData} options={barChartOptions} />
//           ) : (
//             <div className="no-data">
//               <Pill size={48} />
//               <p>No prescription data available</p>
//             </div>
//           )}
//         </div>

//         <div className="chart-card">
//           <div className="chart-header">
//             <h3>Medication Status Distribution</h3>
//             <p>Taken vs Missed medications</p>
//           </div>
//           {(adherenceStats.taken_medicines > 0 || adherenceStats.missed_medicines > 0) ? (
//             <Pie data={medicationStatusData} options={pieChartOptions} />
//           ) : (
//             <div className="no-data">
//               <Activity size={48} />
//               <p>No medication status data available</p>
//             </div>
//           )}
//         </div>

//         {medicineAdherenceData.length > 0 && (
//           <div className="chart-card">
//             <div className="chart-header">
//               <h3>Individual Medicine Adherence</h3>
//               <p>Per-medicine adherence rates</p>
//             </div>
//             <Bar data={individualAdherenceData} options={individualBarOptions} />
//           </div>
//         )}
//       </div>

//       {/* Health Updates Section */}
//       <div className="updates-section">
//         <div className="section-header">
//           <div className="section-title">
//             <MessageCircle size={24} className="section-icon" />
//             <div>
//               <h3>Recent Health Updates</h3>
//               <p>Patient-reported health status and feedback</p>
//             </div>
//           </div>
//           {healthUpdates.length > 0 && (
//             <Link
//               to={`/doctor/patient/${patientId}/health-updates`}
//               state={{ patient: patient }}
//               className="view-all-link"
//             >
//               View All Updates
//               <ExternalLink size={16} />
//             </Link>
//           )}
//         </div>

//         {updatesLoading ? (
//           <div className="updates-loading">
//             <div className="small-spinner"></div>
//             <p>Loading health updates...</p>
//           </div>
//         ) : healthUpdates.length > 0 ? (
//           <div className="updates-grid">
//             {healthUpdates.slice(0, 3).map((update, index) => (
//               <div key={update.update_id || index} className="update-card">
//                 <div className="update-header">
//                   <div className="update-number">#{healthUpdates.length - index}</div>
//                   <div className="update-date">
//                     <Calendar size={14} />
//                     {formatDate(update.created_at)}
//                   </div>
//                 </div>
//                 <div className="update-content">
//                   <p>{update.update_text}</p>
//                 </div>
//                 <div className="update-footer">
//                   <span className="time-ago">{getTimeAgo(update.days_ago)}</span>
//                 </div>
//               </div>
//             ))}
//           </div>
//         ) : (
//           <div className="no-updates">
//             <MessageCircle size={48} className="no-updates-icon" />
//             <p>No health updates available</p>
//             <small>The patient hasn't submitted any health updates yet.</small>
//           </div>
//         )}
//       </div>

//       <style>{`
//         .analytics-container {
//           padding: 20px;
//           max-width: 1400px;
//           margin: 0 auto;
//           background: #f8f9fa;
//           min-height: 100vh;
//         }

//         .analytics-header {
//           display: flex;
//           justify-content: space-between;
//           align-items: center;
//           margin-bottom: 30px;
//           background: white;
//           padding: 25px;
//           border-radius: 12px;
//           box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
//         }

//         .back-link {
//           display: flex;
//           align-items: center;
//           gap: 8px;
//           color: #3498db;
//           text-decoration: none;
//           font-weight: 500;
//           transition: color 0.2s ease;
//         }

//         .back-link:hover {
//           color: #2980b9;
//         }

//         .patient-info {
//           display: flex;
//           align-items: center;
//           gap: 15px;
//         }

//         .patient-icon {
//           color: #3498db;
//         }

//         .patient-info h1 {
//           margin: 0;
//           color: #2c3e50;
//           font-size: 1.8rem;
//         }

//         .patient-info p {
//           margin: 0 0 5px 0;
//           color: #7f8c8d;
//         }

//         .patient-info small {
//           color: #95a5a6;
//           font-size: 0.9rem;
//         }

//         .metrics-grid {
//           display: grid;
//           grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
//           gap: 20px;
//           margin-bottom: 30px;
//         }

//         .metric-card {
//           background: white;
//           padding: 25px;
//           border-radius: 12px;
//           box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
//           display: flex;
//           align-items: center;
//           gap: 20px;
//           transition: transform 0.2s ease;
//         }

//         .metric-card:hover {
//           transform: translateY(-2px);
//         }

//         .metric-icon {
//           padding: 15px;
//           border-radius: 10px;
//           color: white;
//         }

//         .metric-icon.current-adherence {
//           background: #3498db;
//         }

//         .metric-icon.total-meds {
//           background: #e74c3c;
//         }

//         .metric-icon.success-rate {
//           background: #27ae60;
//         }

//         .metric-icon.health-updates {
//           background: #9b59b6;
//         }

//         .metric-content h3 {
//           font-size: 2rem;
//           color: #2c3e50;
//           margin: 0 0 5px 0;
//         }

//         .metric-content p {
//           color: #7f8c8d;
//           margin: 0 0 8px 0;
//           font-weight: 500;
//         }

//         .metric-trend, .metric-subtitle {
//           font-size: 0.85rem;
//           padding: 4px 8px;
//           border-radius: 12px;
//           display: inline-block;
//         }

//         .metric-trend.excellent {
//           background: #d4edda;
//           color: #155724;
//         }

//         .metric-trend.good {
//           background: #fff3cd;
//           color: #856404;
//         }

//         .metric-trend.poor {
//           background: #f8d7da;
//           color: #721c24;
//         }

//         .metric-subtitle {
//           background: #f8f9fa;
//           color: #6c757d;
//         }

//         .charts-grid {
//           display: grid;
//           grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
//           gap: 25px;
//           margin-bottom: 30px;
//         }

//         .chart-card {
//           background: white;
//           border-radius: 12px;
//           padding: 25px;
//           box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
//           transition: transform 0.2s ease;
//         }

//         .chart-card:hover {
//           transform: translateY(-2px);
//         }

//         .chart-header {
//           margin-bottom: 20px;
//         }

//         .chart-header h3 {
//           margin: 0 0 5px 0;
//           color: #2c3e50;
//           font-size: 1.2rem;
//         }

//         .chart-header p {
//           margin: 0;
//           color: #7f8c8d;
//           font-size: 0.9rem;
//         }

//         .no-data {
//           text-align: center;
//           padding: 40px 20px;
//           color: #95a5a6;
//         }

//         .no-data p {
//           margin-top: 15px;
//           font-size: 1rem;
//         }

//         .updates-section {
//           background: white;
//           border-radius: 12px;
//           padding: 25px;
//           box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
//         }

//         .section-header {
//           display: flex;
//           justify-content: space-between;
//           align-items: center;
//           margin-bottom: 20px;
//         }

//         .section-title {
//           display: flex;
//           align-items: center;
//           gap: 12px;
//         }

//         .section-icon {
//           color: #3498db;
//         }

//         .section-title h3 {
//           margin: 0 0 5px 0;
//           color: #2c3e50;
//           font-size: 1.2rem;
//         }

//         .section-title p {
//           margin: 0;
//           color: #7f8c8d;
//           font-size: 0.9rem;
//         }

//         .view-all-link {
//           display: flex;
//           align-items: center;
//           gap: 8px;
//           color: #3498db;
//           text-decoration: none;
//           font-weight: 500;
//           transition: color 0.2s ease;
//         }

//         .view-all-link:hover {
//           color: #2980b9;
//         }

//         .updates-grid {
//           display: grid;
//           grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
//           gap: 20px;
//         }

//         .update-card {
//           border: 1px solid #ecf0f1;
//           border-radius: 8px;
//           padding: 20px;
//           background: #f8f9fa;
//           transition: transform 0.2s ease;
//         }

//         .update-card:hover {
//           transform: translateY(-2px);
//           box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
//         }

//         .update-header {
//           display: flex;
//           justify-content: space-between;
//           align-items: center;
//           margin-bottom: 12px;
//         }

//         .update-number {
//           background: #3498db;
//           color: white;
//           padding: 4px 12px;
//           border-radius: 20px;
//           font-size: 0.85rem;
//           font-weight: 600;
//         }

//         .update-date {
//           display: flex;
//           align-items: center;
//           gap: 6px;
//           color: #7f8c8d;
//           font-size: 0.85rem;
//         }

//         .update-content p {
//           margin: 0 0 15px 0;
//           color: #2c3e50;
//           line-height: 1.5;
//         }

//         .update-footer {
//           display: flex;
//           justify-content: flex-end;
//         }

//         .time-ago {
//           color: #95a5a6;
//           font-size: 0.8rem;
//           font-style: italic;
//         }

//         .updates-loading {
//           text-align: center;
//           padding: 40px 20px;
//           color: #7f8c8d;
//         }

//         .small-spinner {
//           border: 2px solid #f3f3f3;
//           border-top: 2px solid #3498db;
//           border-radius: 50%;
//           width: 24px;
//           height: 24px;
//           animation: spin 1s linear infinite;
//           margin: 0 auto 10px;
//         }

//         .no-updates {
//           text-align: center;
//           padding: 40px 20px;
//           color: #95a5a6;
//         }

//         .no-updates-icon {
//           margin-bottom: 15px;
//           color: #bdc3c7;
//         }

//         .no-updates p {
//           margin: 0 0 8px 0;
//           font-size: 1.1rem;
//         }

//         .no-updates small {
//           font-size: 0.9rem;
//         }

//         .loading-state, .error-state {
//           text-align: center;
//           padding: 60px 20px;
//           background: white;
//           border-radius: 12px;
//           box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
//         }

//         .loading-spinner {
//           border: 3px solid #f3f3f3;
//           border-top: 3px solid #3498db;
//           border-radius: 50%;
//           width: 40px;
//           height: 40px;
//           animation: spin 1s linear infinite;
//           margin: 0 auto 20px;
//         }

//         @keyframes spin {
//           0% { transform: rotate(0deg); }
//           100% { transform: rotate(360deg); }
//         }

//         .error-icon {
//           color: #e74c3c;
//           margin-bottom: 20px;
//         }

//         .error-state h2 {
//           margin: 0 0 10px 0;
//           color: #2c3e50;
//         }

//         .error-state p {
//           color: #7f8c8d;
//           margin-bottom: 20px;
//         }

//         .back-button {
//           display: inline-flex;
//           align-items: center;
//           gap: 8px;
//           background: #3498db;
//           color: white;
//           padding: 10px 20px;
//           border-radius: 6px;
//           text-decoration: none;
//           font-weight: 500;
//           transition: background 0.2s ease;
//         }

//         .back-button:hover {
//           background: #2980b9;
//         }
//       `}</style>
//     </div>
//   );
// };

// export default PatientAnalytics;


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
  const [loading, setLoading] = useState(!location.state?.patient);
  const [updatesLoading, setUpdatesLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!patient && patientId) {
      fetchPatientData();
    } else if (patient && patientId) {
      fetchHealthUpdates();
    }
  }, [patient, patientId]);

  const fetchPatientData = async () => {
    try {
      setLoading(true);
      const response = await doctorAPI.get(`/patients/${patientId}`);
      setPatient(response.data);
      fetchHealthUpdates();
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
      console.log('Fetching health updates for patient:', patientId);

      const response = await doctorAPI.getPatientHealthUpdates(patientId);
      const responseData = response.data;

      console.log('Health updates API response:', responseData);

      // Extract health updates from the response
      const updates = responseData.health_updates || [];

      console.log('Processed health updates:', updates);
      setHealthUpdates(updates);

    } catch (error) {
      console.error('Health updates error:', error);
      console.log('Setting empty health updates array due to error');
      setHealthUpdates([]);
    } finally {
      setUpdatesLoading(false);
    }
  };

  const getAdherenceHistory = () => {
    if (!patient) return [0, 0, 0, 0, 0, 0];

    if (patient.adherence_history && Array.isArray(patient.adherence_history)) {
      return patient.adherence_history;
    }

    if (patient.medication_adherence?.history) {
      return patient.medication_adherence.history;
    }

    const recentRate = patient.medication_adherence?.recent_rate ||
      patient.adherence_rate ||
      patient.overall_adherence || 50;

    return Array(6).fill(0).map((_, i) => {
      const monthOffset = 5 - i;
      const variation = (Math.random() * 20 - 10);
      return Math.max(0, Math.min(100, recentRate + variation - (monthOffset * 2)));
    });
  };

  const getPrescribedMedicines = () => {
    if (!patient) return [];

    if (patient.most_prescribed_medicines && Array.isArray(patient.most_prescribed_medicines)) {
      return patient.most_prescribed_medicines;
    }

    if (patient.prescription_stats) {
      return patient.prescription_stats;
    }

    return [];
  };

  const getMedicationAdherence = () => {
    if (!patient) return { taken_medicines: 0, missed_medicines: 0 };

    const medAdherence = patient.medication_adherence;

    if (medAdherence) {
      return {
        taken_medicines: medAdherence.taken_medicines || medAdherence.taken || 0,
        missed_medicines: medAdherence.missed_medicines || medAdherence.missed || 0
      };
    }

    const adherenceRate = patient.adherence_rate || patient.medication_adherence?.recent_rate || 50;
    return {
      taken_medicines: Math.round(adherenceRate),
      missed_medicines: Math.round(100 - adherenceRate)
    };
  };

  const getMedicineAdherenceBreakdown = () => {
    if (!patient) return [];

    if (patient.medicine_adherence && Array.isArray(patient.medicine_adherence)) {
      return patient.medicine_adherence;
    }

    if (patient.prescriptions && Array.isArray(patient.prescriptions)) {
      const medicineAdherence = [];
      patient.prescriptions.forEach(prescription => {
        if (prescription.medicines && Array.isArray(prescription.medicines)) {
          prescription.medicines.forEach(medicine => {
            medicineAdherence.push({
              name: medicine.name,
              adherence_rate: medicine.adherence_rate || medicine.adherence || 0,
              dosage: medicine.dosage
            });
          });
        }
      });
      return medicineAdherence;
    }

    return [];
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

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  };

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

  const adherenceStats = getMedicationAdherence();
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

  const currentAdherence = patient?.medication_adherence?.recent_rate ||
    patient?.adherence_rate ||
    patient?.current_adherence || 0;
  const overallAdherence = patient?.medication_adherence?.overall_rate ||
    patient?.overall_adherence ||
    currentAdherence;

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
            <h1>{patient.patient_name}</h1>
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
            <h3>{patient.total_prescriptions || 0}</h3>
            <p>Total Prescriptions</p>
            <span className="metric-subtitle">{patient.active_prescriptions || 0} active</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon success-rate">
            <Activity size={24} />
          </div>
          <div className="metric-content">
            <h3>{overallAdherence}%</h3>
            <p>Overall Adherence</p>
            <span className="metric-subtitle">All time average</span>
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

      <style>{`
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
          transition: transform 0.2s ease;
        }

        .metric-card:hover {
          transform: translateY(-2px);
        }

        .metric-icon {
          padding: 15px;
          border-radius: 10px;
          color: white;
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
        }

        .metric-content p {
          color: #7f8c8d;
          margin: 0 0 8px 0;
          font-weight: 500;
        }

        .metric-trend, .metric-subtitle {
          font-size: 0.85rem;
          padding: 4px 8px;
          border-radius: 12px;
          display: inline-block;
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
          transition: transform 0.2s ease;
        }

        .chart-card:hover {
          transform: translateY(-2px);
        }

        .chart-header {
          margin-bottom: 20px;
        }

        .chart-header h3 {
          margin: 0 0 5px 0;
          color: #2c3e50;
          font-size: 1.2rem;
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
          transition: transform 0.2s ease;
        }

        .update-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
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
        }

        .update-footer {
          display: flex;
          justify-content: flex-end;
        }

        .time-ago {
          color: #95a5a6;
          font-size: 0.8rem;
          font-style: italic;
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
      `}</style>
    </div>
  );
};

export default PatientAnalytics;