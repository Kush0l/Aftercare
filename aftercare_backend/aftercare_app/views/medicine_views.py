# views/medicine_views.py
import json
from django.http import JsonResponse
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from datetime import datetime
from ..models import MedicineSchedule, ActivityLog
from ..middleware import user_type_required
from datetime import date

@method_decorator(csrf_exempt, name='dispatch')
class MarkMedicineTakenView(View):
    @user_type_required('patient')
    def post(self, request, schedule_id):
        try:
            schedule = MedicineSchedule.objects.get(
                id=schedule_id,
                medicine__prescription__patient=request.user
            )

            schedule.is_taken = True
            schedule.taken_at = datetime.now()
            schedule.save()

            ActivityLog.objects.create(
                user=request.user,
                action="Medicine taken",
                details=f"Medicine {schedule.medicine.name} marked as taken"
            )

            return JsonResponse({'message': 'Medicine marked as taken'})

        except MedicineSchedule.DoesNotExist:
            return JsonResponse({'error': 'Schedule not found'}, status=404)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)

@method_decorator(csrf_exempt, name='dispatch')
class HealthUpdateView(View):
    @user_type_required('patient')
    def post(self, request):
        try:
            data = json.loads(request.body)
            update_text = data.get('update_text')

            from ..models import HealthUpdate
            health_update = HealthUpdate.objects.create(
                patient=request.user,
                update_text=update_text
            )

            ActivityLog.objects.create(
                user=request.user,
                action="Health update posted",
                details=f"Health update: {update_text[:100]}..."
            )

            return JsonResponse({
                'update_id': str(health_update.id),
                'message': 'Health update posted successfully'
            })

        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)

    @user_type_required(['patient', 'doctor'])
    def get(self, request):
        try:
            from ..models import HealthUpdate
            updates = HealthUpdate.objects.filter(patient=request.user).order_by('-created_at')

            result = []
            for update in updates:
                result.append({
                    'id': str(update.id),
                    'update_text': update.update_text,
                    'created_at': update.created_at.isoformat()
                })

            return JsonResponse({'health_updates': result})

        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)


@method_decorator(csrf_exempt, name='dispatch')
class GetTodayMedicineView(View):
    @user_type_required('patient')
    def get(self, request):
        try:
            today = date.today()
            print(today)

            # Get schedules for this patient for today
            schedules = MedicineSchedule.objects.filter(
                scheduled_date=today,
                medicine__prescription__patient=request.user
            ).select_related("medicine")

            result = []
            for schedule in schedules:
                result.append({
                    "schedule_id": str(schedule.id),
                    "medicine_name": schedule.medicine.name,
                    "dosage": schedule.medicine.dosage,
                    "instructions": schedule.medicine.instructions,
                    "scheduled_time": schedule.scheduled_time.strftime("%I:%M %p"),
                    "is_taken": schedule.is_taken,
                    "taken_at": schedule.taken_at.isoformat() if schedule.taken_at else None,
                    "reminder_sent": schedule.reminder_sent
                })

            # Log activity
            ActivityLog.objects.create(
                user=request.user,
                action="Fetched today's medicines",
                details=f"Patient fetched {len(result)} medicines for {today}"
            )

            return JsonResponse({"today_medicines": result})

        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)

