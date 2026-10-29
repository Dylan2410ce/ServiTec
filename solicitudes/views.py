from django.core.paginator import Paginator
from django.db.models import Count, Q
from django.db.models.deletion import ProtectedError
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from servicios.models import Servicio
from tecnicos.models import Tecnico
from .models import Solicitud
from .serializers import SolicitudSerializer


def respuesta_paginada(queryset, page_number):
    paginator = Paginator(queryset, 5)
    page = paginator.get_page(page_number)
    serializer = SolicitudSerializer(page.object_list, many=True)
    return Response({
        'pagina_actual': page.number,
        'total_paginas': paginator.num_pages,
        'total_registros': paginator.count,
        'resultados': serializer.data
    })


@api_view(['GET', 'POST'])
def solicitudes_api(request):
    if not request.user.is_authenticated:
        return Response({'detail': 'Autenticación requerida.'}, status=401)

    permiso = 'solicitudes.view_solicitud'
    if request.method == 'POST':
        permiso = 'solicitudes.add_solicitud'

    if not request.user.is_staff and not request.user.has_perm(permiso):
        return Response({'detail': 'No tiene permiso para esta operación.'}, status=403)

    if request.method == 'GET':
        solicitudes = Solicitud.objects.select_related('cliente', 'servicio')
        estado = request.query_params.get('estado')
        prioridad = request.query_params.get('prioridad')
        buscar = request.query_params.get('buscar')
        ordering = request.query_params.get('ordering', '-fecha_creacion')

        if estado is not None:
            estado = estado.upper()
            if estado not in ['PENDIENTE', 'EN_PROCESO', 'RESUELTA', 'CANCELADA']:
                return Response({'estado': 'El estado no es válido.'}, status=400)
            solicitudes = solicitudes.filter(estado=estado)

        if prioridad is not None:
            prioridad = prioridad.upper()
            if prioridad not in ['BAJA', 'NORMAL', 'ALTA']:
                return Response({'prioridad': 'La prioridad no es válida.'}, status=400)
            solicitudes = solicitudes.filter(prioridad=prioridad)

        for campo in ['cliente', 'servicio', 'tecnico']:
            valor = request.query_params.get(campo)
            if valor is not None:
                try:
                    identificador = int(valor)
                except (TypeError, ValueError):
                    return Response({campo: 'Debe enviar un ID numérico.'}, status=400)
                if identificador <= 0:
                    return Response({campo: 'El ID debe ser mayor que cero.'}, status=400)
                if campo == 'cliente':
                    solicitudes = solicitudes.filter(cliente_id=identificador)
                elif campo == 'servicio':
                    solicitudes = solicitudes.filter(servicio_id=identificador)
                else:
                    solicitudes = solicitudes.filter(asignacion__tecnico_id=identificador)

        if buscar:
            solicitudes = solicitudes.filter(
                Q(asunto__icontains=buscar) | Q(descripcion__icontains=buscar)
            )

        if ordering not in ['fecha_creacion', '-fecha_creacion']:
            return Response({'ordering': 'Utilice fecha_creacion o -fecha_creacion.'}, status=400)

        solicitudes = solicitudes.order_by(ordering, 'id')
        return respuesta_paginada(solicitudes, request.query_params.get('page', 1))

    serializer = SolicitudSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
def solicitud_detalle_api(request, id):
    if not request.user.is_authenticated:
        return Response({'detail': 'Autenticación requerida.'}, status=401)

    permiso = 'solicitudes.view_solicitud'
    if request.method in ['PUT', 'PATCH']:
        permiso = 'solicitudes.change_solicitud'
    elif request.method == 'DELETE':
        permiso = 'solicitudes.delete_solicitud'

    if not request.user.is_staff and not request.user.has_perm(permiso):
        return Response({'detail': 'No tiene permiso para esta operación.'}, status=403)

    try:
        solicitud = Solicitud.objects.select_related('cliente', 'servicio').get(id=id)
    except Solicitud.DoesNotExist:
        return Response({'error': 'Solicitud no encontrada.'}, status=404)

    if request.method == 'GET':
        return Response(SolicitudSerializer(solicitud).data)

    if request.method in ['PUT', 'PATCH']:
        serializer = SolicitudSerializer(
            solicitud,
            data=request.data,
            partial=request.method == 'PATCH'
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    try:
        solicitud.delete()
    except ProtectedError:
        return Response({'error': 'La solicitud tiene una asignación registrada.'}, status=409)
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['GET'])
def resumen_api(request):
    if not request.user.is_authenticated:
        return Response({'detail': 'Autenticación requerida.'}, status=401)

    if not request.user.is_staff and not request.user.has_perm('solicitudes.view_solicitud'):
        return Response({'detail': 'No tiene permiso para esta operación.'}, status=403)

    solicitudes_por_estado = Solicitud.objects.values('estado').annotate(
        total=Count('id')
    ).order_by('estado')

    servicios_mas_solicitados = Servicio.objects.annotate(
        total_solicitudes=Count('solicitudes')
    ).filter(total_solicitudes__gt=0).order_by(
        '-total_solicitudes', 'nombre'
    ).values('id', 'nombre', 'total_solicitudes')[:5]

    carga_tecnicos = Tecnico.objects.filter(activo=True).annotate(
        solicitudes_abiertas=Count(
            'asignaciones',
            filter=Q(asignaciones__solicitud__estado__in=['PENDIENTE', 'EN_PROCESO'])
        )
    ).order_by('-solicitudes_abiertas', 'nombre').values(
        'id', 'nombre', 'solicitudes_abiertas'
    )

    solicitudes_urgentes = Solicitud.objects.filter(
        prioridad='ALTA',
        estado__in=['PENDIENTE', 'EN_PROCESO']
    ).select_related('cliente', 'servicio').order_by('-fecha_creacion', '-id')[:5]

    totales = Solicitud.objects.aggregate(
        total=Count('id'),
        abiertas=Count('id', filter=Q(estado__in=['PENDIENTE', 'EN_PROCESO'])),
        resueltas=Count('id', filter=Q(estado='RESUELTA')),
        canceladas=Count('id', filter=Q(estado='CANCELADA'))
    )

    return Response({
        'solicitudes_por_estado': list(solicitudes_por_estado),
        'servicios_mas_solicitados': list(servicios_mas_solicitados),
        'carga_tecnicos': list(carga_tecnicos),
        'solicitudes_urgentes': SolicitudSerializer(solicitudes_urgentes, many=True).data,
        'totales': totales
    })
