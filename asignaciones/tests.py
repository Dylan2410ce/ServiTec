from django.test import TestCase

# Create your tests here.
from django.contrib.auth import get_user_model
from rest_framework.authtoken.models import Token
from clientes.models import Cliente
from servicios.models import Servicio
from solicitudes.models import Solicitud
from tecnicos.models import Tecnico
from .models import Asignacion


class AsignacionTests(TestCase):
    def setUp(self):
        usuario = get_user_model().objects.create_user(
            username='admin_prueba', is_staff=True, is_superuser=True
        )
        self.autorizacion = 'Token ' + Token.objects.create(user=usuario).key
        self.cliente = Cliente.objects.create(
            documento='CLI-001', nombre='Laura Mora',
            correo='laura@example.com', telefono='88880001'
        )
        self.servicio = Servicio.objects.create(
            codigo='SER-001', nombre='Mantenimiento', precio='25000.00'
        )
        self.tecnico = Tecnico.objects.create(
            identificacion='TEC-001', nombre='Daniel Rojas', correo='daniel@example.com'
        )
        self.tecnico.servicios.add(self.servicio)
        self.solicitud = Solicitud.objects.create(
            cliente=self.cliente, servicio=self.servicio,
            asunto='Equipo lento', descripcion='Revisar computadora'
        )
        self.datos = {
            'solicitud': self.solicitud.id,
            'tecnico': self.tecnico.id,
            'fecha_inicio': '2026-11-01T08:00:00-06:00',
            'fecha_fin': '2026-11-01T10:00:00-06:00',
            'notas': 'Atención presencial'
        }

    def test_crud_asignaciones(self):
        respuesta = self.client.post(
            '/api/asignaciones/', self.datos, content_type='application/json',
            HTTP_AUTHORIZATION=self.autorizacion
        )
        self.assertEqual(respuesta.status_code, 201)
        identificador = respuesta.json()['id']
        url = f'/api/asignaciones/{identificador}/'
        respuesta = self.client.get('/api/asignaciones/', HTTP_AUTHORIZATION=self.autorizacion)
        self.assertEqual(respuesta.status_code, 200)
        respuesta = self.client.get(url, HTTP_AUTHORIZATION=self.autorizacion)
        self.assertEqual(respuesta.status_code, 200)
        self.datos['notas'] = 'Confirmar asistencia'
        respuesta = self.client.put(
            url, self.datos, content_type='application/json',
            HTTP_AUTHORIZATION=self.autorizacion
        )
        self.assertEqual(respuesta.status_code, 200)
        respuesta = self.client.patch(
            url, {'notas': 'Asistencia confirmada'}, content_type='application/json',
            HTTP_AUTHORIZATION=self.autorizacion
        )
        self.assertEqual(respuesta.status_code, 200)
        self.assertEqual(Asignacion.objects.get(id=identificador).notas, 'Asistencia confirmada')
        respuesta = self.client.delete(url, HTTP_AUTHORIZATION=self.autorizacion)
        self.assertEqual(respuesta.status_code, 204)
        self.assertFalse(Asignacion.objects.filter(id=identificador).exists())

    def test_reglas_de_programacion_de_asignaciones(self):
        for fecha_fin in ['2026-11-01T08:00:00-06:00', '2026-11-01T07:00:00-06:00']:
            datos = self.datos.copy()
            datos['fecha_fin'] = fecha_fin
            respuesta = self.client.post(
                '/api/asignaciones/', datos, content_type='application/json',
                HTTP_AUTHORIZATION=self.autorizacion
            )
            self.assertEqual(respuesta.status_code, 400)
            self.assertIn('fecha_fin', respuesta.json())
        self.tecnico.activo = False
        self.tecnico.save()
        respuesta = self.client.post(
            '/api/asignaciones/', self.datos, content_type='application/json',
            HTTP_AUTHORIZATION=self.autorizacion
        )
        self.assertEqual(respuesta.status_code, 400)
        self.assertIn('tecnico', respuesta.json())
        self.tecnico.activo = True
        self.tecnico.save()
        otro_servicio = Servicio.objects.create(
            codigo='SER-002', nombre='Instalación', precio='10000.00'
        )
        self.tecnico.servicios.set([otro_servicio])
        respuesta = self.client.post(
            '/api/asignaciones/', self.datos, content_type='application/json',
            HTTP_AUTHORIZATION=self.autorizacion
        )
        self.assertEqual(respuesta.status_code, 400)
        self.assertIn('tecnico', respuesta.json())
        self.tecnico.servicios.set([self.servicio])
        respuesta = self.client.post(
            '/api/asignaciones/', self.datos, content_type='application/json',
            HTTP_AUTHORIZATION=self.autorizacion
        )
        self.assertEqual(respuesta.status_code, 201)
        respuesta = self.client.post(
            '/api/asignaciones/', self.datos, content_type='application/json',
            HTTP_AUTHORIZATION=self.autorizacion
        )
        self.assertEqual(respuesta.status_code, 400)
        self.assertIn('solicitud', respuesta.json())
        otra_solicitud = Solicitud.objects.create(
            cliente=self.cliente, servicio=self.servicio,
            asunto='Otra revisión', descripcion='Revisar otro equipo'
        )
        datos = self.datos.copy()
        datos['solicitud'] = otra_solicitud.id
        datos['fecha_inicio'] = '2026-11-01T09:00:00-06:00'
        datos['fecha_fin'] = '2026-11-01T11:00:00-06:00'
        respuesta = self.client.post(
            '/api/asignaciones/', datos, content_type='application/json',
            HTTP_AUTHORIZATION=self.autorizacion
        )
        self.assertEqual(respuesta.status_code, 400)
        self.assertIn('tecnico', respuesta.json())
        respuesta = self.client.patch(
            f'/api/tecnicos/{self.tecnico.id}/', {'activo': False},
            content_type='application/json', HTTP_AUTHORIZATION=self.autorizacion
        )
        self.assertEqual(respuesta.status_code, 400)
        respuesta = self.client.patch(
            f'/api/tecnicos/{self.tecnico.id}/', {'servicios': [otro_servicio.id]},
            content_type='application/json', HTTP_AUTHORIZATION=self.autorizacion
        )
        self.assertEqual(respuesta.status_code, 400)
        self.assertEqual(Asignacion.objects.count(), 1)

    def test_patch_y_borrado_de_asignacion_en_proceso(self):
        respuesta = self.client.post(
            '/api/asignaciones/', self.datos, content_type='application/json',
            HTTP_AUTHORIZATION=self.autorizacion
        )
        self.assertEqual(respuesta.status_code, 201)
        identificador = respuesta.json()['id']
        url = f'/api/asignaciones/{identificador}/'
        respuesta = self.client.patch(
            url, {'fecha_fin': '2026-11-01T07:00:00-06:00'},
            content_type='application/json', HTTP_AUTHORIZATION=self.autorizacion
        )
        self.assertEqual(respuesta.status_code, 400)
        self.assertIn('fecha_fin', respuesta.json())
        respuesta = self.client.patch(
            url, {'fecha_fin': '2026-11-01T11:00:00-06:00'},
            content_type='application/json', HTTP_AUTHORIZATION=self.autorizacion
        )
        self.assertEqual(respuesta.status_code, 200)
        respuesta = self.client.patch(
            url, {'notas': 'Nuevo horario confirmado'}, content_type='application/json',
            HTTP_AUTHORIZATION=self.autorizacion
        )
        self.assertEqual(respuesta.status_code, 200)
        otra_solicitud = Solicitud.objects.create(
            cliente=self.cliente, servicio=self.servicio,
            asunto='Otra revisión', descripcion='Revisar otro equipo'
        )
        respuesta = self.client.patch(
            url, {'solicitud': otra_solicitud.id}, content_type='application/json',
            HTTP_AUTHORIZATION=self.autorizacion
        )
        self.assertEqual(respuesta.status_code, 400)
        respuesta = self.client.patch(
            f'/api/solicitudes/{self.solicitud.id}/', {'estado': 'EN_PROCESO'},
            content_type='application/json', HTTP_AUTHORIZATION=self.autorizacion
        )
        self.assertEqual(respuesta.status_code, 200)
        respuesta = self.client.delete(url, HTTP_AUTHORIZATION=self.autorizacion)
        self.assertEqual(respuesta.status_code, 409)
        self.assertTrue(Asignacion.objects.filter(id=identificador).exists())
