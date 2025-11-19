from django.urls import path
from . import views

app_name = 'document_detection'

urlpatterns = [
    # Endpoints principales
    path('detect-document/', views.detect_document, name='detect_document'),
    path('crop-document/', views.crop_document, name='crop_document'),
    path('health/', views.health_check, name='health'),
    
    # Endpoint simple para planillas
    path('planillas/', views.upload_planilla, name='upload_planilla'),
    
    # Endpoints de información
    path('history/', views.processing_history, name='processing_history'),
    path('statistics/', views.statistics, name='statistics'),
]