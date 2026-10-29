from rest_framework import serializers
from .models import Solicitud


class SolicitudSerializer(serializers.ModelSerializer):
    class Meta:
        model = Solicitud
        fields = '__all__'

    def validate(self, data):
        cliente = data.get('cliente')
        servicio = data.get('servicio')
        estado = data.get('estado', 'PENDIENTE')
        asignacion = None
        if self.instance is None:
            if estado != 'PENDIENTE':
                raise serializers.ValidationError({
                    'estado': 'Una solicitud debe crearse como PENDIENTE.'
                })
        else:
            cliente = data.get('cliente', self.instance.cliente)
            servicio = data.get('servicio', self.instance.servicio)
            estado = data.get('estado', self.instance.estado)
            asignacion = getattr(self.instance, 'asignacion', None)

            transiciones = {
                'PENDIENTE': ['PENDIENTE', 'EN_PROCESO', 'CANCELADA'],
                'EN_PROCESO': ['EN_PROCESO', 'RESUELTA', 'CANCELADA'],
                'RESUELTA': ['RESUELTA'],
                'CANCELADA': ['CANCELADA']
            }


            if estado not in transiciones[self.instance.estado]:
                raise serializers.ValidationError({
                    'estado': 'El cambio de estado no está permitido.'
                })

            if self.instance.estado in ['RESUELTA', 'CANCELADA']:
                for campo in ['cliente', 'servicio', 'asunto', 'descripcion', 'prioridad']:
                    if campo in data and data[campo] != getattr(self.instance, campo):
                        raise serializers.ValidationError({
                            campo: 'No se puede modificar una solicitud cerrada.'
                        })

        if estado in ['PENDIENTE', 'EN_PROCESO']:
            if cliente and not cliente.activo:
                raise serializers.ValidationError({
                    'cliente': 'El cliente debe estar activo.'
                })


            if servicio and not servicio.activo:
                raise serializers.ValidationError({
                    'servicio': 'El servicio debe estar activo.'
                })

            if asignacion is not None:
                if not asignacion.tecnico.activo:
                    raise serializers.ValidationError({
                        'servicio': 'El técnico asignado debe estar activo.'
                    })

        if asignacion is not None and servicio:
            if estado in ['PENDIENTE', 'EN_PROCESO'] or servicio != self.instance.servicio:
                if not asignacion.tecnico.servicios.filter(pk=servicio.pk).exists():
                    raise serializers.ValidationError({
                        'servicio': 'El técnico asignado no ofrece este servicio.'
                    })

        if estado in ['EN_PROCESO', 'RESUELTA'] and asignacion is None:
            raise serializers.ValidationError({
                'estado': 'La solicitud debe tener una asignación.'
            })

        return data
