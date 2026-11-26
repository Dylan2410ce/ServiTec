# Evidencias Técnicas y Matrices de Integración — ServiTec

## 1. Matriz de Pantallas y Endpoints REST

| Pantalla / Módulo | Acción en la interfaz | Método HTTP | Endpoint REST | Parámetros / Payload | Códigos esperados |
| :--- | :--- | :---: | :--- | :--- | :---: |
| **Login** (`/login`) | Iniciar sesión con credenciales | `POST` | `/api/token/` | `{ username, password }` | `200`, `400` |
| **Layout** (Global) | Obtener usuario, rol y permisos activos | `GET` | `/api/usuario/` | Header `Authorization: Token ...` | `200`, `401` |
| **Dashboard** (`/`) | Cargar KPIs, carga técnica, top servicios y urgentes | `GET` | `/api/reportes/resumen/` | Header `Authorization` | `200`, `401`, `403` |
| **Clientes** (`/clientes`) | Listar, buscar, filtrar, ordenar y paginar | `GET` | `/api/clientes/` | `?page=&buscar=&activo=&ordering=` | `200`, `400`, `401`, `403` |
| **Clientes** (`/clientes/nuevo`) | Crear nuevo cliente | `POST` | `/api/clientes/` | `{ documento, nombre, correo, telefono, activo }` | `201`, `400`, `401`, `403` |
| **Clientes** (`/clientes/editar/:id`) | Consultar detalle para precargar edición | `GET` | `/api/clientes/<id>/` | ID en ruta | `200`, `401`, `403`, `404` |
| **Clientes** (`/clientes/editar/:id`) | Actualizar datos o estado de cliente | `PUT` | `/api/clientes/<id>/` | `{ documento, nombre, correo, telefono, activo }` | `200`, `400`, `401`, `403`, `404` |
| **Clientes** (`/clientes`) | Eliminar cliente (con modal de confirmación) | `DELETE` | `/api/clientes/<id>/` | ID en ruta | `204`, `401`, `403`, `404`, `409` |
| **Servicios** (`/servicios`) | Listar catálogo, buscar, filtrar y ordenar por precio | `GET` | `/api/servicios/` | `?page=&buscar=&activo=&ordering=` | `200`, `400`, `401`, `403` |
| **Servicios** (`/servicios/nuevo`) | Crear nuevo servicio | `POST` | `/api/servicios/` | `{ codigo, nombre, descripcion, precio, activo }` | `201`, `400`, `401`, `403` |
| **Servicios** (`/servicios/editar/:id`) | Consultar y actualizar servicio | `GET` / `PUT` | `/api/servicios/<id>/` | `{ codigo, nombre, descripcion, precio, activo }` | `200`, `400`, `401`, `403`, `404` |
| **Servicios** (`/servicios`) | Eliminar servicio (bloqueado si tiene técnicos/solicitudes) | `DELETE` | `/api/servicios/<id>/` | ID en ruta | `204`, `401`, `403`, `404`, `409` |
| **Técnicos** (`/tecnicos`) | Listar con filtros combinables (`activo` + `servicio`) | `GET` | `/api/tecnicos/` | `?page=&buscar=&activo=&servicio=&ordering=` | `200`, `400`, `401`, `403` |
| **Técnicos** (`/tecnicos/nuevo`) | Registrar técnico con especialidades (`ManyToMany`) | `POST` | `/api/tecnicos/` | `{ identificacion, nombre, correo, activo, servicios: [] }` | `201`, `400`, `401`, `403` |
| **Técnicos** (`/tecnicos/editar/:id`) | Consultar y editar técnico y sus servicios | `GET` / `PUT` | `/api/tecnicos/<id>/` | `{ identificacion, nombre, correo, activo, servicios: [] }` | `200`, `400`, `401`, `403`, `404` |
| **Técnicos** (`/tecnicos`) | Eliminar técnico | `DELETE` | `/api/tecnicos/<id>/` | ID en ruta | `204`, `401`, `403`, `404`, `409` |
| **Solicitudes** (`/solicitudes`) | Listar con 5 filtros combinables, búsqueda y orden | `GET` | `/api/solicitudes/` | `?page=&buscar=&estado=&prioridad=&cliente=&servicio=&tecnico=&ordering=` | `200`, `400`, `401`, `403` |
| **Solicitudes** (`/solicitudes/nueva`) | Crear solicitud (estado inicial `PENDIENTE`) | `POST` | `/api/solicitudes/` | `{ cliente, servicio, asunto, descripcion, prioridad, estado }` | `201`, `400`, `401`, `403` |
| **Solicitudes** (`/solicitudes/editar/:id`) | Consultar y gestionar transición de estado | `GET` / `PUT` | `/api/solicitudes/<id>/` | `{ cliente, servicio, asunto, descripcion, prioridad, estado }` | `200`, `400`, `401`, `403`, `404` |
| **Solicitudes** (`/solicitudes`) | Eliminar solicitud (bloqueado si tiene asignación) | `DELETE` | `/api/solicitudes/<id>/` | ID en ruta | `204`, `401`, `403`, `404`, `409` |
| **Asignaciones** (`/asignaciones`) | Listar con 4 filtros combinables y ordenamiento | `GET` | `/api/asignaciones/` | `?page=&estado=&tecnico=&solicitud=&servicio=&ordering=` | `200`, `400`, `401`, `403` |
| **Asignaciones** (`/asignaciones/nueva`) | Programar técnico y horario a solicitud abierta | `POST` | `/api/asignaciones/` | `{ solicitud, tecnico, fecha_inicio, fecha_fin, notas }` | `201`, `400`, `401`, `403` |
| **Asignaciones** (`/asignaciones/editar/:id`) | Consultar y reprogramar asignación existente | `GET` / `PUT` | `/api/asignaciones/<id>/` | `{ solicitud, tecnico, fecha_inicio, fecha_fin, notas }` | `200`, `400`, `401`, `403`, `404` |
| **Asignaciones** (`/asignaciones`) | Eliminar asignación (solo si `PENDIENTE` o `CANCELADA`) | `DELETE` | `/api/asignaciones/<id>/` | ID en ruta | `204`, `401`, `403`, `404`, `409` |

---

## 2. Matriz de Perfiles y Permisos

| Módulo / Recurso | Operación | Administrador (`root`) | Operador (`operador`) | Consulta (`consulta`) |
| :--- | :--- | :---: | :---: | :---: |
| **Dashboard** (`/api/reportes/resumen/`) | Consultar indicadores (`GET`) | Permitido (`200`) | Permitido (`200`) | Permitido (`200`) |
| **Clientes** (`/api/clientes/`) | Listar y ver detalle (`GET`) | Permitido (`200`) | Permitido (`200`) | Permitido (`200`) |
| **Clientes** (`/api/clientes/`) | Crear y editar (`POST`, `PUT`) | Permitido (`201`/`200`) | Permitido (`201`/`200`) | Denegado (`403`) |
| **Clientes** (`/api/clientes/`) | Eliminar (`DELETE`) | Permitido (`204`) | Denegado (`403`) | Denegado (`403`) |
| **Servicios** (`/api/servicios/`) | Listar y ver detalle (`GET`) | Permitido (`200`) | Permitido (`200`) | Permitido (`200`) |
| **Servicios** (`/api/servicios/`) | Crear, editar y eliminar (`POST`, `PUT`, `DELETE`) | Permitido (`201`/`200`/`204`) | Denegado (`403`) | Denegado (`403`) |
| **Técnicos** (`/api/tecnicos/`) | Listar y ver detalle (`GET`) | Permitido (`200`) | Permitido (`200`) | Permitido (`200`) |
| **Técnicos** (`/api/tecnicos/`) | Crear, editar y eliminar (`POST`, `PUT`, `DELETE`) | Permitido (`201`/`200`/`204`) | Denegado (`403`) | Denegado (`403`) |
| **Solicitudes** (`/api/solicitudes/`) | Listar y ver detalle (`GET`) | Permitido (`200`) | Permitido (`200`) | Permitido (`200`) |
| **Solicitudes** (`/api/solicitudes/`) | Crear y editar (`POST`, `PUT`) | Permitido (`201`/`200`) | Permitido (`201`/`200`) | Denegado (`403`) |
| **Solicitudes** (`/api/solicitudes/`) | Eliminar (`DELETE`) | Permitido (`204`) | Denegado (`403`) | Denegado (`403`) |
| **Asignaciones** (`/api/asignaciones/`) | Listar y ver detalle (`GET`) | Permitido (`200`) | Permitido (`200`) | Permitido (`200`) |
| **Asignaciones** (`/api/asignaciones/`) | Crear y editar (`POST`, `PUT`) | Permitido (`201`/`200`) | Permitido (`201`/`200`) | Denegado (`403`) |
| **Asignaciones** (`/api/asignaciones/`) | Eliminar (`DELETE`) | Permitido (`204`) | Denegado (`403`) | Denegado (`403`) |

---

## 3. Escenarios de Prueba Manuales (14 Casos Verificados)

| ID | Escenario | Pasos ejecutados en la interfaz | Resultado esperado y código HTTP | Estado |
| :--- | :--- | :--- | :--- | :---: |
| **PM-01** | **Login exitoso y carga de perfil** | Ingresar `root` / `root` en `/login` y pulsar *Ingresar al sistema*. | Obtiene token (`200`), consulta `/api/usuario/` (`200`), muestra `root (Administrador)` en barra superior y redirige al Dashboard. | Aprobado |
| **PM-02** | **Login con credenciales inválidas** | Ingresar usuario `root` con contraseña errónea en `/login`. | Muestra alerta Bootstrap roja con mensaje de credenciales inválidas (`400 Bad Request`) sin crear sesión. | Aprobado |
| **PM-03** | **Protección de rutas privadas y Logout** | Sin iniciar sesión, navegar a `/clientes`; luego iniciar sesión y pulsar *Salir*. | `ProtectedRoute` redirige a `/login`. Al cerrar sesión, borra `servitec_token` de `localStorage` y bloquea rutas privadas. | Aprobado |
| **PM-04** | **Consulta de KPIs reales en Dashboard** | Acceder a `/` tras autenticarse. | Muestra los 4 KPIs (`Total`, `Abiertas`, `Resueltas`, `Canceladas`), carga de técnicos, top servicios y solicitudes urgentes desde `/api/reportes/resumen/` (`200`). | Aprobado |
| **PM-05** | **CRUD Clientes: Creación y Edición** | Ir a `/clientes/nuevo`, registrar cliente activo y luego editar su teléfono en `/clientes/editar/:id`. | Crea registro (`201 Created`), precarga datos en edición (`200`) y actualiza la tabla inmediatamente (`200 OK`). | Aprobado |
| **PM-06** | **Búsqueda, filtro, orden y paginación en Clientes** | En `/clientes`, buscar texto, filtrar `Activos`, ordenar `Nombre (Z - A)` y avanzar a página 2. | Envía `?buscar=...&activo=true&ordering=-nombre&page=2` a Django (`200 OK`) y actualiza tabla y paginador. | Aprobado |
| **PM-07** | **Validación de negocio en Servicios (`400`)** | En `/servicios/nuevo`, intentar registrar un servicio con precio `0` o negativo. | Validación preventiva en formulario y validación en backend (`400 Bad Request`: *"El precio debe ser mayor que cero"*). | Aprobado |
| **PM-08** | **CRUD Técnicos con relación ManyToMany** | En `/tecnicos/nuevo`, registrar técnico marcando 2 servicios del catálogo; probar guardar sin servicios. | Sin servicios muestra error `400`; con servicios crea técnico (`201`) y muestra etiquetas de especialidades en el listado. | Aprobado |
| **PM-09** | **Filtros combinables en Solicitudes** | En `/solicitudes`, combinar `Estado: Pendiente` + `Prioridad: Alta` + `Cliente` + `Servicio`. | Envía los parámetros combinados en la URL (`200 OK`) y filtra los resultados directamente en MySQL. | Aprobado |
| **PM-10** | **Regla de transición de estado en Solicitudes (`400`)** | Editar una solicitud `PENDIENTE` sin asignación e intentar cambiar su estado a `EN_PROCESO`. | Django rechaza el cambio (`400 Bad Request`: *"La solicitud debe tener una asignación"*) y el formulario lo muestra en alerta. | Aprobado |
| **PM-11** | **Creación de Asignación y validación horaria (`400`)** | En `/asignaciones/nueva`, intentar asignar con `fecha_fin` anterior a `fecha_inicio` o con horario traslapado; luego corregir horario. | Rechaza rango inválido o traslape (`400 Bad Request`) y guarda correctamente con horario válido (`201 Created`). | Aprobado |
| **PM-12** | **Acceso denegado por rol (`403 Forbidden`)** | Iniciar sesión como `consulta`, activar *"Simular botones (probar 403)"* e intentar crear un cliente o eliminar un registro. | El servidor bloquea la petición y la interfaz muestra la alerta *"No tiene permisos para realizar esta acción (403)"*. | Aprobado |
| **PM-13** | **Conflicto de integridad al eliminar (`409 Conflict`)** | Como `root`, confirmar en el modal la eliminación de un cliente o servicio que ya tiene solicitudes asociadas. | Django captura `ProtectedError` (`409 Conflict`) y la alerta informa que el registro está en uso y no puede borrarse. | Aprobado |
| **PM-14** | **Consulta de registro inexistente (`404 Not Found`)** | Navegar manualmente a `/clientes/editar/999999`. | El servidor responde `404 Not Found` y el formulario muestra *"Cliente no encontrado"*. | Aprobado |


## 4. Detalle de Autenticación, Permisos y Estructura JSON por Recurso

- **Autenticación global:** Todos los endpoints (excepto `POST /api/token/`) requieren el encabezado `Authorization: Token <token_usuario>`.
- **Estructura JSON de paginación estándar** (`GET /api/clientes/`, `/api/servicios/`, `/api/tecnicos/`, `/api/solicitudes/`, `/api/asignaciones/`):
  ```json
  {
    "pagina_actual": 1,
    "total_paginas": 2,
    "total_registros": 8,
    "resultados": [ ... ]
  }
  ```
- **Permisos exigidos por Django y estructura JSON de cada entidad:**
  1. **Token (`POST /api/token/`):** Público → `{"token": "string"}`
  2. **Usuario (`GET /api/usuario/`):** Autenticado → `{"id": 1, "username": "string", "is_staff": true, "rol": "string", "grupos": [], "permisos": []}`
  3. **Dashboard (`GET /api/reportes/resumen/`):** `solicitudes.view_solicitud` → `{"solicitudes_por_estado": [], "servicios_mas_solicitados": [], "carga_tecnicos": [], "solicitudes_urgentes": [], "totales": {"total": 0, "abiertas": 0, "resueltas": 0, "canceladas": 0}}`
  4. **Clientes (`/api/clientes/`):** `clientes.{view|add|change|delete}_cliente` → `{"id": 1, "documento": "string", "nombre": "string", "correo": "email", "telefono": "string", "activo": true}`
  5. **Servicios (`/api/servicios/`):** `servicios.{view|add|change|delete}_servicio` → `{"id": 1, "codigo": "string", "nombre": "string", "descripcion": "string", "precio": "25000.00", "activo": true}`
  6. **Técnicos (`/api/tecnicos/`):** `tecnicos.{view|add|change|delete}_tecnico` → `{"id": 1, "identificacion": "string", "nombre": "string", "correo": "email", "activo": true, "servicios": [1]}`
  7. **Solicitudes (`/api/solicitudes/`):** `solicitudes.{view|add|change|delete}_solicitud` → `{"id": 1, "cliente": 1, "servicio": 1, "asunto": "string", "descripcion": "string", "prioridad": "NORMAL", "estado": "PENDIENTE", "fecha_creacion": "ISO-8601"}`
  8. **Asignaciones (`/api/asignaciones/`):** `asignaciones.{view|add|change|delete}_asignacion` → `{"id": 1, "solicitud": 1, "tecnico": 1, "fecha_inicio": "ISO-8601", "fecha_fin": "ISO-8601", "notas": "string"}`