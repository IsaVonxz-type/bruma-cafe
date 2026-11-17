"use strict";

// Combina filtros leídos de la vista con orden y paginación para volver a pintar la tabla.
const ControladorTabla = (() => {
  // Estado de la tabla: columna y sentido del orden, y página actual.
  const estado = { columna: "nombre", direccion: "asc", pagina: 1 };

  function consultarActual() {
    const filtros = VistaTabla.leerFiltros();
    return ModeloTabla.consultar(Modelo.productos, { ...filtros, ...estado });
  }

  // Repinta categorías, filas y paginación; si la categoría elegida ya no existe vuelve a "Todas".
  function actualizar() {
    const categorias = [
      ...new Set(Modelo.productos.map((producto) => producto.categoria)),
    ];
    const filtros = VistaTabla.leerFiltros();
    const activa = categorias.includes(filtros.categoria)
      ? filtros.categoria
      : "Todas";
    VistaTabla.pintarCategorias(categorias, activa);
    const resultado = ModeloTabla.paginar(consultarActual(), estado.pagina);
    estado.pagina = resultado.pagina;
    VistaTabla.pintar(resultado, estado.columna, estado.direccion);
  }

  // Al cambiar un filtro se vuelve a la página 1 para no quedar en una página que ya no existe.
  function reiniciarPagina() {
    estado.pagina = 1;
    actualizar();
  }

  // Pulsar la misma columna invierte el sentido; una columna distinta empieza en ascendente.
  function ordenarPor(columna) {
    estado.direccion =
      estado.columna === columna && estado.direccion === "asc" ? "desc" : "asc";
    estado.columna = columna;
    reiniciarPagina();
  }

  function exportarCsv() {
    const lista = consultarActual();
    VistaTabla.descargarCsv(ModeloTabla.aCsv(lista), "inventario-bruma.csv");
    VistaTabla.mostrarMensaje(
      `Se exportaron ${lista.length} registros a inventario-bruma.csv.`,
    );
  }

  function iniciar() {
    document
      .querySelector("#table-search")
      .addEventListener("input", reiniciarPagina);
    document
      .querySelector("#table-category")
      .addEventListener("change", reiniciarPagina);
    document
      .querySelector("#table-stock")
      .addEventListener("change", reiniciarPagina);
    // Delegación de eventos: un solo listener en el encabezado atiende todos los botones de ordenar.
    document
      .querySelector("#data-table thead")
      .addEventListener("click", (evento) => {
        const boton = evento.target.closest("button[data-column]");
        if (boton) ordenarPor(boton.dataset.column);
      });
    document.querySelector("#table-prev").addEventListener("click", () => {
      estado.pagina -= 1;
      actualizar();
    });
    document.querySelector("#table-next").addEventListener("click", () => {
      estado.pagina += 1;
      actualizar();
    });
    document
      .querySelector("#table-export")
      .addEventListener("click", exportarCsv);
  }

  return { iniciar, actualizar };
})();
