# views/doctor_views.py
import json
from django.http import JsonResponse
from django.views import View
from django.utils.decorators import method_decorator
from datetime import datetime, timedelta
from ..models import Prescription, HealthUpdate, MedicineSchedule, User
from ..middleware import user_type_required

class DoctorDashboardView(View):
    @user_type_required('doctor')
    def get(self, request):
        try:
            # Get recent prescriptions
            recent_prescriptions = Prescription.objects.filter(
                doctor=request.user
            ).select_related('patient').order_by('-created_at')[:10]

            # Get patient activities
            patient_activities = []
            patients = User.objects.filter(
                prescriptions_received__doctor=request.user
            ).distinct()

            for patient in patients:
                # Recent health updates
                recent_updates = HealthUpdate.objects.filter(
                    patient=patient
                ).order_by('-created_at')[:5]

                # Medicine adherence rate
                total_medicines = MedicineSchedule.objects.filter(
                    medicine__prescription__patient=patient,
                    medicine__prescription__doctor=request.user,
                    scheduled_date__gte=datetime.now().date() - timedelta(days=30)
                ).count()

                taken_medicines = MedicineSchedule.objects.filter(
                    medicine__prescription__patient=patient,
                    medicine__prescription__doctor=request.user,
                    is_taken=True,
                    scheduled_date__gte=datetime.now().date() - timedelta(days=30)
                ).count()

                adherence_rate = (taken_medicines / total_medicines * 100) if total_medicines > 0 else 0

                patient_activities.append({
                    'patient_id': str(patient.id),
                    'patient_name': f"{patient.first_name} {patient.last_name}",
                    'email': patient.email,
                    'recent_updates': [
                        {
                            'text': update.update_text,
                            'created_at': update.created_at.isoformat()
                        } for update in recent_updates
                    ],
                    'adherence_rate': round(adherence_rate, 2),
                    'total_prescriptions': Prescription.objects.filter(
                        patient=patient, doctor=request.user
                    ).count()
                })

            result = {
                'recent_prescriptions': [
                    {
                        'id': str(p.id),
                        'patient_name': f"{p.patient.first_name} {p.patient.last_name}",
                        'diagnosis': p.diagnosis,
                        'created_at': p.created_at.isoformat()
                    } for p in recent_prescriptions
                ],
                'patient_activities': patient_activities
            }

            return JsonResponse(result)

        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
