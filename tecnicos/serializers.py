from rest_framework import serializers
from .models import Tecnico


class TecnicoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tecnico
        fields = '__all__'
        extra_kwargs = {'servicios': {'required': True, 'allow_empty': False}}

    def validate(self, data):
        servicios = data.get('servicios')
        activo = data.get('activo', True)

        if self.instance is not None:
            activo = data.get('activo', self.instance.activo)
            if servicios is None:
                servicios = list(self.instance.servicios.all())

            abiertas = self.instance.asignaciones.filter(
                solicitud__estado__in=['PENDIENTE', 'EN_PROCESO']
            )

            if not activo and abiertas.exists():
                raise serializers.ValidationError({
                    'activo': 'No se puede desactivar un técnico con asignaciones abiertas.'
                })

            if servicios is not None:
                ids = [servicio.pk for servicio in servicios]
                if abiertas.exclude(solicitud__servicio_id__in=ids).exists():
                    raise serializers.ValidationError({
                        'servicios': 'No se puede quitar un servicio con una asignación abierta.'
                    })

        return data
