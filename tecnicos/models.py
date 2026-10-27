from django.db import models

# Create your models here.

class Tecnico(models.Model):
    identificacion = models.CharField(max_length=20, unique=True)
    nombre = models.CharField(max_length=100)
    correo = models.EmailField(unique=True)
    activo = models.BooleanField(default=True)
    servicios = models.ManyToManyField('servicios.Servicio', related_name='tecnicos')

    def __str__(self):
        return self.nombre
