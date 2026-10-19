// Datos estáticos del dataset de prueba: catálogos, personas y textos.
// Lo que se computa con lógica (fechas relativas, asignaciones por curso,
// notas, asistencias...) vive en carga.js.

// ============================================================
// MATERIAS (ids 9001+). `prof` = índice en DEMO_PROFESORES.
// ============================================================
export const MATERIAS = [
  { id: 9001, nombre: "Matemática", carga: 4, descripcion: "Álgebra, geometría y funciones por año.", prof: 0 },
  { id: 9002, nombre: "Lengua y Literatura", carga: 4, descripcion: "Comprensión y producción oral y escrita.", prof: 2 },
  { id: 9003, nombre: "Historia", carga: 3, descripcion: "Procesos históricos de América y el mundo.", prof: 3 },
  { id: 9004, nombre: "Geografía", carga: 2, descripcion: "Espacios geográficos y territorio argentino.", prof: 3 },
  { id: 9005, nombre: "Inglés", carga: 3, descripcion: "Inglés técnico y conversación.", prof: 4 },
  { id: 9006, nombre: "Física", carga: 4, descripcion: "Mecánica, electricidad y óptica con laboratorio.", prof: 1 },
  { id: 9007, nombre: "Química", carga: 3, descripcion: "Química general con prácticas de laboratorio.", prof: 5 },
  { id: 9008, nombre: "Biología", carga: 3, descripcion: "Biología celular, humana y ambiental.", prof: 5 },
  { id: 9009, nombre: "Educación Física", carga: 2, descripcion: "Deportes, juegos y vida saludable.", prof: 6 },
  { id: 9010, nombre: "Arte", carga: 2, descripcion: "Expresión plástica y visual.", prof: 7 },
  { id: 9011, nombre: "Ciudadanía y Trabajo", carga: 2, descripcion: "Derechos, mundo laboral y proyectos comunitarios.", prof: 2 },
  { id: 9012, nombre: "Laboratorio Informática", carga: 6, descripcion: "Programación, redes y ensamblado de equipos.", prof: 8 },
  { id: 9013, nombre: "Taller Electrónica", carga: 6, descripcion: "Circuitos analógicos y digitales, medición y soldadura.", prof: 10 },
  { id: 9014, nombre: "Taller Electromecánica", carga: 6, descripcion: "Mecánica, motores y mantenimiento industrial.", prof: 10 },
  { id: 9015, nombre: "Proyecto Integrador", carga: 4, descripcion: "Proyecto anual que integra saberes de la especialidad.", prof: 9 },
  { id: 9016, nombre: "Prácticas Profesionalizantes", carga: 6, descripcion: "Inserción en empresas del sector técnico.", prof: 9 },
];

// ============================================================
// PLANES DE ESTUDIO (ids 9001+).
// Los planes superiores comparten estructura; la materia en la
// posición 0 de cada lista se reemplaza por el taller del plan.
// ============================================================
const BASICO = {
  1: [9001, 9002, 9003, 9004, 9005, 9009, 9010, 9012],
  2: [9001, 9002, 9003, 9004, 9005, 9008, 9009, 9010, 9012],
  3: [9001, 9002, 9003, 9004, 9005, 9006, 9007, 9011, 9012],
};

const ESTRUCTURA_SUPERIOR = {
  4: [0, 9001, 9006, 9005, 9009, 9015],
  5: [0, 9001, 9006, 9002, 9011, 9015],
  6: [0, 9002, 9005, 9011, 9016],
};

export const PLANES = [
  {
    id: 9001,
    nombre: "Ciclo Básico (Demo)",
    codigo: "TEC-BAS-2026",
    orientacion: "Formación general base técnica",
    descripcion: "Primeros tres años del plan técnico escolar.",
    duracion: 3,
    anios: BASICO,
  },
  {
    id: 9002,
    nombre: "Ciclo Superior Informática (Demo)",
    codigo: "TEC-INF-2026",
    orientacion: "Informática",
    descripcion: "Técnico en informática (desarrollo, bases de datos y redes).",
    duracion: 4,
    taller: 9012,
    anios: ESTRUCTURA_SUPERIOR,
  },
  {
    id: 9003,
    nombre: "Ciclo Superior Electrónica (Demo)",
    codigo: "TEC-ELE-2026",
    orientacion: "Electrónica",
    descripcion: "Técnico en electrónica (circuitos y sistemas).",
    duracion: 4,
    taller: 9013,
    anios: ESTRUCTURA_SUPERIOR,
  },
  {
    id: 9004,
    nombre: "Ciclo Superior Electromecánica (Demo)",
    codigo: "TEC-EME-2026",
    orientacion: "Electromecánica",
    descripcion: "Técnico electromecánico (motores y mantenimiento).",
    duracion: 4,
    taller: 9014,
    anios: ESTRUCTURA_SUPERIOR,
  },
];

// Pares de correlativas por nombre (se resuelve con los ids del plan).
// { materia, anio } requiere { materiaReq, anioReq }.
export const CORRELATIVAS_BASICO = [
  { materia: "Física", anio: 3, materiaReq: "Matemática", anioReq: 2 },
  { materia: "Química", anio: 3, materiaReq: "Biología", anioReq: 2 },
  { materia: "Geografía", anio: 3, materiaReq: "Historia", anioReq: 2 },
];

export const CORRELATIVAS_SUPERIOR = [
  { materia: "TALLER", anio: 6, materiaReq: "TALLER", anioReq: 5 },
  { materia: "TALLER", anio: 5, materiaReq: "TALLER", anioReq: 4 },
  { materia: "Prácticas Profesionalizantes", anio: 6, materiaReq: "Proyecto Integrador", anioReq: 5 },
];

// ============================================================
// CURSOS (ids 9001+)
// ============================================================
export const CURSOS = [
  { id: 9001, nombre: "1º Año A (Demo)", nivel: "Ciclo basico", anio: 1, aula: "101", turno: "Mañana", planId: 9001 },
  { id: 9002, nombre: "1º Año B (Demo)", nivel: "Ciclo basico", anio: 1, aula: "102", turno: "Mañana", planId: 9001 },
  { id: 9003, nombre: "1º Año C (Demo)", nivel: "Ciclo basico", anio: 1, aula: "103", turno: "Tarde", planId: 9001 },
  { id: 9004, nombre: "2º Año A (Demo)", nivel: "Ciclo basico", anio: 2, aula: "104", turno: "Mañana", planId: 9001 },
  { id: 9005, nombre: "2º Año B (Demo)", nivel: "Ciclo basico", anio: 2, aula: "105", turno: "Tarde", planId: 9001 },
  { id: 9006, nombre: "3º Año A (Demo)", nivel: "Ciclo basico", anio: 3, aula: "106", turno: "Mañana", planId: 9001 },
  { id: 9007, nombre: "3º Año B (Demo)", nivel: "Ciclo basico", anio: 3, aula: "107", turno: "Tarde", planId: 9001 },
  { id: 9008, nombre: "4º Año Electrónica (Demo)", nivel: "Ciclo superior", anio: 4, aula: "201", turno: "Mañana", planId: 9003 },
  { id: 9009, nombre: "4º Año Informática (Demo)", nivel: "Ciclo superior", anio: 4, aula: "202", turno: "Mañana", planId: 9002 },
  { id: 9010, nombre: "5º Año Informática (Demo)", nivel: "Ciclo superior", anio: 5, aula: "203", turno: "Tarde", planId: 9002 },
  { id: 9011, nombre: "5º Año Electrónica (Demo)", nivel: "Ciclo superior", anio: 5, aula: "204", turno: "Mañana", planId: 9003 },
  { id: 9012, nombre: "6º Año Electromecánica (Demo)", nivel: "Ciclo superior", anio: 6, aula: "205", turno: "Tarde", planId: 9004 },
];

// ============================================================
// PERSONAL / PROFESORES / TUTORES / cuentas de ALUMNOS.
// Los 4 logins base de prueba.sql (root/profesor/preceptor/alumno
// @tecnica2.edu.ar) NO se recrean; si existen, se les integra data.
// ============================================================
export const DEMO_PERSONAL = [
  { id: 9001, nombre: "Fabiana", apellido: "Prieto", email: "admin@tecnica2.edu.ar", cargo: "Administrativo", nacimiento: "1982-04-12", ingreso: "2018-03-05", dni: "38050001" },
  { id: 9002, nombre: "Marcos", apellido: "Duarte", email: "preceptor2@tecnica2.edu.ar", cargo: "Preceptor", nacimiento: "1988-09-20", ingreso: "2020-03-01", dni: "38050002" },
  { id: 9003, nombre: "Elida", apellido: "Saravia", email: "preceptor3@tecnica2.edu.ar", cargo: "Preceptor", nacimiento: "1990-02-14", ingreso: "2021-03-10", dni: "38050003" },
  { id: 9004, nombre: "Rosa", apellido: "Cáceres", email: "bibliotecario@tecnica2.edu.ar", cargo: "Bibliotecario", nacimiento: "1985-07-08", ingreso: "2019-03-15", dni: "38050004" },
];

export const DEMO_PROFESORES = [
  { id: 9001, nombre: "Mariana", apellido: "Ferreyra", email: "mariana.ferreyra@tecnica2.edu.ar", especialidad: "Matemática", nacimiento: "1986-05-16", ingreso: "2015-03-02", dni: "34100001" },
  { id: 9002, nombre: "Gustavo", apellido: "Pereyra", email: "gustavo.pereyra@tecnica2.edu.ar", especialidad: "Física", nacimiento: "1983-11-04", ingreso: "2016-03-07", dni: "34100002" },
  { id: 9003, nombre: "Silvina", apellido: "González", email: "silvina.gonzalez@tecnica2.edu.ar", especialidad: "Lengua", nacimiento: "1989-01-25", ingreso: "2018-03-12", dni: "34100003" },
  { id: 9004, nombre: "Ramiro", apellido: "Águilar", email: "ramiro.aguilar@tecnica2.edu.ar", especialidad: "Ciencias Sociales", nacimiento: "1991-06-30", ingreso: "2020-03-02", dni: "34100004" },
  { id: 9005, nombre: "Lucía", apellido: "Herrera", email: "lucia.herrera@tecnica2.edu.ar", especialidad: "Inglés", nacimiento: "1992-03-18", ingreso: "2021-03-15", dni: "34100005" },
  { id: 9006, nombre: "Paulo", apellido: "Miranda", email: "paulo.miranda@tecnica2.edu.ar", especialidad: "Química y Biología", nacimiento: "1985-08-22", ingreso: "2017-03-06", dni: "34100006" },
  { id: 9007, nombre: "Julián", apellido: "Beltrán", email: "julian.beltran@tecnica2.edu.ar", especialidad: "Educación Física", nacimiento: "1993-12-05", ingreso: "2022-03-14", dni: "34100007" },
  { id: 9008, nombre: "Verónica", apellido: "Ruiz", email: "veronica.ruiz@tecnica2.edu.ar", especialidad: "Arte", nacimiento: "1987-04-09", ingreso: "2019-04-02", dni: "34100008" },
  { id: 9009, nombre: "Esteban", apellido: "Ferrari", email: "esteban.ferrari@tecnica2.edu.ar", especialidad: "Informática", nacimiento: "1990-10-12", ingreso: "2020-08-01", dni: "34100009" },
  { id: 9010, nombre: "Caterina", apellido: "Volpe", email: "caterina.volpe@tecnica2.edu.ar", especialidad: "Informática", nacimiento: "1994-02-27", ingreso: "2023-03-01", dni: "34100010" },
  { id: 9011, nombre: "Óscar", apellido: "Ledesma", email: "oscar.ledesma@tecnica2.edu.ar", especialidad: "Taller Electrónica", nacimiento: "1984-07-19", ingreso: "2015-08-03", dni: "34100011" },
];

// Tutores: usuarios (rol 6) vinculados a alumnos demo vía tutores_alumnos.
export const DEMO_TUTORES = [
  { usuarioId: 9016, nombre: "María", apellido: "López", email: "maria.lopez@tecnica2.edu.ar", telefono: "11-4311-1122", links: [{ idAlumno: 9002, parentesco: "madre" }] },
  { usuarioId: 9017, nombre: "Carlos", apellido: "Sosa", email: "carlos.sosa@tecnica2.edu.ar", telefono: "11-4311-2233", links: [{ idAlumno: 9020, parentesco: "padre" }] },
  { usuarioId: 9018, nombre: "Gabriela", apellido: "Núñez", email: "gabriela.nunez@tecnica2.edu.ar", telefono: "11-4311-3344", links: [{ idAlumno: 9037, parentesco: "tutor_legal" }, { idAlumno: 9056, parentesco: "otro" }] },
];

// Alumnos con cuenta de usuario: 2 delegados + 1 alumno.
export const ALUMNOS_CON_CUENTA = [
  { usuarioId: 9019, email: "nicolas.vega@tecnica2.edu.ar", alumnoId: 9001, rol: 2 },
  { usuarioId: 9020, email: "brenda.paz@tecnica2.edu.ar", alumnoId: 9019, rol: 2 },
  { usuarioId: 9021, email: "tadeo.martinez@tecnica2.edu.ar", alumnoId: 9055, rol: 1 },
];

export const NOMBRES_M = ["Nicolás", "Matías", "Julián", "Franco", "Alexis", "Tadeo", "Lucas", "Benjamín", "Emmanuel", "Bautista", "Diego", "Marcos", "Iván", "Santiago", "Bruno", "Valentín", "Agustín", "Lautaro", "Ezequiel", "Emilio", "Máximo", "Tomás"];
export const NOMBRES_F = ["Sofía", "Valentina", "Camila", "Julieta", "Micaela", "Martina", "Antonella", "Delfina", "Ludmila", "Yasmin", "Agustina", "Rocío", "Bianca", "Guadalupe", "Malena", "Aurora", "Solange", "Paulina"];
export const APELLIDOS = ["Vega", "Paz", "Martinez", "Gómez", "Ferreyra", "Sosa", "Suárez", "Álvarez", "Ruiz", "Molina", "Ortega", "Castro", "Romero", "Benitez", "Villalba", "Jara", "Correa", "Domínguez", "Paredes", "Rosales", "Acosta", "Almada", "Blanco", "Cardozo", "Díaz", "Espínola", "Fuentes", "Godoy"];
export const CALLES = ["Av. San Martín", "Calle Zeballos", "Pje. Los Tilos", "Av. Técnicos", "Calle Rivadavia", "Bv. Argentino"];

// ============================================================
// FRANJAS DE HORARIO (6 franjas de 45 minutos, 5 días)
// ============================================================
export const FRANJAS = [
  { inicio: "08:00", fin: "08:45" },
  { inicio: "08:45", fin: "09:30" },
  { inicio: "09:30", fin: "10:15" },
  { inicio: "10:15", fin: "11:00" },
  { inicio: "11:00", fin: "11:45" },
  { inicio: "11:45", fin: "12:30" },
];

// ============================================================
// TEXTOS DE CONVIVENCIA
// ============================================================
export const MOTIVOS_SANCION = [
  "Reiteradas faltas de respeto hacia compañeros durante la clase de Historia.",
  "Faltas de asistencia injustificadas reiteradas en el mes.",
  "Agresión leve entre compañeros en el patio durante el recreo.",
  "Ingresar al establecimiento fuera de horario sin autorización del preceptor.",
  "Daño intencional al mobiliario del aula registrado por las cámaras.",
  "No cumplir con el uso del uniforme y la normativa del taller por tercera vez.",
  "Retirarse del establecimiento durante la jornada sin autorización.",
  "Encontrado jugando cartas con apuestas de dinero durante clases.",
];

export const TEXTOS_OBSERVACION = [
  "Excelente participación y trabajo en grupo.",
  "Muestra interés creciente por los trabajos prácticos del taller.",
  "Necesita apoyo en matemática: se sugiere reforzar aritmética.",
  "Buen compañerismo: ayudó a un compañero nuevo a integrarse al grupo.",
  "Rendimiento irregular en el cuatrimestre; se comunicó al tutor por agenda.",
  "Presenta los trabajos en tiempo y forma salvo por retrasos puntuales.",
  "Lidera proyectos en la materia; se propone como delegado del curso.",
  "Presentó certificado justificando dos tardanzas de la semana.",
  "Se lo observó atento, pero con distracciones reiteradas en la última clase.",
  "Recuperó contenidos pendientes del primer cuatrimestre con éxito.",
  "Falta de materiales en clase de forma reiterada; se entregó kit de préstamo.",
  "Muy buen cumplimiento de las normas del laboratorio informático.",
];

// ============================================================
// CORREOS / WHATSAPP / NOTIFICACIONES (plantillas)
// ============================================================
export const ASUNTOS_CORREO = [
  { asunto: "Novedad: Boletín del 1er cuatrimestre", cuerpo: "Estimado alumno/tutor: el boletín de calificaciones del primer cuatrimestre ya está disponible en el panel de la escuela." },
  { asunto: "Recordatorio: entrega de carpeta de taller", cuerpo: "Recordá presentar la carpeta del taller antes del cierre de la semana." },
  { asunto: "Aviso: inasistencias registradas", cuerpo: "Se registraron inasistencias en los últimos días. Para justificarlas presentá el certificado correspondiente en preceptoría." },
  { asunto: "Novedad: clases de apoyo de matemática", cuerpo: "Se abren clases de apoyo de matemática los martes y jueves en el aula 103." },
  { asunto: "Novedad: préstamos de biblioteca", cuerpo: "La biblioteca habilitó préstamos de manuales de apoyo para el segundo cuatrimestre." },
  { asunto: "Recordatorio: ficha médica", cuerpo: "Recordá completar la ficha médica del alumno antes de fin de mes." },
  { asunto: "Invitación: acto escolar", cuerpo: "El próximo evento institucional se realizará en el patio principal a las 9 hs." },
  { asunto: "Proyecto integrador", cuerpo: "La entrega del plan del proyecto integrador se abre la semana entrante en el panel." },
];

export const CUERPOS_WHATSAPP = [
  "Hola tutora, avisamos que el alumno faltó hoy. ¿Hay novedades para justificar?",
  "Buenas tardes, compartimos el listado de materiales del taller para la firma.",
  "Recordá pasar a retirar la carpeta de reuniones por secretaría.",
  "El colectivo escolar saldrá a las 11:40 por la actividad cultural.",
  "Le escribimos por las inasistencias de la semana: esperamos el certificado.",
  "El alumno entregó el práctico pendiente. Seguimos en contacto por cualquier consulta.",
  "Buen día, le pasamos el material del taller ya subido al panel.",
  "Confirmamos la reunión de tutores el jueves a las 18 hs.",
  "El alumno llega a término con las entregas de biología.",
  "Los objetos perdidos pueden retirarse por secretaría hasta el viernes.",
  "El alumno tiene una evaluación pendiente de inglés; se toma el lunes.",
  "No se olvide del acto de cierre del cuatrimestre; detalle en el panel.",
];

export const TITULOS_NOTIFICACION = [
  { tipo: "comunicado", titulo: "Nuevo comunicado institucional", cuerpo: "Se publicó un nuevo comunicado en el panel del colegio." },
  { tipo: "inasistencia", titulo: "Inasistencia registrada", cuerpo: "Se registró una inasistencia en tu curso." },
  { tipo: "sancion", titulo: "Sanción cargada en legajo", cuerpo: "Se cargó una sanción en el legajo de un alumno." },
  { tipo: "nota", titulo: "Nota cargada en libreta", cuerpo: "El profesor cargó una calificación nueva." },
  { tipo: "reunion", titulo: "Reunión de tutores convocada", cuerpo: "Se convocó reunión de tutores para el próximo jueves." },
  { tipo: "sistema", titulo: "Copia de seguridad completada", cuerpo: "El sistema completó el backup nocturno sin errores." },
];

// ============================================================
// BIBLIOTECA / OBJETOS PERDIDOS
// ============================================================
export const RECURSOS_BIBLIOTECA = [
  ["Java 11 — Guía de programación", "Libro"],
  ["Manual de electrónica básica", "Libro"],
  ["Matemática — Manual 3er año", "Manual"],
  ["Diseño de bases de datos SQL", "Libro"],
  ["Revista Popular Science Nº 210", "Revista"],
  ["Historia Argentina Vol. II", "Libro"],
  ["Diccionario técnico industrial", "Enciclopedia"],
  ["Guía práctica de MySQL", "Libro"],
  ["Ciencias naturales — Manual 2º año", "Manual"],
  ["Revista National Geographic Nº 90", "Revista"],
  ["Microcontroladores AVR", "Libro"],
  ["Resúmenes de física", "Manual"],
  ["Manual de electrotecnia", "Libro"],
  ["Álgebra y trigonometría", "Libro"],
  ["Prácticas de inglés B1", "Manual"],
  ["Compilers — Revista Nº 3", "Revista"],
  ["Atlas mundial escolar", "Enciclopedia"],
  ["Guía de motores DC", "Libro"],
  ["Fundamentos de robótica", "Libro"],
  ["Redes inalámbricas sin misterios", "Libro"],
  ["Ejercicios de física", "Manual"],
  ["Poemario latinoamericano", "Libro"],
  ["Manual básico de CAD", "Manual"],
  ["Fundamentos de mecatrónica", "Libro"],
  ["Revista informática anual", "Revista"],
];

export const OBJETOS_PERDIDOS = [
  { nombre: "Llavero con figura geométrica", descripcion: "Llavero metálico hallado en el hall central.", estado: "perdido", offsetDias: 9 },
  { nombre: "Paraguas azul", descripcion: "Paraguas plegable tiempo del hall inferior.", estado: "encontrado", offsetDias: 14 },
  { nombre: "Auriculares in-ear", descripcion: "Auriculares con cable, hallados en el taller.", estado: "encontrado", offsetDias: 21 },
  { nombre: "Carpeta azul", descripcion: "Carpeta con calcomanías y nombre ilegible.", estado: "perdido", offsetDias: 27 },
  { nombre: "Bufanda gris", descripcion: "Bufanda, extraviada en el patio tras el acto.", estado: "perdido", offsetDias: 33 },
  { nombre: "Botella térmica negra", descripcion: "Botella térmica negra con etiqueta despegada.", estado: "encontrado", offsetDias: 41 },
  { nombre: "Anteojos de vista", descripcion: "Armazón metálico hallado en la biblioteca.", estado: "reclamado", offsetDias: 55 },
  { nombre: "Libreta verde", descripcion: "Libreta de tapa dura con goma elástica.", estado: "perdido", offsetDias: 70 },
];
