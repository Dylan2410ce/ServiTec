from django.test import TestCase

# Create your tests here.

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group, Permission
from rest_framework.authtoken.models import Token
from .models import Cliente


class ClienteTests(TestCase):
    def setUp(self):
        usuario = get_user_model().objects.create_user(
            username='admin_prueba', is_staff=True, is_superuser=True
        )
        self.autorizacion = 'Token ' + Token.objects.create(user=usuario).key

    def test_crud_clientes(self):
        datos = {
            'documento': 'CLI-001',
            'nombre': 'Laura Mora',
            'correo': 'laura@example.com',
            'telefono': '88880001'
        }
        respuesta = self.client.post(
            '/api/clientes/', datos, content_type='application/json',
            HTTP_AUTHORIZATION=self.autorizacion
        )
        self.assertEqual(respuesta.status_code, 201)
        identificador = respuesta.json()['id']
        url = f'/api/clientes/{identificador}/'
        respuesta = self.client.get('/api/clientes/', HTTP_AUTHORIZATION=self.autorizacion)
        self.assertEqual(respuesta.status_code, 200)
        respuesta = self.client.get(url, HTTP_AUTHORIZATION=self.autorizacion)
        self.assertEqual(respuesta.status_code, 200)
        datos['nombre'] = 'Laura Mora Vargas'
        respuesta = self.client.put(
            url, datos, content_type='application/json',
            HTTP_AUTHORIZATION=self.autorizacion
        )
        self.assertEqual(respuesta.status_code, 200)
        respuesta = self.client.patch(
            url, {'telefono': '88889999'}, content_type='application/json',
            HTTP_AUTHORIZATION=self.autorizacion
        )
        self.assertEqual(respuesta.status_code, 200)
        cliente = Cliente.objects.get(id=identificador)
        self.assertEqual(cliente.nombre, 'Laura Mora Vargas')
        self.assertEqual(cliente.telefono, '88889999')
        respuesta = self.client.delete(url, HTTP_AUTHORIZATION=self.autorizacion)
        self.assertEqual(respuesta.status_code, 204)
        self.assertFalse(Cliente.objects.filter(id=identificador).exists())
        respuesta = self.client.get(url, HTTP_AUTHORIZATION=self.autorizacion)
        self.assertEqual(respuesta.status_code, 404)

    def test_consulta_no_puede_crear_clientes(self):
        usuario = get_user_model().objects.create_user(username='consulta_prueba')
        grupo, creado = Group.objects.get_or_create(name='Consulta')
        permiso = Permission.objects.get(
            content_type__app_label='clientes', codename='view_cliente'
        )
        grupo.permissions.add(permiso)
        usuario.groups.add(grupo)
        autorizacion = 'Token ' + Token.objects.create(user=usuario).key
        respuesta = self.client.get('/api/clientes/', HTTP_AUTHORIZATION=autorizacion)
        self.assertEqual(respuesta.status_code, 200)
        respuesta = self.client.post(
            '/api/clientes/', {
                'documento': 'CLI-002',
                'nombre': 'Otro cliente',
                'correo': 'otro@example.com',
                'telefono': '88880002'
            }, content_type='application/json', HTTP_AUTHORIZATION=autorizacion
        )
        self.assertEqual(respuesta.status_code, 403)

    def test_paginacion_y_filtro_de_clientes(self):
        for numero in range(7):
            Cliente.objects.create(
                documento=f'CLI-{numero}', nombre=f'Cliente {numero}',
                correo=f'cliente{numero}@example.com', telefono='88880000'
            )
        respuesta = self.client.get(
            '/api/clientes/?page=1', HTTP_AUTHORIZATION=self.autorizacion
        )
        self.assertEqual(respuesta.status_code, 200)
        self.assertEqual(respuesta.json()['total_registros'], 7)
        self.assertEqual(respuesta.json()['total_paginas'], 2)
        self.assertEqual(len(respuesta.json()['resultados']), 5)
        respuesta = self.client.get(
            '/api/clientes/?page=2', HTTP_AUTHORIZATION=self.autorizacion
        )
        self.assertEqual(respuesta.status_code, 200)
        self.assertEqual(respuesta.json()['pagina_actual'], 2)
        self.assertEqual(len(respuesta.json()['resultados']), 2)
        respuesta = self.client.get(
            '/api/clientes/', {'activo': 'true', 'buscar': 'Cliente 6'},
            HTTP_AUTHORIZATION=self.autorizacion
        )
        self.assertEqual(respuesta.status_code, 200)
        self.assertEqual(respuesta.json()['total_registros'], 1)
        self.assertEqual(respuesta.json()['resultados'][0]['nombre'], 'Cliente 6')
