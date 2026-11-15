"use strict";

const VistaTabla = (() => {
  const formatoPrecio = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });
  const cuerpo = document.querySelector("#table-body");
  const selectorCategoria = document.querySelector("#table-category");

  return {
    leerFiltros() {
      return {
        busqueda: document.querySelector("#table-search").value,
        categoria: selectorCategoria.value,
        disponibilidad: document.querySelector("#table-stock").value,
      };
    },
    pintarCategorias(categorias, activa) {
      selectorCategoria.replaceChildren();
      ["Todas", ...categorias].forEach((categoria) => {
        const opcion = document.createElement("option");
        opcion.value = categoria;
        opcion.textContent = categoria;
        opcion.selected = categoria === activa;
        selectorCategoria.append(opcion);
      });
    },
    pintar(resultado, columna, direccion) {
      cuerpo.replaceChildren();
      resultado.items.forEach((producto) => {
        const fila = document.createElement("tr");
        [
          producto.nombre,
          producto.categoria,
          formatoPrecio.format(producto.precio),
          String(producto.cantidad),
        ].forEach((valor) => {
          const celda = document.createElement("td");
          celda.textContent = valor;
          fila.append(celda);
        });
        cuerpo.append(fila);
      });
      document.querySelector("#table-empty").hidden = resultado.total > 0;
      document.querySelectorAll("th[data-column]").forEach((encabezado) => {
        const activo = encabezado.dataset.column === columna;
        encabezado.setAttribute(
          "aria-sort",
          activo ? (direccion === "asc" ? "ascending" : "descending") : "none",
        );
      });
      document.querySelector("#table-count").textContent =
        `${resultado.total} ${resultado.total === 1 ? "registro" : "registros"}`;
      document.querySelector("#table-page").textContent =
        `Página ${resultado.pagina} de ${resultado.totalPaginas}`;
      document.querySelector("#table-prev").disabled = resultado.pagina <= 1;
      document.querySelector("#table-next").disabled =
        resultado.pagina >= resultado.totalPaginas;
      document.querySelector("#table-export").disabled = resultado.total === 0;
    },
    mostrarMensaje(mensaje) {
      document.querySelector("#table-status").textContent = mensaje;
    },
    descargarCsv(contenido, nombreArchivo) {
      const url = URL.createObjectURL(
        new Blob([contenido], { type: "text/csv;charset=utf-8" }),
      );
      const enlace = document.createElement("a");
      enlace.href = url;
      enlace.download = nombreArchivo;
      enlace.click();
      URL.revokeObjectURL(url);
    },
  };
})();
