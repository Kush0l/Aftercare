import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  Users,
  FileText,
  UserPlus,
  Pill,
  LogOut,
  Activity
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const DoctorNavbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const navItems = [
    {
      path: '/doctor/dashboard',
      label: 'Dashboard',
      icon: Home
    },
    {
      path: '/doctor/register-patient',
      label: 'Register Patient',
      icon: UserPlus
    },
    {
      path: '/doctor/create-prescription',
      label: 'Create Prescription',
      icon: FileText
    },
    {
      path: '/doctor/patients',
      label: 'Patient Details',
      icon: Users
    },

  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="doctor-navbar">
      <div className="navbar-header">
        <Pill className="navbar-logo" />
        <h2>Doctor Portal</h2>
      </div>

      <div className="navbar-items">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`navbar-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* User Info and Logout Section */}
      <div className="navbar-footer">
        <div className="user-info">
          <Users size={16} />
          <div className="user-details">
            <span className="username">{user?.username}</span>
            <span className="user-role">Doctor</span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="logout-button"
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </nav>
  );
};

export default DoctorNavbar;