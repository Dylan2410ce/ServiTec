from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.authtoken.models import Token
from clientes.models import Cliente
from servicios.models import Servicio
from .models import Solicitud


class SolicitudTests(TestCase):
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
        self.datos = {
            'cliente': self.cliente.id,
            'servicio': self.servicio.id,
            'asunto': 'Equipo lento',
            'descripcion': 'Revisar el rendimiento de la computadora',
            'prioridad': 'NORMAL'
        }

    def test_crud_solicitudes(self):
        respuesta = self.client.post(
            '/api/solicitudes/', self.datos, content_type='application/json',
            HTTP_AUTHORIZATION=self.autorizacion
        )
        self.assertEqual(respuesta.status_code, 201)
        self.assertEqual(respuesta.json()['estado'], 'PENDIENTE')
        identificador = respuesta.json()['id']
        url = f'/api/solicitudes/{identificador}/'
        respuesta = self.client.get('/api/solicitudes/', HTTP_AUTHORIZATION=self.autorizacion)
        self.assertEqual(respuesta.status_code, 200)
        respuesta = self.client.get(url, HTTP_AUTHORIZATION=self.autorizacion)
        self.assertEqual(respuesta.status_code, 200)
        self.datos['asunto'] = 'Revisión de computadora'
        respuesta = self.client.put(
            url, self.datos, content_type='application/json',
            HTTP_AUTHORIZATION=self.autorizacion
        )
        self.assertEqual(respuesta.status_code, 200)
        respuesta = self.client.patch(
            url, {'prioridad': 'ALTA'}, content_type='application/json',
            HTTP_AUTHORIZATION=self.autorizacion
        )
        self.assertEqual(respuesta.status_code, 200)
        solicitud = Solicitud.objects.get(id=identificador)
        self.assertEqual(solicitud.asunto, 'Revisión de computadora')
        self.assertEqual(solicitud.prioridad, 'ALTA')
        respuesta = self.client.delete(url, HTTP_AUTHORIZATION=self.autorizacion)
        self.assertEqual(respuesta.status_code, 204)
        self.assertFalse(Solicitud.objects.filter(id=identificador).exists())

    def test_solicitud_requiere_cliente_y_servicio_activos(self):
        self.cliente.activo = False
        self.cliente.save()
        respuesta = self.client.post(
            '/api/solicitudes/', self.datos, content_type='application/json',
            HTTP_AUTHORIZATION=self.autorizacion
        )
        self.assertEqual(respuesta.status_code, 400)
        self.assertIn('cliente', respuesta.json())
        self.cliente.activo = True
        self.cliente.save()
        self.servicio.activo = False
        self.servicio.save()
        respuesta = self.client.post(
            '/api/solicitudes/', self.datos, content_type='application/json',
            HTTP_AUTHORIZATION=self.autorizacion
        )
        self.assertEqual(respuesta.status_code, 400)
        self.assertIn('servicio', respuesta.json())
        self.assertEqual(Solicitud.objects.count(), 0)

    def test_patch_conserva_las_reglas_de_solicitud(self):
        solicitud = Solicitud.objects.create(
            cliente=self.cliente, servicio=self.servicio,
            asunto='Equipo lento', descripcion='Revisar computadora'
        )
        url = f'/api/solicitudes/{solicitud.id}/'
        respuesta = self.client.patch(
            url, {'estado': 'EN_PROCESO'}, content_type='application/json',
            HTTP_AUTHORIZATION=self.autorizacion
        )
        self.assertEqual(respuesta.status_code, 400)
        self.assertIn('estado', respuesta.json())
        respuesta = self.client.patch(
            f'/api/clientes/{self.cliente.id}/', {'activo': False},
            content_type='application/json', HTTP_AUTHORIZATION=self.autorizacion
        )
        self.assertEqual(respuesta.status_code, 400)
        respuesta = self.client.patch(
            f'/api/servicios/{self.servicio.id}/', {'activo': False},
            content_type='application/json', HTTP_AUTHORIZATION=self.autorizacion
        )
        self.assertEqual(respuesta.status_code, 400)
        self.servicio.activo = False
        self.servicio.save()
        respuesta = self.client.patch(
            url, {'asunto': 'Otro asunto'}, content_type='application/json',
            HTTP_AUTHORIZATION=self.autorizacion
        )
        self.assertEqual(respuesta.status_code, 400)
        self.assertIn('servicio', respuesta.json())
        self.servicio.activo = True
        self.servicio.save()
        respuesta = self.client.patch(
            url, {'estado': 'CANCELADA'}, content_type='application/json',
            HTTP_AUTHORIZATION=self.autorizacion
        )
        self.assertEqual(respuesta.status_code, 200)
        respuesta = self.client.patch(
            url, {'asunto': 'Cambio posterior al cierre'}, content_type='application/json',
            HTTP_AUTHORIZATION=self.autorizacion
        )
        self.assertEqual(respuesta.status_code, 400)
        solicitud.refresh_from_db()
        self.assertEqual(solicitud.estado, 'CANCELADA')
        self.assertEqual(solicitud.asunto, 'Equipo lento')
