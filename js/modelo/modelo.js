"use strict";

const Modelo = (() => {
  const productosKey = "bruma-cafe-productos";
  const siguienteIdKey = "bruma-cafe-siguiente-id";
  const pedidosKey = "bruma-cafe-pedidos";
  const temaKey = "bruma-theme";
  const claveQuantyKey = "bruma-cafe-quanty-clave";
  const precioMaximo = 1_000_000;
  const umbralStockBajo = 5;
  const ejemplos = [
    {
      id: 1,
      nombre: "Sierra Dulce",
      precio: 42000,
      categoria: "Grano",
      cantidad: 12,
      imagen: "assets/sierra-dulce.jpg",
    },
    {
      id: 2,
      nombre: "Niebla Rosa",
      precio: 48000,
      categoria: "Grano",
      cantidad: 8,
      imagen: "assets/niebla-rosa.jpg",
    },
    {
      id: 3,
      nombre: "Monte Negro",
      precio: 45000,
      categoria: "Molido",
      cantidad: 5,
      imagen: "assets/monte-negro.jpg",
    },
    {
      id: 4,
      nombre: "Caturra Honey",
      precio: 52000,
      categoria: "Grano",
      cantidad: 0,
      imagen: "assets/caturra-honey.jpg",
    },
    {
      id: 5,
      nombre: "Prensa Bruma",
      precio: 68000,
      categoria: "Accesorios",
      cantidad: 4,
      imagen: "assets/prensa-bruma.jpg",
    },
    {
      id: 6,
      nombre: "Huila de Altura",
      precio: 39000,
      categoria: "Molido",
      cantidad: 9,
      imagen: "assets/huila-de-altura.jpg",
    },
  ];
  let productos = [];
  let siguienteId = 1;

  function persistir() {
    try {
      localStorage.setItem(productosKey, JSON.stringify(productos));
      return true;
    } catch {
      return false;
    }
  }

  function guardarSiguienteId() {
    try {
      localStorage.setItem(siguienteIdKey, String(siguienteId));
      return true;
    } catch {
      return false;
    }
  }

  function leerSiguienteIdGuardado() {
    const guardado = Number(localStorage.getItem(siguienteIdKey));
    return Number.isInteger(guardado) && guardado > 0 ? guardado : 1;
  }

  function calcularSiguienteId() {
    const mayor = productos.reduce(
      (maximo, producto) => Math.max(maximo, producto.id),
      0,
    );
    return Math.max(leerSiguienteIdGuardado(), mayor + 1);
  }

  function leerPedidos() {
    try {
      return JSON.parse(localStorage.getItem(pedidosKey) || "[]");
    } catch {
      return [];
    }
  }

  function guardarPedidos(pedidos) {
    localStorage.setItem(pedidosKey, JSON.stringify(pedidos));
  }

  return {
    get productos() {
      return productos;
    },
    cargar() {
      try {
        const guardados = JSON.parse(localStorage.getItem(productosKey));
        productos = Array.isArray(guardados)
          ? guardados
          : structuredClone(ejemplos);
      } catch {
        productos = structuredClone(ejemplos);
      }
      if (localStorage.getItem(productosKey) === null) persistir();
      siguienteId = calcularSiguienteId();
      guardarSiguienteId();
    },
    validar(datos, idEditando = null) {
      const errores = [];
      const nombre = datos.nombre.trim();
      if (nombre.length < 3)
        errores.push("El nombre debe tener al menos 3 caracteres.");
      if (!Number.isFinite(datos.precio) || datos.precio <= 0)
        errores.push("El precio debe ser mayor que cero.");
      else if (datos.precio > precioMaximo)
        errores.push("El precio no puede superar $1.000.000 COP.");
      if (!Number.isInteger(datos.cantidad) || datos.cantidad < 0)
        errores.push("La cantidad debe ser un entero mayor o igual a cero.");
      if (!new Set(["Grano", "Molido", "Accesorios"]).has(datos.categoria))
        errores.push("Selecciona una categoría válida.");
      if (
        productos.some(
          (producto) =>
            producto.nombre.trim().toLocaleLowerCase() ===
              nombre.toLocaleLowerCase() && producto.id !== idEditando,
        )
      )
        errores.push("Ya existe un producto con ese nombre.");
      if (datos.categoria === "Grano" && datos.cantidad > 50)
        errores.push(
          "No se pueden registrar más de 50 bolsas de café en grano.",
        );
      if (!datos.imagen) errores.push("La URL de imagen es obligatoria.");
      try {
        const url = new URL(datos.imagen, location.href);
        if (!["http:", "https:"].includes(url.protocol))
          errores.push("La imagen debe usar una URL HTTP o HTTPS.");
      } catch {
        errores.push("Ingresa una URL válida para la imagen.");
      }
      return errores;
    },
    agregar(datos) {
      const id = siguienteId;
      productos.unshift({ ...datos, id, nombre: datos.nombre.trim() });
      siguienteId += 1;
      if (persistir() && guardarSiguienteId()) return true;
      productos.shift();
      siguienteId = id;
      return false;
    },
    buscarPorId(id) {
      return productos.find((producto) => producto.id === id);
    },
    actualizar(id, datos) {
      if (!this.buscarPorId(id)) return false;
      const anterior = productos;
      productos = productos.map((producto) =>
        producto.id === id
          ? { ...producto, ...datos, nombre: datos.nombre.trim() }
          : producto,
      );
      if (persistir()) return true;
      productos = anterior;
      return false;
    },
    eliminar(id) {
      const encontrados = productos.some((producto) => producto.id === id);
      const anteriores = productos;
      productos = productos.filter((producto) => producto.id !== id);
      if (!encontrados) return false;
      if (persistir()) return true;
      productos = anteriores;
      return false;
    },
    restaurar() {
      const anteriores = productos;
      productos = structuredClone(ejemplos);
      if (persistir()) return true;
      productos = anteriores;
      return false;
    },
    estadoStock(producto) {
      if (producto.cantidad === 0) return "agotado";
      return producto.cantidad <= umbralStockBajo ? "bajo" : "disponible";
    },
    totalUnidades() {
      return productos.reduce(
        (total, producto) => total + producto.cantidad,
        0,
      );
    },
    valorInventario() {
      return productos.reduce(
        (total, producto) => total + producto.precio * producto.cantidad,
        0,
      );
    },
    tema: {
      esOscuro() {
        try {
          return localStorage.getItem(temaKey) === "dark";
        } catch {
          return false;
        }
      },
      guardar(oscuro) {
        try {
          localStorage.setItem(temaKey, oscuro ? "dark" : "light");
        } catch {
          return;
        }
      },
    },
    quanty: {
      leerClave() {
        try {
          return localStorage.getItem(claveQuantyKey) || "";
        } catch {
          return "";
        }
      },
      guardarClave(clave) {
        try {
          localStorage.setItem(claveQuantyKey, clave);
          return true;
        } catch {
          return false;
        }
      },
      borrarClave() {
        try {
          localStorage.removeItem(claveQuantyKey);
        } catch {
          return;
        }
      },
      compararStock(productosQuanty) {
        const filas = productos
          .map((producto) => {
            const remoto = productosQuanty.find(
              (item) => String(item.id) === String(producto.id),
            );
            if (!remoto)
              return {
                id: producto.id,
                nombre: producto.nombre,
                cantidadLocal: producto.cantidad,
                estado: "ausente",
              };
            return {
              id: producto.id,
              nombre: producto.nombre,
              cantidadLocal: producto.cantidad,
              cantidadQuanty: remoto.cantidad,
              diferencia: remoto.cantidad - producto.cantidad,
              umbral: remoto.umbral,
              actualizado: remoto.actualizado,
              estado: remoto.cantidad === producto.cantidad ? "igual" : "distinto",
            };
          })
          .sort(
            (a, b) =>
              Math.abs(b.diferencia ?? 0) - Math.abs(a.diferencia ?? 0) ||
              a.nombre.localeCompare(b.nombre, "es"),
          );
        const resumen = filas.reduce(
          (total, fila) => ({ ...total, [fila.estado]: total[fila.estado] + 1 }),
          { igual: 0, distinto: 0, ausente: 0 },
        );
        const idsLocales = new Set(productos.map((producto) => String(producto.id)));
        resumen.soloEnQuanty = productosQuanty.filter(
          (item) => !idsLocales.has(String(item.id)),
        ).length;
        return { filas, resumen };
      },
      construirEnvio() {
        const envio = { source: "bruma-cafe" };
        const contactos = leerPedidos().map(
          ({ id, nombre, email, telefono }) => ({
            id,
            nombre,
            email,
            telefono,
          }),
        );
        if (productos.length)
          envio.productos = productos.map((producto) => ({
            id: producto.id,
            nombre: producto.nombre,
            precio: producto.precio,
            cantidad: producto.cantidad,
            categoria: producto.categoria,
            imagen: new URL(producto.imagen, location.href).href,
          }));
        if (contactos.length) envio.contactos = contactos;
        return envio;
      },
    },
    pedidos: {
      listar: leerPedidos,
      agregar(pedido) {
        const nuevo = {
          ...pedido,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
        };
        guardarPedidos([nuevo, ...leerPedidos()]);
        return nuevo;
      },
      eliminar(id) {
        guardarPedidos(leerPedidos().filter((pedido) => pedido.id !== id));
      },
    },
  };
})();
