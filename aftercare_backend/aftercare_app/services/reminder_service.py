# services/reminder_service.py
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone
from twilio.rest import Client
import logging
from ..models import MedicineSchedule, ActivityLog

logger = logging.getLogger(__name__)

class ReminderService:
    def __init__(self):
        self.scheduler = BackgroundScheduler()
        self.twilio_client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)

    def start(self):
        # Schedule reminder check every minute
        self.scheduler.add_job(
            self.send_scheduled_reminders,
            trigger=CronTrigger(minute='*'),
            id='medication_reminders',
            max_instances=1,
            replace_existing=True
        )

        self.scheduler.start()
        logger.info("Reminder service started")

    def send_scheduled_reminders(self):
        try:
            now = timezone.now()
            current_time = now.time()
            current_date = now.date()

            # Find schedules that need reminders
            schedules = MedicineSchedule.objects.filter(
                scheduled_date=current_date,
                scheduled_time__hour=current_time.hour,
                scheduled_time__minute=current_time.minute,
                reminder_sent=False,
                is_taken=False
            ).select_related('medicine__prescription__patient')

            for schedule in schedules:
                self.send_reminder(schedule)
                schedule.reminder_sent = True
                schedule.save()

        except Exception as e:
            logger.error(f"Error sending reminders: {str(e)}")

    def send_reminder(self, schedule):
        patient = schedule.medicine.prescription.patient
        medicine = schedule.medicine

        # Generate tracking link
        tracking_link = f"{settings.BASE_URL}/api/medicine/mark-taken/{schedule.id}"

        # Email reminder
        email_subject = f"Medication Reminder: {medicine.name}"
        email_body = f"""
        Hello {patient.first_name},

        It's time to take your medication:

        Medicine: {medicine.name}
        Dosage: {medicine.dosage}
        Instructions: {medicine.instructions}
        Scheduled Time: {schedule.scheduled_time.strftime('%I:%M %p')}

        Please click the link below to confirm you've taken your medicine:
        {tracking_link}

        Thank you,
        Your Healthcare Team
        """

        try:
            send_mail(
                email_subject,
                email_body,
                settings.DEFAULT_FROM_EMAIL,
                [patient.email],
                fail_silently=False,
            )
        except Exception as e:
            logger.error(f"Failed to send email to {patient.email}: {str(e)}")

        # SMS reminder
        if patient.phone_number:
            sms_body = f"Medication Reminder: {medicine.name} - {medicine.dosage}. Confirm: {tracking_link}"

            try:
                self.twilio_client.messages.create(
                    body=sms_body,
                    from_=settings.TWILIO_PHONE_NUMBER,
                    to=patient.phone_number
                )
            except Exception as e:
                logger.error(f"Failed to send SMS to {patient.phone_number}: {str(e)}")

        # Log the reminder
        ActivityLog.objects.create(
            user=patient,
            action="Medication reminder sent",
            details=f"Reminder sent for {medicine.name}"
        )

# Singleton instance
reminder_service = ReminderService()
