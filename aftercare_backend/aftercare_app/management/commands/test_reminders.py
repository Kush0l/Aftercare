# management/commands/test_reminders.py
from django.core.management.base import BaseCommand
from aftercare_app.services.reminder_service import reminder_service

class Command(BaseCommand):
    help = 'Test the reminder service'
    
    def handle(self, *args, **options):
        self.stdout.write('Testing reminder service...')
        reminder_service.send_scheduled_reminders()
        self.stdout.write('Reminder test completed')