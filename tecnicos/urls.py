from django.urls import path
from . import views


urlpatterns = [
    path('', views.tecnicos_api, name='tecnicos_api'),
    path('<int:id>/', views.tecnico_detalle_api, name='tecnico_detalle_api'),
]
