"use strict";

const ModeloTabla = (() => {
  const tamanoPagina = 5;
  const columnas = {
    nombre: { etiqueta: "Producto", numerica: false },
    categoria: { etiqueta: "Categoría", numerica: false },
    precio: { etiqueta: "Precio (COP)", numerica: true },
    cantidad: { etiqueta: "Cantidad", numerica: true },
  };

  function coincideDisponibilidad(producto, disponibilidad) {
    if (disponibilidad === "disponibles") return producto.cantidad > 0;
    if (disponibilidad === "bajo") return Modelo.estadoStock(producto) === "bajo";
    if (disponibilidad === "agotados") return producto.cantidad === 0;
    return true;
  }

  function celdaCsv(valor) {
    const texto = String(valor);
    const seguro = /^[=+\-@\t\r]/.test(texto) ? `'${texto}` : texto;
    return `"${seguro.replaceAll('"', '""')}"`;
  }

  return {
    columnas,
    consultar(productos, filtros) {
      const texto = filtros.busqueda.trim().toLocaleLowerCase();
      const factor = filtros.direccion === "desc" ? -1 : 1;
      const { numerica } = columnas[filtros.columna];
      return productos
        .filter((producto) => {
          const coincideTexto = `${producto.nombre} ${producto.categoria}`
            .toLocaleLowerCase()
            .includes(texto);
          const coincideCategoria =
            filtros.categoria === "Todas" ||
            producto.categoria === filtros.categoria;
          const coincideStock = coincideDisponibilidad(
            producto,
            filtros.disponibilidad,
          );
          return coincideTexto && coincideCategoria && coincideStock;
        })
        .sort((a, b) => {
          const x = a[filtros.columna];
          const y = b[filtros.columna];
          const orden = numerica
            ? x - y
            : String(x).localeCompare(String(y), "es");
          return orden * factor;
        });
    },
    paginar(lista, pagina) {
      const totalPaginas = Math.max(1, Math.ceil(lista.length / tamanoPagina));
      const actual = Math.min(Math.max(1, pagina), totalPaginas);
      const inicio = (actual - 1) * tamanoPagina;
      return {
        items: lista.slice(inicio, inicio + tamanoPagina),
        pagina: actual,
        totalPaginas,
        total: lista.length,
      };
    },
    aCsv(lista) {
      const encabezado = Object.values(columnas)
        .map((columna) => celdaCsv(columna.etiqueta))
        .join(",");
      const filas = lista.map((producto) =>
        Object.keys(columnas)
          .map((clave) => celdaCsv(producto[clave]))
          .join(","),
      );
      return `﻿${[encabezado, ...filas].join("\r\n")}`;
    },
  };
})();
