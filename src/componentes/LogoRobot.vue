<script setup>
// Logo de robot: cabeza con antena, ojos y sonrisa, sobre un circulo con degradado.
defineProps({ tamano: { type: Number, default: 40 } })
</script>

<template>
  <svg :width="tamano" :height="tamano" viewBox="0 0 48 48" role="img" aria-label="Asistente RAGFlow">
    <defs>
      <linearGradient id="rf-grad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#3b85b0" />
        <stop offset="1" stop-color="#148f8f" />
      </linearGradient>
    </defs>
    <circle cx="24" cy="24" r="24" fill="url(#rf-grad)" />
    <!-- antena -->
    <line x1="24" y1="9" x2="24" y2="14" stroke="#fff" stroke-width="2.4" stroke-linecap="round" />
    <circle cx="24" cy="8" r="2.6" fill="#ffe08a" />
    <!-- orejas -->
    <rect x="8" y="21" width="3.5" height="9" rx="1.7" fill="#fff" opacity=".85" />
    <rect x="36.5" y="21" width="3.5" height="9" rx="1.7" fill="#fff" opacity=".85" />
    <!-- cabeza -->
    <rect x="12" y="14" width="24" height="22" rx="7" fill="#fff" />
    <!-- ojos -->
    <circle cx="19" cy="24" r="3" fill="#002d61" />
    <circle cx="29" cy="24" r="3" fill="#002d61" />
    <circle cx="20" cy="23" r="1" fill="#fff" />
    <circle cx="30" cy="23" r="1" fill="#fff" />
    <!-- sonrisa -->
    <path d="M18.5 30.5c1.6 2 3.3 3 5.5 3s3.9-1 5.5-3" fill="none" stroke="#148f8f" stroke-width="2.2" stroke-linecap="round" />
  </svg>
</template>
