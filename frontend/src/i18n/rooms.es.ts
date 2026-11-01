import type { RoomContent } from "../rooms/roomContent";
import type { RoomSlug } from "../rooms/rooms";

export const roomsEs: Partial<Record<RoomSlug, RoomContent>> = {
  recon: {
    letterhead: "Planilla de ingreso de visitantes",
    story:
      "La recepcionista se fue en 2019. La planilla se quedó, junto con una nota que dice que el edificio está cerrado y que su carné no existe. Detrás de este escritorio hay una terminal que nadie quiso publicar.",
    objective: "Encuentre la página que Recepción pidió a los buscadores no leer, y tome lo que le devuelve.",
    hints: [
      "Los rastreadores educados revisan un archivo conocido antes de indexar un sitio. Kryptelia asume que todos son educados.",
      "Abra ese archivo en el mini navegador. Lo que prohíbe es un mapa.",
      "El cuerpo de la página no tiene nada para usted. Los desarrolladores dejan ayudas de depuración donde una página nunca las muestra.",
    ],
    debrief: {
      happened:
        "Leyó robots.txt, siguió la ruta que pedía evitar y encontró un header de depuración activo en producción.",
      why: "robots.txt es una petición a rastreadores educados, no un control de acceso: listar una ruta privada la publica. El handler confió en que nadie llegaría, y por eso conservó un header de diagnóstico que entrega valores internos a cualquier cliente.",
      detection:
        "Compare los headers de respuesta con una lista permitida en CI, rastree las rutas desplegadas buscando caminos internos sin autenticación y genere alertas ante peticiones a lo listado en Disallow.",
      owasp: "A02:2025 Security Misconfiguration",
    },
  },
  checkout: {
    letterhead: "Orden de compra, Moral Interna",
    story:
      "Moral Interna administra una tienda donde el personal gasta créditos en lugar de recibir aumentos. La llave maestra de Contabilidad está en el estante superior por 9.999 créditos. A usted le asignaron 100 créditos y una advertencia.",
    objective: "Salga de la tienda con la llave maestra.",
    hints: [
      "El catálogo explica cómo se hace un pedido. Lea lo que envía el cliente, no lo que dice el estante.",
      "Haga un pedido honesto en el repeater. Observe qué campos cree el servidor sin dudar.",
      "El servidor compara sus créditos con un número. Pregúntese quién puso ese número.",
    ],
    debrief: {
      happened:
        "Editó el precio dentro de su propia petición y el servidor le cobró ese valor. Las reglas de la tienda las aplicaba el comprador.",
      why: "El cliente es territorio hostil: todo lo que envía se puede cambiar. El handler tomó el precio recibido como un hecho, cuando el único precio confiable es el guardado en el servidor. Validar el monto no ayuda si el monto lo controla el atacante.",
      detection:
        "Concilie los pedidos con los precios del catálogo, genere alertas cuando el valor cobrado difiera del listado y revise todo esquema de petición que transporte datos que el servidor ya conoce.",
      owasp: "A06:2025 Insecure Design",
    },
  },
  cookiejar: {
    letterhead: "Asignación de casilleros, Recursos Humanos",
    story:
      "Los casilleros se asignan con una cookie que Recursos Humanos describe como una solución de identidad basada en la confianza. El casillero ejecutivo abre para administradores. Usted es, en esta etapa de su carrera, un invitado.",
    objective: "Abra el casillero ejecutivo.",
    hints: [
      "Visite el casillero una vez. Se emitirá un perfil a su tarro de cookies.",
      "Ese valor no es aleatorio. Páselo por el decoder.",
      "Nada en la petición prueba quién escribió ese valor. Cambie lo que dice, codifíquelo de nuevo y regrese.",
    ],
    debrief: {
      happened:
        "Su perfil era JSON en Base64, sin firma. Reescribió su propio rol y el servidor lo aceptó.",
      why: "Base64 es una codificación, no una protección: cualquiera la revierte. Sin firma, el servidor no distingue un valor que emitió de uno inventado por el cliente, y el cliente termina eligiendo sus propios permisos.",
      detection:
        "Inspeccione las cookies buscando datos estructurados decodificables, rechace estado de sesión sin firma en la revisión de código y registre cambios de rol sin una acción administrativa asociada.",
      owasp: "A08:2025 Software or Data Integrity Failures",
    },
  },
  idor: {
    letterhead: "Solicitud de registros, El Archivo",
    story:
      "El Archivo guarda cada registro que Kryptelia espera que nadie solicite. Usted puede leer su propio expediente. El archivista lo verifica asumiendo que usted no mentiría.",
    objective: "Lea las notas de la entrevista de salida del Director.",
    hints: [
      "Abra su bandeja y lea su propio documento. Observe cómo está identificado.",
      "Su contrato menciona cómo se numeran los registros del personal.",
      "El número en la ruta es lo único que mira el servidor. El Director llegó primero.",
    ],
    debrief: {
      happened:
        "Cambió un número en la ruta y leyó el documento de otra persona. El servidor verificó que el registro existía, nunca que fuera suyo.",
      why: "Estar autenticado dice quién es usted, no qué puede tocar. Cada búsqueda de un objeto necesita una verificación de propiedad o permiso, porque los identificadores se adivinan, se enumeran y siempre están bajo control del cliente.",
      detection:
        "Agregue tests donde un usuario pide objetos de otro, marque los handlers que buscan por identificador sin principal y genere alertas cuando una sesión lee muchos identificadores secuenciales.",
      owasp: "A01:2025 Broken Access Control",
    },
  },
};
