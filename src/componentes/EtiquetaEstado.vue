<script setup>
import { computed } from 'vue'
import { claseEstado } from '../presentacion.js'

const props = defineProps({
  id: { type: [Number, String], default: null },
  descripcion: { type: String, default: null },
})
const clase = computed(() => claseEstado(props.id))
const texto = computed(() => props.descripcion || (props.id === null ? '—' : `Estado ${props.id}`))
</script>

<template>
  <span class="etiqueta" :class="`etiqueta-${clase}`" :title="texto">{{ texto }}</span>
</template>
