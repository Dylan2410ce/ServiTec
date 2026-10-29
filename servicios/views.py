from django.shortcuts import render

# Create your views here.
from django.core.paginator import Paginator
from django.db.models import Q
from django.db.models.deletion import ProtectedError
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import Servicio
from .serializers import ServicioSerializer


def respuesta_paginada(queryset, page_number):
    paginator = Paginator(queryset, 5)
    page = paginator.get_page(page_number)
    serializer = ServicioSerializer(page.object_list, many=True)
    return Response({
        'pagina_actual': page.number,
        'total_paginas': paginator.num_pages,
        'total_registros': paginator.count,
        'resultados': serializer.data
    })


@api_view(['GET', 'POST'])
def servicios_api(request):
    if not request.user.is_authenticated:
        return Response({'detail': 'Autenticación requerida.'}, status=401)

    permiso = 'servicios.view_servicio'
    if request.method == 'POST':
        permiso = 'servicios.add_servicio'

    if not request.user.is_staff and not request.user.has_perm(permiso):
        return Response({'detail': 'No tiene permiso para esta operación.'}, status=403)

    if request.method == 'GET':
        registros = Servicio.objects.all()
        activo = request.query_params.get('activo')
        buscar = request.query_params.get('buscar')
        ordering = request.query_params.get('ordering', 'nombre')

        if activo is not None:
            if activo.lower() not in ['true', 'false']:
                return Response({'activo': 'Utilice true o false.'}, status=400)
            registros = registros.filter(activo=activo.lower() == 'true')

        if buscar:
            registros = registros.filter(Q(nombre__icontains=buscar) | Q(codigo__icontains=buscar))

        if ordering not in ['nombre', '-nombre', 'precio', '-precio']:
            return Response({'ordering': 'El campo de ordenamiento no es válido.'}, status=400)

        registros = registros.order_by(ordering, 'id')
        return respuesta_paginada(registros, request.query_params.get('page', 1))

    serializer = ServicioSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
def servicio_detalle_api(request, id):
    if not request.user.is_authenticated:
        return Response({'detail': 'Autenticación requerida.'}, status=401)

    permiso = 'servicios.view_servicio'
    if request.method in ['PUT', 'PATCH']:
        permiso = 'servicios.change_servicio'
    elif request.method == 'DELETE':
        permiso = 'servicios.delete_servicio'

    if not request.user.is_staff and not request.user.has_perm(permiso):
        return Response({'detail': 'No tiene permiso para esta operación.'}, status=403)

    try:
        registro = Servicio.objects.get(id=id)
    except Servicio.DoesNotExist:
        return Response({'error': 'Servicio no encontrado.'}, status=404)

    if request.method == 'GET':
        return Response(ServicioSerializer(registro).data)

    if request.method in ['PUT', 'PATCH']:
        serializer = ServicioSerializer(
            registro,
            data=request.data,
            partial=request.method == 'PATCH'
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    if registro.tecnicos.exists():
        return Response({'error': 'El servicio está relacionado con técnicos.'}, status=409)

    try:
        registro.delete()
    except ProtectedError:
        return Response({'error': 'El registro tiene relaciones que impiden eliminarlo.'}, status=409)
    return Response(status=status.HTTP_204_NO_CONTENT)
