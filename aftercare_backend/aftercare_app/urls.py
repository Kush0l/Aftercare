# # urls.py
# from django.urls import path
# from .views import auth, patient_views, prescription_views, medicine_views, doctor_views

# urlpatterns = [
#     # Authentication
#     path('api/auth/doctor/register', auth.DoctorRegisterView.as_view(), name='doctor_register'),
#     path('api/auth/login', auth.LoginView.as_view(), name='login'),

#     # Patient Management
#     path('api/patients/search-create', patient_views.PatientSearchCreateView.as_view(), name='patient_search_create'),

#     # Prescription Management
#     path('api/prescriptions/create', prescription_views.PrescriptionCreateView.as_view(), name='create_prescription'),
#     path('api/patient/prescriptions', prescription_views.PatientPrescriptionsView.as_view(), name='patient_prescriptions'),

#     # Medicine Tracking
#     path('api/medicine/mark-taken/<uuid:schedule_id>', medicine_views.MarkMedicineTakenView.as_view(), name='mark_medicine_taken'),
#     path('api/health-updates', medicine_views.HealthUpdateView.as_view(), name='health_updates'),

#     # Doctor Dashboard
#     path('api/doctor/dashboard', doctor_views.DoctorDashboardView.as_view(), name='doctor_dashboard'),
# ]


# aftercare_app/urls.py
from django.urls import path

from .views.auth import DoctorRegisterView, LoginView
from .views.patient_views import PatientSearchCreateView
from .views.prescription_views import PrescriptionCreateView, PatientPrescriptionsView
from .views.medicine_views import MarkMedicineTakenView, HealthUpdateView
from .views.doctor_views import DoctorDashboardView, DoctorPatientDetailView,DoctorPatientHealthUpdatesView

urlpatterns = [
    # Authentication
    path('api/auth/doctor/register', DoctorRegisterView.as_view(), name='doctor_register'),
    path('api/auth/login', LoginView.as_view(), name='login'),

    # Patient Management
    path('api/patients/search-create', PatientSearchCreateView.as_view(), name='patient_search_create'),

    # Prescription Management
    path('api/prescriptions/create', PrescriptionCreateView.as_view(), name='create_prescription'),
    path('api/patient/prescriptions', PatientPrescriptionsView.as_view(), name='patient_prescriptions'),

    # Medicine Tracking
    path('api/medicine/mark-taken/<uuid:schedule_id>', MarkMedicineTakenView.as_view(), name='mark_medicine_taken'),
    path('api/health-updates', HealthUpdateView.as_view(), name='health_updates'),

    # Doctor Dashboard
    path('api/doctor/dashboard', DoctorDashboardView.as_view(), name='doctor_dashboard'),
    path('api/doctor/patients/<uuid:patient_id>', DoctorPatientDetailView.as_view(), name='doctor-patient-detail'),
    path("api/doctor/patient/<uuid:patient_id>/health-updates", DoctorPatientHealthUpdatesView.as_view(), name="doctor-patient-health-updates"),
]