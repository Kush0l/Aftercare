from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import RegexValidator
import uuid

class User(AbstractUser):
    USER_TYPE_CHOICES = (
        ('doctor', 'Doctor'),
        ('patient', 'Patient'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_type = models.CharField(max_length=10, choices=USER_TYPE_CHOICES)
    phone_regex = RegexValidator(regex=r'^\\+?1?\\d{9,15}$', message="Phone number must be entered in the format: '+999999999'.")
    phone_number = models.CharField(validators=[phone_regex], max_length=17, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'users'

class PatientProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='patient_profile')
    date_of_birth = models.DateField(null=True, blank=True)
    emergency_contact = models.CharField(max_length=17, blank=True)
    medical_history = models.TextField(blank=True)
    allergies = models.TextField(blank=True)

    class Meta:
        db_table = 'patient_profiles'

class DoctorProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='doctor_profile')
    specialization = models.CharField(max_length=100)
    license_number = models.CharField(max_length=50)
    hospital_affiliation = models.CharField(max_length=200, blank=True)

    class Meta:
        db_table = 'doctor_profiles'

class Prescription(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    doctor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='prescriptions_given')
    patient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='prescriptions_received')
    diagnosis = models.TextField()
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'prescriptions'

class Medicine(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    prescription = models.ForeignKey(Prescription, on_delete=models.CASCADE, related_name='medicines')
    name = models.CharField(max_length=200)
    dosage = models.CharField(max_length=100)
    instructions = models.TextField(blank=True)

    class Meta:
        db_table = 'medicines'

class MedicineSchedule(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    medicine = models.ForeignKey(Medicine, on_delete=models.CASCADE, related_name='schedules')
    scheduled_time = models.DateTimeField()
    scheduled_date = models.DateField()
    is_taken = models.BooleanField(default=False)
    taken_at = models.DateTimeField(null=True, blank=True)
    reminder_sent = models.BooleanField(default=False)

    class Meta:
        db_table = 'medicine_schedules'

class HealthUpdate(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    patient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='health_updates')
    update_text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'health_updates'

class ActivityLog(models.Model):
    LOG_LEVEL_CHOICES = (
        ('INFO', 'Info'),
        ('WARNING', 'Warning'),
        ('ERROR', 'Error'),
        ('DEBUG', 'Debug'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    timestamp = models.DateTimeField(auto_now_add=True)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    action = models.CharField(max_length=200)
    details = models.TextField(blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    log_level = models.CharField(max_length=10, choices=LOG_LEVEL_CHOICES, default='INFO')

    class Meta:
        db_table = 'activity_logs'
        ordering = ['-timestamp']

class PatientRevisit(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    patient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='revisits')
    doctor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='scheduled_revisits')
    prescription = models.ForeignKey(Prescription, on_delete=models.SET_NULL, null=True, blank=True, related_name='revisits')
    
    revisit_date = models.DateField()
    expected_condition = models.TextField(blank=True)
    actual_condition = models.TextField(blank=True)  # optional: doctor can update later
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'patient_revisits'
        ordering = ['-revisit_date']

