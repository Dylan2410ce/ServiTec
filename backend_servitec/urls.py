"""
URL configuration for backend_servitec project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework.authtoken.views import obtain_auth_token
from solicitudes.views import resumen_api

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/token/', obtain_auth_token, name='api_token'),
    path('api/clientes/', include('clientes.urls')),
    path('api/servicios/', include('servicios.urls')),
    path('api/tecnicos/', include('tecnicos.urls')),
    path('api/solicitudes/', include('solicitudes.urls')),
    path('api/asignaciones/', include('asignaciones.urls')),
    path('api/reportes/resumen/', resumen_api, name='resumen_api'),
]
