<script setup>
// "Analizados X de Y": barra de cobertura tomada de los datos del orquestador (no del texto de la IA).
defineProps({ cobertura: { type: Object, required: true } })
</script>

<template>
  <div class="cobertura" :class="{ parcial: !cobertura.completo }" role="group" aria-label="Cobertura del análisis">
    <div class="cobertura-fila">
      <strong>{{ cobertura.completo ? 'Cobertura completa' : 'Cobertura parcial' }}</strong>
      <span>{{ cobertura.analizados }} de {{ cobertura.total }} expedientes · {{ cobertura.porcentaje }}%</span>
    </div>
    <div
      class="cobertura-pista"
      role="progressbar"
      :aria-valuenow="cobertura.porcentaje"
      aria-valuemin="0"
      aria-valuemax="100"
    >
      <div class="cobertura-relleno" :style="{ width: Math.max(cobertura.porcentaje, 1.5) + '%' }"></div>
    </div>
    <p v-if="!cobertura.completo" class="cobertura-nota">
      Los conteos corresponden solo a los {{ cobertura.analizados }} expedientes analizados.
    </p>
  </div>
</template>
