<script setup lang="ts">
withDefaults(defineProps<{ size?: number }>(), { size: 16 });
</script>

<template>
  <svg
    class="blocked-warning-icon"
    :width="size"
    :height="size"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <circle cx="8" cy="8" r="6.5" stroke="currentColor" />
    <path d="M8 4.75V9" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" />
    <circle cx="8" cy="11.25" r="0.75" fill="currentColor" />
  </svg>
</template>
