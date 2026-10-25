export const navigationByRole = {
  alumno: [
    { label: "Inicio", items: [{ label: "Inicio", to: "/alumno/inicio", icon: "fas fa-house" }] },
    { label: "Comunicación", items: [{ label: "Noticias", to: "/alumno/noticias", icon: "fas fa-newspaper" }] },
    { label: "Académico", items: [
      { label: "Cursos", to: "/alumno/cursos", icon: "fas fa-graduation-cap" },
      { label: "Libreta Digital", to: "/alumno/libreta", icon: "fas fa-book-open" },
    ] },
    { label: "Servicios", items: [{ label: "Objetos perdidos", to: "/alumno/objetos-perdidos", icon: "fas fa-box" }] },
  ],
  profesor: [
    { label: "Inicio", items: [{ label: "Inicio", to: "/profesor/inicio", icon: "fas fa-house" }] },
    { label: "Comunicación", items: [
      { label: "Noticias", to: "/profesor/noticias", icon: "fas fa-newspaper" },
      { label: "Comunicados", to: "/profesor/comunicados", icon: "fas fa-bullhorn" },
    ] },
    { label: "Mis cursos · Académico", items: [
      { label: "Mis Cursos", to: "/profesor/cursos", icon: "fas fa-graduation-cap" },
      { label: "Mis Materias", to: "/profesor/materias", icon: "fas fa-book" },
      { label: "Asistencias", to: "/profesor/asistencias", icon: "fas fa-clipboard-check" },
      { label: "Libreta Digital", to: "/profesor/libreta", icon: "fas fa-book-open" },
      { label: "Boletines", to: "/profesor/boletines", icon: "fas fa-file-lines" },
      { label: "Plan de Estudios", to: "/profesor/plan", icon: "fas fa-layer-group" },
    ] },
    { label: "Mensajería", items: [{ label: "WhatsApp", to: "/profesor/mensajes", icon: "fab fa-whatsapp" }] },
  ],
  preceptor: [
    { label: "Inicio", items: [{ label: "Inicio", to: "/preceptor/inicio", icon: "fas fa-house" }] },
    { label: "Académico · Cursos a cargo", items: [
      { label: "Asistencias", to: "/preceptor/asistencias", icon: "fas fa-clipboard-check" },
      { label: "Libreta Digital", to: "/preceptor/libreta", icon: "fas fa-book-open" },
      { label: "Boletines", to: "/preceptor/boletines", icon: "fas fa-file-lines" },
      { label: "Plan de Estudios", to: "/preceptor/plan", icon: "fas fa-layer-group" },
      { label: "Cursos a cargo", to: "/preceptor/cursos", icon: "fas fa-users" },
    ] },
    { label: "Comunicación", items: [
      { label: "WhatsApp", to: "/preceptor/mensajes", icon: "fab fa-whatsapp" },
      { label: "Comunicados", to: "/preceptor/comunicados", icon: "fas fa-bullhorn" },
    ] },
    { label: "Seguimiento", items: [
      { label: "Reportes", to: "/preceptor/reportes", icon: "fas fa-chart-bar" },
      { label: "Calendario", to: "/preceptor/calendario", icon: "fas fa-calendar-days" },
    ] },
  ],
  bibliotecario: [
    { label: "Biblioteca", items: [
      { label: "Inicio", to: "/biblioteca", icon: "fas fa-house" },
      { label: "Libros", to: "/biblioteca/libros", icon: "fas fa-book" },
      { label: "Recursos", to: "/biblioteca/recursos", icon: "fas fa-boxes-stacked" },
      { label: "Préstamos", to: "/biblioteca/prestamos", icon: "fas fa-arrow-right-arrow-left" },
    ] },
  ],
};
