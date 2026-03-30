<script setup>
import ShareDialog from "./components/ShareDialog.vue";
</script>

<template>
  <ShareDialog />
</template>

<style>
@font-face {
  font-family: "Noto-Sans-Regular";
  src: url("./fonts/NotoSans-Regular.ttf") format("truetype");
  font-weight: normal;
  font-style: normal;
}

.toast-wrapper {
  position: fixed;
  top: 50%;
  left: 50%;
  color: #fff;
  font-weight: bold;
  transform: translate(-50%, -50%);
  padding: 19px 50px;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 6px;
  font-size: 16px;
  line-height: 22px;
  animation: fade-in-out 2s linear;
  white-space: nowrap;
  z-index: 9999;
}
</style>
