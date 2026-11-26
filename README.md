# ServiTec

**Curso:** Desarrollo de Software IV  
**Profesor:** Irwin Leal Elizondo  
**Integrantes:** Dylan Calvo Escobar, Marcony Salazar Bogantes y Emmanuel Porras Jimenez

## ¿De qué trata?

ServiTec es el sistema de un centro de servicios técnicos . Sirve para llevar el orden de las atenciones y evitar tres problemas comunes: solicitudes que se pierden, trabajos que se le dan al técnico equivocado y técnicos con dos citas a la misma hora.

Está hecho con Django, Django REST Framework y MySQL, todo se usa y se prueba desde Postman.

## Las cinco partes del sistema

| Módulo | ¿Para qué sirve? |
| --- | --- |
| Clientes | Guardar los datos de quienes piden un servicio. |
| Servicios | El catálogo de trabajos que se ofrecen, con su precio. |
| Técnicos | El personal y los servicios que sabe hacer cada uno. |
| Solicitudes | Lo que pide el cliente, con su prioridad y su estado. |
| Asignaciones | Qué técnico atiende cada solicitud y en qué horario. |

## Cómo funciona

1. Se registran los clientes, los servicios y los técnicos.
2. Un cliente hace una solicitud.
3. A esa solicitud se le asigna un técnico con un horario.
4. La solicitud avanza por estos estados: **Pendiente → En proceso → Resuelta**.

También se puede **cancelar** mientras esté pendiente o en proceso. Una vez resuelta o cancelada, ya no se puede reabrir ni modificar.

## Cómo se relacionan los datos

- Un cliente o un servicio pueden tener muchas solicitudes.
- Un técnico puede tener muchas asignaciones.
- Los técnicos y los servicios se relacionan en ambos sentidos: un técnico sabe hacer varios servicios y un servicio lo pueden hacer varios técnicos.
- Cada solicitud tiene como máximo una asignación.

Para no perder información, el sistema no deja borrar algo que otra cosa esté usando. Por ejemplo, no se puede eliminar un cliente con solicitudes. En ese caso responde con un error 409.

## Quién puede hacer qué

Hay tres tipos de usuario:

| Acción | Administrador | Operador | Consulta |
| --- | --- | --- | --- |
| Ver todo | Sí | Sí | Sí |
| Crear y editar clientes, solicitudes y asignaciones | Sí | Sí | No |
| Crear y editar servicios y técnicos | Sí | No | No |
| Eliminar | Sí | No | No |

Para entrar, cada usuario pide su token con su usuario y contraseña, y lo envía en cada petición.

## Reglas que cuida el sistema

Si algo no cumple estas reglas, el sistema lo rechaza y explica el motivo (error 400):

- El precio de un servicio debe ser mayor que cero.
- Cada técnico debe ofrecer al menos un servicio.
- Solo se pueden abrir solicitudes con clientes y servicios activos.
- El técnico asignado debe estar activo y saber hacer ese servicio.
- Una solicitud solo puede tener una asignación.
- La hora de fin debe ser después de la de inicio.
- Un técnico no puede tener dos asignaciones abiertas al mismo tiempo.
- Una solicitud debe seguir el orden de estados: no se puede iniciar o resolver sin técnico asignado, ni saltarse pasos, ni modificar una ya cerrada.

Estas reglas también se cumplen al editar solo algunos campos, no solo al crear.

## Buscar, filtrar y reportes

Los listados se pueden filtrar, buscar y ordenar, y se pueden combinar. Por ejemplo, ver solo las solicitudes pendientes de prioridad alta de un cliente, o buscar un técnico por nombre. Cada página muestra cinco registros.

También hay un resumen general del centro con:

1. Cuántas solicitudes hay en cada estado.
2. Los cinco servicios más pedidos.
3. Cuántas asignaciones abiertas tiene cada técnico.
4. Las cinco solicitudes urgentes más recientes.
5. Totales de solicitudes abiertas, resueltas y canceladas.

## Respuestas del sistema

| Código | Qué significa |
| --- | --- |
| 200 | Todo bien. |
| 201 | Se creó el registro. |
| 204 | Se eliminó el registro. |
| 400 | Datos incorrectos o una regla no se cumple. |
| 401 | Falta iniciar sesión o el token no sirve. |
| 403 | El usuario no tiene permiso para eso. |
| 404 | El registro no existe. |
| 409 | No se puede borrar porque está en uso. |

## Cómo ponerlo a funcionar

se necesita Python, Git y MySQL 8. Los comandos se ejecutan en la carpeta donde está `manage.py`

**1. Instalar lo necesario**

```
python -m pip install -r requirements.txt
```

**2. Crear la base de datos en MySQL**

```sql
CREATE DATABASE IF NOT EXISTS servitec_db CHARACTER SET utf8mb4;
```

**3. Configurar la conexión**

Copia el archivo `.env.example`, hay que llamarlo `.env` y completa los datos:

```
DB_NAME=servitec_db
DB_USER=tu_usuario
DB_PASSWORD=tu_contrasena
DB_HOST=127.0.0.1
DB_PORT=3306
```

**4. Crear las tablas**

```
python manage.py migrate
```

**5. Crear los usuarios**

```
python manage.py createsuperuser
python manage.py changepassword operador_demo
python manage.py changepassword consulta_demo
```

**6. Encender el servidor**

```
python manage.py runserver
```

Queda funcionando en http://localhost:8000.

## Pruebas

El proyecto tiene 15 pruebas automáticas que revisan los cinco módulos, las reglas, los permisos, los filtros y la paginación:

```
python manage.py test clientes servicios tecnicos solicitudes asignaciones
```

| Método | URL | Código correcto | Posibles errores |
| --- | --- | --- | --- |
| POST | http://localhost:8000/api/token/ | 200 | 400 |
| GET | http://localhost:8000/api/usuario/ | 200 | 401 |
| GET | http://localhost:8000/api/reportes/resumen/ | 200 | 401, 403 |
| GET | http://localhost:8000/api/clientes/ | 200 | 400, 401, 403 |
| POST | http://localhost:8000/api/clientes/ | 201 | 400, 401, 403 |
| GET | http://localhost:8000/api/clientes/1/ | 200 | 401, 403, 404 |
| PUT / PATCH | http://localhost:8000/api/clientes/1/ | 200 | 400, 401, 403, 404 |
| DELETE | http://localhost:8000/api/clientes/1/ | 204 | 401, 403, 404, 409 |
| GET | http://localhost:8000/api/servicios/ | 200 | 400, 401, 403 |
| POST | http://localhost:8000/api/servicios/ | 201 | 400, 401, 403 |
| GET | http://localhost:8000/api/servicios/1/ | 200 | 401, 403, 404 |
| PUT / PATCH | http://localhost:8000/api/servicios/1/ | 200 | 400, 401, 403, 404 |
| DELETE | http://localhost:8000/api/servicios/1/ | 204 | 401, 403, 404, 409 |
| GET | http://localhost:8000/api/tecnicos/ | 200 | 400, 401, 403 |
| POST | http://localhost:8000/api/tecnicos/ | 201 | 400, 401, 403 |
| GET | http://localhost:8000/api/tecnicos/1/ | 200 | 401, 403, 404 |
| PUT / PATCH | http://localhost:8000/api/tecnicos/1/ | 200 | 400, 401, 403, 404 |
| DELETE | http://localhost:8000/api/tecnicos/1/ | 204 | 401, 403, 404, 409 |
| GET | http://localhost:8000/api/solicitudes/ | 200 | 400, 401, 403 |
| POST | http://localhost:8000/api/solicitudes/ | 201 | 400, 401, 403 |
| GET | http://localhost:8000/api/solicitudes/1/ | 200 | 401, 403, 404 |
| PUT / PATCH | http://localhost:8000/api/solicitudes/1/ | 200 | 400, 401, 403, 404 |
| DELETE | http://localhost:8000/api/solicitudes/1/ | 204 | 401, 403, 404, 409 |
| GET | http://localhost:8000/api/asignaciones/ | 200 | 400, 401, 403 |
| POST | http://localhost:8000/api/asignaciones/ | 201 | 400, 401, 403 |
| GET | http://localhost:8000/api/asignaciones/1/ | 200 | 401, 403, 404 |
| PUT / PATCH | http://localhost:8000/api/asignaciones/1/ | 200 | 400, 401, 403, 404 |
| DELETE | http://localhost:8000/api/asignaciones/1/ | 204 | 401, 403, 404, 409 |
