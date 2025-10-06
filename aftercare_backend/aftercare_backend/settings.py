from pathlib import Path
import dj_database_url
import environ
import os

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = 'django-insecure-6yop7)acir@lh_r8dzs-$99hq_52!!2$x*er3%u2hkbiqlx5d='
DEBUG = True
ALLOWED_HOSTS = []

# Apps
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',   # ✅ only once
    'aftercare_app',
    "corsheaders",
    
]

AUTH_USER_MODEL = 'aftercare_app.User'

# Middleware
MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",  # ✅ must be first
    "django.middleware.common.CommonMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "aftercare_app.middleware.UserTypeMiddleware",
    "aftercare_app.middleware.LoggingMiddleware",
]

# CORS (development setup)
CORS_ALLOW_ALL_ORIGINS = True   # ✅ simplest for dev

# If you prefer only Vite:
# CORS_ALLOWED_ORIGINS = ["http://localhost:5173"]

CORS_ALLOW_HEADERS = [
    "authorization",
    "content-type",
]

ROOT_URLCONF = 'aftercare_backend.urls'

CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",  # React frontend URL
]


TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'aftercare_backend.wsgi.application'

# Env + Database
env = environ.Env()
environ.Env.read_env(os.path.join(BASE_DIR, ".env"))

DATABASES = {
    'default': dj_database_url.parse(env("DATABASE_URL"))
}

# Password validators
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# i18n
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Asia/Kolkata'
USE_I18N = True
USE_TZ = True

# Static
STATIC_URL = 'static/'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Logging
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': 'logs/application.log',
        },
        'console': {
            'level': 'DEBUG',
            'class': 'logging.StreamHandler',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['file', 'console'],
            'level': 'INFO',
            'propagate': True,
        },
    },
}
os.makedirs('logs', exist_ok=True)

# JWT
JWT_SECRET_KEY = SECRET_KEY

# Twilio
TWILIO_ACCOUNT_SID = env('TWILIO_ACCOUNT_SID')
TWILIO_AUTH_TOKEN = env('TWILIO_AUTH_TOKEN')
TWILIO_PHONE_NUMBER = env('TWILIO_PHONE_NUMBER')

# Email
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = env('EMAIL_HOST')
EMAIL_PORT = env('EMAIL_PORT')
EMAIL_USE_TLS = True
EMAIL_HOST_USER = env('EMAIL_HOST_USER')
EMAIL_HOST_PASSWORD = env('EMAIL_HOST_PASSWORD')
DEFAULT_FROM_EMAIL = EMAIL_HOST_USER