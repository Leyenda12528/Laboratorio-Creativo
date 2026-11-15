# Laboratorio Creativo

Aplicación educativa para crear proyectos web pegando código generado con herramientas de IA externas. La primera versión funciona como sitio estático y no necesita API Key, servidor ni cuenta.

## Incluye

- Editor separado para HTML, CSS y JavaScript.
- Vista previa actualizada al editar, ejecutada en un `iframe` con `sandbox="allow-scripts"` y sin acceso al origen de la aplicación.
- Misiones con objetivos y prompts para copiar a una herramienta externa.
- Proyectos, progreso y misión seleccionada guardados localmente en el navegador.
- Exportación e importación de respaldo JSON.
- Interfaz adaptable a escritorio y teléfono.

## Abrir en Windows

No abras `index.html` directamente: los navegadores bloquean los módulos del editor cuando se abre desde el disco. Haz doble clic en `Abrir-Laboratorio.bat`. Se abrirá la aplicación en `http://localhost:4173`. Mantén abierta la ventana mientras la uses; al cerrarla, se detiene el servidor local.

También puedes iniciar el servidor con Node.js:

```sh
node server.mjs
```

Después visita `http://localhost:4173`.

## Publicar en GitHub Pages

El flujo incluido en `.github/workflows/pages.yml` publica la carpeta raíz cuando se actualiza la rama `main`.

1. Sube estos archivos a un repositorio independiente y a la rama `main`.
2. En GitHub, abre **Settings → Pages** y selecciona **GitHub Actions** como origen.
3. Espera a que termine el flujo de publicación y abre la URL indicada en GitHub.

No hay dependencias que instalar ni secretos que configurar para esta versión. La app no envía proyectos a un servidor; borrar los datos del navegador puede borrar los proyectos, así que descargue respaldos con regularidad.

## Persistencia futura

La clave de almacenamiento local está versionada (`laboratorio-creativo:v1`) para facilitar una migración. La integración futura con Supabase debe añadir autenticación y reglas de acceso en el servidor. No incluir contraseñas, PIN administrativos ni claves secretas en el JavaScript público.
