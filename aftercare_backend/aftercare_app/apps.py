# aftercare_app/apps.py
from django.apps import AppConfig
import os
from django.conf import settings  # Add this import

class AftercareAppConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'aftercare_app'

    def ready(self):
        from django.conf import settings
        
        # Start the reminder service when Django starts
        if os.environ.get('RUN_MAIN') == 'true' or not settings.DEBUG:
            self.start_reminder_service()
    
    def start_reminder_service(self):
        try:
            from .services.reminder_service import reminder_service
            reminder_service.start()
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Failed to start reminder service: {e}")