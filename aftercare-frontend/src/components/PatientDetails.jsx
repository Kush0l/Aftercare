import React, { useState, useEffect } from "react";
import { doctorAPI } from "../api/axios";
import { User, Mail, Phone, Calendar, ArrowLeft } from "lucide-react";

const PatientsPage = () => {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch all patients from dashboard
  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const response = await doctorAPI.getDashboard();
      setPatients(response.data.patient_activities || []);
    } catch (error) {
      console.error("Error fetching patients:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch one patient's details
  const fetchPatientDetails = async (id) => {
    try {
      setLoading(true);
      const response = await doctorAPI.getPatientDetails(id); // should call `/doctor/patients/${id}`
      setSelectedPatient(response.data);
    } catch (error) {
      console.error("Error fetching patient details:", error);
    } finally {
      setLoading(false);
    }
  };

  const backToList = () => setSelectedPatient(null);

  if (loading) return <div className="page-container">Loading...</div>;

  return (
    <div className="page-container">
      {!selectedPatient ? (
        // ===== Patient List View =====
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {patients.length > 0 ? (
            patients.map((patient) => (
              <div
                key={patient.patient_id}
                className="card hover:shadow-lg cursor-pointer"
                onClick={() => fetchPatientDetails(patient.patient_id)}
              >
                <div className="flex items-center space-x-4 mb-3">
                  <div className="bg-blue-100 p-3 rounded-full">
                    <User size={28} className="text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">{patient.patient_name}</h2>
                    <p className="text-sm text-gray-500">ID: {patient.patient_id}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500">No patients found</div>
          )}
        </div>
      ) : (
        // ===== Patient Detail View =====
        <div>
          <button onClick={backToList} className="back-button mb-4 flex items-center">
            <ArrowLeft size={20} className="mr-2" /> Back to Patients
          </button>

          <div className="card space-y-4">
            {/* Basic Info */}
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <User size={28} className="text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold">{selectedPatient.patient_name}</h2>
                <p className="text-sm text-gray-500">ID: {selectedPatient.patient_id}</p>
              </div>
            </div>
            <p><Mail size={14} className="inline" /> {selectedPatient.email}</p>
            <p><Phone size={14} className="inline" /> {selectedPatient.phone_number}</p>
            {selectedPatient.age && <p><Calendar size={14} className="inline" /> Age: {selectedPatient.age}</p>}

            {/* Medical History */}
            <div>
              <h3 className="font-semibold">Medical Info</h3>
              <p>Emergency Contact: {selectedPatient.emergency_contact || "N/A"}</p>
              <p>Medical History: {selectedPatient.medical_history || "N/A"}</p>
              <p>Allergies: {selectedPatient.allergies || "N/A"}</p>
            </div>

            {/* Prescriptions */}
            <div>
              <h3 className="font-semibold">Prescriptions ({selectedPatient.total_prescriptions})</h3>
              {selectedPatient.prescriptions.map((p) => (
                <div key={p.prescription_id} className="border rounded p-3 my-2">
                  <p><strong>Diagnosis:</strong> {p.diagnosis}</p>
                  <p><strong>Notes:</strong> {p.notes}</p>
                  <p><strong>Created:</strong> {new Date(p.created_at).toLocaleString()}</p>
                  <div>
                    <strong>Medicines:</strong>
                    {p.medicines.map((m) => (
                      <p key={m.medicine_id}>
                        {m.name} ({m.dosage}) - {m.instructions} | Adherence: {m.adherence_rate}%
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Health Updates */}
            <div>
              <h3 className="font-semibold">Recent Health Updates ({selectedPatient.total_health_updates})</h3>
              {selectedPatient.recent_health_updates.map((u) => (
                <p key={u.update_id}>
                  {u.update_text} ({u.days_ago} days ago)
                </p>
              ))}
            </div>

            {/* Medication Adherence */}
            <div>
              <h3 className="font-semibold">Medication Adherence</h3>
              <p>Overall Rate: {selectedPatient.medication_adherence.overall_rate}%</p>
              <p>Recent Rate: {selectedPatient.medication_adherence.recent_rate}%</p>
              <p>Taken: {selectedPatient.medication_adherence.taken_medicines}</p>
              <p>Missed: {selectedPatient.medication_adherence.missed_medicines}</p>
            </div>

            {/* History & Stats */}
            <div>
              <h3 className="font-semibold">Stats</h3>
              <p>First Prescription: {new Date(selectedPatient.first_prescription_date).toLocaleDateString()}</p>
              <p>Latest Prescription: {new Date(selectedPatient.latest_prescription_date).toLocaleDateString()}</p>
              <p>Most Prescribed: {selectedPatient.most_prescribed_medicines.map(m => `${m.name} (${m.count})`).join(", ")}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientsPage;
