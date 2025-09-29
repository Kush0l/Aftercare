from django.apps import AppConfig
import os

class AftercareAppConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'aftercare_app'

    def ready(self):
        # Start the reminder service when Django starts
        if not os.environ.get('RUN_MAIN'):
            return

        from .services.reminder_service import reminder_service
        reminder_service.start()
