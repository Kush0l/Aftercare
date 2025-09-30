# management/commands/debug_reminders.py
from django.core.management.base import BaseCommand
from django.utils import timezone
from aftercare_app.models import MedicineSchedule, User, Prescription, Medicine
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Debug reminder service issues'
    
    def handle(self, *args, **options):
        self.stdout.write("=== DEBUG REMINDER SERVICE ===")
        
        # Check current time
        now = timezone.now()
        self.stdout.write(f"Current time: {now}")
        self.stdout.write(f"Current date: {now.date()}")
        self.stdout.write(f"Current time (time only): {now.time()}")
        
        # Check what schedules exist
        all_schedules = MedicineSchedule.objects.all()
        self.stdout.write(f"\nTotal schedules in database: {all_schedules.count()}")
        
        for schedule in all_schedules:
            self.stdout.write(f"\nSchedule ID: {schedule.id}")
            self.stdout.write(f"Medicine: {schedule.medicine.name}")
            self.stdout.write(f"Scheduled time: {schedule.scheduled_time}")
            self.stdout.write(f"Scheduled date: {schedule.scheduled_date}")
            self.stdout.write(f"Timezone aware: {not timezone.is_naive(schedule.scheduled_time)}")
            self.stdout.write(f"Reminder sent: {schedule.reminder_sent}")
            self.stdout.write(f"Is taken: {schedule.is_taken}")
        
        # Check for schedules that should trigger now
        current_time = now.time()
        current_date = now.date()
        
        matching_schedules = MedicineSchedule.objects.filter(
            scheduled_date=current_date,
            scheduled_time__hour=current_time.hour,
            scheduled_time__minute=current_time.minute,
            reminder_sent=False,
            is_taken=False
        )
        
        self.stdout.write(f"\nSchedules matching current time: {matching_schedules.count()}")
        
        for schedule in matching_schedules:
            self.stdout.write(f"MATCH: {schedule.medicine.name} at {schedule.scheduled_time}")