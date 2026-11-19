<script setup>
import { computed } from 'vue'

// Grafico de barras horizontales hecho con CSS (sin librerias).
// items: [{ etiqueta, valor, clase? }]
const props = defineProps({
  titulo: { type: String, required: true },
  items: { type: Array, required: true },
  maxFilas: { type: Number, default: 8 },
})

const visibles = computed(() => props.items.slice(0, props.maxFilas))
const ocultos = computed(() => props.items.slice(props.maxFilas))
const maximo = computed(() => Math.max(1, ...props.items.map((i) => i.valor)))
const sumaOcultos = computed(() => ocultos.value.reduce((t, i) => t + i.valor, 0))
</script>

<template>
  <section class="grafico" :aria-label="titulo">
    <h4>{{ titulo }}</h4>
    <ul>
      <li v-for="(it, i) in visibles" :key="it.etiqueta + i">
        <span class="grafico-etiqueta" :title="it.etiqueta">{{ it.etiqueta }}</span>
        <span class="grafico-pista">
          <span
            class="grafico-barra"
            :class="it.clase ? `barra-${it.clase}` : `barra-c${i % 4}`"
            :style="{ width: Math.max((it.valor / maximo) * 100, 2) + '%' }"
          ></span>
        </span>
        <span class="grafico-valor">{{ it.valor }}</span>
      </li>
    </ul>
    <p v-if="ocultos.length" class="meta">+ {{ ocultos.length }} más ({{ sumaOcultos }} expedientes)</p>
  </section>
</template>
