import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { prescriptionAPI, doctorAPI } from '../api/axios';
import { Plus, Trash2, Clock, Calendar, ArrowLeft, User, ChevronDown } from 'lucide-react';

const CreatePrescription = () => {
  const navigate = useNavigate();

  // Form state
  const [formData, setFormData] = useState({
    patient_id: '',
    diagnosis: '',
    notes: '',
    medicines: [{
      name: '',
      dosage: '',
      instructions: '',
      schedules: [{ date: '', time: '' }]
    }]
  });

  // Revisit state
  const [revisit, setRevisit] = useState({
    date: '',
    notes: '' // expected condition
  });

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [patientSearch, setPatientSearch] = useState('');
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const dashboardResponse = await doctorAPI.getDashboard();
      if (dashboardResponse.data.patient_activities) {
        const patientList = dashboardResponse.data.patient_activities.map(activity => ({
          id: activity.patient_id,
          email: activity.email,
          name: activity.patient_name
        }));
        setPatients(patientList);
      } else {
        setPatients([]);
      }
    } catch (error) {
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  // Patient selection
  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient);
    setFormData(prev => ({ ...prev, patient_id: patient.id }));
    setPatientSearch(`${patient.name || patient.email} (ID: ${patient.id})`);
    setShowPatientDropdown(false);
  };

  const handleManualPatientId = (e) => {
    const patientId = e.target.value;
    setFormData(prev => ({ ...prev, patient_id: patientId }));

    if (patientId) {
      setSelectedPatient({ id: patientId, email: 'Manual Entry', name: 'Manual Entry' });
      setPatientSearch(`Manual Entry (ID: ${patientId})`);
    } else {
      setSelectedPatient(null);
      setPatientSearch('');
    }
  };

  // Form changes
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleMedicineChange = (index, field, value) => {
    const updatedMedicines = [...formData.medicines];
    updatedMedicines[index][field] = value;
    setFormData({ ...formData, medicines: updatedMedicines });
  };

  const handleScheduleChange = (medIndex, schedIndex, field, value) => {
    const updatedMedicines = [...formData.medicines];
    if (field === 'time' && value) {
      const timeParts = value.split(':');
      if (timeParts.length === 2) value = `${value}:00`;
    }
    updatedMedicines[medIndex].schedules[schedIndex][field] = value;
    setFormData({ ...formData, medicines: updatedMedicines });
  };

  const addMedicine = () => setFormData({
    ...formData,
    medicines: [...formData.medicines, { name: '', dosage: '', instructions: '', schedules: [{ date: '', time: '' }] }]
  });

  const removeMedicine = (index) => setFormData({
    ...formData,
    medicines: formData.medicines.filter((_, i) => i !== index)
  });

  const addSchedule = (medIndex) => {
    const updatedMedicines = [...formData.medicines];
    updatedMedicines[medIndex].schedules.push({ date: '', time: '' });
    setFormData({ ...formData, medicines: updatedMedicines });
  };

  const removeSchedule = (medIndex, schedIndex) => {
    const updatedMedicines = [...formData.medicines];
    updatedMedicines[medIndex].schedules = updatedMedicines[medIndex].schedules.filter((_, i) => i !== schedIndex);
    setFormData({ ...formData, medicines: updatedMedicines });
  };

  const formatTimeForDisplay = (timeValue) => {
    if (!timeValue) return '';
    if (timeValue.includes(':')) {
      const parts = timeValue.split(':');
      return `${parts[0]}:${parts[1]}`;
    }
    return timeValue;
  };

  const formatTimeForBackend = (timeValue) => {
    if (!timeValue) return '';
    if (timeValue.includes(':')) {
      const parts = timeValue.split(':');
      if (parts.length === 2) return `${timeValue}:00`;
      if (parts.length === 3) return timeValue;
    }
    return `${timeValue}:00:00`;
  };

  const filteredPatients = patients.filter(patient =>
    patient.name?.toLowerCase().includes(patientSearch.toLowerCase()) ||
    patient.email?.toLowerCase().includes(patientSearch.toLowerCase()) ||
    patient.id?.toLowerCase().includes(patientSearch.toLowerCase())
  );

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    if (!formData.patient_id) {
      setError('Please select a patient or enter Patient ID');
      setSubmitting(false);
      return;
    }

    if (!formData.diagnosis.trim()) {
      setError('Please enter a diagnosis');
      setSubmitting(false);
      return;
    }

    try {
      // 1️⃣ Create prescription
      const prescriptionData = {
        ...formData,
        medicines: formData.medicines.map(med => ({
          ...med,
          schedules: med.schedules.map(sched => ({
            date: sched.date,
            time: formatTimeForBackend(sched.time)
          }))
        }))
      };

      const prescriptionResponse = await prescriptionAPI.create(prescriptionData);
      const prescriptionId = prescriptionResponse.data.id;

      // 2️⃣ Schedule revisit if provided
      if (revisit.date) {
        await doctorAPI.scheduleRevisit(formData.patient_id, {
          revisit_date: revisit.date,
          expected_condition: revisit.notes,
          prescription_id: prescriptionId
        });
      }

      alert('Prescription and revisit saved successfully!');
      navigate('/doctor/dashboard');
    } catch (error) {
      console.error('Error:', error);
      setError(error.response?.data?.error || 'Failed to create prescription or schedule revisit');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-left">
          <button onClick={() => navigate('/doctor/dashboard')} className="back-button">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1>Create Prescription</h1>
            <p>Create a new prescription for a patient</p>
          </div>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit} className="prescription-form">
        {/* Patient Selection */}
        <div className="card">
          <h2>1. Select Patient</h2>
          <div className="patient-selection">
            <div className="dropdown-container">
              <div className="dropdown-header">
                <input
                  type="text"
                  placeholder="Click here to select a patient or enter Patient ID..."
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  onFocus={() => setShowPatientDropdown(true)}
                  onClick={() => setShowPatientDropdown(true)}
                  className="dropdown-input"
                />
                <button type="button" className="dropdown-toggle" onClick={() => setShowPatientDropdown(!showPatientDropdown)}>
                  <ChevronDown size={16} />
                </button>
              </div>
              {showPatientDropdown && (
                <div className="dropdown-menu">
                  {loading ? (
                    <div className="dropdown-loading">Loading patients...</div>
                  ) : filteredPatients.length > 0 ? (
                    <div className="patient-list">
                      {filteredPatients.map((patient) => (
                        <div
                          key={patient.id}
                          className={`dropdown-item ${selectedPatient?.id === patient.id ? 'selected' : ''}`}
                          onClick={() => handlePatientSelect(patient)}
                        >
                          <User size={16} />
                          <div className="patient-info">
                            <strong>{patient.name || patient.email}</strong>
                            <span>ID: {patient.id}</span>
                            {patient.email && <span>Email: {patient.email}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="dropdown-empty">
                      No patients found. Enter Patient ID manually below.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="manual-patient-id">
            <label>Or enter Patient ID directly:</label>
            <input
              type="text"
              placeholder="Enter Patient ID"
              value={formData.patient_id}
              onChange={handleManualPatientId}
              className="patient-id-input"
            />
          </div>

          {selectedPatient && (
            <div className="selected-patient-display">
              <User size={20} />
              <div>
                <strong>Selected Patient:</strong>
                <div className="patient-details">
                  <span>Name: {selectedPatient.name || selectedPatient.email}</span>
                  <span>Patient ID: {selectedPatient.id}</span>
                  {selectedPatient.email && selectedPatient.email !== 'Manual Entry' && <span>Email: {selectedPatient.email}</span>}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Diagnosis & Notes */}
        <div className="card">
          <h2>2. Diagnosis & Notes</h2>
          <div className="form-group">
            <label>Diagnosis *</label>
            <textarea name="diagnosis" value={formData.diagnosis} onChange={handleChange} required rows="3" placeholder="Enter diagnosis details" />
          </div>
          <div className="form-group">
            <label>Notes</label>
            <textarea name="notes" value={formData.notes} onChange={handleChange} rows="2" placeholder="Additional notes for the patient" />
          </div>
        </div>



        {/* Medications */}
        <div className="card">
          <div className="card-header">
            <h2>4. Medications</h2>
            <button type="button" onClick={addMedicine} className="secondary-button"><Plus size={16} /> Add Medicine</button>
          </div>
          {formData.medicines.map((medicine, medIndex) => (
            <div key={medIndex} className="medicine-card">
              <div className="medicine-header">
                <h3>Medicine {medIndex + 1}</h3>
                {formData.medicines.length > 1 && <button type="button" onClick={() => removeMedicine(medIndex)} className="danger-button"><Trash2 size={16} /></button>}
              </div>
              <div className="medicine-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Medicine Name *</label>
                    <input type="text" value={medicine.name} onChange={(e) => handleMedicineChange(medIndex, 'name', e.target.value)} required placeholder="e.g., Lisinopril" />
                  </div>
                  <div className="form-group">
                    <label>Dosage *</label>
                    <input type="text" value={medicine.dosage} onChange={(e) => handleMedicineChange(medIndex, 'dosage', e.target.value)} required placeholder="e.g., 10mg" />
                  </div>
                </div>
                <div className="form-group">
                  <label>Instructions</label>
                  <textarea value={medicine.instructions} onChange={(e) => handleMedicineChange(medIndex, 'instructions', e.target.value)} rows="2" placeholder="e.g., Take daily with food" />
                </div>

                <div className="schedules-section">
                  <div className="section-header">
                    <h4>Schedule (24-hour format)</h4>
                    <button type="button" onClick={() => addSchedule(medIndex)} className="secondary-button small"><Plus size={14} /> Add Schedule</button>
                  </div>

                  {medicine.schedules.map((schedule, schedIndex) => (
                    <div key={schedIndex} className="schedule-item">
                      <div className="form-row">
                        <div className="form-group">
                          <Calendar size={16} />
                          <input type="date" value={schedule.date} onChange={(e) => handleScheduleChange(medIndex, schedIndex, 'date', e.target.value)} required />
                        </div>
                        <div className="form-group time-input-group">
                          <Clock size={16} />
                          <input type="time" value={formatTimeForDisplay(schedule.time)} onChange={(e) => handleScheduleChange(medIndex, schedIndex, 'time', e.target.value)} required step="1" />
                          <small className="time-format-hint">Format: HH:MM:SS (24-hour)</small>
                        </div>
                        {medicine.schedules.length > 1 && <button type="button" onClick={() => removeSchedule(medIndex, schedIndex)} className="danger-button small"><Trash2 size={14} /></button>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>



        {/* Revisit */}
        <div className="card">
          <h2>3. Schedule Revisit (Optional)</h2>
          <div className="form-group">
            <label>Revisit Date</label>
            <input
              type="date"
              value={revisit.date}
              onChange={e => setRevisit({ ...revisit, date: e.target.value })}
              placeholder="yyyy-mm-dd"
            />
          </div>
          <div className="form-group">
            <label>Expected Condition / Remarks</label>
            <textarea
              value={revisit.notes}
              onChange={e => setRevisit({ ...revisit, notes: e.target.value })}
              placeholder="Describe expected condition or reason for revisit"
              rows="3"
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="button" onClick={() => navigate('/doctor/dashboard')} className="secondary-button">Cancel</button>
          <button type="submit" className="primary-button" disabled={submitting || !formData.patient_id}>
            {submitting ? 'Creating Prescription...' : 'Create Prescription'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreatePrescription;
