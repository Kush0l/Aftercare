import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doctorAPI } from '../api/axios';
import { 
  ArrowLeft, 
  User, 
  Calendar, 
  Pill, 
  Activity, 
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Heart,
  Stethoscope,
  FileText,
  Phone,
  Mail,
  RefreshCw
} from 'lucide-react';

const PatientDetails = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [patientData, setPatientData] = useState(null);
  const [healthUpdates, setHealthUpdates] = useState([]);
  const [patientProfile, setPatientProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [healthUpdatesLoading, setHealthUpdatesLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (patientId && patientId !== 'undefined') {
      fetchPatientData();
    } else {
      setError('Invalid patient ID');
      setLoading(false);
    }
  }, [patientId]);

  const fetchPatientData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch main patient details
      const response = await doctorAPI.getPatientDetails(patientId);
      setPatientData(response.data);
      
      // Fetch health updates separately
      await fetchHealthUpdates();
      
    } catch (error) {
      console.error('Error fetching patient details:', error);
      setError(error.response?.data?.error || 'Failed to fetch patient details');
    } finally {
      setLoading(false);
    }
  };

  const fetchHealthUpdates = async () => {
    try {
      setHealthUpdatesLoading(true);
      // Use the separate health updates endpoint
      const response = await doctorAPI.getPatientHealthUpdates(patientId);
      setHealthUpdates(response.data.health_updates || []);
      setPatientProfile({
        email: response.data.email,
        first_name: response.data.first_name,
        last_name: response.data.last_name,
        phone_number: response.data.phone_number
      });
    } catch (error) {
      console.error('Error fetching health updates:', error);
      // Don't set error here, just log it and continue with empty health updates
      setHealthUpdates([]);
    } finally {
      setHealthUpdatesLoading(false);
    }
  };

  const refreshHealthUpdates = async () => {
    await fetchHealthUpdates();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    // Handle both ISO format and "YYYY-MM-DD HH:MM:SS" format
    const isoDate = dateString.includes('T') ? dateString : dateString.replace(' ', 'T');
    return new Date(isoDate).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAdherenceColor = (rate) => {
    if (rate >= 80) return 'text-green-600';
    if (rate >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getAdherenceStatus = (rate) => {
    if (rate >= 80) return 'Excellent';
    if (rate >= 60) return 'Good';
    if (rate >= 40) return 'Fair';
    return 'Poor';
  };

  const getAdherenceBgColor = (rate) => {
    if (rate >= 80) return 'bg-green-100 text-green-800';
    if (rate >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  // Combine patient data with profile data for display
  const getDisplayData = () => {
    if (!patientData) return null;
    
    return {
      ...patientData,
      // Use profile data if available, otherwise fall back to patientData
      email: patientProfile?.email || patientData.email,
      phone_number: patientProfile?.phone_number || patientData.phone_number,
      patient_name: patientProfile 
        ? `${patientProfile.first_name} ${patientProfile.last_name}`
        : patientData.patient_name
    };
  };

  const displayData = getDisplayData();

  if (loading) {
    return (
      <div className="page-container">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading patient details...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="error-message">
          {error}
        </div>
        <button 
          onClick={() => navigate('/doctor/dashboard')}
          className="primary-button mt-4"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  if (!displayData) {
    return (
      <div className="page-container">
        <div className="error-message">
          Patient data not found
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div className="header-left">
          <button 
            onClick={() => navigate('/doctor/dashboard')}
            className="back-button"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1>Patient Details</h1>
            <p>Comprehensive view of patient information and treatment progress</p>
          </div>
        </div>
      </div>

      {/* Patient Summary Card */}
      <div className="card mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <div className="bg-blue-100 p-3 rounded-full">
              <User size={32} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {displayData.patient_name}
              </h2>
              <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                {displayData.age && (
                  <div className="flex items-center space-x-1">
                    <Calendar size={16} />
                    <span>Age: {displayData.age}</span>
                  </div>
                )}
                <div className="flex items-center space-x-1">
                  <Heart size={16} />
                  <span>Patient ID: {displayData.patient_id}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Mail size={16} />
                  <span>Email: {displayData.email}</span>
                </div>
                {displayData.phone_number && (
                  <div className="flex items-center space-x-1">
                    <Phone size={16} />
                    <span>Phone: {displayData.phone_number}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Adherence Summary */}
          <div className="text-right">
            <div className={`text-2xl font-bold ${getAdherenceColor(displayData.medication_adherence?.overall_rate || 0)}`}>
              {displayData.medication_adherence?.overall_rate || 0}%
            </div>
            <div className={`text-sm px-2 py-1 rounded-full ${getAdherenceBgColor(displayData.medication_adherence?.overall_rate || 0)}`}>
              {getAdherenceStatus(displayData.medication_adherence?.overall_rate || 0)} Adherence
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {['overview', 'prescriptions', 'health-updates', 'medical-history'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.replace('-', ' ')}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Adherence Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="card">
                <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                  <CheckCircle size={20} className="text-green-600" />
                  <span>Medication Adherence</span>
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Overall Rate:</span>
                    <span className={`font-semibold ${getAdherenceColor(displayData.medication_adherence?.overall_rate || 0)}`}>
                      {displayData.medication_adherence?.overall_rate || 0}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Recent (7 days):</span>
                    <span className={`font-semibold ${getAdherenceColor(displayData.medication_adherence?.recent_rate || 0)}`}>
                      {displayData.medication_adherence?.recent_rate || 0}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Medicines Taken:</span>
                    <span>{displayData.medication_adherence?.taken_medicines || 0} / {displayData.medication_adherence?.total_medicines_scheduled || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Missed Medicines:</span>
                    <span className="text-red-600">{displayData.medication_adherence?.missed_medicines || 0}</span>
                  </div>
                </div>
              </div>

              <div className="card">
                <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                  <Pill size={20} className="text-blue-600" />
                  <span>Prescription Summary</span>
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Total Prescriptions:</span>
                    <span className="font-semibold">{displayData.total_prescriptions || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Prescriptions:</span>
                    <span className="font-semibold text-green-600">{displayData.active_prescriptions || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>First Prescription:</span>
                    <span className="text-sm">
                      {formatDate(displayData.first_prescription_date)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Latest Prescription:</span>
                    <span className="text-sm">
                      {formatDate(displayData.latest_prescription_date)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="card">
                <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                  <Activity size={20} className="text-purple-600" />
                  <span>Health Updates</span>
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Total Updates:</span>
                    <span className="font-semibold">{healthUpdates.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Latest Update:</span>
                    <span className="text-sm">
                      {healthUpdates.length > 0 
                        ? `${healthUpdates[0].days_ago} days ago`
                        : 'N/A'
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Health Updates */}
            {healthUpdates.length > 0 && (
              <div className="card">
                <h3 className="text-lg font-semibold mb-4">Recent Health Updates</h3>
                <div className="space-y-3">
                  {healthUpdates.slice(0, 5).map((update) => (
                    <div key={update.update_id} className="border-l-4 border-blue-500 pl-4 py-2">
                      <p className="text-gray-800">{update.update_text}</p>
                      <div className="text-sm text-gray-500 mt-1">
                        {formatDateTime(update.created_at)} • {update.days_ago} days ago
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Most Prescribed Medicines */}
            {displayData.most_prescribed_medicines && displayData.most_prescribed_medicines.length > 0 && (
              <div className="card">
                <h3 className="text-lg font-semibold mb-4">Most Prescribed Medicines</h3>
                <div className="space-y-2">
                  {displayData.most_prescribed_medicines.map((medicine, index) => (
                    <div key={medicine.name} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                      <div className="flex items-center space-x-3">
                        <div className="bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center text-sm font-semibold">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium">{medicine.name}</div>
                          <div className="text-sm text-gray-500">Prescribed {medicine.count} times</div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        Last: {formatDate(medicine.latest_prescription)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Prescriptions Tab */}
        {activeTab === 'prescriptions' && (
          <div className="space-y-6">
            {displayData.prescriptions && displayData.prescriptions.length > 0 ? (
              displayData.prescriptions.map((prescription) => (
                <div key={prescription.prescription_id} className="card">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold flex items-center space-x-2">
                        <Stethoscope size={20} className="text-blue-600" />
                        <span>Diagnosis: {prescription.diagnosis}</span>
                      </h3>
                      <div className="text-sm text-gray-600 mt-1">
                        Created: {formatDateTime(prescription.created_at)}
                        {prescription.updated_at !== prescription.created_at && 
                          ` • Updated: ${formatDateTime(prescription.updated_at)}`
                        }
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      prescription.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {prescription.is_active ? 'Active' : 'Inactive'}
                    </div>
                  </div>

                  {prescription.notes && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                      <strong>Notes:</strong> {prescription.notes}
                    </div>
                  )}

                  <div className="space-y-4">
                    <h4 className="font-semibold flex items-center space-x-2">
                      <Pill size={16} />
                      <span>Medicines ({prescription.total_medicines})</span>
                    </h4>
                    {prescription.medicines.map((medicine) => (
                      <div key={medicine.medicine_id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="font-semibold">{medicine.name}</div>
                            <div className="text-sm text-gray-600">Dosage: {medicine.dosage}</div>
                            {medicine.instructions && (
                              <div className="text-sm text-gray-600 mt-1">
                                Instructions: {medicine.instructions}
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <div className={`font-semibold ${getAdherenceColor(medicine.adherence_rate)}`}>
                              {medicine.adherence_rate}% adherence
                            </div>
                            <div className="text-sm text-gray-600">
                              {medicine.taken_schedules} / {medicine.total_schedules} taken
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="card text-center py-8">
                <FileText size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Prescriptions Found</h3>
                <p className="text-gray-600">This patient doesn't have any prescriptions yet.</p>
              </div>
            )}
          </div>
        )}

        {/* Health Updates Tab */}
        {activeTab === 'health-updates' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Health Updates ({healthUpdates.length})</h3>
              <button
                onClick={refreshHealthUpdates}
                disabled={healthUpdatesLoading}
                className="secondary-button flex items-center space-x-2"
              >
                <RefreshCw size={16} className={healthUpdatesLoading ? 'animate-spin' : ''} />
                <span>Refresh</span>
              </button>
            </div>

            {healthUpdates.length > 0 ? (
              <div className="card">
                <div className="space-y-4">
                  {healthUpdates.map((update) => (
                    <div key={update.update_id} className="border-l-4 border-green-500 pl-4 py-3 bg-green-50 rounded-r-lg">
                      <p className="text-gray-800 mb-2">{update.update_text}</p>
                      <div className="text-sm text-gray-500">
                        <Clock size={14} className="inline mr-1" />
                        {formatDateTime(update.created_at)} • {update.days_ago} days ago
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="card text-center py-8">
                <Activity size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Health Updates</h3>
                <p className="text-gray-600">This patient hasn't submitted any health updates yet.</p>
              </div>
            )}
          </div>
        )}

        {/* Medical History Tab */}
        {activeTab === 'medical-history' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Medical History */}
              <div className="card">
                <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                  <FileText size={20} className="text-blue-600" />
                  <span>Medical History</span>
                </h3>
                {displayData.medical_history ? (
                  <div className="prose prose-sm max-w-none">
                    {displayData.medical_history.split('\n').map((paragraph, index) => (
                      <p key={index} className="text-gray-700 mb-2">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No medical history recorded</p>
                )}
              </div>

              {/* Allergies */}
              <div className="card">
                <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                  <AlertCircle size={20} className="text-red-600" />
                  <span>Allergies</span>
                </h3>
                {displayData.allergies ? (
                  <div className="prose prose-sm max-w-none">
                    {displayData.allergies.split('\n').map((allergy, index) => (
                      <p key={index} className="text-gray-700 mb-2">
                        {allergy}
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No allergies recorded</p>
                )}
              </div>
            </div>

            {/* Emergency Contact */}
            {displayData.emergency_contact && (
              <div className="card">
                <h3 className="text-lg font-semibold mb-4">Emergency Contact</h3>
                <p className="text-gray-700">{displayData.emergency_contact}</p>
              </div>
            )}

            {/* Treatment Duration */}
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Treatment Overview</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-gray-600">Average Prescription Duration</div>
                  <div className="font-semibold">
                    {displayData.average_prescription_duration 
                      ? `${Math.round(displayData.average_prescription_duration)} days` 
                      : 'N/A'
                    }
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">First Prescription</div>
                  <div className="font-semibold">
                    {formatDate(displayData.first_prescription_date)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Latest Prescription</div>
                  <div className="font-semibold">
                    {formatDate(displayData.latest_prescription_date)}
                  </div>
                </div>
              </div>
            </div>

            {/* Medication History */}
            {displayData.medication_history && displayData.medication_history.length > 0 && (
              <div className="card">
                <h3 className="text-lg font-semibold mb-4">Medication History</h3>
                <div className="space-y-2">
                  {displayData.medication_history.map((medication, index) => (
                    <div key={medication.name} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                      <div className="font-medium">{medication.name}</div>
                      <div className="text-sm text-gray-500">
                        Prescribed {medication.total_prescriptions} times
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientDetails;