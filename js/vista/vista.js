"use strict";

const Vista = (() => {
  const formatoPrecio = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });
  const formatoFecha = new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const productList = document.querySelector("#product-list");
  const categoryFilters = document.querySelector("#category-filters");
  const recordForm = document.querySelector("#record-form");
  let temporizadorContacto;

  return {
    leerFormulario() {
      const datos = new FormData(recordForm);
      return {
        nombre: String(datos.get("nombre") || "").trim(),
        precio: Number(datos.get("precio")),
        categoria: String(datos.get("categoria") || ""),
        cantidad: Number(datos.get("cantidad")),
        imagen: String(datos.get("imagen") || "").trim(),
      };
    },
    llenarFormulario(producto) {
      for (const [campo, valor] of Object.entries(producto)) {
        if (recordForm.elements[campo])
          recordForm.elements[campo].value = valor;
      }
      document.querySelector("#record-form-title").textContent =
        "Editar producto";
      document.querySelector("#save-product").textContent = "Guardar cambios";
      document.querySelector("#cancel-edit").hidden = false;
      document
        .querySelector("#catalogo")
        .scrollIntoView({ behavior: "smooth", block: "start" });
      recordForm.elements.nombre.focus();
    },
    limpiarFormulario() {
      recordForm.reset();
      document.querySelector("#record-form-title").textContent =
        "Agregar producto";
      document.querySelector("#save-product").textContent =
        "Agregar al inventario";
      document.querySelector("#cancel-edit").hidden = true;
    },
    mostrarMensaje(mensaje, tipo = "ok") {
      const status = document.querySelector("#record-status");
      status.textContent = mensaje;
      status.classList.toggle("has-error", tipo === "error");
      status.dataset.type = tipo;
    },
    pintarProductos(productos, busqueda, categoria) {
      const query = busqueda.toLocaleLowerCase();
      const filtrados = productos.filter((producto) => {
        const categoriaValida =
          categoria === "Todas" || producto.categoria === categoria;
        const textoValido = `${producto.nombre} ${producto.categoria}`
          .toLocaleLowerCase()
          .includes(query);
        return categoriaValida && textoValido;
      });
      productList.replaceChildren();
      filtrados.forEach((producto) => {
        const tarjeta = document.createElement("article");
        tarjeta.className = `product-card${producto.cantidad === 0 ? " is-empty" : ""}`;
        tarjeta.dataset.id = producto.id;
        const imagen = document.createElement("img");
        imagen.src = producto.imagen;
        imagen.alt = `Café ${producto.nombre}`;
        imagen.loading = "lazy";
        const etiqueta = document.createElement("span");
        etiqueta.className = "product-tag";
        etiqueta.textContent = producto.categoria;
        const titulo = document.createElement("h3");
        titulo.textContent = producto.nombre;
        const detalle = document.createElement("p");
        detalle.textContent = `${formatoPrecio.format(producto.precio)} · ${producto.cantidad} bolsas`;
        const stock = document.createElement("p");
        stock.className = "stock-status";
        stock.textContent = producto.cantidad === 0 ? "Agotado" : "Disponible";
        const acciones = document.createElement("div");
        acciones.className = "product-actions";
        [
          ["Editar", "edit-product"],
          ["Eliminar", "delete-product"],
        ].forEach(([texto, clase]) => {
          const boton = document.createElement("button");
          boton.type = "button";
          boton.className = clase;
          boton.dataset.id = producto.id;
          boton.textContent = texto;
          acciones.append(boton);
        });
        tarjeta.append(imagen, etiqueta, titulo, detalle, stock, acciones);
        productList.append(tarjeta);
      });
      document.querySelector("#result-count").textContent =
        `${filtrados.length} ${filtrados.length === 1 ? "resultado" : "resultados"}`;
      document.querySelector("#empty-results").hidden = filtrados.length > 0;
      this.pintarFiltros(productos, categoria);
    },
    pintarFiltros(productos, categoriaActiva) {
      const categorias = [
        "Todas",
        ...new Set(productos.map((producto) => producto.categoria)),
      ];
      categoryFilters.replaceChildren();
      categorias.forEach((categoria) => {
        const boton = document.createElement("button");
        boton.type = "button";
        boton.className = `filter-button${categoria === categoriaActiva ? " is-selected" : ""}`;
        boton.dataset.category = categoria;
        boton.textContent = categoria;
        categoryFilters.append(boton);
      });
    },
    pintarResumen(productos, modelo) {
      document.querySelector("#summary-total").textContent = productos.length;
      document.querySelector("#summary-empty").textContent = productos.filter(
        (producto) => producto.cantidad === 0,
      ).length;
      document.querySelector("#summary-quantity").textContent =
        modelo.totalUnidades();
      document.querySelector("#summary-value").textContent =
        formatoPrecio.format(modelo.valorInventario());
    },
    leerContacto(formulario) {
      return {
        nombre: formulario.elements.nombre.value.trim(),
        email: formulario.elements.email.value.trim(),
        telefono: formulario.elements.telefono.value.trim(),
      };
    },
    mostrarMensajeContacto(mensaje, error = false) {
      const estado = document.querySelector("#form-status");
      clearTimeout(temporizadorContacto);
      estado.textContent = mensaje;
      estado.classList.toggle("has-error", error);
      if (mensaje)
        temporizadorContacto = setTimeout(() => {
          estado.textContent = "";
        }, 5000);
    },
    limpiarBusqueda() {
      document.querySelector("#product-search").value = "";
    },
    aplicarTema(oscuro) {
      const boton = document.querySelector(".theme-toggle");
      document.documentElement.dataset.theme = oscuro ? "dark" : "light";
      boton.setAttribute(
        "aria-label",
        oscuro ? "Activar modo claro" : "Activar modo oscuro",
      );
      boton.setAttribute("aria-pressed", String(oscuro));
    },
    temaEsOscuro() {
      return document.documentElement.dataset.theme === "dark";
    },
    confirmar(titulo, mensaje, accion, peligro = false) {
      const dialogo = document.querySelector("#confirm-dialog");
      dialogo.querySelector("#confirm-title").textContent = titulo;
      dialogo.querySelector("#confirm-message").textContent = mensaje;
      const aceptar = dialogo.querySelector("#confirm-accept");
      aceptar.textContent = accion;
      aceptar.classList.toggle("is-danger", peligro);
      dialogo.returnValue = "cancel";
      dialogo.showModal();
      return new Promise((resolve) => {
        const terminar = (aceptado) => {
          dialogo.removeEventListener("close", cerrar);
          dialogo.querySelector("form").removeEventListener("submit", enviar);
          resolve(aceptado);
        };
        const cerrar = () => terminar(dialogo.returnValue === "accept");
        const enviar = (evento) =>
          terminar(evento.submitter.value === "accept");
        dialogo.addEventListener("close", cerrar);
        dialogo.querySelector("form").addEventListener("submit", enviar);
      });
    },
    renderizarPedidos(pedidos, destacadoId) {
      const contenedor = document.querySelector("#saved-orders");
      contenedor.replaceChildren();
      if (!pedidos.length) return;
      const encabezado = document.createElement("h3");
      encabezado.textContent = "Pedidos guardados";
      contenedor.append(encabezado);
      pedidos.forEach((pedido) => {
        const articulo = document.createElement("article");
        articulo.className = `saved-order${pedido.id === destacadoId ? " saved-order--new" : ""}`;
        articulo.dataset.orderId = pedido.id;
        const nombre = document.createElement("h3");
        nombre.textContent = pedido.nombre;
        const datos = document.createElement("p");
        datos.textContent = `${pedido.email} · ${formatoFecha.format(new Date(pedido.createdAt))}`;
        const telefono = document.createElement("p");
        telefono.textContent = `Teléfono: ${pedido.telefono}`;
        const eliminar = document.createElement("button");
        eliminar.type = "button";
        eliminar.className = "remove-order";
        eliminar.textContent = "Eliminar";
        articulo.append(nombre, datos, telefono, eliminar);
        contenedor.append(articulo);
      });
    },
    leerClaveQuanty() {
      return document.querySelector("#quanty-key").value.trim();
    },
    llenarClaveQuanty(clave) {
      document.querySelector("#quanty-key").value = clave;
    },
    mostrarEstadoQuanty(mensaje, tipo = "ok") {
      const estado = document.querySelector("#quanty-status");
      estado.textContent = mensaje;
      estado.classList.toggle("has-error", tipo === "error");
      estado.classList.toggle("is-loading", tipo === "loading");
    },
    cargandoQuanty(cargando) {
      const formulario = document.querySelector("#quanty-form");
      formulario.setAttribute("aria-busy", String(cargando));
      formulario
        .querySelectorAll("button")
        .forEach((boton) => (boton.disabled = cargando));
    },
    pintarResultadoQuanty(respuesta) {
      const contenedor = document.querySelector("#quanty-result");
      contenedor.replaceChildren();
      const secciones = [
        ["Productos", respuesta.productos],
        ["Contactos", respuesta.contactos],
      ].filter(([, datos]) => datos);
      if (!secciones.length) return;
      const encabezado = document.createElement("h3");
      encabezado.textContent = "Resultado del envío";
      contenedor.append(encabezado);
      secciones.forEach(([titulo, datos]) => {
        const articulo = document.createElement("article");
        articulo.className = "saved-order";
        const nombre = document.createElement("h3");
        nombre.textContent = titulo;
        const resumen = document.createElement("p");
        resumen.textContent = `Recibidos: ${datos.received} · Creados: ${datos.created} · Actualizados: ${datos.updated} · Omitidos: ${datos.skipped.length}`;
        articulo.append(nombre, resumen);
        datos.skipped.forEach((omitido) => {
          const detalle = document.createElement("p");
          detalle.textContent = `Omitido ${omitido.externalId}: ${omitido.reason}`;
          articulo.append(detalle);
        });
        contenedor.append(articulo);
      });
    },
    limpiarResultadoQuanty() {
      document.querySelector("#quanty-result").replaceChildren();
    },
    darFormatoPrecio(valor) {
      return formatoPrecio.format(valor);
    },
  };
})();
