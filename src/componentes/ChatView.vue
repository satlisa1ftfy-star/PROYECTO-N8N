<script setup>
import { computed, nextTick, ref } from 'vue'
import MensajeBot from './MensajeBot.vue'
import Icono from './Icono.vue'
import LogoRobot from './LogoRobot.vue'
import { consultar } from '../servicios/orquestador.js'
import { exigeNuevoLogin } from '../servicios/errores.js'
import { guardarSesion } from '../servicios/auth.js'
import { horaActual, iniciales } from '../presentacion.js'
import {
  PREGUNTA_MAX,
  PREGUNTA_MIN,
  armarPreguntaLibre,
  preguntasDePerfil,
  validarParametros,
} from '../catalogo.js'

const props = defineProps({ sesion: { type: Object, required: true } })
const emit = defineEmits(['salir'])

const perfil = ref(props.sesion.perfil)
const sesionActiva = computed(() => ({ ...props.sesion, perfil: perfil.value }))
const preguntas = computed(() => preguntasDePerfil(perfil.value))
const directas = computed(() => preguntas.value.filter((p) => !p.usaIA))
const conIA = computed(() => preguntas.value.filter((p) => p.usaIA))
const sugerencias = computed(() => conIA.value.filter((p) => p.parametros.length === 0).slice(0, 3))
const nombrePerfil = computed(() => props.sesion.perfiles.find((p) => p.rol === perfil.value)?.nombre ?? perfil.value)
const avatar = computed(() => iniciales(props.sesion.nombre))
const primerNombre = computed(() => String(props.sesion.nombre).split(' ')[0])

const mensajes = ref([])
const ocupado = ref(false)
const pendiente = ref(null) // pregunta que espera parametros
const valores = ref({})
const errorForm = ref('')
const textoLibre = ref('')
const zona = ref(null)
const menuAbierto = ref(false)
let contador = 0

const bajar = async () => {
  await nextTick()
  if (zona.value) zona.value.scrollTop = zona.value.scrollHeight
}

const ejecutar = async (body, etiqueta, usaIA = body.tipoConsulta === 'PREGUNTA') => {
  if (ocupado.value) return
  ocupado.value = true
  pendiente.value = null
  menuAbierto.value = false
  mensajes.value.push({ id: ++contador, rol: 'usuario', texto: etiqueta, hora: horaActual() })
  const respuesta = { id: ++contador, rol: 'bot', cargando: true, usaIA, solicitud: body, data: null, hora: horaActual() }
  mensajes.value.push(respuesta)
  await bajar()

  const data = await consultar(body, props.sesion.token)
  const objetivo = mensajes.value.find((m) => m.id === respuesta.id)
  objetivo.cargando = false
  objetivo.data = data
  objetivo.hora = horaActual()
  ocupado.value = false
  await bajar()
  if (exigeNuevoLogin(data)) {
    setTimeout(() => emit('salir'), 2500)
  }
}

const elegir = (p) => {
  errorForm.value = ''
  menuAbierto.value = false
  if (p.parametros.length === 0) {
    ejecutar(p.construir({}, sesionActiva.value), p.texto, p.usaIA)
    return
  }
  pendiente.value = p
  valores.value = {}
  bajar()
}

const enviarParametros = () => {
  const p = pendiente.value
  const problema = validarParametros(p, valores.value)
  if (problema) {
    errorForm.value = problema
    return
  }
  errorForm.value = ''
  ejecutar(p.construir(valores.value, sesionActiva.value), p.texto, p.usaIA)
}

const enviarLibre = () => {
  const body = armarPreguntaLibre(textoLibre.value, sesionActiva.value)
  if (!body) {
    errorForm.value = `La pregunta debe tener entre ${PREGUNTA_MIN} y ${PREGUNTA_MAX} caracteres.`
    return
  }
  errorForm.value = ''
  const texto = body.pregunta
  textoLibre.value = ''
  ejecutar(body, texto, true)
}

// Acciones que salen de una respuesta: ver detalle/trazabilidad de una fila o cambiar de pagina
const desdeRespuesta = ({ body, etiqueta }) => ejecutar(body, etiqueta)

const nuevaConversacion = () => {
  if (ocupado.value) return
  mensajes.value = []
  pendiente.value = null
  errorForm.value = ''
  menuAbierto.value = false
}

const cambiarPerfil = () => {
  guardarSesion({ ...props.sesion, perfil: perfil.value })
  nuevaConversacion()
}
</script>

<template>
  <div class="app-chat">
    <div v-if="menuAbierto" class="velo" @click="menuAbierto = false"></div>

    <!-- Barra lateral -->
    <aside class="lateral" :class="{ abierta: menuAbierto }" aria-label="Menú de consultas">
      <div class="lateral-marca">
        <LogoRobot :tamano="42" />
        <div>
          <strong>RAGFlow</strong>
          <span>Expedientes</span>
        </div>
        <button type="button" class="icono-boton solo-movil" aria-label="Cerrar menú" @click="menuAbierto = false">
          <Icono nombre="cerrar" />
        </button>
      </div>

      <button type="button" class="nueva" :disabled="ocupado" @click="nuevaConversacion">
        <Icono nombre="mas" :tamano="18" /> Nueva conversación
      </button>

      <nav class="lateral-menu">
        <p class="lateral-titulo">Consultas directas</p>
        <button v-for="p in directas" :key="p.id" type="button" class="lateral-item" :disabled="ocupado" @click="elegir(p)">
          <Icono :nombre="p.icono" :tamano="18" />
          <span>{{ p.texto }}</span>
        </button>

        <p v-if="conIA.length" class="lateral-titulo">Preguntas con IA <span class="mini-ia">IA</span></p>
        <button v-for="p in conIA" :key="p.id" type="button" class="lateral-item ia" :disabled="ocupado" @click="elegir(p)">
          <Icono :nombre="p.icono" :tamano="18" />
          <span>{{ p.texto }}</span>
        </button>
      </nav>

      <div class="lateral-usuario">
        <span class="avatar" aria-hidden="true">{{ avatar }}</span>
        <div class="datos-usuario">
          <strong :title="sesion.nombre">{{ sesion.nombre }}</strong>
          <span class="insignia-perfil" :class="`perfil-${perfil}`">{{ nombrePerfil }}</span>
        </div>
        <button type="button" class="icono-boton" aria-label="Cerrar sesión" title="Cerrar sesión" @click="emit('salir')">
          <Icono nombre="salir" :tamano="19" />
        </button>
      </div>
      <label v-if="sesion.perfiles.length > 1" class="selector-perfil">
        <span>Cambiar de perfil</span>
        <select v-model="perfil" @change="cambiarPerfil">
          <option v-for="p in sesion.perfiles" :key="p.rol" :value="p.rol">{{ p.nombre }}</option>
        </select>
      </label>
    </aside>

    <!-- Zona principal -->
    <section class="principal">
      <header class="principal-barra">
        <button type="button" class="icono-boton solo-movil" aria-label="Abrir menú" @click="menuAbierto = true">
          <Icono nombre="menu" />
        </button>
        <div class="principal-titulo">
          <strong>Asistente de expedientes</strong>
          <span class="en-linea"><i></i> En línea</span>
        </div>
      </header>

      <div ref="zona" class="chat-zona" aria-live="polite">
        <!-- Bienvenida -->
        <div v-if="mensajes.length === 0" class="bienvenida">
          <LogoRobot :tamano="64" />
          <h2>Hola, {{ primerNombre }} 👋</h2>
          <p>¿Qué desea consultar hoy? Elija una opción o escriba su pregunta abajo.</p>

          <h3 class="bloque-titulo">Consultas directas</h3>
          <div class="tarjetas">
            <button v-for="p in directas" :key="p.id" type="button" class="tarjeta-consulta" :disabled="ocupado" @click="elegir(p)">
              <span class="tc-icono"><Icono :nombre="p.icono" :tamano="22" /></span>
              <span class="tc-texto">
                <strong>{{ p.texto }}</strong>
                <small>{{ p.descripcion }}</small>
              </span>
            </button>
          </div>

          <template v-if="conIA.length">
            <h3 class="bloque-titulo">Preguntas con IA <span class="mini-ia">más lento</span></h3>
            <div class="tarjetas">
              <button v-for="p in conIA" :key="p.id" type="button" class="tarjeta-consulta ia" :disabled="ocupado" @click="elegir(p)">
                <span class="tc-icono"><Icono :nombre="p.icono" :tamano="22" /></span>
                <span class="tc-texto">
                  <strong>{{ p.texto }}</strong>
                  <small>{{ p.descripcion }}</small>
                </span>
              </button>
            </div>
          </template>
        </div>

        <!-- Conversación -->
        <MensajeBot
          v-for="m in mensajes"
          :key="m.id"
          :mensaje="m"
          :iniciales="avatar"
          @consultar="desdeRespuesta"
        />
      </div>

      <footer class="compositor">
        <form v-if="pendiente" class="formulario" @submit.prevent="enviarParametros">
          <div class="formulario-cabecera">
            <strong><Icono :nombre="pendiente.icono" :tamano="18" /> {{ pendiente.texto }}</strong>
            <button type="button" class="icono-boton" aria-label="Cancelar" @click="pendiente = null">
              <Icono nombre="cerrar" :tamano="18" />
            </button>
          </div>
          <div v-for="campo in pendiente.parametros" :key="campo.campo" class="campo">
            <label :for="'p-' + campo.campo">{{ campo.etiqueta }}</label>
            <input
              :id="'p-' + campo.campo"
              v-model="valores[campo.campo]"
              :type="campo.tipo === 'entero' ? 'number' : 'text'"
              :placeholder="campo.placeholder"
              :min="campo.tipo === 'entero' ? 1 : undefined"
              maxlength="200"
              autofocus
            />
          </div>
          <div class="fila">
            <button type="submit" class="primario" :disabled="ocupado">Consultar</button>
            <button type="button" class="secundario" @click="pendiente = null">Cancelar</button>
          </div>
        </form>

        <div v-if="sugerencias.length && !pendiente" class="sugerencias">
          <span>Pruebe:</span>
          <button v-for="p in sugerencias" :key="p.id" type="button" class="chip ia" :disabled="ocupado" @click="elegir(p)">
            <Icono nombre="chispa" :tamano="14" /> {{ p.texto }}
          </button>
        </div>

        <form class="libre" @submit.prevent="enviarLibre">
          <div class="libre-caja">
            <input
              v-model="textoLibre"
              type="text"
              :maxlength="PREGUNTA_MAX"
              placeholder="Escriba su pregunta sobre expedientes…"
              aria-label="Pregunta en lenguaje natural"
              :disabled="ocupado"
            />
            <span class="contador" :class="{ cerca: textoLibre.length > PREGUNTA_MAX - 50 }">
              {{ textoLibre.length }}/{{ PREGUNTA_MAX }}
            </span>
          </div>
          <button
            type="submit"
            class="enviar"
            aria-label="Enviar pregunta"
            :disabled="ocupado || textoLibre.trim().length < PREGUNTA_MIN"
          >
            <Icono nombre="enviar" :tamano="20" />
          </button>
        </form>
        <p v-if="errorForm" class="alerta-error" role="alert"><Icono nombre="alerta" :tamano="16" /> {{ errorForm }}</p>
        <p class="pie-nota">Las respuestas con IA usan solo los datos consultados. Verifique la información importante.</p>
      </footer>
    </section>
  </div>
</template>
