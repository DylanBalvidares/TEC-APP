<template>
  <div class="auth-wrapper">
    <div class="auth-card">
      <header class="auth-header">
        <div class="logo-dot">
          <img src="/logoEscuela.png" alt="logo" width="22" height="22" />
        </div>
        <div class="brand-text">
          <h1>GESTIÓN ESCOLAR</h1>
          <p>Portal Educativo Institucional</p>
        </div>
      </header>

      <section class="hero-section">
        <img src="/escuelita.png" alt="Escuela" class="hero-image" />
        <div class="welcome-text">
          <h2>¡Bienvenido!</h2>
          <p>Selecciona una opción para comenzar tu gestión.</p>
        </div>
      </section>

      <nav class="profile-options">
        <RouterLink to="/login" class="profile-btn">
          <div class="profile-icon">
            <i class="fa-solid fa-user-shield"></i>
          </div>
          <div class="profile-info">
            <span class="profile-title">Iniciar sesión</span>
            <span class="profile-desc">Acceso para usuarios registrados.</span>
          </div>
          <i class="fa-solid fa-chevron-right arrow-icon"></i>
        </RouterLink>

        <RouterLink to="/registro" class="profile-btn">
          <div class="profile-icon">
            <i class="fa-solid fa-user-plus"></i>
          </div>
          <div class="profile-info">
            <span class="profile-title">Registrate</span>
            <span class="profile-desc">Activa tu cuenta por primera vez.</span>
          </div>
          <i class="fa-solid fa-chevron-right arrow-icon"></i>
        </RouterLink>
      </nav>
    </div>
  </div>
</template>

<style scoped>
@import url("https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css");

.auth-wrapper {
  display: grid;
  place-items: center;
  min-height: 100vh;
  background: #f4f5f7;
  padding: 16px;
}

.auth-card {
  width: 100%;
  max-width: 400px;
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
}

.auth-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 32px;
}
.logo-dot {
  background: #cd322c;
  padding: 8px;
  border-radius: 8px;
  display: flex;
}
.brand-text h1 {
  margin: 0;
  font-size: 18px;
  color: #111827;
}
.brand-text p {
  margin: 0;
  font-size: 12px;
  color: #6b7280;
}

.hero-section {
  text-align: center;
  margin-bottom: 24px;
}
.hero-image {
  width: 100%;
  border-radius: 12px;
  margin-bottom: 16px;
  max-width: 280px;
}
.welcome-text h2 {
  font-size: 20px;
  color: #111827;
  margin: 0 0 4px 0;
}
.welcome-text p {
  font-size: 13px;
  color: #6b7280;
  margin: 0;
}

.profile-options {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 24px;
}

.profile-btn {
  display: flex;
  align-items: center;
  padding: 14px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  text-decoration: none;
  transition: all 0.2s ease;
}

.profile-btn:hover {
  border-color: #cd322c;
  background-color: #fef2f2;
  transform: translateY(-2px);
}

.profile-icon {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  background: #f9fafb;
  border-radius: 10px;
  margin-right: 14px;
  color: #6b7280;
  font-size: 18px;
}

.profile-btn:hover .profile-icon {
  background: white;
  color: #cd322c;
}

.profile-title {
  font-weight: 700;
  color: #111827;
  display: block;
}
.profile-desc {
  font-size: 12px;
  color: #6b7280;
}
.arrow-icon {
  margin-left: auto;
  color: #d1d5db;
  transition: 0.2s;
}
.profile-btn:hover .arrow-icon {
  color: #cd322c;
  transform: translateX(3px);
}
</style>
