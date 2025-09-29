# views/doctor_views.py
import json
from django.http import JsonResponse
from django.views import View
from django.utils.decorators import method_decorator
from datetime import datetime, timedelta
from ..models import Prescription, HealthUpdate, MedicineSchedule, User, PatientProfile, Medicine
from ..middleware import user_type_required
from django.shortcuts import get_object_or_404
from django.db.models import Count, Avg, Q, Max


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


class DoctorPatientDetailView(View):
    @user_type_required('doctor')
    def get(self, request, patient_id):
        try:
            # Get the patient and verify they exist
            patient = get_object_or_404(User, id=patient_id, user_type='patient')
            
            # Verify that the doctor has prescribed to this patient
            has_prescription_access = Prescription.objects.filter(
                doctor=request.user,
                patient=patient
            ).exists()
            
            if not has_prescription_access:
                return JsonResponse(
                    {'error': 'Access denied. You can only view patients you have prescribed to.'}, 
                    status=403
                )
            
            # Get patient profile information
            patient_profile = PatientProfile.objects.get(user=patient)
            
            # Calculate comprehensive medication adherence statistics
            thirty_days_ago = datetime.now().date() - timedelta(days=30)
            
            # Overall adherence for this doctor's prescriptions
            total_medicines = MedicineSchedule.objects.filter(
                medicine__prescription__patient=patient,
                medicine__prescription__doctor=request.user,
                scheduled_date__gte=thirty_days_ago
            ).count()

            taken_medicines = MedicineSchedule.objects.filter(
                medicine__prescription__patient=patient,
                medicine__prescription__doctor=request.user,
                is_taken=True,
                scheduled_date__gte=thirty_days_ago
            ).count()

            adherence_rate = (taken_medicines / total_medicines * 100) if total_medicines > 0 else 0
            
            # Recent adherence (last 7 days)
            seven_days_ago = datetime.now().date() - timedelta(days=7)
            recent_total = MedicineSchedule.objects.filter(
                medicine__prescription__patient=patient,
                medicine__prescription__doctor=request.user,
                scheduled_date__gte=seven_days_ago
            ).count()
            
            recent_taken = MedicineSchedule.objects.filter(
                medicine__prescription__patient=patient,
                medicine__prescription__doctor=request.user,
                is_taken=True,
                scheduled_date__gte=seven_days_ago
            ).count()
            
            recent_adherence = (recent_taken / recent_total * 100) if recent_total > 0 else 0

            # Get all prescriptions for this patient from this doctor
            prescriptions = Prescription.objects.filter(
                patient=patient, 
                doctor=request.user
            ).order_by('-created_at')
            
            # Get detailed prescription data
            prescription_details = []
            for prescription in prescriptions:
                medicines = Medicine.objects.filter(prescription=prescription)
                medicine_list = []
                
                for medicine in medicines:
                    medicine_schedules = MedicineSchedule.objects.filter(medicine=medicine)
                    total_schedules = medicine_schedules.count()
                    taken_schedules = medicine_schedules.filter(is_taken=True).count()
                    medicine_adherence = (taken_schedules / total_schedules * 100) if total_schedules > 0 else 0
                    
                    medicine_list.append({
                        'medicine_id': str(medicine.id),
                        'name': medicine.name,
                        'dosage': medicine.dosage,
                        'instructions': medicine.instructions,
                        'adherence_rate': round(medicine_adherence, 2),
                        'total_schedules': total_schedules,
                        'taken_schedules': taken_schedules
                    })
                
                prescription_details.append({
                    'prescription_id': str(prescription.id),
                    'diagnosis': prescription.diagnosis,
                    'notes': prescription.notes,
                    'created_at': prescription.created_at.isoformat(),
                    'updated_at': prescription.updated_at.isoformat(),
                    'is_active': prescription.is_active,
                    'medicines': medicine_list,
                    'total_medicines': len(medicine_list)
                })

            # Get recent health updates
            recent_health_updates = HealthUpdate.objects.filter(
                patient=patient
            ).order_by('-created_at')[:10]
            
            health_updates = [
                {
                    'update_id': str(update.id),
                    'update_text': update.update_text,
                    'created_at': update.created_at.isoformat(),
                    'days_ago': (datetime.now().date() - update.created_at.date()).days
                } for update in recent_health_updates
            ]

            # Get medication statistics
            all_medicines_prescribed = Medicine.objects.filter(
                prescription__patient=patient,
                prescription__doctor=request.user
            ).values('name').annotate(total_prescriptions=Count('prescription'))

            # Calculate patient age
            age = None
            if patient_profile.date_of_birth:
                today = datetime.now().date()
                age = today.year - patient_profile.date_of_birth.year - (
                    (today.month, today.day) < (patient_profile.date_of_birth.month, patient_profile.date_of_birth.day)
                )

            # Prepare comprehensive response data
            patient_data = {
                # Basic Information
                'patient_id': str(patient.id),
                'patient_name': f"{patient.first_name} {patient.last_name}",
                'email': patient.email,
                'phone_number': patient.phone_number,
                'date_of_birth': patient_profile.date_of_birth.isoformat() if patient_profile.date_of_birth else None,
                'age': age,
                'emergency_contact': patient_profile.emergency_contact,
                
                # Medical Information
                'medical_history': patient_profile.medical_history,
                'allergies': patient_profile.allergies,
                
                # Prescription Statistics
                'total_prescriptions': prescriptions.count(),
                'active_prescriptions': prescriptions.filter(is_active=True).count(),
                'medication_adherence': {
                    'overall_rate': round(adherence_rate, 2),
                    'recent_rate': round(recent_adherence, 2),
                    'total_medicines_scheduled': total_medicines,
                    'taken_medicines': taken_medicines,
                    'missed_medicines': total_medicines - taken_medicines
                },
                
                # Detailed Prescription Information
                'prescriptions': prescription_details,
                
                # Health Updates
                'recent_health_updates': health_updates,
                'total_health_updates': HealthUpdate.objects.filter(patient=patient).count(),
                
                # Medication History
                'medication_history': list(all_medicines_prescribed),
                
                # Treatment Duration
                'first_prescription_date': prescriptions.last().created_at.isoformat() if prescriptions.exists() else None,
                'latest_prescription_date': prescriptions.first().created_at.isoformat() if prescriptions.exists() else None,
                
                # Compliance Metrics
                'average_prescription_duration': self.calculate_avg_prescription_duration(prescriptions) if prescriptions.exists() else 0,
                'most_prescribed_medicines': self.get_most_prescribed_medicines(patient, request.user)
            }

            return JsonResponse(patient_data)

        except User.DoesNotExist:
            return JsonResponse({'error': 'Patient not found'}, status=404)
        except PatientProfile.DoesNotExist:
            return JsonResponse({'error': 'Patient profile not found'}, status=404)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
    
    def calculate_avg_prescription_duration(self, prescriptions):
        """Calculate average duration between prescriptions"""
        if len(prescriptions) < 2:
            return 0
            
        dates = sorted([prescription.created_at for prescription in prescriptions])
        durations = []
        
        for i in range(1, len(dates)):
            duration = (dates[i] - dates[i-1]).days
            durations.append(duration)
            
        return sum(durations) / len(durations)
    
    def get_most_prescribed_medicines(self, patient, doctor):
        """Get most frequently prescribed medicines for this patient"""
        medicines = Medicine.objects.filter(
            prescription__patient=patient,
            prescription__doctor=doctor
        ).values('name').annotate(
            count=Count('id'),
            latest_prescription=Max('prescription__created_at')
        ).order_by('-count')[:5]
        
        return list(medicines)