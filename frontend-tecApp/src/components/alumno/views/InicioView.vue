<template>
  <main class="main-content" id="inicio-alumno">
    <!-- Hero Section -->
    <section class="hero">
      <div class="hero-text">
        <span class="hero-badge"> <i class="fas fa-sparkles"></i> Panel del Alumno </span>
        <h1>¡Bienvenido a<br />Gestión Escolar!</h1>
        <p>
          Nos alegra tenerte aquí. Este es tu espacio para enterarte de las nuevas noticias, revisar tus horarios, recuperar objetos
          perdidos y más, de la comunidad Técnica 2.
        </p>
        <div class="hero-accent"></div>
      </div>
      <div class="hero-image">
        <img src="/escuelita.png" alt="Escuela" />
      </div>
    </section>

    <!-- Info Banner -->
    <section class="info-box">
      <div class="info-left">
        <div class="icon-circle">
          <i class="fa-solid fa-shield-heart"></i>
        </div>
        <div>
          <h3>Estamos aquí para ayudarte</h3>
          <p>Usa las herramientas del menú para explorar categorías. Ante cualquier duda consultale a Pixelina.</p>
        </div>
      </div>
      <button class="btn btn-primary" id="btn-consultar-inicio">
        <i class="fas fa-comment-dots"></i>
        Consultar ahora
      </button>
    </section>

    <!-- Quick Action Cards -->
    <section class="cards">
      <div class="card card-orange">
        <div class="card-icon">
          <img src="/cajita2.png" alt="Objetos" />
        </div>
        <div class="card-body">
          <h3>Encuentra objetos</h3>
          <p>Navega por las categorías y descubre lo que has perdido.</p>
        </div>
        <RouterLink to="/alumno/objetos-perdidos" class="card-link card-link-orange">
          Ver objetos <i class="fas fa-arrow-right"></i>
        </RouterLink>
      </div>

      <div class="card card-blue">
        <div class="card-icon">
          <span class="card-emoji">🔔</span>
        </div>
        <div class="card-body">
          <h3>Mantente informado</h3>
          <p>Consulta las últimas noticias y avisos importantes.</p>
        </div>
        <RouterLink to="/alumno/noticias" class="card-link card-link-blue"> Ver noticias <i class="fas fa-arrow-right"></i> </RouterLink>
      </div>

      <div class="card card-green">
        <div class="card-icon">
          <span class="card-emoji">📖</span>
        </div>
        <div class="card-body">
          <h3>Recursos y aprendizaje</h3>
          <p>Accede a materiales y recursos disponibles para ti.</p>
        </div>
        <RouterLink to="/biblioteca" class="card-link card-link-green"> Ir a biblioteca <i class="fas fa-arrow-right"></i> </RouterLink>
      </div>

      <div class="card card-purple">
        <div class="card-icon">
          <span class="card-emoji">🎓</span>
        </div>
        <div class="card-body">
          <h3>Tus cursos</h3>
          <p>Revisa tus cursos y accede a su información.</p>
        </div>
        <RouterLink to="/alumno/cursos" class="card-link card-link-purple"> Ver cursos <i class="fas fa-arrow-right"></i> </RouterLink>
      </div>
    </section>

    <!-- Footer Banner -->
    <section class="footer-box">
      <div class="footer-left">
        <div class="footer-icon">
          <i class="fa-solid fa-hand-holding-heart"></i>
        </div>
        <div>
          <h3>Gracias por ser parte de nuestra comunidad</h3>
          <p>Tu colaboración ayuda a mantener nuestra escuela unida y organizada.</p>
        </div>
      </div>
      <div class="footer-text">¡Juntos hacemos la T2!</div>
    </section>
  </main>
</template>

<style scoped>
.main-content {
  flex: 1;
  padding: 28px 32px;
  background: #f1f5f9;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* ── Hero ─────────────────────────────────── */
.hero {
  background: linear-gradient(135deg, #ffffff 0%, #fdf8f8 60%, #fff5f5 100%);
  border-radius: 24px;
  padding: 44px 48px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 32px;
  border: 1px solid #f0e8e8;
  box-shadow: 0 6px 24px rgba(192, 21, 42, 0.04), 0 1px 4px rgba(15,23,42,0.04);
  position: relative;
  overflow: hidden;
}

.hero::before {
  content: '';
  position: absolute;
  top: -60px;
  right: -60px;
  width: 280px;
  height: 280px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(192,21,42,0.05) 0%, transparent 70%);
  pointer-events: none;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  background: rgba(192, 21, 42, 0.08);
  color: #c0152a;
  padding: 6px 14px;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 800;
  margin-bottom: 18px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  border: 1px solid rgba(192, 21, 42, 0.15);
}

.hero-text h1 {
  font-size: 2.6rem;
  color: #0f172a;
  margin-bottom: 16px;
  line-height: 1.12;
  letter-spacing: -0.6px;
  font-weight: 800;
}

.hero-text p {
  color: #64748b;
  max-width: 520px;
  font-size: 1rem;
  line-height: 1.7;
}

.hero-accent {
  width: 52px;
  height: 4px;
  background: linear-gradient(90deg, #c0152a, #ef4444);
  margin-top: 24px;
  border-radius: 10px;
}

.hero-image img {
  width: 320px;
  flex-shrink: 0;
  filter: drop-shadow(0 8px 20px rgba(0, 0, 0, 0.1));
  animation: floatY 4s ease-in-out infinite;
}

@keyframes floatY {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

/* ── Info Banner ──────────────────────────── */
.info-box {
  background: linear-gradient(135deg, #fff5f5 0%, #fef0f0 100%);
  border: 1px solid #fde0e0;
  border-radius: 20px;
  padding: 22px 28px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  box-shadow: 0 4px 14px rgba(192, 21, 42, 0.06);
}

.info-left {
  display: flex;
  align-items: center;
  gap: 18px;
}

.icon-circle {
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, #ffd4d4, #ffb8b8);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #c0152a;
  font-size: 22px;
  flex-shrink: 0;
  box-shadow: 0 4px 10px rgba(192, 21, 42, 0.15);
}

.info-left h3 {
  font-size: 1.05rem;
  margin-bottom: 4px;
  color: #0f172a;
  font-weight: 700;
}

.info-left p {
  color: #64748b;
  font-size: 0.88rem;
}

.btn {
  padding: 12px 24px;
  border-radius: 50px;
  border: none;
  cursor: pointer;
  font-size: 0.88rem;
  font-weight: 700;
  transition: all 0.25s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
}

.btn-primary {
  background: #fff;
  border: 2px solid #fca5a5;
  color: #c0152a;
}

.btn-primary:hover {
  background: #c0152a;
  color: #fff;
  border-color: #c0152a;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(192, 21, 42, 0.22);
}

/* ── Cards Grid ───────────────────────────── */
.cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.card {
  background: #fff;
  border-radius: 22px;
  padding: 28px 20px 22px;
  text-align: center;
  border: 1px solid #e8edf2;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 290px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
}

.card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  border-radius: 22px 22px 0 0;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.card:hover {
  transform: translateY(-6px);
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.10);
}

.card:hover::before {
  opacity: 1;
}

/* Card color accents */
.card-orange::before { background: linear-gradient(90deg, #f59e0b, #f97316); }
.card-blue::before   { background: linear-gradient(90deg, #3b82f6, #2563eb); }
.card-green::before  { background: linear-gradient(90deg, #22c55e, #16a34a); }
.card-purple::before { background: linear-gradient(90deg, #a855f7, #7c3aed); }

.card-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 18px;
  transition: transform 0.3s ease;
}

.card:hover .card-icon { transform: scale(1.08); }

.card-orange .card-icon { background: #fff7ed; }
.card-blue .card-icon   { background: #eff6ff; }
.card-green .card-icon  { background: #f0fdf4; }
.card-purple .card-icon { background: #faf5ff; }

.card-icon img {
  max-width: 48px;
  max-height: 48px;
}

.card-emoji {
  font-size: 34px;
  line-height: 1;
}

.card-body {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.card h3 {
  font-size: 1.08rem;
  margin-bottom: 8px;
  color: #0f172a;
  font-weight: 700;
}

.card p {
  color: #94a3b8;
  font-size: 0.85rem;
  margin-bottom: 18px;
  line-height: 1.55;
  flex: 1;
}

/* Card link buttons */
.card-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  border-radius: 50px;
  font-size: 0.85rem;
  font-weight: 700;
  text-decoration: none;
  transition: all 0.25s ease;
  border: 2px solid;
}

.card-link i {
  font-size: 0.75rem;
  transition: transform 0.2s ease;
}

.card-link:hover i { transform: translateX(4px); }

.card-link-orange { border-color: #fed7aa; color: #ea580c; background: #fffbf5; }
.card-link-orange:hover { background: #fff7ed; border-color: #f97316; }

.card-link-blue { border-color: #bfdbfe; color: #2563eb; background: #f8fbff; }
.card-link-blue:hover { background: #eff6ff; border-color: #3b82f6; }

.card-link-green { border-color: #bbf7d0; color: #16a34a; background: #f8fffe; }
.card-link-green:hover { background: #f0fdf4; border-color: #22c55e; }

.card-link-purple { border-color: #e9d5ff; color: #7c3aed; background: #fdfaff; }
.card-link-purple:hover { background: #faf5ff; border-color: #a855f7; }

/* ── Footer Banner ────────────────────────── */
.footer-box {
  background: linear-gradient(135deg, #fff5f5 0%, #fef0f0 100%);
  border: 1px solid #fde0e0;
  border-radius: 20px;
  padding: 28px 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  box-shadow: 0 4px 14px rgba(192, 21, 42, 0.05);
}

.footer-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.footer-icon {
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, #ffd4d4, #ffb8b8);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #c0152a;
  flex-shrink: 0;
  box-shadow: 0 4px 10px rgba(192, 21, 42, 0.15);
}

.footer-left h3 { font-size: 1.15rem; margin-bottom: 6px; color: #0f172a; }
.footer-left p  { color: #64748b; font-size: 0.9rem; }

.footer-text {
  font-size: 1.8rem;
  color: #c0152a;
  font-weight: 800;
  letter-spacing: -0.5px;
  white-space: nowrap;
}

/* ── Responsive ───────────────────────────── */
@media (max-width: 1200px) {
  .cards { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 900px) {
  .hero { flex-direction: column; text-align: center; padding: 32px 28px; }
  .hero-text p { max-width: 100%; }
  .hero-accent { margin: 20px auto 0; }
  .hero-image img { width: 240px; }
  .info-box { flex-direction: column; text-align: center; }
  .info-left { flex-direction: column; }
  .footer-box { flex-direction: column; text-align: center; }
  .footer-left { flex-direction: column; }
}

@media (max-width: 700px) {
  .main-content { padding: 16px; }
  .cards { grid-template-columns: 1fr; }
  .hero-text h1 { font-size: 1.9rem; }
  .footer-text { font-size: 1.4rem; }
}
</style>

