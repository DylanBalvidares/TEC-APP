<template>
  <div class="biblioteca-container">
    <nav class="navbar">
      <div class="nav-izquierda">
        <div class="logo">
          <div>
            <img src="/logoEscuela.png" width="60" height="60">
          </div>
          <div class="logo-titulo">
            <h2>GESTIÓN ESCOLAR</h2>
            <p>Biblioteca</p>
          </div>
        </div>
      </div>
  
      <div class="profile-container" id="profileContainer">
        <button class="profile-trigger" id="profileBtn" @click="toggleMenu">
          <img :src="avatarUrl" alt="User">
        </button>

        <div :class="['profile-menu', { active: menuActivo }]" id="profileMenu">
          <div class="menu-header">
            <img :src="avatarUrl" class="large-avatar">
            <p class="user-name">{{ userName }}</p>
            <p class="user-email">{{ userDni ? `DNI: ${userDni}` : 'Sin documento' }}</p>
          </div>
          <hr>
          <div class="menu-body">
            <p class="user-role">Curso: <span id="roleBadge" :style="{ color: badgeColor }">{{ userCurso }}</span></p>
            <a href="#" class="menu-item"><i class="fas fa-user-cog"></i> Mi Perfil</a>
            <a href="#" class="menu-item"><i class="fas fa-book"></i> Mis Cursos</a>
          </div>
          <hr>
          <button class="sign-out-btn" @click="cerrarSesion">Cerrar Sesión</button>
        </div>
      </div>       
    </nav>

    <div class="container">
      <aside class="sidebar">
        <ul>
          <RouterLink to="/inicio"><li><i class="fas fa-home"></i> Inicio</li></RouterLink>
          <RouterLink to="/noticias"><li><i class="fas fa-newspaper"></i> Noticias</li></RouterLink>
          <RouterLink to="/biblioteca"><li class="active"><i class="fas fa-book"></i> Biblioteca</li></RouterLink>
          <RouterLink to="/objetos-perdidos"><li><i class="fas fa-box"></i> Objetos Perdidos</li></RouterLink>
          <RouterLink to="/cursos"><li><i class="fas fa-graduation-cap"></i> Cursos</li></RouterLink>
        </ul>
        <div class="sidebar-help">
          <i class="fas fa-question-circle"></i>
          <div>
            <p class="help-title">¿Necesitás ayuda?</p>
            <p class="help-sub">Pixelina resolverá tu consulta.</p>
          </div>
        </div>               
      </aside>

      <main class="main-content">
        <header class="topbar">
          <div class="header-info">
            <div class="caja">
              <img src="/libritos.png" alt="caja" width="70" height="70">
            </div>
            <div>
              <h1>Biblioteca - Recursos</h1>
              <p>Todos los recursos que se encuentran en la biblioteca.</p> <br>
            </div>
          </div>
        </header>

        <section class="filters">
          <div class="search-box">
            <i class="fas fa-search"></i>
            <input type="text" v-model="searchText" placeholder="Buscar por nombre...">
          </div>

          <div class="filters-right">
            <select v-model="selectedCategory">
              <option value="Todos">Todos</option>
              <option value="Herramientas">Herramientas</option>
              <option value="Material Didáctico">Material didáctico</option>
              <option value="Dispositivos">Dispositivos</option>
            </select>

            <select v-model="selectedOrder">
              <option value="recientes">Más recientes</option>
              <option value="antiguos">Más antiguos</option>
            </select>
          </div>
        </section>

        <section class="reports" id="cardsContainer">
          <div v-for="recurso in recursosFiltrados" :key="recurso.id" class="report-card">
            <div class="report-left">
              <div>
                <h3>📦 {{ recurso.nombre }}</h3>
                <p>{{ recurso.categoria }}</p>
              </div>
            </div>
            <div class="report-description">
              Recurso disponible en biblioteca.
            </div>
            <div class="report-status">
              <span :class="['status', getClaseEstado(recurso.estado)]">
                {{ recurso.estado.toUpperCase() }}
              </span>
              <button v-if="recurso.estado === 'Disponible'" class="loan-btn" @click="solicitarRecurso(recurso)">
                Solicitar préstamo
              </button>
              <button v-if="recurso.estado === 'Solicitado'" class="cancel-btn" @click="cancelarSolicitudRecurso(recurso)">
                Cancelar solicitud
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  </div>
</template>

<script>
import { useAuthStore } from '../../stores/auth.js';

export default {
  name: 'BibliotecaRecursos',
  setup() {
    const authStore = useAuthStore();
    return { authStore };
  },
  data() {
    return {
      menuActivo: false,
      userName: '',
      userDni: '',
      userCurso: '',
      searchText: '',
      selectedCategory: 'Todos',
      selectedOrder: 'recientes',
      recursos: [],
      prestamos: []
    };
  },
  computed: {
    avatarUrl() {
      if (!this.userName) return '';
      const nameForApi = this.userName.split(' ').join('+');
      return `https://ui-avatars.com/api/?name=${nameForApi}&background=0D8ABC&color=fff`;
    },
    badgeColor() {
      return this.userCurso.includes('7') ? '#d93025' : '#1e8e3e';
    },
    recursosFiltrados() {
      let lista = [...this.recursos];

      if (this.searchText) {
        const text = this.searchText.toLowerCase();
        lista = lista.filter(r => 
          r.nombre.toLowerCase().includes(text) || 
          r.categoria.toLowerCase().includes(text)
        );
      }

      if (this.selectedCategory !== 'Todos') {
        lista = lista.filter(r => r.categoria === this.selectedCategory);
      }

      if (this.selectedOrder === 'recientes') {
        lista.sort((a, b) => b.id - a.id);
      } else {
        lista.sort((a, b) => a.id - b.id);
      }

      return lista;
    }
  },
  created() {
    this.cargarDatosUsuario();
    this.inicializarLocalStorage();
    this.cargarDatos();
    document.addEventListener('click', this.cerrarMenuExterno);
    if (this.$route.query.categoria) {
      this.selectedCategory = this.$route.query.categoria;
    }
  },
  unmounted() {
    document.removeEventListener('click', this.cerrarMenuExterno);
  },
  methods: {
    cargarDatosUsuario() {
      this.userName = this.authStore.usuario?.nombre || this.authStore.usuario?.nombre_usuario || 'Usuario Escuela';
      this.userDni = this.authStore.usuario?.dni || '';
      this.userCurso = this.authStore.rol || 'Profesor';
    },
    inicializarLocalStorage() {
      const recursosMock = [
        { id: 1, nombre: "Netbook 07", categoria: "Dispositivos", estado: "Disponible" },
        { id: 2, nombre: "Tablet Samsung", categoria: "Dispositivos", estado: "Disponible" },
        { id: 3, nombre: "Destornillador Phillips", categoria: "Herramientas", estado: "Disponible" },
        { id: 4, nombre: "Mapa Político", categoria: "Material Didáctico", estado: "Disponible" }
      ];
      if (!localStorage.getItem('recursos')) {
        localStorage.setItem('recursos', JSON.stringify(recursosMock));
      }
    },
    cargarDatos() {
      this.recursos = JSON.parse(localStorage.getItem('recursos')) || [];
      this.prestamos = JSON.parse(localStorage.getItem('prestamos')) || [];
    },
    guardarDatos() {
      localStorage.setItem('recursos', JSON.stringify(this.recursos));
      localStorage.setItem('prestamos', JSON.stringify(this.prestamos));
    },
    toggleMenu(e) {
      this.menuActivo = !this.menuActivo;
      e.stopPropagation();
    },
    cerrarMenuExterno(e) {
      const menu = document.getElementById('profileMenu');
      const btn = document.getElementById('profileBtn');
      if (menu && !menu.contains(e.target) && e.target !== btn && !btn.contains(e.target)) {
        this.menuActivo = false;
      }
    },
    cerrarSesion() {
      this.authStore.logout();
      this.$router.push('/');
    },
    getClaseEstado(estado) {
      switch (estado) {
        case 'Disponible': return 'green-status';
        case 'Solicitado': return 'yellow-status';
        case 'Prestado': return 'red-status';
        default: return '';
      }
    },
    solicitarRecurso(recurso) {
      recurso.estado = 'Solicitado';
      this.prestamos.push({
        tipo: 'Recurso',
        nombre: recurso.nombre,
        usuario: this.userName,
        curso: this.userCurso,
        fecha: new Date().toLocaleDateString('es-AR'),
        estado: 'Pendiente'
      });
      this.guardarDatos();
    },
    cancelarSolicitudRecurso(recurso) {
      const confirmar = confirm(`¿Cancelar la solicitud de "${recurso.nombre}"?`);
      if (!confirmar) return;

      recurso.estado = 'Disponible';
      this.prestamos = this.prestamos.filter(p => p.nombre !== recurso.nombre);
      this.guardarDatos();
    }
  }
};
</script>

<style scoped>
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css');

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: 'Segoe UI', sans-serif;
}

body {
    background-image: url(/fondo.jpg);
}

.navbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 1.5%;
    background-color: #ffffff;
    border-bottom: 5px solid #ffffff;
    box-shadow: 0 6px 12px rgba(0,0,0,0.10);
}

.nav-izquierda, .nav-derecha {
    display: flex;
    align-items: center;
    gap: 15px;
}

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

.profile-trigger:hover { border-color: #ddd; }

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
    box-shadow: 0 8px 24px rgba(0,0,0,0.15);
    padding: 20px;
    z-index: 1000;
}

.profile-menu.active { display: block; }

.menu-header { text-align: center; padding-bottom: 10px; }

.large-avatar {
    border-radius: 50%;
    width: 70px;
    height: 70px;
    margin-bottom: 10px;
}

.user-name { font-weight: 600; font-size: 1.1em; }
.user-email { color: #5f6368; font-size: 0.85em; }

hr { border: 0; border-top: 1px solid #eee; margin: 15px 0; }

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

.menu-item:hover { background: #f8f9fa; }

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

.container {
    display: flex;
    min-height: calc(100vh - 70px);
}

.sidebar {
    width: 250px;
    background: linear-gradient(180deg, #ca0d0d, #420101);
    color: white;
    padding: 20px;
    flex-shrink: 0; 
}

.sidebar ul { list-style: none; }

.sidebar li {
    padding: 14px;
    margin-bottom: 10px;
    border-radius: 10px;
    cursor: pointer;
    transition: 0.3s;
}

.sidebar li:hover, .sidebar li.active {
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
    color: rgba(255,255,255,0.7);
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
    color: rgba(255,255,255,0.6);
    margin: 2px 0 0 0;
}

.main-content {
    flex: 1;
    padding: 30px;
    overflow-y: auto;
}

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

.logo h2, .logo p {
    font-family: 'Franklin Gothic Medium', 'Arial Narrow', Arial, sans-serif;
}

.logo p { color: gray; }

.topbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #f8f8fb;
    padding: 30px;
    border-radius: 20px;
    margin-bottom: 25px;
}

.header-info {
    display: flex;
    gap: 30px;
}

.topbar h1 {
    font-size: 38px;
    margin-bottom: 5px;
}

.topbar p {
    color: #666;
}

.filters {
    display: flex;
    justify-content: space-between;
    gap: 20px;
    margin-bottom: 25px;
}

.filters-right {
    display: flex;
    gap: 15px;
}

.search-box {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 10px;
    background: white;
    padding: 15px 20px;
    border-radius: 14px;
    border: 1px solid #ddd;
}

.search-box input {
    border: none;
    outline: none;
    width: 100%;
    font-size: 14px;
}

select {
    padding: 15px;
    border-radius: 12px;
    border: 1px solid #ddd;
    background: white;
    font-size: 14px;
}

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
    grid-template-columns: 2fr 2fr 1.5fr;
    align-items: center;
    gap: 25px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    border-left: 6px solid transparent;
}

.report-left {
    display: flex;
    align-items: center;
    gap: 18px;
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

.red-status {
    background: #fee2e2;
    color: #dc2626;
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

@media (max-width: 1200px) {
    .report-card {
        grid-template-columns: 1fr;
    }
}

@media (max-width: 900px) {
    .container {
        flex-direction: column;
    }

    .sidebar {
        width: 100%;
    }

    .topbar,
    .filters {
        flex-direction: column;
        align-items: stretch;
    }

    .filters-right {
        flex-direction: column;
    }
}
</style>
