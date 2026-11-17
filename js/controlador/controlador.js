"use strict";

// Coordina eventos y operaciones entre modelo, vistas y servicio remoto.
const Controlador = (() => {
  let idEditando = null;
  let categoriaActiva = "Todas";
  let busqueda = "";

  function actualizarVista() {
    if (
      categoriaActiva !== "Todas" &&
      !Modelo.productos.some(
        (producto) => producto.categoria === categoriaActiva,
      )
    )
      categoriaActiva = "Todas";
    Vista.pintarProductos(Modelo.productos, busqueda, categoriaActiva);
    Vista.pintarResumen(Modelo.productos, Modelo);
    Vista.pintarDestacados(Modelo.productos);
    ControladorTabla.actualizar();
  }

  function cancelarEdicion() {
    idEditando = null;
    Vista.limpiarFormulario();
    Vista.mostrarMensaje("");
  }

  async function guardarProducto(evento) {
    evento.preventDefault();
    const datos = Vista.leerFormulario();
    const errores = Modelo.validar(datos, idEditando);
    if (errores.length) {
      Vista.mostrarMensaje(errores.join(" "), "error");
      return;
    }
    const editando = idEditando !== null;
    const titulo = editando ? "Guardar cambios" : "Agregar producto";
    const accion = editando ? "Guardar" : "Agregar";
    const aceptado = await Vista.confirmar(
      titulo,
      `${editando ? "¿Actualizar" : "¿Agregar"} "${datos.nombre}" ${editando ? "en el" : "al"} inventario?`,
      accion,
    );
    if (!aceptado) return;
    const guardado = editando
      ? Modelo.actualizar(idEditando, datos)
      : Modelo.agregar(datos);
    if (!guardado) {
      Vista.mostrarMensaje(
        "No se pudo guardar en este navegador. Revisa el almacenamiento disponible.",
        "error",
      );
      return;
    }
    cancelarEdicion();
    Vista.mostrarMensaje(
      `${datos.nombre} ${editando ? "actualizado" : "agregado"} en el inventario.`,
    );
    actualizarVista();
  }

  async function eliminarProducto(id) {
    const producto = Modelo.buscarPorId(id);
    if (!producto) return;
    const aceptado = await Vista.confirmar(
      "Eliminar producto",
      `¿Eliminar "${producto.nombre}" del inventario?`,
      "Eliminar",
      true,
    );
    if (!aceptado) return;
    if (!Modelo.eliminar(id)) {
      Vista.mostrarMensaje(
        "No se pudo eliminar el producto del almacenamiento.",
        "error",
      );
      return;
    }
    if (idEditando === id) cancelarEdicion();
    Vista.mostrarMensaje(`${producto.nombre} eliminado del inventario.`);
    actualizarVista();
  }

  async function ejecutarQuanty(tarea) {
    const clave = Vista.leerClaveQuanty();
    if (!clave) {
      Vista.mostrarEstadoQuanty("Pega primero la clave de Quanty.", "error");
      return;
    }
    Modelo.quanty.guardarClave(clave);
    Vista.cargandoQuanty(true);
    Vista.mostrarEstadoQuanty("Conectando con Quanty...", "loading");
    try {
      await tarea(clave);
    } catch (error) {
      Vista.mostrarEstadoQuanty(error.message, "error");
    } finally {
      Vista.cargandoQuanty(false);
    }
  }

  function probarClaveQuanty() {
    return ejecutarQuanty(async (clave) => {
      const valida = await ApiQuanty.probarClave(clave);
      Vista.mostrarEstadoQuanty(
        valida
          ? "Clave válida. Ya puedes enviar tus datos."
          : "Quanty no confirmó la clave.",
        valida ? "ok" : "error",
      );
    });
  }

  function traerStockQuanty() {
    return ejecutarQuanty(async (clave) => {
      const remotos = await ApiQuanty.consultarStock(clave);
      // Se captura antes de sincronizar para conservar visible la diferencia aplicada.
      const comparacion = Modelo.quanty.compararStock(remotos);
      const sincronizacion = Modelo.quanty.sincronizarStock(remotos);
      if (!sincronizacion.ok)
        throw new Error(
          "Quanty devolvió el stock, pero no se pudo guardar en este navegador.",
        );
      actualizarVista();
      Vista.pintarStockQuanty(comparacion, sincronizacion.actualizados);
      Vista.mostrarEstadoQuanty(
        `Stock recibido de Quanty: ${remotos.length} ${remotos.length === 1 ? "producto" : "productos"}. ${sincronizacion.actualizados} ${sincronizacion.actualizados === 1 ? "cantidad actualizada" : "cantidades actualizadas"} en Bruma.`,
      );
    });
  }

  function enviarAQuanty(evento) {
    evento.preventDefault();
    return ejecutarQuanty(async (clave) => {
      const envio = Modelo.quanty.construirEnvio();
      if (!envio.productos && !envio.contactos) {
        Vista.mostrarEstadoQuanty(
          "No hay productos ni contactos para enviar.",
          "error",
        );
        return;
      }
      const respuesta = await ApiQuanty.importar(clave, envio);
      Vista.pintarResultadoQuanty(respuesta);
      Vista.mostrarEstadoQuanty("Datos enviados a Quanty correctamente.");
    });
  }

  function iniciar() {
    Modelo.cargar();
    ControladorTabla.iniciar();
    Vista.llenarClaveQuanty(Modelo.quanty.leerClave());
    document
      .querySelector("#quanty-form")
      .addEventListener("submit", enviarAQuanty);
    document
      .querySelector("#quanty-test")
      .addEventListener("click", probarClaveQuanty);
    document
      .querySelector("#quanty-stock-load")
      .addEventListener("click", traerStockQuanty);
    document
      .querySelector("#quanty-forget")
      .addEventListener("click", () => {
        Modelo.quanty.borrarClave();
        Vista.llenarClaveQuanty("");
        Vista.limpiarResultadoQuanty();
        Vista.mostrarEstadoQuanty("Clave eliminada de este navegador.");
      });
    actualizarVista();
    Vista.renderizarPedidos(Modelo.pedidos.listar());

    document
      .querySelector("#record-form")
      .addEventListener("submit", guardarProducto);
    document
      .querySelector("#cancel-edit")
      .addEventListener("click", cancelarEdicion);
    document
      .querySelector("#product-search")
      .addEventListener("input", (evento) => {
        busqueda = evento.target.value;
        actualizarVista();
      });
    document
      .querySelector("#category-filters")
      .addEventListener("click", (evento) => {
        const boton = evento.target.closest("button[data-category]");
        if (!boton) return;
        categoriaActiva = boton.dataset.category;
        actualizarVista();
      });
    document.querySelector("#new-product").addEventListener("click", () => {
      cancelarEdicion();
      Vista.abrirFormulario();
    });
    document
      .querySelector("#product-dialog")
      .addEventListener("close", cancelarEdicion);
    document
      .querySelector("#record-form")
      .addEventListener("input", () => Vista.pintarVistaPrevia());
    window.addEventListener("hashchange", () =>
      Vista.mostrarRuta(location.hash),
    );
    Vista.mostrarRuta(location.hash);
    document
      .querySelector("#table-body")
      .addEventListener("click", (evento) => {
        const boton = evento.target.closest("button[data-id]");
        if (!boton) return;
        const id = Number(boton.dataset.id);
        if (boton.classList.contains("data-table__edit")) {
          const producto = Modelo.buscarPorId(id);
          if (producto) {
            idEditando = id;
            Vista.llenarFormulario(producto);
          }
        } else if (boton.classList.contains("data-table__delete")) {
          eliminarProducto(id);
        }
      });
    document
      .querySelector("#restore-products")
      .addEventListener("click", async () => {
        const aceptado = await Vista.confirmar(
          "Restaurar ejemplos",
          "Se reemplazará el inventario guardado por los productos de ejemplo.",
          "Restaurar",
          true,
        );
        if (!aceptado) return;
        if (!Modelo.restaurar()) {
          Vista.mostrarMensaje(
            "No se pudieron restaurar los datos de ejemplo.",
            "error",
          );
          return;
        }
        cancelarEdicion();
        busqueda = "";
        Vista.limpiarBusqueda();
        categoriaActiva = "Todas";
        Vista.mostrarMensaje("Inventario de ejemplo restaurado.");
        actualizarVista();
      });
    document
      .querySelector("#contact-form")
      .addEventListener("submit", (evento) => {
        evento.preventDefault();
        const formulario = evento.currentTarget;
        if (!formulario.reportValidity()) return;
        const datos = Vista.leerContacto(formulario);
        try {
          const pedido = Modelo.pedidos.agregar(datos);
          formulario.reset();
          Vista.mostrarMensajeContacto(
            `Gracias, ${datos.nombre}. Recibimos tu mensaje y pronto te contactaremos.`,
          );
          Vista.renderizarPedidos(Modelo.pedidos.listar(), pedido.id);
        } catch {
          Vista.mostrarMensajeContacto(
            "No se pudo guardar el mensaje en este navegador.",
            true,
          );
        }
      });
    document
      .querySelector("#saved-orders")
      .addEventListener("click", (evento) => {
        const boton = evento.target.closest(".saved-order__remove");
        if (!boton) return;
        const articulo = boton.closest(".saved-order");
        articulo.classList.add("saved-order--removing");
        setTimeout(() => {
          Modelo.pedidos.eliminar(articulo.dataset.orderId);
          Vista.renderizarPedidos(Modelo.pedidos.listar());
          Vista.mostrarMensajeContacto("Pedido eliminado.");
        }, 260);
      });

    if (Modelo.tema.esOscuro()) Vista.aplicarTema(true);
    document
      .querySelector(".theme-toggle")
      .addEventListener("click", () => {
        const oscuro = !Vista.temaEsOscuro();
        Vista.aplicarTema(oscuro);
        Modelo.tema.guardar(oscuro);
      });
  }

  return { iniciar };
})();
