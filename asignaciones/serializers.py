from rest_framework import serializers
from .models import Asignacion


class AsignacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Asignacion
        fields = '__all__'

    def validate(self, data):
        solicitud = data.get('solicitud')
        tecnico = data.get('tecnico')
        fecha_inicio = data.get('fecha_inicio')
        fecha_fin = data.get('fecha_fin')

        if self.instance is not None:
            solicitud = data.get('solicitud', self.instance.solicitud)
            tecnico = data.get('tecnico', self.instance.tecnico)
            fecha_inicio = data.get('fecha_inicio', self.instance.fecha_inicio)
            fecha_fin = data.get('fecha_fin', self.instance.fecha_fin)

            if solicitud != self.instance.solicitud:
                raise serializers.ValidationError({
                    'solicitud': 'No se puede cambiar la solicitud de una asignación.'
                })

        if solicitud and solicitud.estado not in ['PENDIENTE', 'EN_PROCESO']:
            raise serializers.ValidationError({
                'solicitud': 'Solo se pueden asignar o modificar solicitudes abiertas.'
            })

        if solicitud and not solicitud.cliente.activo:
            raise serializers.ValidationError({
                'solicitud': 'El cliente de la solicitud debe estar activo.'
            })

        if solicitud and not solicitud.servicio.activo:
            raise serializers.ValidationError({
                'solicitud': 'El servicio de la solicitud debe estar activo.'
            })

        if tecnico and not tecnico.activo:
            raise serializers.ValidationError({
                'tecnico': 'El técnico debe estar activo.'
            })

        if solicitud and tecnico:
            if not tecnico.servicios.filter(pk=solicitud.servicio_id).exists():
                raise serializers.ValidationError({
                    'tecnico': 'El técnico no ofrece el servicio solicitado.'
                })

        if fecha_inicio and fecha_fin and fecha_fin <= fecha_inicio:
            raise serializers.ValidationError({
                'fecha_fin': 'Debe ser posterior a la fecha de inicio.'
            })

        if tecnico and fecha_inicio and fecha_fin:
            asignaciones = Asignacion.objects.filter(
                tecnico=tecnico,
                solicitud__estado__in=['PENDIENTE', 'EN_PROCESO'],
                fecha_inicio__lt=fecha_fin,
                fecha_fin__gt=fecha_inicio
            )

            if self.instance is not None:
                asignaciones = asignaciones.exclude(pk=self.instance.pk)

            if asignaciones.exists():
                raise serializers.ValidationError({
                    'tecnico': 'El técnico tiene otra asignación en ese horario.'
                })

        return data
