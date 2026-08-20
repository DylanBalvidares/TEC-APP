<!DOCTYPE html>
<html lang="es">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />

        <title>Biblioteca - Libros</title>

        <link rel="stylesheet" href="disenioBibliotecaLibros.css" />

        <link
            href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"
            rel="stylesheet"
        />
    </head>

    <body>
        <nav class="navbar">
            <div class="nav-izquierda">
                <div class="logo">
                    <div>
                        <img src="logoEscuela.png" width="60" height="60" />
                    </div>
                    <div class="logo-titulo">
                        <h2>GESTIÓN ESCOLAR</h2>
                        <p>Biblioteca</p>
                    </div>
                </div>
            </div>

            <div class="profile-container" id="profileContainer">
                <button class="profile-trigger" id="profileBtn">
                    <img
                        src="https://ui-avatars.com/api/?name=Usuario+Escuela&background=0D8ABC&color=fff"
                        alt="User"
                    />
                </button>

                <div class="profile-menu" id="profileMenu">
                    <div class="menu-header">
                        <img
                            src="https://ui-avatars.com/api/?name=Usuario+Escuela&background=0D8ABC&color=fff"
                            class="large-avatar"
                        />
                        <p class="user-name">Juan Pérez</p>
                        <p class="user-email">juan.perez@escuela.edu</p>
                    </div>
                    <hr />
                    <div class="menu-body">
                        <p class="user-role">
                            Curso: <span id="roleBadge">Profesor</span>
                        </p>
                        <a href="#" class="menu-item"
                            ><i class="fas fa-user-cog"></i> Mi Perfil</a
                        >
                        <a href="#" class="menu-item"
                            ><i class="fas fa-book"></i> Mis Cursos</a
                        >
                    </div>
                    <hr />
                    <button class="sign-out-btn">Cerrar Sesión</button>
                </div>
            </div>
        </nav>

        <!-- ACÁ TERMINA EL NAV-->

        <div class="container">
            <aside class="sidebar">
                <ul>
                    <a href="Inicio.html"
                        ><li><i class="fas fa-home"></i> Inicio</li></a
                    >
                    <a href="Noticias.html"
                        ><li><i class="fas fa-newspaper"></i> Noticias</li></a
                    >
                    <a href="Biblioteca.html"
                        ><li class="active">
                            <i class="fas fa-book"></i> Biblioteca
                        </li></a
                    >
                    <a href="ObjetosPerdidos2.0.html"
                        ><li><i class="fas fa-box"></i> Objetos Perdidos</li></a
                    >
                    <a href="cursosMaestros.html"
                        ><li>
                            <i class="fas fa-graduation-cap"></i> Cursos
                        </li></a
                    >
                </ul>
                <div class="sidebar-help">
                    <i class="fas fa-question-circle"></i>
                    <div>
                        <p class="help-title">¿Necesitás ayuda?</p>
                        <p class="help-sub">Pixelina resolverá tu consulta.</p>
                    </div>
                </div>
            </aside>

            <!-- MAIN -->
            <main class="main-content">
                <!-- TOPBAR -->
                <header class="topbar">
                    <div class="header-info">
                        <div class="caja">
                            <img
                                src="libritos.png"
                                alt="caja"
                                width="70"
                                height="70"
                            />
                        </div>

                        <div>
                            <h1>Biblioteca - Libros</h1>
                            <p>
                                Todos los libros que se encuentran en la
                                biblioteca.
                            </p>
                            <br />
                        </div>
                    </div>
                </header>

                <!-- FILTERS -->
                <section class="filters">
                    <div class="search-box">
                        <i class="fas fa-search"></i>
                        <input
                            type="text"
                            id="searchInput"
                            placeholder="Buscar por libro o autor..."
                        />
                    </div>

                    <div class="filters-right">
                        <select id="genreFilter">
                            <option value="Todos">Todos los géneros</option>
                            <option value="Novela">Novela</option>
                            <option value="Historia">Historia</option>
                            <option value="Terror">Terror</option>
                            <option value="Poesía">Poesía</option>
                            <option value="Otros">Otros</option>
                        </select>

                        <select id="orderFilter">
                            <option value="recientes">Más recientes</option>
                            <option value="antiguos">Más antiguos</option>
                        </select>
                    </div>
                </section>

                <!-- REPORTES -->
                <section class="reports" id="cardsContainer"></section>
            </main>
        </div>

        <script src="bibliotecaJava.js"></script>
    </body>
</html>

<style>
/* 1. RESET Y CONFIGURACIÓN GLOBAL */

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: "Segoe UI", sans-serif;
}

body {
    background-image: url(fondo.jpg);
}

/* 2. BARRA DE NAVEGACIÓN (NAVBAR) */

.navbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 1.5%;
    background-color: #ffffff;
    border-bottom: 5px solid #ffffff;
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
}

.nav-izquierda,
.nav-derecha {
    display: flex;
    align-items: center;
    gap: 15px;
}

/* 3. PERFIL Y MENÚ DESPLEGABLE */

.profile-container {
    position: relative;
    display: flex;
    align-items: center;
}

.profile-trigger {
    border: 2px solid transparent;
    background: none;
    cursor: pointer;
    padding: 2px;
    border-radius: 50%;
    transition: 0.3s;
}

.profile-trigger:hover {
    border-color: #ddd;
}

.profile-trigger img {
    border-radius: 50%;
    width: 45px;
    height: 45px;
    display: block;
}

.profile-menu {
    display: none;
    position: absolute;
    right: 0;
    top: 55px;
    width: 280px;
    background: white;
    border-radius: 20px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    padding: 20px;
    z-index: 1000;
}

.profile-menu.active {
    display: block;
}

.menu-header {
    text-align: center;
    padding-bottom: 10px;
}

.large-avatar {
    border-radius: 50%;
    width: 70px;
    height: 70px;
    margin-bottom: 10px;
}

.user-name {
    font-weight: 600;
    font-size: 1.1em;
}

.user-email {
    color: #5f6368;
    font-size: 0.85em;
}

hr {
    border: 0;
    border-top: 1px solid #eee;
    margin: 15px 0;
}

.menu-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px;
    text-decoration: none;
    color: #3c4043;
    border-radius: 8px;
    transition: 0.2s;
}

.menu-item:hover {
    background: #f8f9fa;
}

.sign-out-btn {
    width: 100%;
    padding: 10px;
    border: 1px solid #dadce0;
    border-radius: 10px;
    background: white;
    cursor: pointer;
    font-weight: 500;
    transition: 0.3s;
}

.sign-out-btn:hover {
    background: #fdf2f2;
    border-color: #d93025;
    color: #d93025;
}

/* 4. ESTRUCTURA PRINCIPAL (LAYOUT) */

.container {
    display: flex;
    min-height: calc(100vh - 70px);
}

/* SIDEBAR */

.sidebar {
    width: 250px;
    background: linear-gradient(180deg, #ca0d0d, #420101);
    color: white;
    padding: 20px;
    flex-shrink: 0;
}

.sidebar ul {
    list-style: none;
}

.sidebar li {
    padding: 14px;
    margin-bottom: 10px;
    border-radius: 10px;
    cursor: pointer;
    transition: 0.3s;
}

.sidebar li:hover,
.sidebar li.active {
    background: rgba(255, 255, 255, 0.2);
}

.sidebar a {
    text-decoration: none;

    color: inherit;

    display: block;
}

.sidebar-help {
    display: flex;

    align-items: center;

    gap: 12px;

    background: rgba(255, 255, 255, 0.08);

    border-radius: 10px;

    padding: 12px 14px;

    margin-top: auto;
}

.sidebar-help i {
    font-size: 22px;

    color: rgba(255, 255, 255, 0.7);

    flex-shrink: 0;
}

.help-title {
    font-size: 13px;

    font-weight: 600;

    color: white;

    margin: 0;
}

.help-sub {
    font-size: 11px;

    color: rgba(255, 255, 255, 0.6);

    margin: 2px 0 0 0;
}

/* 5. ELEMENTOS DEL LOGO */

.logo {
    display: flex;

    align-items: center;

    gap: 15px;

    margin: 5px;
}

.logo-titulo {
    display: flex;

    flex-direction: column;

    gap: 5px;
}

.logo h2,
.logo p {
    font-family: "Franklin Gothic Medium", "Arial Narrow", Arial, sans-serif;
}

.logo p {
    color: gray;
}

/* MAIN CONTENT */

.main-content {
    flex: 1;
    padding: 30px;
    overflow-y: auto;
}

.profile {
    width: 50px;
    height: 50px;
    background: #0ea5e9;
    border-radius: 50%;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
}

/* HEADER */

.page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #f8f8fb;
    padding: 30px;
    border-radius: 20px;
    margin-bottom: 25px;
}

.header-left {
    display: flex;
    align-items: center;
    gap: 20px;
}

.header-icon {
    font-size: 45px;
}

.header-info {
    display: flex;
    gap: 30px;
}

.page-header h1 {
    font-size: 38px;
    margin-bottom: 5px;
}

.page-header p {
    color: #666;
}

/* FILTERS */

.filters {
    display: flex;
    justify-content: space-between;
    gap: 20px;
    margin-bottom: 25px;
}

.filters input {
    flex: 1;
    padding: 15px;
    border-radius: 12px;
    border: 1px solid #ddd;
    font-size: 14px;
}

.filter-actions {
    display: flex;
    gap: 15px;
}

select {
    padding: 15px;
    border-radius: 12px;
    border: 1px solid #ddd;
    background: white;
    font-size: 14px;
}

/* GRID */

.cards-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 22px;
}

.card {
    background: white;
    border-radius: 20px;
    padding: 18px;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.05);
    transition: 0.3s;
}

.card:hover {
    transform: translateY(-4px);
}

.tag {
    display: inline-block;

    padding: 6px 12px;

    border-radius: 999px;

    font-size: 12px;

    font-weight: 600;

    margin-bottom: 12px;
}

.red {
    background: #fee2e2;

    color: #dc2626;
}

.yellow {
    background: #fef3c7;

    color: #d97706;
}

.green {
    background: #dcfce7;

    color: #16a34a;
}

.blue {
    background: #dbeafe;

    color: #2563eb;
}

.card h3 {
    font-size: 24px;

    margin-bottom: 12px;
}

.info {
    color: #555;

    line-height: 1.8;

    margin-bottom: 15px;
}

@keyframes aparecer {
    from {
        transform: translateY(20px);

        opacity: 0;
    }

    to {
        transform: translateY(0);

        opacity: 1;
    }
}

.close-btn {
    background: none;
    border: none;
    font-size: 18px;
    cursor: pointer;
}

.delete-btn {
    width: 100%;
    margin-top: 12px;
    background: #fee2e2;
    color: #dc2626;
    border: none;
    padding: 12px;
    border-radius: 10px;
    cursor: pointer;
    font-weight: 600;
}

.search-box {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 10px;
    background: white;
    padding: 15px 20px;
    border-radius: 14px;
}

.search-box input {
    border: none;
    outline: none;
    width: 100%;
    font-size: 14px;
}

.filters-right {
    display: flex;
    gap: 15px;
}

/* REPORTS */

.reports {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.report-card {
    background: white;
    border-radius: 18px;
    padding: 25px;
    display: grid;
    grid-template-columns: 2fr 2fr 1.5fr 0fr;
    align-items: center;
    gap: 25px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    border-left: 6px solid transparent;
}

.red {
    border-color: #dc2626;
}

.yellow {
    border-color: #f59e0b;
}

.green {
    border-color: #16a34a;
}

.blue {
    border-color: #2563eb;
}

.report-left {
    display: flex;
    align-items: center;
    gap: 18px;
}

.object-image {
    width: 90px;

    height: 90px;

    border-radius: 50%;

    background: #f1f1f1;
}

.report-left h3 {
    margin-bottom: 10px;

    font-size: 26px;
}

.report-left p {
    color: #666;

    margin-bottom: 6px;
}

.report-description {
    color: #444;

    line-height: 1.7;
}

.report-user {
    display: flex;

    align-items: center;

    gap: 15px;
}

.avatar {
    width: 50px;

    height: 50px;

    border-radius: 50%;

    background: #38bdf8;

    color: white;

    display: flex;

    justify-content: center;

    align-items: center;

    font-weight: bold;
}

.purple {
    background: #8b5cf6;
}

.report-user h4 {
    margin-bottom: 6px;
}

.report-user p {
    color: #666;

    margin-bottom: 4px;
}

.report-status {
    text-align: right;
}

.status {
    display: inline-block;

    padding: 10px 16px;

    border-radius: 999px;

    font-size: 13px;

    font-weight: 700;

    margin-bottom: 12px;
}

.green-status {
    background: #dcfce7;

    color: #16a34a;
}

.yellow-status {
    background: #fef3c7;

    color: #d97706;
}

.report-status p {
    color: #666;
}

/* MODAL */

.modal {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
    display: none;
    justify-content: center;
    align-items: center;
    z-index: 3000;
}

.modal.active {
    display: flex;
}

.modal-content {
    width: 95%;
    max-width: 550px;
    background: white;
    padding: 30px;
    border-radius: 20px;
    animation: aparecer 0.25s ease;
}

@keyframes aparecer {
    from {
        transform: translateY(20px);
        opacity: 0;
    }

    to {
        transform: translateY(0);
        opacity: 1;
    }
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.modal-header button {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 18px;
}

#objectForm {
    display: flex;
    flex-direction: column;
    gap: 15px;
}

#objectForm input,
#objectForm textarea,
#objectForm select {
    padding: 15px;
    border-radius: 12px;
    border: 1px solid #ddd;
    font-size: 14px;
}

#objectForm textarea {
    resize: none;
    min-height: 120px;
}

.save-btn {
    background: #dc2626;
    color: white;
    border: none;
    padding: 15px;
    border-radius: 12px;
    cursor: pointer;
    font-weight: 600;
}

.action-btn {
    color: white;
    border: none;
    padding: 10px 18px;
    border-radius: 8px;
    cursor: pointer;
    margin-top: 10px;
}

.loan-btn {
    background: #e53935;
    color: white;
    border: none;
    padding: 10px 18px;
    border-radius: 8px;
    cursor: pointer;
    margin-top: 10px;
}

.cancel-btn {
    background: #6b7280;
    color: white;
    border: none;
    padding: 10px 18px;
    border-radius: 8px;
    cursor: pointer;
    margin-top: 10px;
}

/* =========================
   RESPONSIVE
========================= */

/* REPORTES */
@media (max-width: 1200px) {
    .report-card {
        grid-template-columns: 1fr;
    }
}

/* GRID */
@media (max-width: 1100px) {
    .cards-grid {
        grid-template-columns: repeat(2, 1fr);
    }
}

/* TABLET */
@media (max-width: 900px) {
    .container {
        flex-direction: column;
    }

    .sidebar {
        width: 100%;
    }

    .page-header,
    .filters {
        flex-direction: column;
        align-items: stretch;
    }

    .filter-actions,
    .filters-right {
        flex-direction: column;
    }

    .topbar {
        flex-direction: column;
        align-items: flex-start;
        gap: 20px;
    }
}

/* MÓVIL */
@media (max-width: 700px) {
    .cards-grid {
        grid-template-columns: 1fr;
    }
}
</style>
<script>
/* ======================================================
    INICIO DE SESIÓN
====================================================== */

document.addEventListener("DOMContentLoaded", () => {
    // --- 1. REFERENCIAS AL DOM ---
    const navDerecha = document.getElementById("navDerecha");
    const profileBtn = document.getElementById("profileBtn");
    const profileMenu = document.getElementById("profileMenu");
    const signOutBtn = document.querySelector(".sign-out-btn");
    const searchInput = document.querySelector(".search-box input");

    // --- 2. VERIFICACIÓN DE SEGURIDAD ---
    const sesionActiva = localStorage.getItem("sesionActiva");

    if (sesionActiva !== "true") {
        // IMPORTANTE: Asegúrate de que este nombre de archivo sea el correcto
        window.location.href = "loginPrincipal.html";
        return;
    }

    // --- 3. CARGA DE DATOS DEL PERFIL ---
    // Usamos las mismas llaves que guardamos en el login
    const userName = localStorage.getItem("userName");
    const userDni = localStorage.getItem("userDni"); // Cambiado de Email a DNI
    const userCurso = localStorage.getItem("userCurso"); // Cambiado de Role a Curso

    // --- LÓGICA DE AVATAR DINÁMICO ---
    // Convertimos "Juan Perez" en "Juan+Perez" para la API
    const nameForApi = userName.split(" ").join("+");
    const avatarUrl = `https://ui-avatars.com/api/?name=${nameForApi}&background=0D8ABC&color=fff`;

    // Seleccionamos las imágenes (la del botón y la del menú abierto)
    const profileImg = document.querySelector("#profileBtn img");
    const largeAvatar = document.querySelector(".large-avatar");

    // Aplicamos la imagen con las iniciales
    if (profileImg) profileImg.src = avatarUrl;
    if (largeAvatar) largeAvatar.src = avatarUrl;
    // --------------------------------

    if (navDerecha) navDerecha.classList.remove("logged-out");

    if (document.querySelector(".user-name")) {
        document.querySelector(".user-name").innerText = userName;
    }

    if (document.querySelector(".user-email")) {
        document.querySelector(".user-email").innerText = userDni
            ? `DNI: ${userDni}`
            : "Sin documento";
    }

    const badge = document.getElementById("roleBadge");
    if (badge) {
        badge.innerText = userCurso;
        badge.style.color = userCurso.includes("7") ? "#d93025" : "#1e8e3e";
    }
    // --- 4. INTERACTIVIDAD DEL MENÚ ---
    if (profileBtn) {
        profileBtn.addEventListener("click", (e) => {
            profileMenu.classList.toggle("active");
            e.stopPropagation();
        });
    }

    document.addEventListener("click", (e) => {
        if (
            profileMenu &&
            !profileMenu.contains(e.target) &&
            e.target !== profileBtn
        ) {
            profileMenu.classList.remove("active");
        }
    });

    // --- 5. CERRAR SESIÓN ---
    if (signOutBtn) {
        signOutBtn.addEventListener("click", () => {
            localStorage.clear();
            window.location.href = "loginPrincipal.html";
        });
    }
});

/* ======================================================
   BIBLIOTECA - LIBROS
====================================================== */

let libros = JSON.parse(localStorage.getItem("libros")) || [
    {
        id: 1,
        titulo: "El Principito",
        autor: "Antoine de Saint-Exupéry",
        categoria: "Novela",
        estado: "Disponible",
    },

    {
        id: 2,
        titulo: "Don Quijote",
        autor: "Miguel de Cervantes",
        categoria: "Historia",
        estado: "Disponible",
    },

    {
        id: 3,
        titulo: "1984",
        autor: "George Orwell",
        categoria: "Novela",
        estado: "Disponible",
    },

    {
        id: 4,
        titulo: "Veinte poemas de amor y una canción desesperada",
        autor: "Pablo Neruda",
        categoria: "Poesía",
        estado: "Disponible",
    },

    {
        id: 5,
        titulo: "El extraño caso del doctor Jekyll y el señor Hyde",
        autor: "Robert Louis Stevenson",
        categoria: "Terror",
        estado: "Disponible",
    },
];

if (!localStorage.getItem("libros")) {
    localStorage.setItem("libros", JSON.stringify(libros));
}

const prestamos = JSON.parse(localStorage.getItem("prestamos")) || [];

const booksList = document.getElementById("cardsContainer");

const searchInput = document.getElementById("searchInput");

const genreFilter = document.getElementById("genreFilter");

const orderFilter = document.getElementById("orderFilter");

function renderLibros() {
    booksList.innerHTML = "";

    let librosFiltrados = [...libros];

    const texto = searchInput.value.toLowerCase();

    const genero = genreFilter.value;

    const orden = orderFilter.value;

    librosFiltrados = librosFiltrados.filter(
        (libro) =>
            libro.titulo.toLowerCase().includes(texto) ||
            libro.autor.toLowerCase().includes(texto),
    );

    if (genero !== "Todos") {
        librosFiltrados = librosFiltrados.filter(
            (libro) => libro.categoria === genero,
        );
    }

    if (orden === "recientes") {
        librosFiltrados.sort((a, b) => b.id - a.id);
    } else {
        librosFiltrados.sort((a, b) => a.id - b.id);
    }

    librosFiltrados.forEach((libro) => {
        console.log(libro);

        let claseEstado = "";
        let textoEstado = "";

        switch (libro.estado) {
            case "Disponible":
                claseEstado = "green-status";
                textoEstado = "DISPONIBLE";
                break;

            case "Solicitado":
                claseEstado = "yellow-status";
                textoEstado = "SOLICITADO";
                break;

            case "Prestado":
                claseEstado = "red-status";
                textoEstado = "PRESTADO";
                break;
        }

        booksList.innerHTML += `

        <div class="report-card">

            <div class="report-left">

                <div>

                    <h3>📖 ${libro.titulo}</h3>

                    <p>${libro.autor}</p>

                    <p>${libro.categoria}</p>

                </div>

            </div>

            <div class="report-description">

                Libro disponible en biblioteca.

            </div>

            <div class="report-status">

                <span class="status ${claseEstado}">
                    ${textoEstado}
                </span>

                ${
                    libro.estado === "Disponible"
                        ? `
                    <button
                        class="loan-btn"
                        onclick="solicitarLibro(${libro.id})"
                    >
                        Solicitar préstamo
                    </button>
                    `
                        : libro.estado === "Solicitado"
                          ? `
                    <button
                        class="cancel-btn"
                        onclick="cancelarSolicitud(${libro.id})"
                    >
                        Cancelar solicitud
                    </button>
                    `
                          : ""
                }


            </div>

        </div>

        `;
    });
}

function solicitarLibro(id) {
    const libro = libros.find((libro) => libro.id === id);

    if (!libro) return;

    const confirmar = confirm(`¿Deseás solicitar "${libro.titulo}"?`);

    if (!confirmar) return;

    libro.estado = "Solicitado";

    libro.solicitadoPor = localStorage.getItem("userName");

    libro.cursoSolicitante = localStorage.getItem("userCurso");

    localStorage.setItem("libros", JSON.stringify(libros));

    let prestamos = JSON.parse(localStorage.getItem("prestamos")) || [];

    prestamos.push({
        libro: libro.titulo,

        usuario: localStorage.getItem("userName"),

        curso: localStorage.getItem("userCurso"),

        fecha: new Date().toLocaleDateString("es-AR"),

        estado: "Pendiente",
    });

    localStorage.setItem("prestamos", JSON.stringify(prestamos));

    alert("Solicitud enviada correctamente 📚");

    renderLibros();
}

function cancelarSolicitud(id) {
    const libro = libros.find((libro) => libro.id === id);

    if (!libro) return;

    const confirmar = confirm(`¿Cancelar la solicitud de "${libro.titulo}"?`);

    if (!confirmar) return;

    libro.estado = "Disponible";

    delete libro.solicitadoPor;
    delete libro.cursoSolicitante;

    localStorage.setItem("libros", JSON.stringify(libros));

    let prestamos = JSON.parse(localStorage.getItem("prestamos")) || [];

    prestamos = prestamos.filter((prestamo) => prestamo.libro !== libro.titulo);

    localStorage.setItem("prestamos", JSON.stringify(prestamos));

    renderLibros();
}

/* ======================================================
   BIBLIOTECA PRINCIPAL
====================================================== */

function cargarBibliotecaPrincipal() {
    const librosDisponibles = libros.filter(
        (libro) => libro.estado === "Disponible",
    ).length;

    const recursosDisponibles = recursos.filter(
        (recurso) => recurso.estado === "Disponible",
    ).length;

    const prestamosLibros = libros.filter(
        (libro) => libro.estado === "Solicitado",
    ).length;

    const prestamosRecursos = recursos.filter(
        (recurso) => recurso.estado === "Solicitado",
    ).length;

    document.getElementById("librosDisponibles").textContent =
        librosDisponibles;

    document.getElementById("prestamosActivos").textContent =
        prestamosLibros + prestamosRecursos;

    document.getElementById("recursosActivos").textContent =
        recursosDisponibles;
}

function cargarUltimosLibros() {
    const booksList = document.getElementById("booksList");

    booksList.innerHTML = "";

    libros
        .slice(-4)
        .reverse()
        .forEach((libro) => {
            booksList.innerHTML += `

        <div class="book-card">

            <div class="book-title">
                📖 ${libro.titulo}
            </div>

            <div class="book-author">
                ${libro.autor}
            </div>

        <div class="book-status ${
            libro.estado === "Disponible"
                ? "status-disponible"
                : libro.estado === "Solicitado"
                  ? "status-solicitado"
                  : "status-prestado"
        }">
            ${libro.estado}
        </div>


        </div>

        `;
        });
}

function cargarMisPrestamos() {
    const contenedor = document.getElementById("misPrestamos");

    contenedor.innerHTML = "";

    const usuario = localStorage.getItem("userName");

    const misPrestamos = prestamos.filter((p) => p.usuario === usuario);

    if (misPrestamos.length === 0) {
        contenedor.innerHTML = `
        <p>
            No tenés préstamos activos.
        </p>
        `;

        return;
    }

    misPrestamos.forEach((prestamo) => {
        contenedor.innerHTML += `

            <div class="loan-card">

                <h3>
                    ${prestamo.libro || prestamo.nombre}
                </h3>

                <p>
                    Solicitado:
                    ${prestamo.fecha}
                </p>

                <div class="loan-footer">
                    <span class="warning">
                        Pendiente
                    </span>

                    <button
                        class="cancel-btn"
                        onclick="cancelarPrestamo('${prestamo.libro || prestamo.nombre}')"
                    >
                        Cancelar solicitud
                    </button>
                </div>

            </div>

            `;
    });
}

function cancelarPrestamo(nombre) {
    let prestamos = JSON.parse(localStorage.getItem("prestamos")) || [];

    prestamos = prestamos.filter((p) => (p.libro || p.nombre) !== nombre);

    localStorage.setItem("prestamos", JSON.stringify(prestamos));

    libros.forEach((libro) => {
        if (libro.titulo === nombre) {
            libro.estado = "Disponible";
        }
    });

    recursos.forEach((recurso) => {
        if (recurso.nombre === nombre) {
            recurso.estado = "Disponible";
        }
    });

    localStorage.setItem("libros", JSON.stringify(libros));

    localStorage.setItem("recursos", JSON.stringify(recursos));

    window.location.reload();
    cargarMisPrestamos();
}

/* ======================================================
   BIBLIOTECA - RECURSOS
====================================================== */

let recursos = JSON.parse(localStorage.getItem("recursos")) || [
    {
        id: 1,
        nombre: "Netbook 07",
        categoria: "Dispositivos",
        estado: "Disponible",
    },

    {
        id: 2,
        nombre: "Tablet Samsung",
        categoria: "Dispositivos",
        estado: "Disponible",
    },

    {
        id: 3,
        nombre: "Destornillador Phillips",
        categoria: "Herramientas",
        estado: "Disponible",
    },

    {
        id: 4,
        nombre: "Mapa Político",
        categoria: "Material Didáctico",
        estado: "Disponible",
    },
];

if (!localStorage.getItem("recursos")) {
    localStorage.setItem("recursos", JSON.stringify(recursos));
}

function renderRecursos() {
    booksList.innerHTML = "";

    let recursosFiltrados = [...recursos];

    const texto = searchInput.value.toLowerCase();

    const categoria = genreFilter.value;

    const orden = orderFilter.value;

    recursosFiltrados = recursosFiltrados.filter(
        (recurso) =>
            recurso.nombre.toLowerCase().includes(texto) ||
            recurso.categoria.toLowerCase().includes(texto),
    );

    if (categoria !== "Todos") {
        recursosFiltrados = recursosFiltrados.filter(
            (recurso) => recurso.categoria === categoria,
        );
    }

    if (orden === "recientes") {
        recursosFiltrados.sort((a, b) => b.id - a.id);
    } else {
        recursosFiltrados.sort((a, b) => a.id - b.id);
    }

    recursosFiltrados.forEach((recurso) => {
        let claseEstado = "";
        let textoEstado = "";

        switch (recurso.estado) {
            case "Disponible":
                claseEstado = "green-status";
                textoEstado = "DISPONIBLE";
                break;

            case "Solicitado":
                claseEstado = "yellow-status";
                textoEstado = "SOLICITADO";
                break;

            case "Prestado":
                claseEstado = "red-status";
                textoEstado = "PRESTADO";
                break;
        }

        booksList.innerHTML += `

        <div class="report-card">

            <div class="report-left">

                <div>

                    <h3>📦 ${recurso.nombre}</h3>

                    <p>${recurso.categoria}</p>

                </div>

            </div>

            <div class="report-description">

                Recurso disponible en biblioteca.

            </div>

           <div class="report-status">

            <span class="status ${claseEstado}">
                ${textoEstado}
            </span>

            ${
                recurso.estado === "Disponible"
                    ? `
                <button
                    class="loan-btn"
                    onclick="solicitarRecurso(${recurso.id})"
                >
                    Solicitar préstamo
                </button>
                `
                    : recurso.estado === "Solicitado"
                      ? `
                <button
                    class="cancel-btn"
                    onclick="cancelarSolicitudRecurso(${recurso.id})"
                >
                    Cancelar solicitud
                </button>
                `
                      : ""
            }

        </div>


        `;
    });
}

function solicitarRecurso(id) {
    const recurso = recursos.find((r) => r.id === id);

    if (!recurso) return;

    recurso.estado = "Solicitado";

    localStorage.setItem("recursos", JSON.stringify(recursos));

    let prestamos = JSON.parse(localStorage.getItem("prestamos")) || [];

    prestamos.push({
        tipo: "Recurso",

        nombre: recurso.nombre,

        usuario: localStorage.getItem("userName"),

        curso: localStorage.getItem("userCurso"),

        fecha: new Date().toLocaleDateString("es-AR"),

        estado: "Pendiente",
    });

    localStorage.setItem("prestamos", JSON.stringify(prestamos));

    renderRecursos();
}

function cancelarSolicitudRecurso(id) {
    const recurso = recursos.find((r) => r.id === id);

    if (!recurso) return;

    const confirmar = confirm(`¿Cancelar la solicitud de "${recurso.nombre}"?`);

    if (!confirmar) return;

    recurso.estado = "Disponible";

    localStorage.setItem("recursos", JSON.stringify(recursos));

    let prestamos = JSON.parse(localStorage.getItem("prestamos")) || [];

    prestamos = prestamos.filter((p) => p.nombre !== recurso.nombre);

    localStorage.setItem("prestamos", JSON.stringify(prestamos));

    renderRecursos();
}

/* ======================================================
   FINAL
====================================================== */

const esPaginaRecursos = document.title.includes("Recursos");

const params = new URLSearchParams(window.location.search);

const categoriaURL = params.get("categoria");

if (categoriaURL) {
    genreFilter.value = categoriaURL;
}

if (searchInput) {
    searchInput.addEventListener(
        "input",
        esPaginaRecursos ? renderRecursos : renderLibros,
    );
}

if (genreFilter) {
    genreFilter.addEventListener(
        "change",
        esPaginaRecursos ? renderRecursos : renderLibros,
    );
}

if (orderFilter) {
    orderFilter.addEventListener(
        "change",
        esPaginaRecursos ? renderRecursos : renderLibros,
    );
}

console.log(libros);

if (document.title.includes("Recursos")) {
    renderRecursos();
} else if (document.getElementById("cardsContainer")) {
    renderLibros();
}

cargarBibliotecaPrincipal();

cargarUltimosLibros();

cargarMisPrestamos();
</script>
