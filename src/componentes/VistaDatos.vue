<script setup>
import { computed } from 'vue'
import EtiquetaEstado from './EtiquetaEstado.vue'
import GraficoBarras from './GraficoBarras.vue'
import Icono from './Icono.vue'
import { consultaDetalle, consultaTrazabilidad } from '../catalogo.js'
import { claseEstado, fechaCorta } from '../presentacion.js'

const props = defineProps({
  data: { type: Object, required: true },
  // Solicitud original (solo en LISTADO directo, para poder paginar)
  solicitud: { type: Object, default: null },
})
const emit = defineEmits(['consultar'])

const tipo = computed(() => props.data.tipoConsulta)
const puedePaginar = computed(() => props.solicitud && props.solicitud.tipoConsulta === 'LISTADO')

const itemsEstado = computed(() =>
  (props.data.porEstado ?? []).map((f) => ({
    etiqueta: f.descripcion || `Estado ${f.idEstado}`,
    valor: f.cantidad,
    clase: claseEstado(f.idEstado),
  })),
)
const itemsSerie = computed(() => (props.data.porSerie ?? []).map((f) => ({ etiqueta: f.serie, valor: f.cantidad })))
const claseDeEvento = (ev) => `punto-${claseEstado(ev.idEstado)}`

const verDetalle = (e) =>
  emit('consultar', { body: consultaDetalle(e.idExpediente), etiqueta: `Detalle del expediente ${e.numExpediente}` })
const verTrazabilidad = (e) =>
  emit('consultar', {
    body: consultaTrazabilidad(e.idExpediente),
    etiqueta: `Trazabilidad del expediente ${e.numExpediente}`,
  })
const trazabilidadActual = () =>
  emit('consultar', {
    body: consultaTrazabilidad(props.data.idExpediente),
    etiqueta: `Trazabilidad del expediente ${props.data.numExpediente}`,
  })
const irAPagina = (n) =>
  emit('consultar', { body: { ...props.solicitud, pagina: n }, etiqueta: `Página ${n}` })
</script>

<template>
  <!-- LISTADO -->
  <div v-if="tipo === 'LISTADO'" class="vista">
    <div class="vista-cabecera">
      <strong>{{ data.total }} expediente(s)</strong>
      <span class="meta">Página {{ data.pagina }} de {{ data.totalPaginas || 1 }}</span>
    </div>
    <p v-if="data.expedientes.length === 0">No se encontraron expedientes con ese criterio.</p>
    <div v-else class="tabla-envoltura">
      <table class="tabla-adaptable">
        <thead>
          <tr>
            <th>Número</th>
            <th>Asunto</th>
            <th>Estado</th>
            <th>Creación</th>
            <th>Cierre</th>
            <th><span class="sr-only">Acciones</span></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="e in data.expedientes" :key="e.idExpediente">
            <td data-label="Número" class="nowrap numero">{{ e.numExpediente }}</td>
            <td data-label="Asunto">{{ e.asunto || '—' }}</td>
            <td data-label="Estado"><EtiquetaEstado :id="e.estado.id" :descripcion="e.estado.descripcion" /></td>
            <td data-label="Creación" class="nowrap">{{ fechaCorta(e.fechaCreacion) }}</td>
            <td data-label="Cierre" class="nowrap">{{ fechaCorta(e.fechaCierre) }}</td>
            <td class="acciones">
              <button type="button" class="mini" @click="verDetalle(e)"><Icono nombre="documento" :tamano="14" /> Detalle</button>
              <button type="button" class="mini" @click="verTrazabilidad(e)"><Icono nombre="ruta" :tamano="14" /> Trazabilidad</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-if="puedePaginar && data.totalPaginas > 1" class="paginacion">
      <button type="button" class="mini" :disabled="data.pagina <= 1" @click="irAPagina(data.pagina - 1)">← Anterior</button>
      <span class="meta">{{ data.pagina }} / {{ data.totalPaginas }}</span>
      <button type="button" class="mini" :disabled="data.pagina >= data.totalPaginas" @click="irAPagina(data.pagina + 1)">
        Siguiente →
      </button>
    </div>
  </div>

  <!-- DETALLE -->
  <div v-else-if="tipo === 'DETALLE'" class="vista tarjeta-detalle">
    <div class="detalle-cabecera">
      <div>
        <span class="meta">Expediente</span>
        <h3>{{ data.numExpediente }}</h3>
      </div>
      <EtiquetaEstado :id="data.estado.id" :descripcion="data.estado.descripcion" />
    </div>
    <p class="detalle-asunto">{{ data.asunto || 'Sin asunto' }}</p>
    <dl class="detalle-rejilla">
      <div><dt>Serie</dt><dd>{{ data.serie || '—' }}</dd></div>
      <div><dt>Responsable</dt><dd>{{ data.responsable || '—' }}</dd></div>
      <div><dt>Creación</dt><dd>{{ fechaCorta(data.fechaCreacion) }}</dd></div>
      <div><dt>Cierre</dt><dd>{{ fechaCorta(data.fechaCierre) }}</dd></div>
      <div><dt>Folios</dt><dd>{{ data.folios ?? '—' }}</dd></div>
      <div><dt>Versión</dt><dd>{{ data.version ?? '—' }}</dd></div>
      <div v-if="data.observacion" class="ancho"><dt>Observación</dt><dd>{{ data.observacion }}</dd></div>
    </dl>
    <button type="button" class="mini" @click="trazabilidadActual"><Icono nombre="ruta" :tamano="14" /> Ver trazabilidad</button>
  </div>

  <!-- TRAZABILIDAD -->
  <div v-else-if="tipo === 'TRAZABILIDAD'" class="vista">
    <div class="vista-cabecera">
      <strong>Recorrido del expediente {{ data.idExpediente }}</strong>
      <span class="meta">{{ data.total }} evento(s)</span>
    </div>
    <p v-if="data.eventos.length === 0">Este expediente no tiene eventos registrados.</p>
    <ol v-else class="linea-tiempo">
      <li v-for="ev in data.eventos" :key="ev.id ?? ev.fecha + ev.estado" :class="claseDeEvento(ev)">
        <div class="lt-cabecera">
          <EtiquetaEstado :id="ev.idEstado" :descripcion="ev.estado" />
          <span class="meta">{{ ev.fecha || '—' }}</span>
        </div>
        <div v-if="ev.descripcion">{{ ev.descripcion }}</div>
        <div v-if="ev.usuario || ev.observacion" class="meta">
          <template v-if="ev.usuario">Por {{ ev.usuario }}</template>
          <template v-if="ev.usuario && ev.observacion"> · </template>
          <template v-if="ev.observacion">{{ ev.observacion }}</template>
        </div>
      </li>
    </ol>
  </div>

  <!-- RESUMEN -->
  <div v-else-if="tipo === 'RESUMEN'" class="vista">
    <div class="cifras">
      <div class="cifra">
        <span class="cifra-valor">{{ data.total }}</span>
        <span class="cifra-nombre">Total de expedientes</span>
      </div>
      <div class="cifra">
        <span class="cifra-valor">{{ data.analizados }}</span>
        <span class="cifra-nombre">Analizados</span>
      </div>
      <div class="cifra">
        <span class="cifra-valor">{{ data.porEstado.length }}</span>
        <span class="cifra-nombre">Estados distintos</span>
      </div>
    </div>
    <div class="graficos">
      <GraficoBarras titulo="Por estado" :items="itemsEstado" />
      <GraficoBarras titulo="Por serie documental" :items="itemsSerie" />
    </div>
  </div>

  <p v-else class="meta">No hay una vista para este tipo de respuesta.</p>
</template>
