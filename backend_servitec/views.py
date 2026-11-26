from rest_framework.decorators import api_view
from rest_framework.response import Response


@api_view(['GET'])
def usuario_actual_api(request):
    if not request.user.is_authenticated:
        return Response({'detail': 'Autenticación requerida.'}, status=401)

    grupos = list(request.user.groups.values_list('name', flat=True))
    permisos = sorted(list(request.user.get_all_permissions()))

    if request.user.is_staff or request.user.is_superuser:
        rol = 'Administrador'
    elif grupos:
        rol = grupos[0]
    elif request.user.has_perm('solicitudes.add_solicitud'):
        rol = 'Operador'
    else:
        rol = 'Consulta'

    return Response({
        'id': request.user.id,
        'username': request.user.username,
        'first_name': request.user.first_name,
        'last_name': request.user.last_name,
        'email': request.user.email,
        'is_staff': request.user.is_staff,
        'rol': rol,
        'grupos': grupos,
        'permisos': permisos,
    })