"use strict";

const Modelo = (() => {
  const productosKey = "bruma-cafe-productos";
  const pedidosKey = "bruma-cafe-pedidos";
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

  function persistir() {
    try {
      localStorage.setItem(productosKey, JSON.stringify(productos));
      return true;
    } catch {
      return false;
    }
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
    },
    validar(datos, idEditando = null) {
      const errores = [];
      const nombre = datos.nombre.trim();
      if (nombre.length < 3)
        errores.push("El nombre debe tener al menos 3 caracteres.");
      if (!Number.isFinite(datos.precio) || datos.precio <= 0)
        errores.push("El precio debe ser mayor que cero.");
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
        const url = new URL(datos.imagen, document.baseURI);
        if (!["http:", "https:"].includes(url.protocol))
          errores.push("La imagen debe usar una URL HTTP o HTTPS.");
      } catch {
        errores.push("Ingresa una URL válida para la imagen.");
      }
      return errores;
    },
    agregar(datos) {
      const id =
        productos.reduce((mayor, producto) => Math.max(mayor, producto.id), 0) +
        1;
      productos.unshift({ ...datos, id, nombre: datos.nombre.trim() });
      if (persistir()) return true;
      productos.shift();
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
