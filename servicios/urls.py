from django.urls import path
from . import views


urlpatterns = [
    path('', views.servicios_api, name='servicios_api'),
    path('<int:id>/', views.servicio_detalle_api, name='servicio_detalle_api'),
]
