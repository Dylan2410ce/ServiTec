from django.shortcuts import render

# Create your views here.
from django.core.paginator import Paginator
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import Asignacion
from .serializers import AsignacionSerializer


def respuesta_paginada(queryset, page_number):
    paginator = Paginator(queryset, 5)
    page = paginator.get_page(page_number)
    serializer = AsignacionSerializer(page.object_list, many=True)
    return Response({
        'pagina_actual': page.number,
        'total_paginas': paginator.num_pages,
        'total_registros': paginator.count,
        'resultados': serializer.data
    })


@api_view(['GET', 'POST'])
def asignaciones_api(request):
    if not request.user.is_authenticated:
        return Response({'detail': 'Autenticación requerida.'}, status=401)

    permiso = 'asignaciones.view_asignacion'
    if request.method == 'POST':
        permiso = 'asignaciones.add_asignacion'

    if not request.user.is_staff and not request.user.has_perm(permiso):
        return Response({'detail': 'No tiene permiso para esta operación.'}, status=403)

    if request.method == 'GET':
        asignaciones = Asignacion.objects.select_related(
            'tecnico', 'solicitud', 'solicitud__cliente', 'solicitud__servicio'
        )
        estado = request.query_params.get('estado')
        ordering = request.query_params.get('ordering', 'fecha_inicio')

        if estado is not None:
            estado = estado.upper()
            if estado not in ['PENDIENTE', 'EN_PROCESO', 'RESUELTA', 'CANCELADA']:
                return Response({'estado': 'El estado no es válido.'}, status=400)
            asignaciones = asignaciones.filter(solicitud__estado=estado)

        for campo in ['tecnico', 'solicitud', 'servicio']:
            valor = request.query_params.get(campo)
            if valor is not None:
                try:
                    identificador = int(valor)
                except (TypeError, ValueError):
                    return Response({campo: 'Debe enviar un ID numérico.'}, status=400)
                if identificador <= 0:
                    return Response({campo: 'El ID debe ser mayor que cero.'}, status=400)
                if campo == 'tecnico':
                    asignaciones = asignaciones.filter(tecnico_id=identificador)
                elif campo == 'solicitud':
                    asignaciones = asignaciones.filter(solicitud_id=identificador)
                else:
                    asignaciones = asignaciones.filter(solicitud__servicio_id=identificador)

        if ordering not in ['fecha_inicio', '-fecha_inicio']:
            return Response({'ordering': 'Utilice fecha_inicio o -fecha_inicio.'}, status=400)

        asignaciones = asignaciones.order_by(ordering, 'id')
        return respuesta_paginada(asignaciones, request.query_params.get('page', 1))

    serializer = AsignacionSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
def asignacion_detalle_api(request, id):
    if not request.user.is_authenticated:
        return Response({'detail': 'Autenticación requerida.'}, status=401)

    permiso = 'asignaciones.view_asignacion'
    if request.method in ['PUT', 'PATCH']:
        permiso = 'asignaciones.change_asignacion'
    elif request.method == 'DELETE':
        permiso = 'asignaciones.delete_asignacion'

    if not request.user.is_staff and not request.user.has_perm(permiso):
        return Response({'detail': 'No tiene permiso para esta operación.'}, status=403)

    try:
        asignacion = Asignacion.objects.select_related(
            'tecnico', 'solicitud', 'solicitud__cliente', 'solicitud__servicio'
        ).get(id=id)
    except Asignacion.DoesNotExist:
        return Response({'error': 'Asignación no encontrada.'}, status=404)

    if request.method == 'GET':
        return Response(AsignacionSerializer(asignacion).data)

    if request.method in ['PUT', 'PATCH']:
        serializer = AsignacionSerializer(
            asignacion,
            data=request.data,
            partial=request.method == 'PATCH'
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    if asignacion.solicitud.estado not in ['PENDIENTE', 'CANCELADA']:
        return Response({
            'error': 'No se puede eliminar la asignación de una solicitud en proceso o resuelta.'
        }, status=409)

    asignacion.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)
