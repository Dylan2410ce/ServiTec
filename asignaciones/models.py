from django.db import models

# Create your models here.

class Asignacion(models.Model):
    solicitud = models.OneToOneField('solicitudes.Solicitud', on_delete=models.PROTECT, related_name='asignacion')
    tecnico = models.ForeignKey('tecnicos.Tecnico', on_delete=models.PROTECT, related_name='asignaciones')
    fecha_inicio = models.DateTimeField()
    fecha_fin = models.DateTimeField()
    notas = models.TextField(blank=True)

    def __str__(self):
        return f'{self.solicitud_id} - {self.tecnico.nombre}'