import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import DoctorRegister from './pages/DoctorRegister';
import DoctorLayout from './components/DoctorLayout';
import DoctorDashboard from './pages/DoctorDashboard';
import RegisterPatient from './pages/RegisterPatient';
import CreatePrescription from './pages/CreatePrescription';
import PatientDashboard from './pages/PatientDashboard';
import HealthUpdates from './pages/HealthUpdates';
import PatientDetails from './components/PatientDetails'
import PatientAnalytics from './components/PatientAnalytics';
import './App.css';

const ProtectedRoute = ({ children, requiredUserType }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (requiredUserType && user.userType !== requiredUserType) {
    return <Navigate to={user.userType === 'doctor' ? '/doctor/dashboard' : '/patient/dashboard'} />;
  }

  return children;
};

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/doctor/register" element={<DoctorRegister />} />

      {/* Doctor Routes with Layout */}
      <Route path="/doctor" element={
        <ProtectedRoute requiredUserType="doctor">
          <DoctorLayout />
        </ProtectedRoute>
      }>
        <Route path="dashboard" element={<DoctorDashboard />} />
        <Route path="register-patient" element={<RegisterPatient />} />
        <Route path="create-prescription" element={<CreatePrescription />} />
        <Route path="patients" element={<PatientDetails />} />
        <Route path="analytics" element={<PatientAnalytics />} />
        <Route path="analytics/:patientId" element={<PatientAnalytics />} />
      </Route>

      {/* Patient Routes */}
      <Route path="/patient/dashboard" element={
        <ProtectedRoute requiredUserType="patient">
          <PatientDashboard />
        </ProtectedRoute>
      } />
      <Route path="/patient/health-updates" element={
        <ProtectedRoute requiredUserType="patient">
          <HealthUpdates />
        </ProtectedRoute>
      } />

      <Route path="/" element={
        <Navigate to={user?.userType === 'doctor' ? '/doctor/dashboard' : '/patient/dashboard'} />
      } />

    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;