from django.db import models


class Solicitud(models.Model):
    PRIORIDADES = [('BAJA', 'Baja'), ('NORMAL', 'Normal'), ('ALTA', 'Alta')]
    ESTADOS = [
        ('PENDIENTE', 'Pendiente'),
        ('EN_PROCESO', 'En proceso'),
        ('RESUELTA', 'Resuelta'),
        ('CANCELADA', 'Cancelada'),
    ]
    cliente = models.ForeignKey('clientes.Cliente', on_delete=models.PROTECT, related_name='solicitudes')
    servicio = models.ForeignKey('servicios.Servicio', on_delete=models.PROTECT, related_name='solicitudes')
    asunto = models.CharField(max_length=100)
    descripcion = models.TextField()
    prioridad = models.CharField(max_length=10, choices=PRIORIDADES, default='NORMAL')
    estado = models.CharField(max_length=15, choices=ESTADOS, default='PENDIENTE')
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.asunto
