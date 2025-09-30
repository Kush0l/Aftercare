# services/reminder_service.py
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone
from twilio.rest import Client
import logging
from ..models import MedicineSchedule, ActivityLog
import pytz

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

    # def send_scheduled_reminders(self):
    #     try:
    #         now = timezone.now()
    #         current_time = now.time()
    #         current_date = now.date()

    #         # Find schedules that need reminders
    #         schedules = MedicineSchedule.objects.filter(
    #             scheduled_date=current_date,
    #             scheduled_time__hour=current_time.hour,
    #             scheduled_time__minute=current_time.minute,
    #             reminder_sent=False,
    #             is_taken=False
    #         ).select_related('medicine__prescription__patient')

    #         for schedule in schedules:
    #             self.send_reminder(schedule)
    #             schedule.reminder_sent = True
    #             schedule.save()

    #     except Exception as e:
    #         logger.error(f"Error sending reminders: {str(e)}")


    # def send_scheduled_reminders(self):
    #     try:
    #         now = timezone.now()
    #         logger.info(f"Checking reminders at: {now}")
            
    #         current_time = now.time()
    #         current_date = now.date()
            
    #         schedules = MedicineSchedule.objects.filter(
    #             scheduled_date=current_date,
    #             scheduled_time__hour=current_time.hour,
    #             scheduled_time__minute=current_time.minute,
    #             reminder_sent=False,
    #             is_taken=False
    #         ).select_related('medicine__prescription__patient')
            
    #         logger.info(f"Found {schedules.count()} schedules needing reminders")
            
    #         for schedule in schedules:
    #             logger.info(f"Sending reminder for schedule: {schedule.id}, medicine: {schedule.medicine.name}")
    #             self.send_reminder(schedule)
    #             schedule.reminder_sent = True
    #             schedule.save()
                
    #     except Exception as e:
    #         logger.error(f"Error sending reminders: {str(e)}", exc_info=True)

# ---------------------------------------------------------------------

#     def send_scheduled_reminders(self):
#         try:
#             # Get current IST time
#             ist = pytz.timezone("Asia/Kolkata")
#             now = timezone.localtime(timezone.now(), ist)
#             logger.info(f"Checking reminders at (IST): {now}")

#             current_time = now.time()
#             current_date = now.date()

#             schedules = MedicineSchedule.objects.filter(
#                 scheduled_date=current_date,
#                 scheduled_time__hour=current_time.hour,
#                 scheduled_time__minute=current_time.minute,
#                 reminder_sent=False,
#                 is_taken=False
#             ).select_related('medicine__prescription__patient')

#             logger.info(f"Found {schedules.count()} schedules needing reminders")

#             for schedule in schedules:
#                 logger.info(f"Sending reminder for schedule: {schedule.id}, medicine: {schedule.medicine.name}")
#                 self.send_reminder(schedule)
#                 schedule.reminder_sent = True
#                 schedule.save()

#         except Exception as e:
#             logger.error(f"Error sending reminders: {str(e)}", exc_info=True)


#     def send_reminder(self, schedule):
#         patient = schedule.medicine.prescription.patient
#         medicine = schedule.medicine

#         # Generate tracking link
#         # tracking_link = f"{settings.BASE_URL}/api/medicine/mark-taken/{schedule.id}"
#         tracking_link = f"/api/medicine/mark-taken/{schedule.id}"

#         # Email reminder
#         email_subject = f"Medication Reminder: {medicine.name}"
#         email_body = f"""
#         Hello {patient.first_name},

#         It's time to take your medication:

#         Medicine: {medicine.name}
#         Dosage: {medicine.dosage}
#         Instructions: {medicine.instructions}
#         Scheduled Time: {schedule.scheduled_time.strftime('%I:%M %p')}

#         Please click the link below to confirm you've taken your medicine:
#         {tracking_link}

#         Thank you,
#         Your Healthcare Team
#         """

#         try:
#             send_mail(
#                 email_subject,
#                 email_body,
#                 settings.DEFAULT_FROM_EMAIL,
#                 [patient.email],
#                 fail_silently=False,
#             )
#         except Exception as e:
#             logger.error(f"Failed to send email to {patient.email}: {str(e)}")

#         # SMS reminder
#         if patient.phone_number:
#             sms_body = f"Medication Reminder: {medicine.name} - {medicine.dosage}. Confirm: {tracking_link}"

#             try:
#                 self.twilio_client.messages.create(
#                     body=sms_body,
#                     from_=settings.TWILIO_PHONE_NUMBER,
#                     to=patient.phone_number
#                 )
#             except Exception as e:
#                 logger.error(f"Failed to send SMS to {patient.phone_number}: {str(e)}")

#         # Log the reminder
#         ActivityLog.objects.create(
#             user=patient,
#             action="Medication reminder sent",
#             details=f"Reminder sent for {medicine.name}"
#         )

# # Singleton instance
# reminder_service = ReminderService()


# ------------------------------------------------------------

# services/reminder_service.py
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone
from twilio.rest import Client
import logging
import pytz
from ..models import MedicineSchedule, ActivityLog

logger = logging.getLogger(__name__)


class ReminderService:
    def __init__(self):
        self.scheduler = BackgroundScheduler(timezone=pytz.UTC)  # APScheduler runs in UTC
        self.twilio_client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)

    def start(self):
        """Start the background scheduler to check reminders every minute"""
        self.scheduler.add_job(
            self.send_scheduled_reminders,
            trigger=CronTrigger(minute="*"),
            id="medication_reminders",
            max_instances=1,
            replace_existing=True,
        )
        self.scheduler.start()
        logger.info("✅ Reminder service started")

    def send_scheduled_reminders(self):
        try:
            # Always get current IST time
            ist = pytz.timezone("Asia/Kolkata")
            now_utc = timezone.now()  # UTC now
            now_ist = now_utc.astimezone(ist)

            logger.info(f"⏰ Checking reminders at (IST): {now_ist}")

            current_date = now_ist.date()
            current_hour = now_ist.hour
            current_minute = now_ist.minute

            # Match only schedules due at this exact date & time
            schedules = MedicineSchedule.objects.filter(
                scheduled_date=current_date,
                scheduled_time__hour=current_hour,
                scheduled_time__minute=current_minute,
                reminder_sent=False,
                is_taken=False,
            ).select_related("medicine__prescription__patient")

            logger.info(f"📌 Found {schedules.count()} schedules needing reminders")

            for schedule in schedules:
                logger.info(
                    f"📤 Sending reminder for schedule ID: {schedule.id}, medicine: {schedule.medicine.name}"
                )
                self.send_reminder(schedule)
                schedule.reminder_sent = True
                schedule.save()

        except Exception as e:
            logger.error(f"❌ Error sending reminders: {str(e)}", exc_info=True)

    def send_reminder(self, schedule):
        """Send Email + SMS reminders to patient"""
        patient = schedule.medicine.prescription.patient
        medicine = schedule.medicine

        # Tracking link (replace BASE_URL when deployed)
        # tracking_link = f"{settings.BASE_URL}/api/medicine/mark-taken/{schedule.id}"
        tracking_link = f"/api/medicine/mark-taken/{schedule.id}"

        # Email reminder
        email_subject = f"💊 Medication Reminder: {medicine.name}"
        email_body = f"""
        Hello {patient.first_name},

        It's time to take your medication:

        Medicine: {medicine.name}
        Dosage: {medicine.dosage}
        Instructions: {medicine.instructions}
        Scheduled Time: {timezone.localtime(schedule.scheduled_time, pytz.timezone("Asia/Kolkata")).strftime('%I:%M %p')}

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
            logger.info(f"📧 Email sent to {patient.email}")
        except Exception as e:
            logger.error(f"❌ Failed to send email to {patient.email}: {str(e)}")

        # SMS reminder
        if patient.phone_number:
            sms_body = f"💊 Reminder: {medicine.name} ({medicine.dosage}). Confirm: {tracking_link}"
            try:
                self.twilio_client.messages.create(
                    body=sms_body,
                    from_=settings.TWILIO_PHONE_NUMBER,
                    to=patient.phone_number,
                )
                logger.info(f"📱 SMS sent to {patient.phone_number}")
            except Exception as e:
                logger.error(f"❌ Failed to send SMS to {patient.phone_number}: {str(e)}")

        # Log reminder in DB
        ActivityLog.objects.create(
            user=patient,
            action="Medication reminder sent",
            details=f"Reminder sent for {medicine.name}",
        )


# Singleton instance
reminder_service = ReminderService()

