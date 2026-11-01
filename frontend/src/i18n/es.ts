import type { Dictionary } from "./en";

export const es: Dictionary = {
  language: {
    legend: "Idioma de la correspondencia",
    en: "English",
    es: "Español",
  },
  envelope: {
    company: "Kryptelia Systems",
    tagline: "Sus datos. Nuestros sistemas. Su culpa.",
    title: "Breach Room",
    intro:
      "Lo enrutaron por error a la red interna de Kryptelia. Nueve departamentos lo separan de la salida. Cada uno tiene una vulnerabilidad real y ningún presupuesto para corregirla.",
    handling: "No sellar. No doblar. No salir.",
    previousRecipient: "Contratista 1042",
    fields: [
      { label: "Para", value: "Contratista 1043" },
      { label: "De", value: "Recursos Humanos" },
      { label: "Asunto", value: "Su permanencia" },
    ],
    holesNote: "Perforaciones incluidas para que confirme que sigue adentro.",
  },
  route: {
    label: "Registro de ruta",
    department: "Departamento",
    received: "Recibido",
    rooms: {
      recon: "Recepción",
      checkout: "Tienda interna",
      cookiejar: "Vestidor",
      idor: "Archivo",
      sqli: "Directorio",
      xss: "Buzón",
      traversal: "Respaldos",
      jwt: "Control de accesos",
      cmdinjection: "Diagnóstico",
    },
  },
  mailroom: {
    heading: "Mientras espera",
    queue: "En cola",
    waitNote: "La sala de correo duerme cuando no hay nadie. La primera entrega tarda cerca de un minuto.",
    lines: [
      "Se notificó su llegada a la sala de correo.",
      "La sala de correo está almorzando.",
      "La sala de correo volvió del almuerzo. La moral sigue igual.",
      "Solicitud de su sobre radicada por triplicado.",
      "Su sobre apareció detrás de la fotocopiadora.",
      "Sigue detrás de la fotocopiadora. Se informó a Mantenimiento.",
      "Mantenimiento abrió un ticket sobre el ticket.",
      "El ticket sobre el ticket fue escalado a usted.",
    ],
    stamps: ["Pendiente", "Escalado", "Ver adjunto", "No es mi área", "Radicado", "Sigue pendiente"],
    ready: "Sobre localizado. Autorizado para circular.",
    open: "Desenrollar la cuerda",
    undeliverableStamp: "No entregable",
    undeliverable: "La sala de correo dejó de responder. Seguimos intentando. También puede volver más tarde.",
    refused: "La sala de correo rechazó su sobre.",
    retry: "Radicarlo de nuevo",
  },
  memo: {
    title: "Memorando",
    paragraphs: [
      "Nos hemos enterado de que usted está dentro de nuestra red. La política de la compañía lo prohíbe, y también prohíbe salir.",
      "Para salir, pase por los nueve departamentos. Cada uno esconde una flag detrás de una vulnerabilidad real. Radique la flag y se abre la siguiente puerta. Le rogamos no explicarle a Legal cómo lo hizo.",
      "Tras cada puerta, Cumplimiento le mostrará qué salió mal y cómo debió escribirse. Intente parecer sorprendido.",
      "Su kit de herramientas se entrega en Recepción.",
    ],
    closedStamp: "Cerrado",
    closed: "Recepción está cerrada por cambio de alfombra. Mantenimiento no se disculpa por nada. Las salas abren en la próxima versión.",
  },
  footer: {
    fiction: "Kryptelia Systems es ficticia. Breach Room es un juego de",
    author: "Santiago Santofimio",
  },
};
