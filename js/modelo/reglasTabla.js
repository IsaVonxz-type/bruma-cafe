"use strict";

// Transforma datos del inventario en resultados filtrados, ordenados, paginados y exportables.
const ModeloTabla = (() => {
  // Filas que se muestran por página en la tabla de inventario.
  const tamanoPagina = 5;
  // Columnas ordenables y exportables numerica decide si se ordena por resta o como texto.
  const columnas = {
    nombre: { etiqueta: "Producto", numerica: false },
    categoria: { etiqueta: "Categoría", numerica: false },
    precio: { etiqueta: "Precio (COP)", numerica: true },
    cantidad: { etiqueta: "Cantidad", numerica: true },
  };

  // "bajo" usa la misma regla del modelo (estadoStock) para que tabla e indicadores coincidan.
  function coincideDisponibilidad(producto, disponibilidad) {
    if (disponibilidad === "disponibles") return producto.cantidad > 0;
    if (disponibilidad === "bajo") return Modelo.estadoStock(producto) === "bajo";
    if (disponibilidad === "agotados") return producto.cantidad === 0;
    return true;
  }

  function celdaCsv(valor) {
    const texto = String(valor);
    // Evita que valores que empiezan con operadores se ejecuten como fórmulas en hojas de cálculo.
    const seguro = /^[=+\-@\t\r]/.test(texto) ? `'${texto}` : texto;
    return `"${seguro.replaceAll('"', '""')}"`;
  }

  return {
    columnas,
    // Aplica búsqueda, categoría y disponibilidad con filter, y luego ordena con sort.
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
          // Los números se comparan por resta; el texto con localeCompare para respetar las tildes.
          const orden = numerica
            ? x - y
            : String(x).localeCompare(String(y), "es");
          return orden * factor;
        });
    },
    // Limita la página pedida a un rango válido y devuelve solo las filas de esa página.
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
    // Genera el texto del CSV; el carácter invisible del inicio (BOM) hace que Excel respete las tildes.
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
