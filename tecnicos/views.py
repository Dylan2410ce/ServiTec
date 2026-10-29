from django.core.paginator import Paginator
from django.db.models import Q
from django.db.models.deletion import ProtectedError
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import Tecnico
from .serializers import TecnicoSerializer


def respuesta_paginada(queryset, page_number):
    paginator = Paginator(queryset, 5)
    page = paginator.get_page(page_number)
    serializer = TecnicoSerializer(page.object_list, many=True)
    return Response({
        'pagina_actual': page.number,
        'total_paginas': paginator.num_pages,
        'total_registros': paginator.count,
        'resultados': serializer.data
    })


@api_view(['GET', 'POST'])
def tecnicos_api(request):
    if not request.user.is_authenticated:
        return Response({'detail': 'Autenticación requerida.'}, status=401)

    permiso = 'tecnicos.view_tecnico'
    if request.method == 'POST':
        permiso = 'tecnicos.add_tecnico'

    if not request.user.is_staff and not request.user.has_perm(permiso):
        return Response({'detail': 'No tiene permiso para esta operación.'}, status=403)

    if request.method == 'GET':
        registros = Tecnico.objects.prefetch_related('servicios')
        activo = request.query_params.get('activo')
        buscar = request.query_params.get('buscar')
        ordering = request.query_params.get('ordering', 'nombre')

        if activo is not None:
            if activo.lower() not in ['true', 'false']:
                return Response({'activo': 'Utilice true o false.'}, status=400)
            registros = registros.filter(activo=activo.lower() == 'true')

        if buscar:
            registros = registros.filter(Q(nombre__icontains=buscar) | Q(identificacion__icontains=buscar) | Q(correo__icontains=buscar))

        servicio = request.query_params.get('servicio')
        if servicio is not None:
            try:
                servicio_id = int(servicio)
            except (TypeError, ValueError):
                return Response({'servicio': 'Debe enviar un ID numérico.'}, status=400)
            if servicio_id <= 0:
                return Response({'servicio': 'El ID debe ser mayor que cero.'}, status=400)
            registros = registros.filter(servicios__id=servicio_id).distinct()

        if ordering not in ['nombre', '-nombre']:
            return Response({'ordering': 'El campo de ordenamiento no es válido.'}, status=400)

        registros = registros.order_by(ordering, 'id')
        return respuesta_paginada(registros, request.query_params.get('page', 1))

    serializer = TecnicoSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
def tecnico_detalle_api(request, id):
    if not request.user.is_authenticated:
        return Response({'detail': 'Autenticación requerida.'}, status=401)

    permiso = 'tecnicos.view_tecnico'
    if request.method in ['PUT', 'PATCH']:
        permiso = 'tecnicos.change_tecnico'
    elif request.method == 'DELETE':
        permiso = 'tecnicos.delete_tecnico'

    if not request.user.is_staff and not request.user.has_perm(permiso):
        return Response({'detail': 'No tiene permiso para esta operación.'}, status=403)

    try:
        registro = Tecnico.objects.prefetch_related('servicios').get(id=id)
    except Tecnico.DoesNotExist:
        return Response({'error': 'Tecnico no encontrado.'}, status=404)

    if request.method == 'GET':
        return Response(TecnicoSerializer(registro).data)

    if request.method in ['PUT', 'PATCH']:
        serializer = TecnicoSerializer(
            registro,
            data=request.data,
            partial=request.method == 'PATCH'
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    try:
        registro.delete()
    except ProtectedError:
        return Response({'error': 'El registro tiene relaciones que impiden eliminarlo.'}, status=409)
    return Response(status=status.HTTP_204_NO_CONTENT)
