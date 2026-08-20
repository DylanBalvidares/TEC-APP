<template>
  <div class="biblioteca-page">
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
        <button class="profile-trigger" id="profileBtn" @click="toggleProfileMenu">
          <img :src="avatarUrl" alt="User">
        </button>

        <div class="profile-menu" :class="{ 'active': isProfileMenuOpen }" id="profileMenu">
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
          <button class="sign-out-btn" @click="logout">Cerrar Sesión</button>
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
        <section class="library-header">
          <div class="header-info">
            <img src="/libritos.png" alt="" width="100" height="80">
            <div>
              <h1>Biblioteca Escolar</h1>
              <p>Explora libros, recursos y tus préstamos.</p>
            </div>
          </div>
          <img src="/libroYcompu.png" alt="Biblioteca" width="300" height="100">
        </section>

        <section class="stats">
          <div class="stat-card libro">
            <div class="stat-icon books">
              <img src="/libroAbierto.png" alt="" width="75" height="75">
            </div>
            <div>
              <h3 id="librosDisponibles">{{ librosDisponibles }}</h3>
              <p>Libros Disponibles</p>
            </div>
          </div>

          <div class="stat-card compu">
            <div class="stat-icon devices">
              <img src="/compu.png" alt="" width="75" height="65">
            </div>
            <div>
              <h3 id="recursosActivos">{{ recursosActivos }}</h3>
              <p>Recursos Activos</p>
            </div>
          </div>

          <div class="stat-card libreta">
            <div class="stat-icon loans">
              <img src="/libreta.png" alt="" width="75" height="75">
            </div>
            <div>
              <h3 id="prestamosActivos">{{ prestamosActivos }}</h3>
              <p>Préstamos</p>
            </div>
          </div>
        </section>

        <section class="library-content">
          <div class="library-panel books-panel">
            <h2 class="panel-title">📖 Últimos libros agregados</h2>
            <div class="books-list" id="booksList">
              <div v-for="libro in ultimosLibros" :key="'ultimo-'+libro.id" class="book-card">
                <div class="book-title">📖 {{ libro.titulo }}</div>
                <div class="book-author">{{ libro.autor }}</div>
                <div class="book-status" :class="getStatusClass(libro.estado)">
                  {{ libro.estado.toUpperCase() }}
                </div>
              </div>
            </div>
            <br>
            <RouterLink to="/biblioteca/libros" class="verTodos">Ver todos</RouterLink>
          </div>

          <div class="library-panel resources-panel">
            <h2 class="panel-title">💻 Recursos y Equipamiento</h2>
            <div class="resources-list">
              <RouterLink to="/biblioteca/recursos?categoria=Herramientas">
                <div class="resource-card herramientas">
                  <h3>Herramientas</h3>
                </div> 
              </RouterLink>
              <RouterLink to="/biblioteca/recursos?categoria=Material Didáctico">
                <div class="resource-card material">
                  <h3>Material didáctico</h3>
                </div>
              </RouterLink>
              <RouterLink to="/biblioteca/recursos?categoria=Dispositivos">
                <div class="resource-card dispositivos">
                  <h3>Dispositivos</h3>
                </div>
              </RouterLink>
            </div>
            <br>
            <RouterLink to="/biblioteca/recursos" class="verTodos">Ver todos</RouterLink>
          </div>
        </section>

        <h2 class="section-title">📋 Mis Préstamos</h2>
        <section id="misPrestamos">
          <div v-if="misPrestamosFiltrados.length === 0">
            <p>No tenés préstamos activos.</p>
          </div>
          <div v-else v-for="(prestamo, index) in misPrestamosFiltrados" :key="'prestamo-'+index" class="loan-card">
            <h3>{{ prestamo.libro || prestamo.nombre }}</h3>
            <p>Solicitado: {{ prestamo.fecha }}</p>
            <div class="loan-footer">
              <span class="warning">Pendiente</span>
              <button class="cancel-btn" @click="cancelarPrestamo(prestamo.libro || prestamo.nombre)">
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
  name: 'BibliotecaEscolar',
  setup() {
    const authStore = useAuthStore();
    return { authStore };
  },
  data() {
    return {
      isProfileMenuOpen: false,
      userName: '',
      userDni: '',
      userCurso: '',
      libros: [],
      recursos: [],
      prestamos: []
    };
  },
  computed: {
    avatarUrl() {
      if (!this.userName) return 'https://ui-avatars.com/api/?name=Usuario&background=0D8ABC&color=fff';
      const nameForApi = this.userName.split(' ').join('+');
      return `https://ui-avatars.com/api/?name=${nameForApi}&background=0D8ABC&color=fff`;
    },
    badgeColor() {
      if (!this.userCurso) return '#1e8e3e';
      return this.userCurso.includes('7') ? '#d93025' : '#1e8e3e';
    },
    librosDisponibles() {
      return this.libros.filter(l => l.estado === 'Disponible').length;
    },
    recursosActivos() {
      return this.recursos.filter(r => r.estado === 'Disponible').length;
    },
    prestamosActivos() {
      const prestamosLibros = this.libros.filter(l => l.estado === 'Solicitado').length;
      const prestamosRecursos = this.recursos.filter(r => r.estado === 'Solicitado').length;
      return prestamosLibros + prestamosRecursos;
    },
    ultimosLibros() {
      return [...this.libros].slice(-4).reverse();
    },
    misPrestamosFiltrados() {
      return this.prestamos.filter(p => p.usuario === this.userName);
    }
  },
  created() {
    this.cargarDatosUsuario();
    this.initLocalStorageData();
  },
  methods: {
    cargarDatosUsuario() {
      this.userName = this.authStore.usuario?.nombre || this.authStore.usuario?.nombre_usuario || 'Usuario Escuela';
      this.userDni = this.authStore.usuario?.dni || '';
      this.userCurso = this.authStore.rol || 'Sin curso';
    },
    initLocalStorageData() {
      const defaultLibros = [
        { id: 1, titulo: "El Principito", autor: "Antoine de Saint-Exupéry", categoria: "Novela", estado: "Disponible" },
        { id: 2, titulo: "Don Quijote", autor: "Miguel de Cervantes", categoria: "Historia", estado: "Disponible" },
        { id: 3, titulo: "1984", autor: "George Orwell", categoria: "Novela", estado: "Disponible" },
        { id: 4, titulo: "Veinte poemas de amor y una canción desesperada", autor: "Pablo Neruda", categoria: "Poesía", estado: "Disponible" },
        { id: 5, titulo: "El extraño caso del doctor Jekyll y el señor Hyde", autor: "Robert Louis Stevenson", categoria: "Terror", estado: "Disponible" }
      ];

      const defaultRecursos = [
        { id: 1, nombre: "Netbook 07", categoria: "Dispositivos", estado: "Disponible" },
        { id: 2, nombre: "Tablet Samsung", categoria: "Dispositivos", estado: "Disponible" },
        { id: 3, nombre: "Destornillador Phillips", categoria: "Herramientas", estado: "Disponible" },
        { id: 4, nombre: "Mapa Político", categoria: "Material Didáctico", estado: "Disponible" }
      ];

      this.libros = JSON.parse(localStorage.getItem("libros")) || defaultLibros;
      if (!localStorage.getItem("libros")) {
        localStorage.setItem("libros", JSON.stringify(this.libros));
      }

      this.recursos = JSON.parse(localStorage.getItem("recursos")) || defaultRecursos;
      if (!localStorage.getItem("recursos")) {
        localStorage.setItem("recursos", JSON.stringify(this.recursos));
      }

      this.prestamos = JSON.parse(localStorage.getItem("prestamos")) || [];
    },
    toggleProfileMenu() {
      this.isProfileMenuOpen = !this.isProfileMenuOpen;
    },
    logout() {
      this.authStore.logout();
      this.$router.push('/');
    },
    getStatusClass(estado) {
      if (estado === 'Disponible') return 'status-disponible';
      if (estado === 'Solicitado') return 'status-solicitado';
      if (estado === 'Prestado') return 'status-prestado';
      return '';
    },
    cancelarPrestamo(nombre) {
      this.prestamos = this.prestamos.filter(p => (p.libro || p.nombre) !== nombre);
      localStorage.setItem("prestamos", JSON.stringify(this.prestamos));

      this.libros.forEach(libro => {
        if (libro.titulo === nombre) {
          libro.estado = "Disponible";
        }
      });

      this.recursos.forEach(recurso => {
        if (recurso.nombre === nombre) {
          recurso.estado = "Disponible";
        }
      });

      localStorage.setItem("libros", JSON.stringify(this.libros));
      localStorage.setItem("recursos", JSON.stringify(this.recursos));
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

.biblioteca-page {
    background-image: url(/fondo.jpg);
    min-height: 100vh;
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

.library-header{
    background:#f5f6fb;
    border-radius:20px;
    padding:30px;
    display:flex;
    justify-content:space-between;
    align-items:center;
    margin-bottom:25px;
}

.header-info{
    display:flex;
    align-items:center;
    gap:20px;
}

.library-header h1{
    font-size:38px;
    margin-bottom:5px;
}

.library-header p{
    color:#666;
}

.stats{
    display:grid;
    grid-template-columns:repeat(3,1fr);
    gap:20px;
    margin-bottom:30px;
}

.stat-card{
    background:white;
    border-radius:18px;
    padding:20px;
    display:flex;
    align-items:center;
    gap:15px;
    box-shadow:0 4px 12px rgba(0,0,0,.05);
}

.stat-card.libro{ 
    border-left: 5px solid #e74c3c;
}

.stat-card.compu{ 
    border-left: 5px solid #f1c40f;
}

.stat-card.libreta{ 
    border-left: 5px solid #3498db;
}

.stat-icon{
    width:60px;
    height:60px;
    border-radius:50%;
    display:flex;
    justify-content:center;
    align-items:center;
    font-size:24px;
}

.stat-card h3{
    font-size:28px;
    margin-bottom:2px;
}

.stat-card p{
    color:#666;
}

.books{
    background:#fee2e2;
    color:#dc2626;
}

.devices{
    background:#dbeafe;
    color:#2563eb;
}

.loans{
    background:#dcfce7;
    color:#16a34a;
}

.search-section{
    display:flex;
    gap:15px;
    margin-bottom:30px;
}

.search-section input{
    flex:1;
    padding:15px;
    border:1px solid #ddd;
    border-radius:12px;
}

.search-section select{
    padding:15px;
    border:1px solid #ddd;
    border-radius:12px;
}

.section-title{
    margin:30px 0 15px;
}

.books-grid{
    display:grid;
    grid-template-columns: repeat(auto-fill,minmax(220px,1fr));
    gap:20px;
}

.book-card{
    display:flex;
    align-items:center;
    gap:15px;
    padding:15px;
    border:1px solid #eee;
    border-radius:15px;
}

.book-title{
    flex: 1;
    min-width: 0;
    font-weight: bold;
}

.book-author{
    width: 160px;
    flex-shrink: 0;
}

.book-status{
    width: 100px;
    flex-shrink: 0;
}

.status-disponible{
    color: #1e8e3e;
    font-weight: 600;
}

.status-solicitado{
    color: #f9ab00;
    font-weight: 600;
}

.status-prestado{
    color: #d93025;
    font-weight: 600;
}

.book-cover{
    font-size:60px;
    margin-bottom:10px;
}

.book-card h3{
    margin-bottom:5px;
}

.book-card p{
    color:#666;
    margin-bottom:10px;
}

.verTodos{
    text-decoration: none;
    display:inline-block;
    color:rgb(0, 0, 0);
    background:white;
    border-radius:10px;
    padding: 15px;
    text-align:center;
    box-shadow:0 4px 12px rgba(0,0,0,.05);
    border:1px solid #dadada;
    border-left: 5px solid #757575;
    transition:.25s;
    cursor:pointer;
}

.verTodos:hover{
    transform: translateY(-5px);
    box-shadow: 0 8px 20px rgba(0,0,0,.08);
}

.resources-list{
    display:grid;
    grid-template-columns: repeat(auto-fill,minmax(250px,1fr));
    gap:20px;
}

.resource-card{
    text-decoration: none;
    background:white;
    padding:25px;
    border-radius:18px;
    min-height:70px;
    box-shadow: 0 4px 12px rgba(0,0,0,.05);
    display:flex;
    flex-direction:column;
    justify-content:space-between;
    transition:.25s;
    cursor:pointer;
    border:1px solid #dadada;
}

.resource-card.dispositivos{
    border-left: 5px solid #4f8dfd;
}

.resource-card.material{
    border-left:5px solid #f7b731;
}

.resource-card.herramientas{
    border-left: 5px solid #e74c3c;
}

.resource-card:hover{
    transform: translateY(-5px);
    box-shadow: 0 8px 20px rgba(0,0,0,.08);
}

a{
    text-decoration: none;
    color:rgb(0, 0, 0);
}

.loan-card{
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-height: 160px;
    background:white;
    padding:25px;
    border-radius:18px;
    margin-top:10px;
    box-shadow:0 4px 12px rgba(0,0,0,.05);
}

.loan-footer{
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 12px;
}

.cancel-btn{
    background: #6b7280;
    color: white;
    border: none;
    padding: 10px 18px;
    border-radius: 8px;
    cursor: pointer;
    align-self: flex-end;
}

.library-content{
    display:flex;
    gap:25px;
    margin-top:25px;
}

.books-panel{
    flex:2;
}

.resources-panel{
    flex:1;
}

.library-panel{
    background:white;
    border-radius:20px;
    padding:25px;
    box-shadow:0 4px 12px rgba(0,0,0,.05);
}

.panel-title{
    margin-bottom:20px;
}

.books-list{
    display:flex;
    flex-direction:column;
    gap:15px;
}

.resources-list{
    display:flex;
    flex-direction:column;
    gap:15px;
}

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

.cards-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 22px;
}

@media (max-width: 1100px) {
  .cards-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 700px) {
  .cards-grid {
    grid-template-columns: 1fr;
  }
}

.card {
  background: white;
  border-radius: 20px;
  padding: 18px;
  box-shadow: 0 4px 14px rgba(0,0,0,0.05);
  transition: 0.3s;
}

.card:hover {
  transform: translateY(-4px);
}

.card img {
  width: 100%;
  height: 220px;
  object-fit: cover;
  border-radius: 15px;
  margin-bottom: 15px;
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

.status {
  display: inline-block;
  background: #dcfce7;
  color: #16a34a;
  padding: 8px 14px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
}

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
  .filter-actions {
    flex-direction: column;
  }
}
</style>
