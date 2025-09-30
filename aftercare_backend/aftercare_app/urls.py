from django.urls import path

from .views.auth import DoctorRegisterView, LoginView
from .views.patient_views import PatientSearchCreateView
from .views.prescription_views import PrescriptionCreateView, PatientPrescriptionsView
from .views.medicine_views import MarkMedicineTakenView, HealthUpdateView, GetTodayMedicineView
from .views.doctor_views import DoctorDashboardView, DoctorPatientDetailView

urlpatterns = [
    # Authentication
    path('api/auth/doctor/register', DoctorRegisterView.as_view(), name='doctor_register'),
    path('api/auth/login', LoginView.as_view(), name='login'),

    # Patient Management
    path('api/patients/search-create', PatientSearchCreateView.as_view(), name='patient_search_create'),
    path('api/patient/today-medicines', GetTodayMedicineView.as_view(), name='get_today_medicine'),

    # Prescription Management
    path('api/prescriptions/create', PrescriptionCreateView.as_view(), name='create_prescription'),
    path('api/patient/prescriptions', PatientPrescriptionsView.as_view(), name='patient_prescriptions'),

    # Medicine Tracking
    path('api/medicine/mark-taken/<uuid:schedule_id>', MarkMedicineTakenView.as_view(), name='mark_medicine_taken'),
    path('api/health-updates', HealthUpdateView.as_view(), name='health_updates'),

    # Doctor Dashboard
    path('api/doctor/dashboard', DoctorDashboardView.as_view(), name='doctor_dashboard'),
    path('api/doctor/patients/<uuid:patient_id>', DoctorPatientDetailView.as_view(), name='doctor-patient-detail'),
]