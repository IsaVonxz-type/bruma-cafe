![Banner editorial de Bruma Café, café de especialidad colombiano](assets/banner.svg)

# Bruma Café

Landing page de una tienda de café de especialidad. Proyecto académico construido con HTML, CSS y JavaScript para presentar una marca, su catálogo y contenido informativo en una sola página, además de registrar pedidos en el navegador.

## Inicio rápido

No requiere instalación de dependencias ni compilación. Abre la carpeta del proyecto en un editor como Visual Studio Code y ábrelo con la extensión Live Server (o cualquier servidor local).

Las tipografías DM Sans y Fraunces se cargan desde Google Fonts y requieren conexión a Internet; sin ella el navegador usa tipografías de respaldo. Las fotos de los productos son locales, en `assets/`.

## Estructura de archivos

```text
.
├── index.html
├── css/
│   └── styles.css
├── js/
│   └── app.js
└── assets/
    ├── logo.svg
    ├── banner.svg
    └── *.jpg
```

- `index.html`: contenido, estructura semántica, navegación, catálogo, formulario y preguntas frecuentes.
- `css/styles.css`: estilos, distribución con Grid y Flexbox, estados de foco y adaptación responsive.
- `js/app.js`: datos, validaciones, render de tarjetas, filtros, búsqueda, resumen, pedidos de contacto en `localStorage` y arranque.
- `assets/logo.svg`: logotipo vectorial usado en encabezado, pie de página y favicon.
- `assets/banner.svg`: banner editorial del proyecto.
- `assets/*.jpg`: fotos locales de los productos.

## Contenido y funcionalidades

- Cabecera con un solo `h1`, menú superior y menú lateral por anclas. En móvil la barra lateral pasa arriba del contenido.
- Inventario de 6 productos pintados desde JavaScript con `createElement` y `appendChild`.
- Agregar productos con validaciones (campo vacío, número inválido o negativo, nombre repetido, URL de imagen y máximo 50 bolsas de grano). Los errores se muestran en la página.
- Buscador en vivo, sin distinguir mayúsculas, con contador y aviso sin coincidencias.
- Filtros por categoría creados desde JavaScript y combinados con el buscador.
- Eliminar productos con delegación de eventos. Agregar y eliminar abren un cuadro de confirmación estilizado (`<dialog>`) con el nombre del producto antes de aplicar el cambio.
- Resumen lateral (registros, agotados, unidades) con `filter` y `reduce`, y tabla de resumen, ambos actualizados en cada cambio.
- Estados visuales con `classList`: `is-empty`, `is-selected`, `has-error`.
- Formulario de contacto con validación del navegador; al enviar muestra un mensaje con el nombre, limpia el formulario y guarda el pedido en `localStorage`, desde donde puede eliminarse.
- Tema claro y oscuro con preferencia guardada.
- Preguntas frecuentes expandibles y diseño responsive.
- Consola: mensajes `console.info` y `console.table` del inventario al cargar, agregar y eliminar.
