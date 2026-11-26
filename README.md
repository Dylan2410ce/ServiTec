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


# ServiTec — Frontend SPA (React + Bootstrap 5) & API REST (Django)

**Universidad de Costa Rica — Sede del Pacífico**  
**Carrera:** Bachillerato en Informática Empresarial  
**Curso:** Desarrollo de Software IV (Proyecto 02)  
**Docente:** Irwin Leal Elizondo  
**Integrantes:**
- Dylan Calvo Escobar
- Marcony Salazar Bogantes
- Emmanuel Porras Jimenez

---

## 1. Descripción general

**ServiTec** es una aplicación web *Single Page Application* (SPA) desarrollada con **React, Vite, React Router y Bootstrap 5**, conectada mediante `fetch` nativo a la API REST de **Django REST Framework** y **MySQL** construida en el Proyecto 1.

El sistema gestiona el flujo completo de atención de un centro de soporte técnico a través de **cinco módulos de negocio** y un **panel general de control (Dashboard)**:

1. **Clientes:** Registro, consulta, edición, activación/desactivación y eliminación controlada.
2. **Servicios:** Catálogo de servicios técnicos con código, descripción, tarifa en colones y disponibilidad.
3. **Técnicos:** Administración del personal técnico y asociación múltiple de servicios habilitados.
4. **Solicitudes:** Gestión de órdenes de servicio con prioridades (`BAJA`, `NORMAL`, `ALTA`) y máquina de estados (`PENDIENTE` → `EN_PROCESO` → `RESUELTA` / `CANCELADA`).
5. **Asignaciones:** Programación de técnicos por solicitud con validación de especialidad y control de traslapes horarios.

---

## 2. Requisitos previos

- **Python** 3.10 o superior
- **MySQL** 8.0 o superior
- **Node.js** 18.0 o superior y **npm**
- **Git**

---

## 3. Instalación y ejecución del Backend (Django)

1. Ubíquese en la carpeta del proyecto backend (donde se encuentra `manage.py`) y active su entorno virtual:
   ```bash
   python -m venv venv
   # En Windows:
   venv\Scripts\activate
   # En Linux/macOS:
   source venv/bin/activate
   ```

2. Instale las dependencias, incluyendo `django-cors-headers` para permitir peticiones desde el frontend:
   ```bash
   pip install -r requirements.txt
   pip install django-cors-headers
   ```

3. Cree la base de datos en MySQL:
   ```sql
   CREATE DATABASE IF NOT EXISTS servitec_db CHARACTER SET utf8mb4;
   ```

4. Configure el archivo `.env` del backend tomando como base `.env.example`:
   ```env
   DB_NAME=servitec_db
   DB_USER=tu_usuario_mysql
   DB_PASSWORD=tu_contrasena_mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   ```

5. Aplique las migraciones e inicie el servidor en el puerto `8000`:
   ```bash
   python manage.py migrate
   python manage.py runserver
   ```

### Configuración de CORS en Django (`backend_servitec/settings.py`)

Para permitir la comunicación entre Vite (`http://localhost:5173`) y Django (`http://localhost:8000`), el backend incluye la siguiente configuración en `settings.py`:

- En `INSTALLED_APPS`: `'corsheaders'`
- En `MIDDLEWARE` (antes de `CommonMiddleware`): `'corsheaders.middleware.CorsMiddleware'`
- Orígenes autorizados:
  ```python
  CORS_ALLOWED_ORIGINS = [
      'http://localhost:5173',
      '[http://127.0.0.1:5173](http://127.0.0.1:5173)',
  ]
  ```

---

## 4. Instalación y ejecución del Frontend (React + Vite)

1. Abra una segunda terminal dentro de la carpeta `frontend/`:
   ```bash
   cd frontend
   npm install
   ```

2. Cree el archivo de variables de entorno `.env` copiando `.env.example`:
   ```bash
   cp .env.example .env
   ```
   Contenido de `.env.example` (sin credenciales ni secretos):
   ```env
   VITE_API_BASE_URL=http://localhost:8000/api
   ```

3. Inicie el servidor de desarrollo de Vite:
   ```bash
   npm run dev
   ```
   La aplicación estará disponible en `http://localhost:5173`.

---

## 5. Perfiles y usuarios de prueba

El sistema maneja tres perfiles configurados mediante grupos y permisos de Django (`is_staff` y permisos `app.accion_modelo`):

| Perfil | Usuario de prueba | Contraseña de prueba | Alcance funcional |
| :--- | :--- | :--- | :--- |
| **Administrador** | `root` | `root` | Acceso total: consulta, creación, edición y eliminación en los 5 módulos. |
| **Operador** | `operador` | `clave12345` | Consulta en los 5 módulos; crea y edita en **Clientes**, **Solicitudes** y **Asignaciones**. No puede modificar **Servicios** ni **Técnicos**, ni eliminar registros. |
| **Consulta** | `consulta` | `clavelarga12345` | Solo lectura (`GET`) en el Dashboard y los 5 módulos. Cualquier operación de escritura devuelve `403 Forbidden`. |

> **Nota para pruebas de seguridad (`403 Forbidden`):** La barra superior incluye un interruptor *"Simular botones (probar 403)"* para usuarios no administradores que permite habilitar los botones de acción en la interfaz y comprobar que el servidor Django rechaza realmente la operación con código `403`.


---

## 6. Estructura del proyecto Frontend

```text
frontend/
├── .env.example
├── package.json
└── src/
    ├── main.jsx                  # Punto de entrada e importación de Bootstrap 5
    ├── App.jsx                   # Definición de rutas públicas y privadas (React Router)
    ├── api.jsx                   # Cliente fetch centralizado, manejo de token y errores HTTP
    ├── AuthContext.jsx           # Estado global de sesión, usuario, rol y permisos
    ├── index.css                 # Tema visual corporativo en azul marino
    ├── components/               # Componentes reutilizables (Layout, ProtectedRoute, Alertas, Paginación, Modales, Cards)
    └── pages/                    # Pantallas y formularios de Login, Dashboard y los 5 módulos
```
