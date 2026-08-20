<template>
  <div class="dashboard-container">
    <div class="stats-grid">
      <div class="stat-card">
        <h3>Libros</h3>
        <p>{{ cantidadLibros }}</p>
      </div>
      <div class="stat-card">
        <h3>Recursos</h3>
        <p>{{ cantidadRecursos }}</p>
      </div>
      <div class="stat-card">
        <h3>Prestados</h3>
        <p>{{ cantidadPrestados }}</p>
      </div>
      <div class="stat-card">
        <h3>Pendientes</h3>
        <p>{{ cantidadPendientes }}</p>
      </div>
    </div>

    <div class="solicitudes-section">
      <h2>Solicitudes Pendientes</h2>
      <div v-if="solicitudesPendientes.length === 0">
        <p>No hay solicitudes pendientes.</p>
      </div>
      <div v-else>
        <div v-for="prestamo in solicitudesPendientes" :key="prestamo.libro || prestamo.nombre" class="item-reciente">
          <strong>{{ prestamo.libro || prestamo.nombre }}</strong>
          <p>{{ prestamo.usuario }}</p>
          <button class="loan-btn" @click="aprobarPrestamo(prestamo.libro || prestamo.nombre)">
            Aprobar
          </button>
        </div>
      </div>
    </div>

    <div class="ultimos-section">
      <h2>Últimos Agregados</h2>
      <div v-if="ultimosAgregados.length === 0">
        <p>No hay elementos cargados.</p>
      </div>
      <div v-else>
        <div v-for="item in ultimosAgregados" :key="item.nombre" class="loan-card">
          <h3>{{ item.nombre }}</h3>
          <p>{{ item.tipo }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { useAuthStore } from '../../stores/auth.js';

export default {
  name: 'BibliotecaDashboard',
  setup() {
    const authStore = useAuthStore();
    return { authStore };
  },
  data() {
    return {
      libros: [],
      recursos: [],
      prestamos: [],
      userName: 'Bibliotecario'
    };
  },
  computed: {
    cantidadLibros() {
      return this.libros.length;
    },
    cantidadRecursos() {
      return this.recursos.length;
    },
    cantidadPrestados() {
      return this.prestamos.filter(p => p.estado === 'Prestado').length;
    },
    cantidadPendientes() {
      return this.prestamos.filter(p => p.estado === 'Pendiente').length;
    },
    solicitudesPendientes() {
      return this.prestamos.filter(p => p.estado === 'Pendiente');
    },
    ultimosAgregados() {
      let ultimos = [];
      this.libros.forEach(libro => {
        ultimos.push({ nombre: libro.titulo, tipo: '📖 Libro' });
      });
      this.recursos.forEach(recurso => {
        ultimos.push({ nombre: recurso.nombre, tipo: '📦 Recurso' });
      });
      return ultimos.reverse().slice(0, 5);
    }
  },
  created() {
    this.cargarDatos();
  },
  methods: {
    cargarDatos() {
      this.libros = JSON.parse(localStorage.getItem('libros')) || [];
      this.recursos = JSON.parse(localStorage.getItem('recursos')) || [];
      this.prestamos = JSON.parse(localStorage.getItem('prestamos')) || [];
      this.userName = this.authStore.usuario?.nombre || this.authStore.usuario?.nombre_usuario || 'Bibliotecario';
    },
    aprobarPrestamo(nombre) {
      this.prestamos.forEach(prestamo => {
        if ((prestamo.libro || prestamo.nombre) === nombre) {
          prestamo.estado = 'Prestado';
        }
      });

      this.libros.forEach(libro => {
        if (libro.titulo === nombre) {
          libro.estado = 'Prestado';
        }
      });

      this.recursos.forEach(recurso => {
        if (recurso.nombre === nombre) {
          recurso.estado = 'Prestado';
        }
      });

      localStorage.setItem('prestamos', JSON.stringify(this.prestamos));
      localStorage.setItem('libros', JSON.stringify(this.libros));
      localStorage.setItem('recursos', JSON.stringify(this.recursos));
      
      this.cargarDatos();
    }
  }
};
</script>

<style scoped>
.dashboard-container {
  padding: 20px;
  background: #f8f9fa;
  min-height: 100vh;
}
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 30px;
}
.stat-card {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  text-align: center;
}
.stat-card h3 {
  font-size: 1.2rem;
  color: #666;
  margin-bottom: 10px;
}
.stat-card p {
  font-size: 2rem;
  font-weight: bold;
  color: #0d8abc;
}
.solicitudes-section, .ultimos-section {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  margin-bottom: 30px;
}
.solicitudes-section h2, .ultimos-section h2 {
  font-size: 1.5rem;
  color: #333;
  margin-bottom: 20px;
  border-bottom: 2px solid #eee;
  padding-bottom: 10px;
}
.item-reciente {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border-bottom: 1px solid #eee;
}
.item-reciente:last-child {
  border-bottom: none;
}
.loan-btn {
  background: #1e8e3e;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
}
.loan-btn:hover {
  background: #145c28;
}
.loan-card {
  padding: 15px;
  border-bottom: 1px solid #eee;
}
.loan-card h3 {
  font-size: 1.1rem;
  color: #333;
  margin-bottom: 5px;
}
.loan-card p {
  color: #666;
  font-size: 0.9rem;
}
</style>
