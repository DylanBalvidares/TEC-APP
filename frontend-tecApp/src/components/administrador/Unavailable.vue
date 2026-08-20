<template>
    <div class="container">
        <div class="maintenance-icon">
            🔧
        </div>

```
    <div class="message">
        <h1>Sitio en mantenimiento</h1>

        <p>
            Estamos realizando mejoras para ofrecerte una mejor experiencia.
        </p>

        <p class="subtext">
            El servicio volverá a estar disponible en breve.
        </p>
    </div>
</div>
```

</template>

<style scoped>
@import url("https://fonts.googleapis.com/css?family=Lato");

.container {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background: linear-gradient(to bottom right, #eee, #aaa);
    text-align: center;
    font-family: "Lato", sans-serif;
    padding: 20px;
}

.maintenance-icon {
    font-size: 5rem;
    animation: float 2s ease-in-out infinite;
}

.message {
    max-width: 600px;
}

h1 {
    margin: 30px 0 15px;
    color: #222;
    font-size: 2.5rem;
}

p {
    color: #444;
    font-size: 1.1rem;
    line-height: 1.6;
}

.subtext {
    margin-top: 15px;
    color: #666;
    font-size: 0.95rem;
}

@keyframes float {
    0% {
        transform: translateY(0);
    }

    50% {
        transform: translateY(-12px);
    }

    100% {
        transform: translateY(0);
    }
}
</style>
