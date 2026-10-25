"use strict";

const Controlador = (() => {
  let idEditando = null;
  let categoriaActiva = "Todas";
  let busqueda = "";
  let temporizadorContacto;

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
    console.info(`Inventario actualizado: ${datos.nombre}`);
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

  function mostrarMensajeContacto(mensaje, error = false) {
    const estado = document.querySelector("#form-status");
    clearTimeout(temporizadorContacto);
    estado.textContent = mensaje;
    estado.classList.toggle("has-error", error);
    if (mensaje)
      temporizadorContacto = setTimeout(() => {
        estado.textContent = "";
      }, 5000);
  }

  function iniciar() {
    Modelo.cargar();
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
    document
      .querySelector("#product-list")
      .addEventListener("click", (evento) => {
        const boton = evento.target.closest("button[data-id]");
        if (!boton) {
          evento.target
            .closest(".product-card")
            ?.classList.toggle("is-selected");
          return;
        }
        const id = Number(boton.dataset.id);
        if (boton.classList.contains("edit-product")) {
          const producto = Modelo.buscarPorId(id);
          if (producto) {
            idEditando = id;
            Vista.llenarFormulario(producto);
            Vista.mostrarMensaje(`Editando ${producto.nombre}.`);
          }
        } else if (boton.classList.contains("delete-product")) {
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
        document.querySelector("#product-search").value = "";
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
        const nombre = formulario.elements.nombre.value.trim();
        try {
          const pedido = Modelo.pedidos.agregar({
            nombre,
            email: formulario.elements.email.value.trim(),
            telefono: formulario.elements.telefono.value.trim(),
          });
          formulario.reset();
          mostrarMensajeContacto(
            `Gracias, ${nombre}. Recibimos tu mensaje y pronto te contactaremos.`,
          );
          Vista.renderizarPedidos(Modelo.pedidos.listar(), pedido.id);
        } catch {
          mostrarMensajeContacto(
            "No se pudo guardar el mensaje en este navegador.",
            true,
          );
        }
      });
    document
      .querySelector("#saved-orders")
      .addEventListener("click", (evento) => {
        const boton = evento.target.closest(".remove-order");
        if (!boton) return;
        const articulo = boton.closest(".saved-order");
        articulo.classList.add("saved-order--removing");
        setTimeout(() => {
          Modelo.pedidos.eliminar(articulo.dataset.orderId);
          Vista.renderizarPedidos(Modelo.pedidos.listar());
          mostrarMensajeContacto("Pedido eliminado.");
        }, 260);
      });

    const tema = document.querySelector(".theme-toggle");
    if (localStorage.getItem("bruma-theme") === "dark") {
      document.documentElement.dataset.theme = "dark";
      tema.setAttribute("aria-label", "Activar modo claro");
      tema.setAttribute("aria-pressed", "true");
    }
    tema.addEventListener("click", () => {
      const oscuro = document.documentElement.dataset.theme !== "dark";
      document.documentElement.dataset.theme = oscuro ? "dark" : "light";
      tema.setAttribute(
        "aria-label",
        oscuro ? "Activar modo claro" : "Activar modo oscuro",
      );
      tema.setAttribute("aria-pressed", String(oscuro));
      localStorage.setItem("bruma-theme", oscuro ? "dark" : "light");
    });
    console.info("Bruma Café: inventario cargado correctamente.");
  }

  document.addEventListener("DOMContentLoaded", iniciar);
  return { iniciar };
})();
