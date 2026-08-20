<!DOCTYPE html>
<html lang="es">

<head>

    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <title>Gestión de Inventario</title>

    <link rel="stylesheet" href="disenioGestionInventario.css">

</head>

<body>

<header class="top-bar">

    <h1 id="titulo">Gestión de Libros</h1>

    <a href="InicioBibliotecario.html" class="volver">← Volver</a>

</header>

<main class="contenedor">

    <section class="barra-superior">

        <input type="text" id="busqueda" placeholder="Buscar...">

        <button id="btnNuevo" class="new-btn">+ Nuevo Libro</button>

    </section>

    <section id="listaInventario" class="inventario"></section>

</main>

<!-- Modal -->

<div id="modal" class="modal oculto">

    <div class="modal-content">

        <h2 id="tituloModal">Nuevo Libro</h2>

        <form id="formInventario">

            <input type="hidden" id="itemId">

            <label>Título / Nombre</label>

            <input type="text" id="nombre" required>

            <div id="grupoAutor">

                <label>Autor</label>
                <input type="text" id="autor">

            </div>

            <label>Categoría</label>

            <input type="text" id="categoria" required>

            <label>Estado</label>

            <select id="estado">

                <option>Disponible</option>
                <option>Prestado</option>
                <option>Solicitado</option>

            </select>

            <div class="modal-buttons">

                <button type="submit" class="save-btn">Guardar</button>

                <button type="button" id="btnCancelar" class="cancel-btn">Cancelar</button>

            </div>

        </form>

    </div>

</div>

<script src="gestionInventario.js"></script>

</body>

</html>

<style>
/* ==========================================
   GENERAL
========================================== */

*{
    margin:0;
    padding:0;
    box-sizing:border-box;
    font-family:Arial, Helvetica, sans-serif;
}

body{
   background-image: url(fondo.jpg);
}

/* ==========================================
   HEADER
========================================== */

.top-bar{

    background:#ca0d0d;
    color:white;

    display:flex;
    justify-content:space-between;
    align-items:center;

    padding:18px 40px;

}

.top-bar h1{

    font-size:28px;

}

.volver{

    color:white;
    text-decoration:none;
    font-weight:bold;

}

/* ==========================================
   CONTENEDOR
========================================== */

.contenedor{

    width:90%;
    margin:40px auto;

}

/* ==========================================
   BARRA SUPERIOR
========================================== */

.barra-superior{

    display:flex;
    justify-content:space-between;
    align-items:center;

    margin-bottom:30px;

}

#busqueda{

    width:320px;

    padding:12px;

    border:1px solid #ccc;
    border-radius:10px;

}

.new-btn{

    background:#2563eb;
    color:white;

    border:none;
    border-radius:10px;

    padding:12px 22px;

    cursor:pointer;

    font-size:15px;

}

.new-btn:hover{

    background:#1d4ed8;

}

/* ==========================================
   LISTA
========================================== */

.inventario{

    display:flex;
    flex-direction:column;

    gap:18px;

}

.item-card{

    background:white;

    border-radius:16px;

    padding:22px;

    display:flex;
    justify-content:space-between;
    align-items:center;

    box-shadow:0 4px 12px rgba(0,0,0,.08);

}

.item-card h3{

    margin-bottom:6px;

}

.item-card p{

    color:#666;
    margin-bottom:8px;

}

.item-card span{

    font-weight:bold;
    color:#2563eb;

}

/* ==========================================
   BOTONES
========================================== */

.acciones{

    display:flex;
    gap:10px;

}

.acciones button{

    border:none;

    cursor:pointer;

    border-radius:8px;

    padding:10px 14px;

    color:white;

    font-size:16px;

}

.acciones button:first-child{

    background:#f59e0b;

}

.acciones button:last-child{

    background:#dc2626;

}

/* ==========================================
   MODAL
========================================== */

.modal{

    position:fixed;

    inset:0;

    background:rgba(0,0,0,.45);

    display:flex;
    justify-content:center;
    align-items:center;

}

.oculto{

    display:none;

}

.modal-content{

    width:450px;

    background:white;

    border-radius:18px;

    padding:30px;

}

.modal-content h2{

    margin-bottom:25px;

}

.modal-content label{

    display:block;

    margin-top:15px;
    margin-bottom:6px;

    font-weight:bold;

}

.modal-content input,
.modal-content select{

    width:100%;

    padding:12px;

    border:1px solid #ccc;

    border-radius:8px;

}

.modal-buttons{

    display:flex;
    justify-content:flex-end;

    gap:15px;

    margin-top:30px;

}

.save-btn{

    background:#16a34a;
    color:white;

    border:none;

    padding:12px 22px;

    border-radius:8px;

    cursor:pointer;

}

.cancel-btn{

    background:#6b7280;
    color:white;

    border:none;

    padding:12px 22px;

    border-radius:8px;

    cursor:pointer;

}

.save-btn:hover{

    background:#15803d;

}

.cancel-btn:hover{

    background:#4b5563;

}
</style>

<script>
/* ==========================================
   CONFIGURACIÓN
========================================== */

const params =
new URLSearchParams(window.location.search);

const tipo =
params.get("tipo");

console.log(tipo);

let datos =
JSON.parse(
    localStorage.getItem(tipo)
) || [];


/* ==========================================
   ELEMENTOS
========================================== */

const titulo =
document.getElementById("titulo");

const btnNuevo =
document.getElementById("btnNuevo");

const lista =
document.getElementById("listaInventario");

const modal =
document.getElementById("modal");

const form =
document.getElementById("formInventario");

const grupoAutor =
document.getElementById("grupoAutor");

const busqueda =
document.getElementById("busqueda");


/* ==========================================
   CONFIGURAR PÁGINA
========================================== */

if(tipo === "libros"){

    titulo.textContent =
    "Gestión de Libros";

    btnNuevo.textContent =
    "+ Nuevo Libro";

}else{

    titulo.textContent =
    "Gestión de Recursos";

    btnNuevo.textContent =
    "+ Nuevo Recurso";

    grupoAutor.style.display =
    "none";

}


/* ==========================================
   RENDER
========================================== */

function render(){

    lista.innerHTML = "";

    let filtrados = [...datos];

    const texto =
    busqueda.value.toLowerCase();

    filtrados =
    filtrados.filter(item =>

        (item.titulo || item.nombre)
        .toLowerCase()
        .includes(texto)

    );

    filtrados.forEach(item=>{

        lista.innerHTML += `

        <div class="item-card">

            <div>

                <h3>

                    ${
                        item.titulo || item.nombre
                    }

                </h3>

                <p>

                    ${
                        item.autor || item.categoria
                    }

                </p>

                <span>

                    ${item.estado}

                </span>

            </div>

            <div class="acciones">

                <button
                    onclick="editar(${item.id})"
                >

                    ✏

                </button>

                <button
                    onclick="eliminar(${item.id})"
                >

                    🗑

                </button>

            </div>

        </div>

        `;

    });

}

btnNuevo.onclick = ()=>{

    form.reset();

    document.getElementById("itemId").value="";

    modal.classList.remove("oculto");

}

document.getElementById("btnCancelar")
.onclick = ()=>{

    modal.classList.add("oculto");

}

/* ==========================================
   GUARDAR
========================================== */

form.addEventListener("submit",function(e){

    e.preventDefault();

    const id =
    document.getElementById("itemId").value;

    const estado =
    document.getElementById("estado").value;

    if(tipo==="libros"){

        const titulo =
        document.getElementById("nombre").value;

        const autor =
        document.getElementById("autor").value;

        const categoria =
        document.getElementById("categoria").value;

        if(id===""){

            datos.push({

                id: Date.now(),

                titulo,

                autor,

                categoria,

                estado

            });

        }else{

            const libro =
            datos.find(item=>item.id==id);

            libro.titulo = titulo;
            libro.autor = autor;
            libro.categoria = categoria;
            libro.estado = estado;

        }

    }else{

        const nombre =
        document.getElementById("nombre").value;

        const categoria =
        document.getElementById("categoria").value;

        if(id===""){

            datos.push({

                id: Date.now(),

                nombre,

                categoria,

                estado

            });

        }else{

            const recurso =
            datos.find(item=>item.id==id);

            recurso.nombre = nombre;
            recurso.categoria = categoria;
            recurso.estado = estado;

        }

    }

    localStorage.setItem(
        tipo,
        JSON.stringify(datos)
    );

    modal.classList.add("oculto");

    render();

});

/* ==========================================
   EDITAR
========================================== */

function editar(id){

    const item =
    datos.find(item=>item.id==id);

    document.getElementById("itemId").value =
    item.id;

    document.getElementById("nombre").value =
    item.titulo || item.nombre;

    document.getElementById("categoria").value =
    item.categoria;

    document.getElementById("estado").value =
    item.estado;

    if(tipo==="libros"){

        document.getElementById("autor").value =
        item.autor;

    }

    modal.classList.remove("oculto");

}

/* ==========================================
   ELIMINAR
========================================== */

function eliminar(id){

    if(!confirm("¿Eliminar este elemento?")){

        return;

    }

    datos =
    datos.filter(item=>item.id!==id);

    localStorage.setItem(

        tipo,

        JSON.stringify(datos)

    );

    render();

}

busqueda.addEventListener(
    "input",
    render
);

render();
</script>
