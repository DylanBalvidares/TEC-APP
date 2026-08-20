<template>
  <div class="vista-gestion">
    <header class="top-bar">
      <h1>Gestión de Biblioteca</h1>
      <RouterLink to="/inicio" class="volver">← Volver al Menú</RouterLink>
    </header>

    <div class="contenedor">
      <div class="barra-superior">
        <input 
          type="text" 
          id="busqueda" 
          v-model="filtro" 
          placeholder="Buscar libros o préstamos..."
        >
        <button class="new-btn" @click="abrirModal">
          + Agregar Nuevo
        </button>
      </div>

      <div class="inventario">
        <div v-if="prestamosFiltrados.length === 0" class="vacio">
          No hay préstamos registrados.
        </div>

        <div v-else v-for="(prestamo, index) in prestamosFiltrados" :key="index" class="item-card">
          <div>
            <h3>{{ prestamo.libro || prestamo.nombre }}</h3>
            <p><strong>Usuario:</strong> {{ prestamo.usuario }}</p>
            <p><strong>Fecha:</strong> {{ prestamo.fecha }}</p>
            <span>{{ prestamo.estado }}</span>
          </div>
          
          <div class="acciones">
            <button v-if="prestamo.estado === 'Prestado'" @click="devolver(index)">
              Registrar devolución
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="modal" :class="{ 'oculto': !modalAbierto }">
      <div class="modal-content">
        <h2>Registrar Elemento</h2>
        <form @submit.prevent="guardarCambios">
          <label>Título / Nombre:</label>
          <input type="text" required>

          <label>Categoría / Rol:</label>
          <select>
            <option value="1">Opción 1</option>
            <option value="2">Opción 2</option>
          </select>

          <div class="modal-buttons">
            <button type="button" class="cancel-btn" @click="cerrarModal">
              Cancelar
            </button>
            <button type="submit" class="save-btn">
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PrestamosBibliotecario',
  data() {
    return {
      filtro: '',
      modalAbierto: false,
      prestamos: []
    };
  },
  computed: {
    prestamosFiltrados() {
      if (!this.filtro) {
        return this.prestamos;
      }
      const termino = this.filtro.toLowerCase();
      return this.prestamos.filter(p => {
        const titulo = (p.libro || p.nombre || '').toLowerCase();
        const usuario = (p.usuario || '').toLowerCase();
        return titulo.includes(termino) || usuario.includes(termino);
      });
    }
  },
  created() {
    this.cargarPrestamos();
  },
  methods: {
    cargarPrestamos() {
      this.prestamos = JSON.parse(localStorage.getItem("prestamos")) || [];
    },
    abrirModal() {
      this.modalAbierto = true;
    },
    cerrarModal() {
      this.modalAbierto = false;
    },
    guardarCambios() {
      this.cerrarModal();
    },
    devolver(indexReal) {
      const prestamoSeleccionado = this.prestamosFiltrados[indexReal];
      const indexEnOriginal = this.prestamos.findIndex(p => p === prestamoSeleccionado);

      if (indexEnOriginal !== -1) {
        const nombre = this.prestamos[indexEnOriginal].libro || this.prestamos[indexEnOriginal].nombre;

        this.prestamos.splice(indexEnOriginal, 1);

        let libros = JSON.parse(localStorage.getItem("libros")) || [];
        libros.forEach(libro => {
          if (libro.titulo === nombre) {
            libro.estado = "Disponible";
          }
        });

        let recursos = JSON.parse(localStorage.getItem("recursos")) || [];
        recursos.forEach(recurso => {
          if (recurso.nombre === nombre) {
            recurso.estado = "Disponible";
          }
        });

        localStorage.setItem("prestamos", JSON.stringify(this.prestamos));
        localStorage.setItem("libros", JSON.stringify(libros));
        localStorage.setItem("recursos", JSON.stringify(recursos));

        this.cargarPrestamos();
      }
    }
  }
};
</script>

<style scoped>
/* ==========================================
   GENERAL & FONDO
========================================== */
.vista-gestion {
    min-height: 100vh;
    background-image: url(/fondo.jpg);
    background-size: cover;
    background-position: center;
    background-attachment: fixed;
}

/* ==========================================
   HEADER (Rojo de Gestión)
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
    background-color: white;
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
   LISTA DE TARJETAS
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
    box-shadow: 0 4px 12px rgba(0,0,0,.08);
}

.item-card h3 {
    margin-bottom: 6px;
    font-size: 20px;
    color: #000;
}

.item-card p {
    color: #666;
    margin-bottom: 8px;
}

.item-card span {
    font-weight: bold;
    color: #2563eb;
}

.vacio {
    background: white; 
    padding: 40px; 
    border-radius: 15px; 
    text-align: center; 
    color: #a0aec0; 
    width: 100%; 
    box-shadow: 0 4px 12px rgba(0,0,0,.08);
}

/* ==========================================
   BOTONES DE ACCIÓN (Naranja y Rojo)
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

.acciones button:first-child:hover {
    background: #d97706;
}

.acciones button:last-child {
    background: #dc2626;
}

.acciones button:last-child:hover {
    background: #b91c1c;
}

/* ==========================================
   MODAL
========================================== */
.modal {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,.45);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
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
    color: #333;
}

.modal-content label {
    display: block;
    margin-top: 15px;
    margin-bottom: 6px;
    font-weight: bold;
    color: #555;
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

.save-btn:hover { background: #15803d; }
.cancel-btn:hover { background: #4b5563; }
</style>
