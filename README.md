![Banner editorial de Bruma Café, café de especialidad colombiano](assets/banner.svg)

# Bruma Café

Landing page de una tienda de café de especialidad. Proyecto académico construido con HTML, CSS y JavaScript para presentar una marca, su catálogo y contenido informativo en una sola página, además de registrar pedidos en el navegador.

## Inicio rápido

No requiere instalación de dependencias ni compilación. Como el JavaScript usa módulos, abre el proyecto desde un servidor local; no abras `index.html` directamente como archivo.

1. Abre la carpeta del proyecto en un editor como Visual Studio Code.
2. Inicia un servidor local desde esa carpeta, por ejemplo con la extensión Live Server.
3. Abre en el navegador la dirección local que indique el servidor.

Las tipografías DM Sans y Fraunces, así como las imágenes del catálogo, se cargan desde servicios externos; se requiere conexión a Internet para mostrarlas. Si las fuentes no están disponibles, el navegador usa tipografías genéricas de respaldo.

## Estructura de archivos

```text
.
├── index.html
├── css/
│   └── styles.css
├── js/
│   ├── controller.js
│   ├── model.js
│   ├── querys.js
│   └── view.js
└── assets/
    ├── logo.svg
    └── banner.svg
```

- `index.html`: contenido, estructura semántica, navegación, catálogo, formulario y preguntas frecuentes.
- `css/styles.css`: estilos, distribución con Grid y Flexbox, estados de foco y adaptación responsive.
- `js/controller.js`: valida el formulario y coordina el registro, eliminación y actualización de pedidos.
- `js/model.js`: consulta y guarda pedidos en el almacenamiento local del navegador (`localStorage`).
- `js/view.js`: muestra mensajes y renderiza los pedidos guardados en la página.
- `js/querys.js`: contiene una función auxiliar para seleccionar elementos del DOM.
- `assets/logo.svg`: logotipo vectorial usado en encabezado, pie de página y favicon.
- `assets/banner.svg`: banner editorial del proyecto.

## Contenido

- Doble navegación: menú superior y menú lateral por anclas.
- Catálogo con tres productos y etiquetas de estado.
- Especificaciones técnicas y tabla de garantías.
- Promociones, categorías e indicadores de stock y satisfacción.
- Formulario de registro de pedidos con validación del navegador; los pedidos se conservan en `localStorage` y pueden eliminarse desde la página.
- Preguntas frecuentes expandibles.
- Diseño responsive para escritorio, tablet y móvil.
