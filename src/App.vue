<script setup>
import { ref } from 'vue'
import LoginView from './componentes/LoginView.vue'
import ChatView from './componentes/ChatView.vue'
import { leerSesion, cerrarSesion } from './servicios/auth.js'

const sesion = ref(leerSesion())

const alEntrar = (s) => {
  sesion.value = s
}
const alSalir = () => {
  cerrarSesion()
  sesion.value = null
}
</script>

<template>
  <LoginView v-if="!sesion" @entrar="alEntrar" />
  <ChatView v-else :sesion="sesion" @salir="alSalir" />
</template>
