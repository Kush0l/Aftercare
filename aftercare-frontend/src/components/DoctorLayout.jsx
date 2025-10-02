import React from 'react';
import { Outlet } from 'react-router-dom';
import DoctorNavbar from './DoctorNavbar';

const DoctorLayout = () => {
  return (
    <div className="doctor-layout">
      <DoctorNavbar />
      <main className="doctor-main">
        <Outlet />
      </main>
    </div>
  );
};

export default DoctorLayout;