from django.urls import path
from . import views


urlpatterns = [
    path('', views.solicitudes_api, name='solicitudes_api'),
    path('<int:id>/', views.solicitud_detalle_api, name='solicitud_detalle_api'),
]
