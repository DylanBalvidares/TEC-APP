/**
 * Atajos de texto para el composer de WhatsApp.
 * Solo rellenan el textarea en frontend (sin cambios de API).
 */
export const PLANTILLAS_WHATSAPP = [
  {
    nombre: "Inasistencia",
    texto:
      "Estimada familia: les informamos que el/la alumno/a registró una inasistencia. Por favor, envíen la justificación correspondiente. Muchas gracias.",
  },
  {
    nombre: "Reunión",
    texto:
      "Estimada familia: se los convoca a una reunión. Les pedimos confirmar asistencia por este medio. Muchas gracias.",
  },
  {
    nombre: "Recordatorio",
    texto:
      "Estimada familia: les recordamos un compromiso pendiente del alumno/a. Ante cualquier duda, quedamos a disposición. Muchas gracias.",
  },
  {
    nombre: "Felicitación",
    texto:
      "Estimada familia: queremos felicitar al alumno/a por su desempeño. ¡Sigamos así! Muchas gracias.",
  },
];

export const LIMITE_MENSAJE = 1000;
export const UMBRAL_AVISO = 900;
