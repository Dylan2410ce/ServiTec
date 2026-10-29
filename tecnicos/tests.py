from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group, Permission
from django.test import TestCase
from rest_framework.authtoken.models import Token
from servicios.models import Servicio
from .models import Tecnico


class TecnicoTests(TestCase):
    def setUp(self):
        usuario = get_user_model().objects.create_user(
            username='admin_prueba', is_staff=True, is_superuser=True
        )
        self.autorizacion = 'Token ' + Token.objects.create(user=usuario).key
        self.servicio = Servicio.objects.create(
            codigo='SER-001', nombre='Mantenimiento', precio='25000.00'
        )

    def test_crud_tecnicos(self):
        datos = {
            'identificacion': 'TEC-001',
            'nombre': 'Daniel Rojas',
            'correo': 'daniel@example.com',
            'servicios': [self.servicio.id]
        }
        respuesta = self.client.post(
            '/api/tecnicos/', datos, content_type='application/json',
            HTTP_AUTHORIZATION=self.autorizacion
        )
        self.assertEqual(respuesta.status_code, 201)
        identificador = respuesta.json()['id']
        url = f'/api/tecnicos/{identificador}/'
        respuesta = self.client.get('/api/tecnicos/', HTTP_AUTHORIZATION=self.autorizacion)
        self.assertEqual(respuesta.status_code, 200)
        respuesta = self.client.get(url, HTTP_AUTHORIZATION=self.autorizacion)
        self.assertEqual(respuesta.status_code, 200)
        datos['nombre'] = 'Daniel Rojas Soto'
        respuesta = self.client.put(
            url, datos, content_type='application/json',
            HTTP_AUTHORIZATION=self.autorizacion
        )
        self.assertEqual(respuesta.status_code, 200)
        respuesta = self.client.patch(
            url, {'correo': 'daniel.rojas@example.com'}, content_type='application/json',
            HTTP_AUTHORIZATION=self.autorizacion
        )
        self.assertEqual(respuesta.status_code, 200)
        tecnico = Tecnico.objects.get(id=identificador)
        self.assertEqual(tecnico.nombre, 'Daniel Rojas Soto')
        self.assertEqual(tecnico.correo, 'daniel.rojas@example.com')
        self.assertTrue(tecnico.servicios.filter(id=self.servicio.id).exists())
        respuesta = self.client.delete(url, HTTP_AUTHORIZATION=self.autorizacion)
        self.assertEqual(respuesta.status_code, 204)
        self.assertFalse(Tecnico.objects.filter(id=identificador).exists())

    def test_tecnico_debe_tener_al_menos_un_servicio(self):
        respuesta = self.client.post(
            '/api/tecnicos/', {
                'identificacion': 'TEC-001',
                'nombre': 'Daniel Rojas',
                'correo': 'daniel@example.com',
                'servicios': []
            }, content_type='application/json', HTTP_AUTHORIZATION=self.autorizacion
        )
        self.assertEqual(respuesta.status_code, 400)
        self.assertIn('servicios', respuesta.json())
        tecnico = Tecnico.objects.create(
            identificacion='TEC-001', nombre='Daniel Rojas', correo='daniel@example.com'
        )
        tecnico.servicios.add(self.servicio)
        respuesta = self.client.patch(
            f'/api/tecnicos/{tecnico.id}/', {'servicios': []},
            content_type='application/json', HTTP_AUTHORIZATION=self.autorizacion
        )
        self.assertEqual(respuesta.status_code, 400)
        self.assertTrue(tecnico.servicios.filter(id=self.servicio.id).exists())

    def test_operador_puede_consultar_tecnicos(self):
        usuario = get_user_model().objects.create_user(username='operador_prueba')
        grupo, creado = Group.objects.get_or_create(name='Operador')
        permiso = Permission.objects.get(
            content_type__app_label='tecnicos', codename='view_tecnico'
        )
        grupo.permissions.add(permiso)
        usuario.groups.add(grupo)
        autorizacion = 'Token ' + Token.objects.create(user=usuario).key
        respuesta = self.client.get('/api/tecnicos/', HTTP_AUTHORIZATION=autorizacion)
        self.assertEqual(respuesta.status_code, 200)

