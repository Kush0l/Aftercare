import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { patientAPI } from '../api/axios';
import { 
  UserPlus, 
  ArrowLeft,
  Copy,
  Check,
  Mail,
  User,
  Phone,
  Calendar
} from 'lucide-react';

const RegisterPatient = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    date_of_birth: '',
    emergency_contact: '',
    medical_history: '',
    allergies: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdPatient, setCreatedPatient] = useState(null);
  const [copiedField, setCopiedField] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const copyToClipboard = async (text, field) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(''), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await patientAPI.searchOrCreate(formData);

      if (response.data.patient_exists) {
        setError('Patient already exists in the system.');
        setCreatedPatient(null);
      } else {
        const newPatient = {
          id: response.data.patient_id,
          email: formData.email,
          username: response.data.patient_data?.username || `patient_${formData.email.split('@')[0]}`,
          password: 'Auto-generated password sent via email',
          patient_id: response.data.patient_id
        };

        setCreatedPatient(newPatient);

        const savedPatients = localStorage.getItem('recentPatients');
        const recentPatients = savedPatients ? JSON.parse(savedPatients) : [];
        const updatedPatients = [
          { id: newPatient.patient_id, email: newPatient.email },
          ...recentPatients.filter(p => p.id !== newPatient.patient_id)
        ].slice(0, 5);
        localStorage.setItem('recentPatients', JSON.stringify(updatedPatients));

        setFormData({
          email: '',
          first_name: '',
          last_name: '',
          phone_number: '',
          date_of_birth: '',
          emergency_contact: '',
          medical_history: '',
          allergies: ''
        });
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to register patient');
    } finally {
      setLoading(false);
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
            <h1>Register New Patient</h1>
            <p>Create a new patient account in the system</p>
          </div>
        </div>
      </div>

      <div className="content-grid">
        <div className="card">
          <div className="card-header">
            <UserPlus className="card-icon" />
            <h2>Patient Information</h2>
          </div>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit} className="patient-form">
            {/* Required Fields */}
            <div className="input-group">
              <Mail className="input-icon" />
              <input
                type="email"
                name="email"
                placeholder="Patient Email *"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-row">
              <div className="input-group">
                <User className="input-icon" />
                <input
                  type="text"
                  name="first_name"
                  placeholder="First Name *"
                  value={formData.first_name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="input-group">
                <User className="input-icon" />
                <input
                  type="text"
                  name="last_name"
                  placeholder="Last Name *"
                  value={formData.last_name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <Phone className="input-icon" />
              <input
                type="tel"
                name="phone_number"
                placeholder="Phone Number *"
                value={formData.phone_number}
                onChange={handleChange}
                required
              />
            </div>

            {/* Optional Fields */}
            <div className="input-group">
              <Calendar className="input-icon" />
              <input
                type="date"
                name="date_of_birth"
                placeholder="Date of Birth"
                value={formData.date_of_birth}
                onChange={handleChange}
              />
            </div>

            <div className="input-group">
              <Phone className="input-icon" />
              <input
                type="tel"
                name="emergency_contact"
                placeholder="Emergency Contact"
                value={formData.emergency_contact}
                onChange={handleChange}
              />
            </div>

            <div className="input-group">
              <textarea
                name="medical_history"
                placeholder="Medical History (comma separated)"
                value={formData.medical_history}
                onChange={handleChange}
              />
            </div>

            <div className="input-group">
              <textarea
                name="allergies"
                placeholder="Allergies (comma separated)"
                value={formData.allergies}
                onChange={handleChange}
              />
            </div>

            <button type="submit" className="primary-button full-width" disabled={loading}>
              <UserPlus size={18} />
              {loading ? 'Registering Patient...' : 'Register Patient'}
            </button>
          </form>
        </div>

        {createdPatient && (
          <div className="card">
            <div className="card-header">
              <h2>Patient Credentials</h2>
            </div>

            <div className="credentials-success">
              <div className="success-icon">✅</div>
              <h3>Patient Registered Successfully!</h3>
              <p>Share these credentials with the patient:</p>

              <div className="credentials-list">
                {['patient_id', 'email', 'username', 'password'].map((field) => (
                  <div key={field} className="credential-item">
                    <label>{field.replace('_', ' ').toUpperCase()}:</label>
                    <div className="credential-value">
                      <code>{createdPatient[field]}</code>
                      <button
                        onClick={() => copyToClipboard(createdPatient[field], field)}
                        className="copy-button"
                      >
                        {copiedField === field ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="credentials-actions">
                <button onClick={() => navigate('/doctor/create-prescription')} className="primary-button">
                  Create Prescription for This Patient
                </button>
                <button onClick={() => setCreatedPatient(null)} className="secondary-button">
                  Register Another Patient
                </button>
              </div>

              <div className="credentials-note">
                <small>📧 Login credentials have been sent to the patient's email address.</small>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* === Inline CSS === */}
      <style>{`
        .page-container { padding: 20px; background: #f8fafc; min-height: 100vh; }
        .page-header { display: flex; align-items: center; margin-bottom: 20px; }
        .back-button { background: #f1f5f9; border: none; padding: 8px; border-radius: 8px; cursor: pointer; }
        .back-button:hover { background: #e2e8f0; }
        .content-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .card { background: #fff; border-radius: 12px; padding: 20px; box-shadow: 0 2px 6px rgba(0,0,0,0.08); }
        .card-header { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
        .card-header h2 { font-size: 18px; font-weight: 600; }
        .input-group { display: flex; align-items: center; border: 1px solid #e2e8f0; padding: 10px; border-radius: 8px; margin-bottom: 12px; background: #f9fafb; }
        .input-icon { margin-right: 8px; color: #64748b; }
        input, textarea { flex: 1; border: none; outline: none; background: transparent; font-size: 14px; }
        textarea { min-height: 60px; resize: vertical; }
        .form-row { display: flex; gap: 12px; }
        .primary-button, .secondary-button { display: inline-flex; align-items: center; justify-content: center; gap: 6px; padding: 10px 14px; border-radius: 8px; cursor: pointer; font-weight: 600; }
        .primary-button { background: #3b82f6; color: #fff; border: none; }
        .primary-button:hover { background: #2563eb; }
        .secondary-button { background: #f1f5f9; border: none; color: #1e293b; }
        .secondary-button:hover { background: #e2e8f0; }
        .full-width { width: 100%; margin-top: 10px; }
        .error-message { color: #dc2626; font-size: 14px; margin-bottom: 12px; }
        .credentials-success { text-align: center; }
        .credentials-success h3 { margin: 8px 0; font-size: 16px; font-weight: 600; }
        .credentials-list { margin: 16px 0; text-align: left; }
        .credential-item { margin-bottom: 12px; }
        .credential-value { display: flex; align-items: center; gap: 6px; }
        code { background: #f1f5f9; padding: 4px 8px; border-radius: 6px; font-size: 13px; }
        .copy-button { background: #f1f5f9; border: none; padding: 4px 6px; border-radius: 6px; cursor: pointer; }
        .copy-button:hover { background: #e2e8f0; }
        .credentials-actions { display: flex; flex-direction: column; gap: 8px; margin-top: 12px; }
        .credentials-note { margin-top: 12px; font-size: 12px; color: #64748b; }
      `}</style>
    </div>
  );
};

export default RegisterPatient;
