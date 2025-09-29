# views/patient_views.py
import json
from django.core.mail import send_mail
from django.conf import settings
from django.http import JsonResponse
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from ..models import User, PatientProfile, ActivityLog
from ..middleware import user_type_required
import secrets
import string

def generate_random_password(length=12):
    characters = string.ascii_letters + string.digits
    return ''.join(secrets.choice(characters) for i in range(length))

@method_decorator(csrf_exempt, name='dispatch')
class PatientSearchCreateView(View):
    @user_type_required('doctor')
    def post(self, request):
        try:
            data = json.loads(request.body)
            email = data.get('email')
            first_name = data.get('first_name')
            last_name = data.get('last_name')
            phone_number = data.get('phone_number')

            # Search for existing patient
            patients = User.objects.filter(
                user_type='patient',
                email=email
            )

            if patients.exists():
                patient = patients.first()
                return JsonResponse({
                    'patient_exists': True,
                    'patient_id': str(patient.id),
                    'message': 'Patient found'
                })
            else:
                # Create new patient
                password = generate_random_password()
                username = f"patient_{email.split('@')[0]}"

                patient = User.objects.create_user(
                    username=username,
                    email=email,
                    password=password,
                    user_type='patient',
                    first_name=first_name,
                    last_name=last_name,
                    phone_number=phone_number
                )

                PatientProfile.objects.create(user=patient)

                # Send email with login credentials
                send_mail(
                    'Your Patient Account Created',
                    f'Hello {first_name},\\n\\nYour patient account has been created.\\n\\n'
                    f'Username: {username}\\nPassword: {password}\\n\\n'
                    f'Please login and change your password.',
                    settings.DEFAULT_FROM_EMAIL,
                    [email],
                    fail_silently=False,
                )

                ActivityLog.objects.create(
                    user=request.user,
                    action="Patient account created",
                    details=f"Doctor created patient account for {email}"
                )

                return JsonResponse({
                    'patient_exists': False,
                    'patient_id': str(patient.id),
                    'message': 'Patient account created successfully'
                })

        except Exception as e:
            ActivityLog.objects.create(
                user=request.user,
                action="Patient creation error",
                details=f"Error: {str(e)}",
                log_level='ERROR'
            )
            return JsonResponse({'error': str(e)}, status=400)
