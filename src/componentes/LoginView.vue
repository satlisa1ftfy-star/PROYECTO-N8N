<script setup>
import { ref } from 'vue'
import { iniciarSesion } from '../servicios/auth.js'
import Icono from './Icono.vue'
import LogoRobot from './LogoRobot.vue'

const emit = defineEmits(['entrar'])

const usuario = ref('')
const clave = ref('')
const verClave = ref(false)
const error = ref('')
const cargando = ref(false)

const ingresar = async () => {
  error.value = ''
  cargando.value = true
  const resultado = await iniciarSesion(usuario.value, clave.value)
  cargando.value = false
  clave.value = ''
  if (resultado.error) {
    error.value = resultado.error
    return
  }
  emit('entrar', resultado.sesion)
}
</script>

<template>
  <main class="login">
    <section class="login-marca" aria-hidden="false">
      <div class="login-marca-contenido">
        <LogoRobot :tamano="76" />
        <h1>RAGFlow Expedientes</h1>
        <p class="login-lema">Su asistente para consultar expedientes, de forma rápida y segura.</p>
        <ul class="login-puntos">
          <li><Icono nombre="check" :tamano="18" /> Consultas por perfil: técnico, supervisor y jefe</li>
          <li><Icono nombre="check" :tamano="18" /> Preguntas en lenguaje natural con IA</li>
          <li><Icono nombre="check" :tamano="18" /> Trazabilidad y resúmenes al instante</li>
        </ul>
      </div>
      <div class="burbuja-deco b1"></div>
      <div class="burbuja-deco b2"></div>
    </section>

    <section class="login-form-zona">
      <form class="login-form" @submit.prevent="ingresar">
        <h2>Bienvenido</h2>
        <p class="sub">Ingrese con su usuario del sistema.</p>

        <label for="usuario">Usuario</label>
        <div class="campo-icono">
          <Icono nombre="usuario" :tamano="18" />
          <input id="usuario" v-model="usuario" type="text" autocomplete="username" placeholder="Su usuario" autofocus />
        </div>

        <label for="clave">Clave</label>
        <div class="campo-icono">
          <Icono nombre="candado" :tamano="18" />
          <input
            id="clave"
            v-model="clave"
            :type="verClave ? 'text' : 'password'"
            autocomplete="current-password"
            placeholder="Su clave"
          />
          <button
            type="button"
            class="ojo"
            :aria-label="verClave ? 'Ocultar clave' : 'Mostrar clave'"
            @click="verClave = !verClave"
          >
            <Icono :nombre="verClave ? 'ojoNo' : 'ojo'" :tamano="18" />
          </button>
        </div>

        <div v-if="error" class="alerta-error" role="alert">
          <Icono nombre="alerta" :tamano="18" />
          <span>{{ error }}</span>
        </div>

        <button type="submit" class="primario grande" :disabled="cargando">
          <span v-if="cargando" class="spinner" aria-hidden="true"></span>
          {{ cargando ? 'Ingresando…' : 'Ingresar' }}
        </button>
        <p class="nota"><Icono nombre="candado" :tamano="13" /> Sus credenciales van solo al servicio de seguridad. La clave no se guarda.</p>
      </form>
    </section>
  </main>
</template>
