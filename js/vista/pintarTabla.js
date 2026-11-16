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
        const celdaProducto = document.createElement("td");
        const contenido = document.createElement("div");
        contenido.className = "cell-prod";
        const miniatura = document.createElement("span");
        miniatura.className = "thumb";
        miniatura.append(Vista.crearMiniatura(producto));
        contenido.append(miniatura, producto.nombre);
        celdaProducto.append(contenido);
        const celdaCategoria = document.createElement("td");
        celdaCategoria.textContent = producto.categoria;
        const celdaPrecio = document.createElement("td");
        celdaPrecio.className = "num";
        celdaPrecio.textContent = formatoPrecio.format(producto.precio);
        const celdaStock = document.createElement("td");
        celdaStock.className = "num";
        const stock = document.createElement("div");
        stock.className = "stockbar";
        const cantidad = document.createElement("span");
        cantidad.textContent = String(producto.cantidad);
        stock.append(Vista.crearEtiquetaStock(producto), cantidad);
        celdaStock.append(stock);
        const celdaAcciones = document.createElement("td");
        const acciones = document.createElement("div");
        acciones.className = "row-actions";
        [
          ["Editar", "btn btn-secondary btn-sm edit-product"],
          ["Eliminar", "btn btn-danger btn-sm delete-product"],
        ].forEach(([texto, clase]) => {
          const boton = document.createElement("button");
          boton.type = "button";
          boton.className = clase;
          boton.dataset.id = producto.id;
          boton.textContent = texto;
          boton.setAttribute("aria-label", `${texto} ${producto.nombre}`);
          acciones.append(boton);
        });
        celdaAcciones.append(acciones);
        fila.append(
          celdaProducto,
          celdaCategoria,
          celdaPrecio,
          celdaStock,
          celdaAcciones,
        );
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
