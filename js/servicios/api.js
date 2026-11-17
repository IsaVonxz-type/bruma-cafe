"use strict";

// Aísla el contrato HTTP de Quanty para que el controlador no gestione detalles de red.
const ApiQuanty = (() => {
  const urlBase = "https://dnhpjwyaotdyhpialqlk.supabase.co/functions/v1";
  const endpoint = `${urlBase}/catalog-import`;
  const tiempoMaximo = 15000;

  function mensajePorEstado(estado, detalle) {
    if (estado === 401) return "La clave es inválida o fue revocada en Quanty.";
    if (estado === 413)
      return "El envío es demasiado grande para Quanty (máximo 1 MB y 500 elementos por lista).";
    if (estado === 400)
      return `Quanty rechazó los datos enviados${detalle ? `: ${detalle}` : "."}`;
    return "Quanty no pudo procesar la solicitud. Inténtalo de nuevo en unos minutos.";
  }

  async function solicitar(clave, opciones = {}, consulta = "") {
    let respuesta;
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
    const datos = await respuesta.json().catch(() => ({}));
    if (!respuesta.ok)
      throw new Error(mensajePorEstado(respuesta.status, datos.error));
    return datos;
  }

  return {
    async probarClave(clave) {
      const datos = await solicitar(clave);
      return datos.ok === true;
    },
    async consultarStock(clave, origen = "bruma-cafe") {
      const datos = await solicitar(
        clave,
        {},
        `?source=${encodeURIComponent(origen)}`,
      );
      if (!Array.isArray(datos.productos))
        throw new Error(
          "Quanty no devolvió la lista de productos. Puede que la API aún no esté actualizada.",
        );
      return datos.productos;
    },
    importar(clave, envio) {
      return solicitar(clave, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(envio),
      });
    },
  };
})();
