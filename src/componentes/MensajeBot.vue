<script setup>
import { computed, ref } from 'vue'
import VistaDatos from './VistaDatos.vue'
import BarraCobertura from './BarraCobertura.vue'
import Icono from './Icono.vue'
import LogoRobot from './LogoRobot.vue'
import { detalleTecnico, mensajeDeError } from '../servicios/errores.js'
import { coberturaDe, datosParaVista, etiquetaTipo } from '../presentacion.js'

const props = defineProps({
  mensaje: { type: Object, required: true },
  iniciales: { type: String, default: '?' },
})
const emit = defineEmits(['consultar'])

const data = computed(() => props.mensaje.data)
const esUsuario = computed(() => props.mensaje.rol === 'usuario')
const esError = computed(() => data.value?.resultado === 'ERROR')
const esFuera = computed(() => data.value?.resultado === 'FUERA_DE_ALCANCE')
const esPregunta = computed(() => data.value?.tipoConsulta === 'PREGUNTA' && !esFuera.value)
const cobertura = computed(() => coberturaDe(data.value))
const datos = computed(() => datosParaVista(data.value))
const hayDatos = computed(() => esPregunta.value && datos.value && datos.value.resultado === 'EXITOSO')
const interpretada = computed(() => data.value?.consultaInterpretada?.tipoConsulta)

const copiado = ref(false)
const copiar = async () => {
  try {
    await navigator.clipboard.writeText(data.value.respuesta)
    copiado.value = true
    setTimeout(() => (copiado.value = false), 1800)
  } catch {
    copiado.value = false
  }
}
</script>

<template>
  <div class="mensaje" :class="mensaje.rol">
    <span v-if="esUsuario" class="avatar chico" aria-hidden="true">{{ iniciales }}</span>
    <span v-else class="avatar-bot" aria-hidden="true"><LogoRobot :tamano="34" /></span>

    <div class="mensaje-cuerpo">
      <!-- Mensaje del usuario -->
      <p v-if="mensaje.texto" class="burbuja">{{ mensaje.texto }}</p>

      <!-- Respuesta del bot -->
      <div v-else class="burbuja bot-respuesta" :class="{ 'es-ia': esPregunta, 'es-error': esError }">
        <div v-if="mensaje.cargando" class="cargando" role="status">
          <span class="puntos" aria-hidden="true"><i></i><i></i><i></i></span>
          <span>{{ mensaje.usaIA ? 'Consultando con IA… puede tardar unos segundos.' : 'Consultando expedientes…' }}</span>
        </div>

        <template v-else-if="esError">
          <div class="error-tarjeta" role="alert">
            <Icono nombre="alerta" :tamano="22" />
            <div>
              <strong>{{ mensajeDeError(data) }}</strong>
              <p v-if="detalleTecnico(data)" class="meta">Detalle técnico: {{ detalleTecnico(data) }}</p>
            </div>
          </div>
        </template>

        <p v-else-if="esFuera">{{ data.respuesta }}</p>

        <template v-else-if="esPregunta">
          <div class="ia-etiqueta"><Icono nombre="chispa" :tamano="14" /> Respuesta con IA</div>
          <p v-if="data.respuesta" class="texto-ia">{{ data.respuesta }}</p>
          <p v-else class="aviso">{{ data.aviso || 'No se pudo redactar la respuesta; se muestran los datos consultados.' }}</p>
          <BarraCobertura v-if="cobertura" :cobertura="cobertura" />
          <p v-if="interpretada" class="meta">Interpreté su pregunta como: {{ etiquetaTipo(interpretada) }}</p>
          <div class="pie-respuesta">
            <button v-if="data.respuesta" type="button" class="mini" @click="copiar">
              <Icono nombre="copiar" :tamano="14" /> {{ copiado ? 'Copiado' : 'Copiar' }}
            </button>
          </div>
          <details v-if="hayDatos" class="datos">
            <summary>Ver datos consultados</summary>
            <VistaDatos :data="datos" :solicitud="null" @consultar="emit('consultar', $event)" />
          </details>
        </template>

        <template v-else-if="data">
          <BarraCobertura v-if="cobertura" :cobertura="cobertura" />
          <VistaDatos :data="data" :solicitud="mensaje.solicitud" @consultar="emit('consultar', $event)" />
        </template>
      </div>

      <span v-if="mensaje.hora && !mensaje.cargando" class="hora">{{ mensaje.hora }}</span>
    </div>
  </div>
</template>
