from django.test import TestCase

# Create your tests here.

from django.contrib.auth import get_user_model
from rest_framework.authtoken.models import Token
from .models import Servicio


class ServicioTests(TestCase):
    def setUp(self):
        usuario = get_user_model().objects.create_user(
            username='admin_prueba', is_staff=True, is_superuser=True
        )
        self.autorizacion = 'Token ' + Token.objects.create(user=usuario).key

    def test_crud_servicios(self):
        datos = {
            'codigo': 'SER-001',
            'nombre': 'Mantenimiento',
            'descripcion': 'Revisión de equipos',
            'precio': '25000.00'
        }
        respuesta = self.client.post(
            '/api/servicios/', datos, content_type='application/json',
            HTTP_AUTHORIZATION=self.autorizacion
        )
        self.assertEqual(respuesta.status_code, 201)
        identificador = respuesta.json()['id']
        url = f'/api/servicios/{identificador}/'
        respuesta = self.client.get('/api/servicios/', HTTP_AUTHORIZATION=self.autorizacion)
        self.assertEqual(respuesta.status_code, 200)
        respuesta = self.client.get(url, HTTP_AUTHORIZATION=self.autorizacion)
        self.assertEqual(respuesta.status_code, 200)
        datos['nombre'] = 'Mantenimiento preventivo'
        respuesta = self.client.put(
            url, datos, content_type='application/json',
            HTTP_AUTHORIZATION=self.autorizacion
        )
        self.assertEqual(respuesta.status_code, 200)
        respuesta = self.client.patch(
            url, {'precio': '27000.00'}, content_type='application/json',
            HTTP_AUTHORIZATION=self.autorizacion
        )
        self.assertEqual(respuesta.status_code, 200)
        self.assertEqual(Servicio.objects.get(id=identificador).nombre, 'Mantenimiento preventivo')
        self.assertEqual(str(Servicio.objects.get(id=identificador).precio), '27000.00')
        respuesta = self.client.delete(url, HTTP_AUTHORIZATION=self.autorizacion)
        self.assertEqual(respuesta.status_code, 204)
        self.assertFalse(Servicio.objects.filter(id=identificador).exists())

    def test_precio_debe_ser_mayor_que_cero(self):
        servicio = Servicio.objects.create(codigo='SER-001', nombre='Soporte', precio='1000.00')
        for precio in ['0.00', '-1.00']:
            respuesta = self.client.patch(
                f'/api/servicios/{servicio.id}/', {'precio': precio},
                content_type='application/json', HTTP_AUTHORIZATION=self.autorizacion
            )
            self.assertEqual(respuesta.status_code, 400)
            self.assertIn('precio', respuesta.json())
        servicio.refresh_from_db()
        self.assertEqual(str(servicio.precio), '1000.00')

    def test_servicios_requieren_autenticacion(self):
        respuesta = self.client.get('/api/servicios/')
        self.assertEqual(respuesta.status_code, 401)
