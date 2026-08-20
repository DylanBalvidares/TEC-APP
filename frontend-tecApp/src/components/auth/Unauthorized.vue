<template>
    <div class="container">
        <div class="lock"></div>

        <div class="message">
            <h1>El acceso a esta página es restringido</h1>
        </div>
    </div>
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
}

h1 {
    margin: 40px 0 20px;
}

.lock {
    position: relative;
    width: 55px;
    height: 45px;
    background-color: #333;
    border-radius: 5px;
    animation: dip 1s;
}

.lock::before,
.lock::after {
    content: "";
    position: absolute;
    border-left: 5px solid #333;
    height: 20px;
    width: 15px;
    left: calc(50% - 12.5px);
}

.lock::before {
    top: -30px;
    border: 5px solid #333;
    border-bottom-color: transparent;
    border-radius: 15px 15px 0 0;
    height: 30px;
    animation:
        lock 1s,
        spin 1s;
}

.lock::after {
    top: -10px;
    border-right: 5px solid transparent;
    animation: spin 1s;
}

@keyframes lock {
    0% {
        top: -45px;
    }
    65% {
        top: -45px;
    }
    100% {
        top: -30px;
    }
}

@keyframes spin {
    0% {
        transform: scaleX(-1);
        left: calc(50% - 30px);
    }
    65% {
        transform: scaleX(1);
        left: calc(50% - 12.5px);
    }
    100% {
        transform: scaleX(1);
        left: calc(50% - 12.5px);
    }
}

@keyframes dip {
    0% {
        transform: translateY(0);
    }
    50% {
        transform: translateY(10px);
    }
    100% {
        transform: translateY(0);
    }
}
</style>
