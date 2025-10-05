# views/prescription_views.py
import json
from django.http import JsonResponse
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.utils import timezone
from datetime import datetime
from ..models import Prescription, Medicine, MedicineSchedule, User, ActivityLog
from ..middleware import user_type_required
from pytz import timezone as pytz_timezone


@method_decorator(csrf_exempt, name='dispatch')
class PrescriptionCreateView(View):
    @user_type_required('doctor')
    def post(self, request):
        try:
            data = json.loads(request.body)
            patient_id = data.get('patient_id')
            diagnosis = data.get('diagnosis')
            notes = data.get('notes', '')
            medicines = data.get('medicines', [])

            patient = User.objects.get(id=patient_id, user_type='patient')

            prescription = Prescription.objects.create(
                doctor=request.user,
                patient=patient,
                diagnosis=diagnosis,
                notes=notes
            )

            for med_data in medicines:
                medicine = Medicine.objects.create(
                    prescription=prescription,
                    name=med_data['name'],
                    dosage=med_data['dosage'],
                    instructions=med_data.get('instructions', '')
                )

               

                for schedule_data in med_data.get('schedules', []):
                    date_str = schedule_data.get('date')
                    time_str = schedule_data.get('time')

                    if date_str and time_str:
                        datetime_str = f"{date_str} {time_str}"
                        naive_datetime = datetime.strptime(datetime_str, "%Y-%m-%d %H:%M:%S")

                        # Localize to IST
                        ist = pytz_timezone("Asia/Kolkata")
                        local_datetime = ist.localize(naive_datetime)
                        print(local_datetime)

                        # Save — Django will auto-convert to UTC in DB
                        MedicineSchedule.objects.create(
                            medicine=medicine,
                            scheduled_time=local_datetime,
                            scheduled_date=local_datetime.date(),
                            reminder_sent=False,
                            is_taken=False
                        )

            ActivityLog.objects.create(
                user=request.user,
                action="Prescription created",
                details=f"Prescription created for patient {patient.email}"
            )

            return JsonResponse({
                'prescription_id': str(prescription.id),
                'message': 'Prescription created successfully'
            })

        except User.DoesNotExist:
            return JsonResponse({'error': 'Patient not found'}, status=404)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)

@method_decorator(csrf_exempt, name='dispatch')
class PatientPrescriptionsView(View):
    @user_type_required('patient')
    def get(self, request):
        try:
            prescriptions = Prescription.objects.filter(
                patient=request.user
            ).select_related('doctor').prefetch_related('medicines__schedules')

            result = []
            for prescription in prescriptions:
                prescription_data = {
                    'id': str(prescription.id),
                    'doctor_name': f"{prescription.doctor.first_name} {prescription.doctor.last_name}",
                    'diagnosis': prescription.diagnosis,
                    'created_at': prescription.created_at.isoformat(),
                    'medicines': []
                }

                for medicine in prescription.medicines.all():
                    medicine_data = {
                        'name': medicine.name,
                        'dosage': medicine.dosage,
                        'instructions': medicine.instructions,
                        'schedules': []
                    }

                    for schedule in medicine.schedules.all():
                        medicine_data['schedules'].append({
                            'id': str(schedule.id),
                            'scheduled_time': schedule.scheduled_time.isoformat(),
                            'scheduled_date': schedule.scheduled_date.isoformat(),
                            'is_taken': schedule.is_taken,
                            'taken_at': schedule.taken_at.isoformat() if schedule.taken_at else None
                        })

                    prescription_data['medicines'].append(medicine_data)

                result.append(prescription_data)

            return JsonResponse({'prescriptions': result})

        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
        
@method_decorator(csrf_exempt, name='dispatch')
class DoctorPatientMedicationStatusView(View):
    @user_type_required('doctor')
    def get(self, request, patient_id=None):
        try:
            # If patient_id is provided in URL, return single patient
            if patient_id:
                return self._get_single_patient(request, patient_id)
            # If no patient_id, check if query param exists
            elif request.GET.get('patient_id'):
                return self._get_single_patient(request, request.GET.get('patient_id'))
            else:
                # Return all patients (your original logic)
                return self._get_all_patients(request)
                
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
    
    def _get_single_patient(self, request, patient_id):
        # Your single patient logic here
        try:
            # First get the patient by ID only
            patient = User.objects.get(
                id=patient_id,
                user_type='patient'
            )
            
            # Verify that this patient has prescriptions from the current doctor
            has_prescriptions = Prescription.objects.filter(
                doctor=request.user,
                patient=patient
            ).exists()
            
            if not has_prescriptions:
                return JsonResponse({'error': 'Patient not found or not under your care'}, status=404)
            
            patient_data = {
                'patient_id': str(patient.id),
                'patient_name': f"{patient.first_name} {patient.last_name}",
                'prescriptions': []
            }
            
            prescriptions = Prescription.objects.filter(
                doctor=request.user,
                patient=patient,
                is_active=True
            ).prefetch_related('medicines__schedules')
            
            for prescription in prescriptions:
                prescription_data = {
                    'prescription_id': str(prescription.id),
                    'diagnosis': prescription.diagnosis,
                    'prescription_date': prescription.created_at.date().isoformat(),
                    'medicines': []
                }
                
                for medicine in prescription.medicines.all():
                    medicine_data = {
                        'medicine_name': medicine.name,
                        'dosage': medicine.dosage,
                        'schedules': []
                    }
                    
                    for schedule in medicine.schedules.all().order_by('scheduled_date', 'scheduled_time'):
                        medicine_data['schedules'].append({
                            'scheduled_date': schedule.scheduled_date.isoformat(),
                            'scheduled_time': schedule.scheduled_time.time().isoformat(),
                            'is_taken': schedule.is_taken,
                            'taken_at': schedule.taken_at.isoformat() if schedule.taken_at else None
                        })
                    
                    prescription_data['medicines'].append(medicine_data)
                
                patient_data['prescriptions'].append(prescription_data)
            
            return JsonResponse(patient_data)
            
        except User.DoesNotExist:
            return JsonResponse({'error': 'Patient not found'}, status=404)
    
    def _get_all_patients(self, request):
        # Your all patients logic here
        patients = User.objects.filter(
            prescriptions_received__doctor=request.user,
            user_type='patient'
        ).distinct()
        
        result = []
        for patient in patients:
            patient_data = {
                'patient_id': str(patient.id),
                'patient_name': f"{patient.first_name} {patient.last_name}",
                'prescriptions': []
            }
            
            prescriptions = Prescription.objects.filter(
                doctor=request.user,
                patient=patient,
                is_active=True
            ).prefetch_related('medicines__schedules')
            
            for prescription in prescriptions:
                prescription_data = {
                    'prescription_id': str(prescription.id),
                    'diagnosis': prescription.diagnosis,
                    'prescription_date': prescription.created_at.date().isoformat(),
                    'medicines': []
                }
                
                for medicine in prescription.medicines.all():
                    medicine_data = {
                        'medicine_name': medicine.name,
                        'dosage': medicine.dosage,
                        'schedules': []
                    }
                    
                    for schedule in medicine.schedules.all().order_by('scheduled_date', 'scheduled_time'):
                        medicine_data['schedules'].append({
                            'scheduled_date': schedule.scheduled_date.isoformat(),
                            'scheduled_time': schedule.scheduled_time.time().isoformat(),
                            'is_taken': schedule.is_taken,
                            'taken_at': schedule.taken_at.isoformat() if schedule.taken_at else None
                        })
                    
                    prescription_data['medicines'].append(medicine_data)
                
                patient_data['prescriptions'].append(prescription_data)
            
            result.append(patient_data)
        
        return JsonResponse({
            'patients': result,
            'total_patients': len(result)
        })