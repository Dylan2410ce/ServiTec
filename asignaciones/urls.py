from django.urls import path
from . import views


urlpatterns = [
    path('', views.asignaciones_api, name='asignaciones_api'),
    path('<int:id>/', views.asignacion_detalle_api, name='asignacion_detalle_api'),
]
