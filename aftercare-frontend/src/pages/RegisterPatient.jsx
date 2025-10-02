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
  Phone
} from 'lucide-react';

const RegisterPatient = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    phone_number: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdPatient, setCreatedPatient] = useState(null);
  const [copiedField, setCopiedField] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
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
        // Patient was created - show credentials
        setCreatedPatient({
          email: formData.email,
          username: response.data.username || `patient_${formData.email.split('@')[0]}`,
          password: response.data.password || 'Auto-generated password sent via email',
          patient_id: response.data.patient_id
        });

        // In the handleSubmit function, after patient is created:
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
      // Patient was created - show credentials
      const newPatient = {
        id: response.data.patient_id,
        email: formData.email,
        username: response.data.username || `patient_${formData.email.split('@')[0]}`,
        password: response.data.password || 'Auto-generated password sent via email',
        patient_id: response.data.patient_id
      };
      
      setCreatedPatient(newPatient);
      
      // Store in recent patients
      const savedPatients = localStorage.getItem('recentPatients');
      const recentPatients = savedPatients ? JSON.parse(savedPatients) : [];
      const updatedPatients = [
        { id: newPatient.patient_id, email: newPatient.email },
        ...recentPatients.filter(p => p.id !== newPatient.patient_id)
      ].slice(0, 5);
      
      localStorage.setItem('recentPatients', JSON.stringify(updatedPatients));
      
      // Reset form
      setFormData({
        email: '',
        first_name: '',
        last_name: '',
        phone_number: ''
      });
    }
  } catch (error) {
    setError(error.response?.data?.error || 'Failed to register patient');
  } finally {
    setLoading(false);
  }
};
        
        // Reset form
        setFormData({
          email: '',
          first_name: '',
          last_name: '',
          phone_number: ''
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
          <button 
            onClick={() => navigate('/doctor/dashboard')}
            className="back-button"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1>Register New Patient</h1>
            <p>Create a new patient account in the system</p>
          </div>
        </div>
      </div>

      <div className="content-grid">
        {/* Registration Form */}
        <div className="card">
          <div className="card-header">
            <UserPlus className="card-icon" />
            <h2>Patient Information</h2>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="patient-form">
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
                placeholder="Phone Number (optional)"
                value={formData.phone_number}
                onChange={handleChange}
              />
            </div>

            <button 
              type="submit" 
              className="primary-button full-width"
              disabled={loading}
            >
              <UserPlus size={18} />
              {loading ? 'Registering Patient...' : 'Register Patient'}
            </button>
          </form>
        </div>

        {/* Credentials Display */}
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
                <div className="credential-item">
                  <label>Patient ID:</label>
                  <div className="credential-value">
                    <code>{createdPatient.patient_id}</code>
                    <button 
                      onClick={() => copyToClipboard(createdPatient.patient_id, 'patient_id')}
                      className="copy-button"
                    >
                      {copiedField === 'patient_id' ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
                
                <div className="credential-item">
                  <label>Email:</label>
                  <div className="credential-value">
                    <code>{createdPatient.email}</code>
                    <button 
                      onClick={() => copyToClipboard(createdPatient.email, 'email')}
                      className="copy-button"
                    >
                      {copiedField === 'email' ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
                
                <div className="credential-item">
                  <label>Username:</label>
                  <div className="credential-value">
                    <code>{createdPatient.username}</code>
                    <button 
                      onClick={() => copyToClipboard(createdPatient.username, 'username')}
                      className="copy-button"
                    >
                      {copiedField === 'username' ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
                
                <div className="credential-item">
                  <label>Password:</label>
                  <div className="credential-value">
                    <code>{createdPatient.password}</code>
                    <button 
                      onClick={() => copyToClipboard(createdPatient.password, 'password')}
                      className="copy-button"
                    >
                      {copiedField === 'password' ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="credentials-actions">
                <button 
                  onClick={() => navigate('/doctor/create-prescription')}
                  className="primary-button"
                >
                  Create Prescription for This Patient
                </button>
                <button 
                  onClick={() => setCreatedPatient(null)}
                  className="secondary-button"
                >
                  Register Another Patient
                </button>
              </div>
              
              <div className="credentials-note">
                <small>
                  📧 Login credentials have been sent to the patient's email address.
                  The patient can use these credentials to access their portal.
                </small>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RegisterPatient;