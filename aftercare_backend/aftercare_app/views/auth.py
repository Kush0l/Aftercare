# views/auth.py
import jwt
import datetime
from django.conf import settings
from django.contrib.auth import authenticate
from django.core.mail import send_mail
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.views import View
import json
import secrets
import string
from ..models import User, DoctorProfile, PatientProfile, ActivityLog

@method_decorator(csrf_exempt, name='dispatch')
class DoctorRegisterView(View):
    def post(self, request):
        try:
            data = json.loads(request.body)
            username = data.get('username')
            email = data.get('email')
            password = data.get('password')
            phone_number = data.get('phone_number')
            specialization = data.get('specialization')
            license_number = data.get('license_number')
            first_name = data.get('first_name')
            last_name = data.get('last_name')
            hospital_affiliation = data.get('hospital_affiliation')

            if User.objects.filter(username=username).exists():
                return JsonResponse({'error': 'Username already exists'}, status=400)

            if User.objects.filter(email=email).exists():
                return JsonResponse({'error': 'Email already exists'}, status=400)

            # Create user with all available fields
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                user_type='doctor',
                phone_number=phone_number,
                first_name=first_name or '',  # Handle optional fields
                last_name=last_name or ''     # Handle optional fields
            )

            # Create doctor profile
            DoctorProfile.objects.create(
                user=user,
                specialization=specialization,
                license_number=license_number,
                hospital_affiliation=hospital_affiliation or ''  # Handle optional field
            )

            ActivityLog.objects.create(
                user=user,
                action="Doctor registration",
                details=f"Doctor {username} registered successfully"
            )

            return JsonResponse({'message': 'Doctor registered successfully'}, status=201)

        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)

@method_decorator(csrf_exempt, name='dispatch')
class LoginView(View):
    def post(self, request):
        try:
            data = json.loads(request.body)
            username = data.get('username')
            password = data.get('password')

            user = authenticate(username=username, password=password)
            if not user:
                return JsonResponse({'error': 'Invalid credentials'}, status=401)

            payload = {
                'user_id': str(user.id),
                'user_type': user.user_type,
                'exp': datetime.datetime.utcnow() + datetime.timedelta(days=7),
                'iat': datetime.datetime.utcnow()
            }

            token = jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')

            ActivityLog.objects.create(
                user=user,
                action="User login",
                details=f"User {username} logged in successfully"
            )

            return JsonResponse({
                'token': token,
                'user_type': user.user_type,
                'user_id': str(user.id)
            })

        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
