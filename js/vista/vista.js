"use strict";

// Convierte el estado del modelo en interfaz y lee formularios sin persistir datos.
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
  const secciones = ["tienda", "contacto", "panel"];
  const etiquetasStock = {
    disponible: "Disponible",
    bajo: "Stock bajo",
    agotado: "Agotado",
  };
  const productList = document.querySelector("#product-list");
  const categoryFilters = document.querySelector("#category-filters");
  const recordForm = document.querySelector("#record-form");
  const dialogoProducto = document.querySelector("#product-dialog");
  const aviso = document.querySelector("#toast");
  let temporizadorContacto;
  let temporizadorAviso;

  function crearElemento(etiqueta, clase, texto) {
    const elemento = document.createElement(etiqueta);
    if (clase) elemento.className = clase;
    if (texto !== undefined) elemento.textContent = texto;
    return elemento;
  }

  function mostrarAviso(mensaje) {
    clearTimeout(temporizadorAviso);
    aviso.textContent = mensaje;
    aviso.classList.add("toast--visible");
    temporizadorAviso = setTimeout(
      () => aviso.classList.remove("toast--visible"),
      3200,
    );
  }

  return {
    mostrarRuta(hash) {
      const ruta = hash.replace("#", "");
      if (ruta === "catalogo") {
        this.activarSeccion("tienda");
        document.querySelector("#catalogo").scrollIntoView();
        return;
      }
      if (ruta && !secciones.includes(ruta)) return;
      this.activarSeccion(ruta || "tienda");
      window.scrollTo(0, 0);
    },
    activarSeccion(activa) {
      secciones.forEach((seccion) => {
        document.querySelector(`#view-${seccion}`).hidden = seccion !== activa;
      });
      document.querySelectorAll(".nav__link[data-route]").forEach((enlace) => {
        if (enlace.dataset.route === activa)
          enlace.setAttribute("aria-current", "page");
        else enlace.removeAttribute("aria-current");
      });
    },
    crearEtiquetaStock(producto) {
      const estado = Modelo.estadoStock(producto);
      return crearElemento("span", `pill pill--${estado}`, etiquetasStock[estado]);
    },
    crearMiniatura(producto, clase) {
      const imagen = crearElemento("img", clase);
      imagen.src = producto.imagen;
      imagen.alt = `Café ${producto.nombre}`;
      imagen.loading = "lazy";
      return imagen;
    },
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
    abrirFormulario() {
      if (!dialogoProducto.open) dialogoProducto.showModal();
      this.pintarVistaPrevia();
      recordForm.elements.nombre.focus();
    },
    llenarFormulario(producto) {
      for (const [campo, valor] of Object.entries(producto)) {
        if (recordForm.elements[campo])
          recordForm.elements[campo].value = valor;
      }
      document.querySelector("#record-form-title").textContent =
        "Editar producto";
      document.querySelector("#save-product").textContent = "Guardar cambios";
      this.abrirFormulario();
    },
    limpiarFormulario() {
      recordForm.reset();
      document.querySelector("#record-form-title").textContent =
        "Nuevo producto";
      document.querySelector("#save-product").textContent =
        "Agregar al inventario";
      document.querySelector("#record-status").textContent = "";
      if (dialogoProducto.open) dialogoProducto.close();
    },
    pintarVistaPrevia() {
      const datos = this.leerFormulario();
      const contenedor = document.querySelector("#preview-thumb");
      contenedor.replaceChildren();
      if (datos.imagen)
        contenedor.append(
          this.crearMiniatura({ imagen: datos.imagen, nombre: datos.nombre }),
        );
      document.querySelector("#preview-name").textContent =
        datos.nombre || "Nombre del producto";
      document.querySelector("#preview-meta").textContent =
        `${datos.categoria || "Sin categoría"} · ${
          datos.precio > 0
            ? formatoPrecio.format(datos.precio)
            : "Sin precio"
        }`;
    },
    mostrarMensaje(mensaje, tipo = "ok") {
      if (!dialogoProducto.open) {
        if (mensaje) mostrarAviso(mensaje);
        return;
      }
      const status = document.querySelector("#record-status");
      status.textContent = mensaje;
      status.classList.toggle("form-status--error", tipo === "error");
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
        const agotado = Modelo.estadoStock(producto) === "agotado";
        const tarjeta = crearElemento(
          "article",
          `card${agotado ? " card--out" : ""}`,
        );
        tarjeta.dataset.id = producto.id;
        const arte = crearElemento("div", "card__art");
        arte.append(
          this.crearMiniatura(producto),
          this.crearEtiquetaStock(producto),
        );
        const cuerpo = crearElemento("div", "card__body");
        const precio = crearElemento(
          "div",
          "card__price",
          formatoPrecio.format(producto.precio),
        );
        precio.append(
          crearElemento(
            "small",
            "",
            producto.categoria === "Accesorios" ? "por unidad" : "bolsa de 340 g",
          ),
        );
        const pedir = crearElemento(
          "a",
          `btn btn--sm ${agotado ? "btn--secondary" : "btn--primary"}`,
          agotado ? "Avísame" : "Pedir",
        );
        pedir.href = "#contacto";
        const meta = crearElemento("div", "card__meta");
        meta.append(precio, pedir);
        cuerpo.append(
          crearElemento("span", "card__category", producto.categoria),
          crearElemento("h3", "card__title", producto.nombre),
          meta,
        );
        tarjeta.append(arte, cuerpo);
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
        const total =
          categoria === "Todas"
            ? productos.length
            : productos.filter((producto) => producto.categoria === categoria)
                .length;
        const boton = crearElemento("button", "chips__item", categoria);
        boton.type = "button";
        boton.dataset.category = categoria;
        boton.setAttribute("aria-pressed", String(categoria === categoriaActiva));
        boton.append(crearElemento("small", "", String(total)));
        categoryFilters.append(boton);
      });
    },
    pintarDestacados(productos) {
      const lista = document.querySelector("#ranking");
      lista.replaceChildren();
      const destacados = productos
        .filter((producto) => producto.cantidad > 0)
        .sort((a, b) => b.cantidad - a.cantidad)
        .slice(0, 5);
      if (!destacados.length) {
        const vacio = crearElemento("li");
        vacio.append(crearElemento("span", "", "Sin productos disponibles"));
        lista.append(vacio);
      }
      destacados.forEach((producto) => {
        const item = crearElemento("li");
        item.append(
          crearElemento("span", "", producto.nombre),
          crearElemento("em", "", `${producto.cantidad} en stock`),
        );
        lista.append(item);
      });
      document.querySelector("#trust-available").textContent =
        `${productos.filter((producto) => producto.cantidad > 0).length} de ${productos.length}`;
    },
    pintarResumen(productos, modelo) {
      const agotados = productos.filter(
        (producto) => producto.cantidad === 0,
      ).length;
      const bajos = productos.filter(
        (producto) => modelo.estadoStock(producto) === "bajo",
      ).length;
      document.querySelector("#summary-total").textContent = productos.length;
      document.querySelector("#summary-empty").textContent = agotados;
      document.querySelector("#summary-low").textContent = bajos;
      document.querySelector("#summary-quantity").textContent =
        modelo.totalUnidades();
      document.querySelector("#summary-value").textContent =
        formatoPrecio.format(modelo.valorInventario());
      document
        .querySelector("#summary-empty")
        .closest(".kpis__item")
        .classList.toggle("kpis__item--warn", agotados > 0);
      document
        .querySelector("#summary-low")
        .closest(".kpis__item")
        .classList.toggle("kpis__item--warn", bajos > 0);
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
      estado.classList.toggle("form-status--error", error);
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
      aceptar.classList.toggle("confirm-dialog__accept--danger", peligro);
      dialogo.returnValue = "cancel";
      dialogo.showModal();
      // El controlador espera esta promesa antes de ejecutar o cancelar la acción solicitada.
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
        eliminar.className = "btn btn--danger btn--sm saved-order__remove";
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
      estado.classList.toggle("form-status--error", tipo === "error");
      estado.classList.toggle("form-status--loading", tipo === "loading");
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
    pintarStockQuanty({ filas, resumen }, actualizados) {
      const contenedor = document.querySelector("#quanty-stock");
      contenedor.replaceChildren();
      const partes = [
        `${resumen.igual} coinciden`,
        `${resumen.distinto} con diferencia`,
        `${resumen.ausente} sin enviar`,
      ];
      if (resumen.soloEnQuanty) partes.push(`${resumen.soloEnQuanty} solo en Quanty`);
      const tabla = crearElemento("table", "quanty__table");
      tabla.append(
        crearElemento(
          "caption",
          "visually-hidden",
          "Comparación del stock de Bruma Café con el de Quanty",
        ),
      );
      const encabezados = crearElemento("tr");
      [
        ["Producto", ""],
        ["Antes en Bruma", "data-table__num"],
        ["En Quanty", "data-table__num"],
        ["Diferencia", "data-table__num"],
        ["Estado", ""],
        ["Actualizado", ""],
      ].forEach(([texto, clase]) => {
        const celda = crearElemento("th", clase, texto);
        celda.scope = "col";
        encabezados.append(celda);
      });
      const cuerpo = crearElemento("tbody");
      const estados = {
        igual: ["Coincide", "disponible"],
        distinto: ["Diferente", "bajo"],
        ausente: ["Sin enviar", "agotado"],
      };
      filas.forEach((fila) => {
        const [etiqueta, variante] = estados[fila.estado];
        const estado = crearElemento("td");
        estado.append(crearElemento("span", `pill pill--${variante}`, etiqueta));
        const diferencia =
          fila.diferencia === undefined
            ? "-"
            : `${fila.diferencia > 0 ? "+" : ""}${fila.diferencia}`;
        const registro = crearElemento("tr");
        registro.append(
          crearElemento("td", "", fila.nombre),
          crearElemento("td", "data-table__num", String(fila.cantidadLocal)),
          crearElemento(
            "td",
            "data-table__num",
            fila.cantidadQuanty === undefined ? "-" : String(fila.cantidadQuanty),
          ),
          crearElemento("td", "data-table__num", diferencia),
          estado,
          crearElemento(
            "td",
            "",
            fila.actualizado ? formatoFecha.format(new Date(fila.actualizado)) : "-",
          ),
        );
        cuerpo.append(registro);
      });
      tabla.append(crearElemento("thead"), cuerpo);
      tabla.querySelector("thead").append(encabezados);
      const envoltorio = crearElemento("div", "data-table__wrap");
      envoltorio.append(tabla);
      contenedor.append(
        crearElemento("h3", "", "Stock en Quanty"),
        crearElemento("p", "quanty__summary", partes.join(" · ")),
        crearElemento(
          "p",
          "quanty__summary",
          `${actualizados} ${actualizados === 1 ? "cantidad actualizada" : "cantidades actualizadas"} en el inventario local. La diferencia muestra el cambio desde el stock anterior de Bruma.`,
        ),
        envoltorio,
      );
    },
    limpiarResultadoQuanty() {
      document.querySelector("#quanty-result").replaceChildren();
      document.querySelector("#quanty-stock").replaceChildren();
    },
    darFormatoPrecio(valor) {
      return formatoPrecio.format(valor);
    },
  };
})();
