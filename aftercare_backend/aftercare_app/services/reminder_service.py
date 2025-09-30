from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone
from twilio.rest import Client
import logging
import pytz
from collections import defaultdict
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
            ist = pytz.timezone("Asia/Kolkata")
            now_utc = timezone.now()
            now_ist = now_utc.astimezone(ist)

            logger.info(f"⏰ Checking reminders at (IST): {now_ist}")

            current_date = now_ist.date()
            current_hour = now_ist.hour
            current_minute = now_ist.minute

            # Fetch all schedules due now
            schedules = MedicineSchedule.objects.filter(
                scheduled_date=current_date,
                scheduled_time__hour=current_hour,
                scheduled_time__minute=current_minute,
                reminder_sent=False,
                is_taken=False,
            ).select_related("medicine__prescription__patient")

            logger.info(f"📌 Found {schedules.count()} schedules needing reminders")

            # Group schedules by patient & scheduled_time
            grouped = defaultdict(list)
            for schedule in schedules:
                key = (schedule.medicine.prescription.patient.id, schedule.scheduled_time)
                grouped[key].append(schedule)

            # Send one notification per group
            for (patient_id, scheduled_time), group_schedules in grouped.items():
                self.send_grouped_reminder(group_schedules)
                # Mark all as sent
                for schedule in group_schedules:
                    schedule.reminder_sent = True
                    schedule.save()

        except Exception as e:
            logger.error(f"❌ Error sending reminders: {str(e)}", exc_info=True)

    def send_grouped_reminder(self, schedules):
        """Send a single reminder for all medicines at the same time"""
        if not schedules:
            return

        patient = schedules[0].medicine.prescription.patient
        ist = pytz.timezone("Asia/Kolkata")
        scheduled_time_ist = timezone.localtime(schedules[0].scheduled_time, ist)

        # Build medicine list
        medicines_list = "\n".join(
            [f"- {s.medicine.name} ({s.medicine.dosage})" for s in schedules]
        )

        # Email
        email_subject = f"💊 Medication Reminder ({scheduled_time_ist.strftime('%I:%M %p')})"
        email_body = f"""
        Hello {patient.first_name},

        It's time to take your medications scheduled for {scheduled_time_ist.strftime('%I:%M %p')}:

        {medicines_list}

        Please click the links below to confirm:
        """ + "\n".join(
            [f"/api/medicine/mark-taken/{s.id} - {s.medicine.name}" for s in schedules]
        ) + """

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
            logger.info(f"📧 Grouped email sent to {patient.email}")
        except Exception as e:
            logger.error(f"❌ Failed to send email to {patient.email}: {str(e)}")

        # SMS
        if patient.phone_number:
            sms_body = f"💊 Reminder {scheduled_time_ist.strftime('%I:%M %p')}: " + ", ".join(
                [f"{s.medicine.name} ({s.medicine.dosage})" for s in schedules]
            )
            try:
                self.twilio_client.messages.create(
                    body=sms_body,
                    from_=settings.TWILIO_PHONE_NUMBER,
                    to=patient.phone_number,
                )
                logger.info(f"📱 Grouped SMS sent to {patient.phone_number}")
            except Exception as e:
                logger.error(f"❌ Failed to send SMS to {patient.phone_number}: {str(e)}")

        # Log
        ActivityLog.objects.create(
            user=patient,
            action="Medication reminder sent",
            details=f"Grouped reminder sent for {len(schedules)} medicines at {scheduled_time_ist}",
        )

# Singleton instance
reminder_service = ReminderService()
