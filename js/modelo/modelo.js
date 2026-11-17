"use strict";

// Fuente local del inventario: valida y persiste datos, y deja el DOM a cargo de la vista.
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

  // Guarda el inventario como JSON; devuelve false si el navegador no tiene espacio o bloquea el almacenamiento.
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
    // Quanty usa este ID como referencia externa, así que no debe reutilizarse tras eliminar un producto.
    return Math.max(leerSiguienteIdGuardado(), mayor + 1);
  }

  // Si no hay pedidos guardados o el JSON está dañado, se parte de una lista vacía.
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
    // Lee el inventario guardado; si no existe o está dañado, carga los productos de ejemplo.
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
    // Devuelve la lista de errores de negocio un arreglo vacío significa que los datos son válidos.
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
      // El nombre debe ser único sin distinguir mayúsculas al editar se ignora el propio producto.
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
      // new URL lanza un error si el texto no es una dirección válida; se acepta solo http o https.
      try {
        const url = new URL(datos.imagen, location.href);
        if (!["http:", "https:"].includes(url.protocol))
          errores.push("La imagen debe usar una URL HTTP o HTTPS.");
      } catch {
        errores.push("Ingresa una URL válida para la imagen.");
      }
      return errores;
    },
    // Inserta al inicio con el siguiente id; si no se puede guardar, deshace el cambio en memoria.
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
    // Reemplaza el producto por su id con map y guarda la lista anterior para poder revertir.
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
    // Quita el producto con filter; si falla el guardado se restaura la lista anterior.
    eliminar(id) {
      const encontrados = productos.some((producto) => producto.id === id);
      const anteriores = productos;
      productos = productos.filter((producto) => producto.id !== id);
      if (!encontrados) return false;
      if (persistir()) return true;
      productos = anteriores;
      return false;
    },
    // Vuelve a los ejemplos; structuredClone copia los datos para no modificar el original.
    restaurar() {
      const anteriores = productos;
      productos = structuredClone(ejemplos);
      if (persistir()) return true;
      productos = anteriores;
      return false;
    },
    // Clasifica el stock: agotado (cero), bajo (hasta el umbral) o disponible.
    estadoStock(producto) {
      if (producto.cantidad === 0) return "agotado";
      return producto.cantidad <= umbralStockBajo ? "bajo" : "disponible";
    },
    // reduce recorre los productos y los resume en un solo número: el total de unidades.
    totalUnidades() {
      return productos.reduce(
        (total, producto) => total + producto.cantidad,
        0,
      );
    },
    // Valor del inventario: suma precio por cantidad de cada producto.
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
      // La clave de Quanty solo se guarda en este navegador; nunca se sube al repositorio.
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
      // Empareja cada producto local con el de Quanty por id (find) y calcula la diferencia de cantidad.
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
          // Primero las filas con mayor diferencia absoluta; si empatan, por nombre.
          .sort(
            (a, b) =>
              Math.abs(b.diferencia ?? 0) - Math.abs(a.diferencia ?? 0) ||
              a.nombre.localeCompare(b.nombre, "es"),
          );
        // reduce cuenta cuántas filas hay en cada estado: igual, distinto y ausente.
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
      // Copia al inventario local las cantidades de Quanty; ignora valores que no sean enteros desde cero.
      sincronizarStock(productosQuanty) {
        // Solo actualiza IDs locales; los productos remotos nuevos requieren importación explícita.
        const remotosPorId = new Map(
          productosQuanty
            .filter(
              (item) =>
                item.id !== undefined &&
                Number.isInteger(item.cantidad) &&
                item.cantidad >= 0,
            )
            .map((item) => [String(item.id), item.cantidad]),
        );
        const anteriores = productos;
        let actualizados = 0;
        productos = productos.map((producto) => {
          const cantidad = remotosPorId.get(String(producto.id));
          if (cantidad === undefined || cantidad === producto.cantidad)
            return producto;
          actualizados += 1;
          return { ...producto, cantidad };
        });
        if (!actualizados) return { ok: true, actualizados };
        if (persistir()) return { ok: true, actualizados };
        // Revierte la memoria si falla localStorage para no mostrar un stock que no quedó guardado.
        productos = anteriores;
        return { ok: false, actualizados: 0 };
      },
      // Arma el cuerpo del POST: solo incluye las listas que tienen datos.
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
            // Quanty necesita una URL absoluta para mostrar la imagen, no una ruta relativa.
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
