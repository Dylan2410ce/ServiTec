from rest_framework import serializers
from .models import Servicio


class ServicioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Servicio
        fields = '__all__'

    def validate_precio(self, value):
        if value <= 0:
            raise serializers.ValidationError('El precio debe ser mayor que cero.')
        return value

    def validate(self, data):
        if self.instance is not None and data.get('activo', self.instance.activo) is False:
            if self.instance.solicitudes.filter(estado__in=['PENDIENTE', 'EN_PROCESO']).exists():
                raise serializers.ValidationError({
                    'activo': 'No se puede desactivar un servicio con solicitudes abiertas.'
                })
        return data
