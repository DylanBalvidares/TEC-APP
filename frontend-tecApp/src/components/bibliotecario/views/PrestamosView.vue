<!DOCTYPE html>
<html lang="es">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Préstamos</title>
        <link rel="stylesheet" href="disenioGestionInventario.css" />
    </head>
    <body>
        <header class="top-bar">
            <h1 id="titulo">Préstamos</h1>
            <a href="InicioBibliotecario.html" class="volver">← Volver</a>
        </header>

        <main class="contenedor">
            <section class="barra-superior">
                <input
                    type="text"
                    id="busqueda"
                    placeholder="Buscar préstamos..."
                />
            </section>

            <section id="tablaPrestamos" class="inventario"></section>
        </main>

        <script src="prestamosBibliotecario.js"></script>
    </body>
</html>

<style>
/* ==========================================
   GENERAL
========================================== */

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: Arial, Helvetica, sans-serif;
}

body {
    background-image: url(fondo.jpg);
}

/* ==========================================
   HEADER
========================================== */

.top-bar {
    background: #ca0d0d;
    color: white;

    display: flex;
    justify-content: space-between;
    align-items: center;

    padding: 18px 40px;
}

.top-bar h1 {
    font-size: 28px;
}

.volver {
    color: white;
    text-decoration: none;
    font-weight: bold;
}

/* ==========================================
   CONTENEDOR
========================================== */

.contenedor {
    width: 90%;
    margin: 40px auto;
}

/* ==========================================
   BARRA SUPERIOR
========================================== */

.barra-superior {
    display: flex;
    justify-content: space-between;
    align-items: center;

    margin-bottom: 30px;
}

#busqueda {
    width: 320px;

    padding: 12px;

    border: 1px solid #ccc;
    border-radius: 10px;
}

.new-btn {
    background: #2563eb;
    color: white;

    border: none;
    border-radius: 10px;

    padding: 12px 22px;

    cursor: pointer;

    font-size: 15px;
}

.new-btn:hover {
    background: #1d4ed8;
}

/* ==========================================
   LISTA
========================================== */

.inventario {
    display: flex;
    flex-direction: column;

    gap: 18px;
}

.item-card {
    background: white;

    border-radius: 16px;

    padding: 22px;

    display: flex;
    justify-content: space-between;
    align-items: center;

    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.item-card h3 {
    margin-bottom: 6px;
}

.item-card p {
    color: #666;
    margin-bottom: 8px;
}

.item-card span {
    font-weight: bold;
    color: #2563eb;
}

/* ==========================================
   BOTONES
========================================== */

.acciones {
    display: flex;
    gap: 10px;
}

.acciones button {
    border: none;

    cursor: pointer;

    border-radius: 8px;

    padding: 10px 14px;

    color: white;

    font-size: 16px;
}

.acciones button:first-child {
    background: #f59e0b;
}

.acciones button:last-child {
    background: #dc2626;
}

/* ==========================================
   MODAL
========================================== */

.modal {
    position: fixed;

    inset: 0;

    background: rgba(0, 0, 0, 0.45);

    display: flex;
    justify-content: center;
    align-items: center;
}

.oculto {
    display: none;
}

.modal-content {
    width: 450px;

    background: white;

    border-radius: 18px;

    padding: 30px;
}

.modal-content h2 {
    margin-bottom: 25px;
}

.modal-content label {
    display: block;

    margin-top: 15px;
    margin-bottom: 6px;

    font-weight: bold;
}

.modal-content input,
.modal-content select {
    width: 100%;

    padding: 12px;

    border: 1px solid #ccc;

    border-radius: 8px;
}

.modal-buttons {
    display: flex;
    justify-content: flex-end;

    gap: 15px;

    margin-top: 30px;
}

.save-btn {
    background: #16a34a;
    color: white;

    border: none;

    padding: 12px 22px;

    border-radius: 8px;

    cursor: pointer;
}

.cancel-btn {
    background: #6b7280;
    color: white;

    border: none;

    padding: 12px 22px;

    border-radius: 8px;

    cursor: pointer;
}

.save-btn:hover {
    background: #15803d;
}

.cancel-btn:hover {
    background: #4b5563;
}
</style>

<script>
let prestamos = JSON.parse(localStorage.getItem("prestamos")) || [];

// Ahora apunta al contenedor de la sección de inventario/préstamos
const tabla = document.getElementById("tablaPrestamos");

function cargarPrestamos() {
    tabla.innerHTML = "";

    // Si no hay datos, muestra el cartel adaptado al diseño de tarjetas
    if (prestamos.length === 0) {
        tabla.innerHTML = `
            <div class="vacio" style="background: white; padding: 40px; border-radius: 15px; text-align: center; color: #a0aec0; width: 100%; box-shadow: 0 4px 12px rgba(0,0,0,.08);">
                No hay préstamos registrados.
            </div>
        `;
        return;
    }

    prestamos.forEach((prestamo, index) => {
        // Genera la tarjeta con la misma estructura que la gestión de libros
        tabla.innerHTML += `
        <div class="item-card">
            <div>
                <h3>${prestamo.libro || prestamo.nombre}</h3>
                <p><strong>Usuario:</strong> ${prestamo.usuario}</p>
                <p><strong>Fecha:</strong> ${prestamo.fecha}</p>
                <span>${prestamo.estado}</span>
            </div>

            <div class="acciones">
                ${
                    prestamo.estado === "Prestado"
                        ? `<button onclick="devolver(${index})">Registrar devolución</button>`
                        : ""
                }
            </div>
        </div>
        `;
    });
}

function devolver(indice) {
    const nombre = prestamos[indice].libro || prestamos[indice].nombre;

    prestamos.splice(indice, 1);

    let libros = JSON.parse(localStorage.getItem("libros")) || [];
    libros.forEach((libro) => {
        if (libro.titulo === nombre) {
            libro.estado = "Disponible";
        }
    });

    let recursos = JSON.parse(localStorage.getItem("recursos")) || [];
    recursos.forEach((recurso) => {
        if (recurso.nombre === nombre) {
            recurso.estado = "Disponible";
        }
    });

    localStorage.setItem("prestamos", JSON.stringify(prestamos));
    localStorage.setItem("libros", JSON.stringify(libros));
    localStorage.setItem("recursos", JSON.stringify(recursos));

    cargarPrestamos();
}

// Carga inicial
cargarPrestamos();
</script>
