from rest_framework import serializers
from .models import Cliente


class ClienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cliente
        fields = '__all__'

    def validate(self, data):
        if self.instance is not None and data.get('activo', self.instance.activo) is False:
            if self.instance.solicitudes.filter(estado__in=['PENDIENTE', 'EN_PROCESO']).exists():
                raise serializers.ValidationError({
                    'activo': 'No se puede desactivar un cliente con solicitudes abiertas.'
                })
        return data