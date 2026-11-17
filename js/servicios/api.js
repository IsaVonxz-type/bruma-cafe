"use strict";

// Aísla el contrato HTTP de Quanty para que el controlador no gestione detalles de red.
const ApiQuanty = (() => {
  const urlBase = "https://dnhpjwyaotdyhpialqlk.supabase.co/functions/v1";
  const endpoint = `${urlBase}/catalog-import`;
  // Tiempo máximo de espera (15 s) para que la interfaz no quede cargando si Quanty no responde.
  const tiempoMaximo = 15000;

  // Traduce el código HTTP a un mensaje comprensible para quien usa la aplicación.
  function mensajePorEstado(estado, detalle) {
    if (estado === 401) return "La clave es inválida o fue revocada en Quanty.";
    if (estado === 413)
      return "El envío es demasiado grande para Quanty (máximo 1 MB y 500 elementos por lista).";
    if (estado === 400)
      return `Quanty rechazó los datos enviados${detalle ? `: ${detalle}` : "."}`;
    return "Quanty no pudo procesar la solicitud. Inténtalo de nuevo en unos minutos.";
  }

  // Hace la petición con la clave en el encabezado x-api-key y devuelve el JSON de la respuesta.
  async function solicitar(clave, opciones = {}, consulta = "") {
    let respuesta;
    // fetch solo rechaza la promesa si falla la red o vence el tiempo; un 401 o un 500 sí llegan como respuesta.
    try {
      respuesta = await fetch(`${endpoint}${consulta}`, {
        ...opciones,
        headers: { "x-api-key": clave, ...opciones.headers },
        signal: AbortSignal.timeout(tiempoMaximo),
      });
    } catch {
      throw new Error(
        "No se pudo conectar con Quanty. Revisa tu conexión a Internet e inténtalo de nuevo.",
      );
    }
    // Si el cuerpo no es JSON válido se usa un objeto vacío para no romper el flujo.
    const datos = await respuesta.json().catch(() => ({}));
    // response.ok es true solo para los códigos 200 a 299; los demás se convierten en error aquí.
    if (!respuesta.ok)
      throw new Error(mensajePorEstado(respuesta.status, datos.error));
    return datos;
  }

  return {
    // GET sin parámetros: Quanty solo confirma si la clave es válida.
    async probarClave(clave) {
      const datos = await solicitar(clave);
      return datos.ok === true;
    },
    // GET con source: devuelve el stock actual de los productos que Bruma importó a Quanty.
    async consultarStock(clave, origen = "bruma-cafe") {
      const datos = await solicitar(
        clave,
        {},
        `?source=${encodeURIComponent(origen)}`,
      );
      // Una versión anterior de la API responde ok sin lista de productos; se avisa con claridad.
      if (!Array.isArray(datos.productos))
        throw new Error(
          "Quanty no devolvió la lista de productos. Puede que la API aún no esté actualizada.",
        );
      return datos.productos;
    },
    // POST con el catálogo en JSON: Quanty crea lo nuevo y actualiza lo que ya existe por source e id.
    importar(clave, envio) {
      return solicitar(clave, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(envio),
      });
    },
  };
})();
