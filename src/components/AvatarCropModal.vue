<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import Slider from 'primevue/slider'

const props = defineProps<{
  visible: boolean
  file: File | null
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  confirm: [blob: Blob]
}>()

const { t } = useI18n({ useScope: 'global' })

const VIEWPORT = 260
const OUTPUT_SIZE = 512

const imageUrl = ref('')
const imgEl = ref<HTMLImageElement>()
const naturalWidth = ref(0)
const naturalHeight = ref(0)
const baseScale = ref(1)
const zoomFactor = ref(1)
const offsetX = ref(0)
const offsetY = ref(0)

const scale = computed(() => baseScale.value * zoomFactor.value)
const renderedWidth = computed(() => naturalWidth.value * scale.value)
const renderedHeight = computed(() => naturalHeight.value * scale.value)

const imgStyle = computed(() => ({
  width: `${renderedWidth.value}px`,
  height: `${renderedHeight.value}px`,
  transform: `translate(${offsetX.value}px, ${offsetY.value}px)`,
}))

function clampOffsets() {
  const minX = VIEWPORT - renderedWidth.value
  const minY = VIEWPORT - renderedHeight.value
  offsetX.value = Math.min(0, Math.max(minX, offsetX.value))
  offsetY.value = Math.min(0, Math.max(minY, offsetY.value))
}

function resetForImage() {
  if (!naturalWidth.value || !naturalHeight.value) return
  baseScale.value = Math.max(VIEWPORT / naturalWidth.value, VIEWPORT / naturalHeight.value)
  zoomFactor.value = 1
  offsetX.value = (VIEWPORT - renderedWidth.value) / 2
  offsetY.value = (VIEWPORT - renderedHeight.value) / 2
}

function onImageLoad() {
  if (!imgEl.value) return
  naturalWidth.value = imgEl.value.naturalWidth
  naturalHeight.value = imgEl.value.naturalHeight
  resetForImage()
}

watch(
  () => props.file,
  (file) => {
    if (imageUrl.value) URL.revokeObjectURL(imageUrl.value)
    imageUrl.value = file ? URL.createObjectURL(file) : ''
  },
  { immediate: true }
)

watch(zoomFactor, (next, prev) => {
  const scalePrev = baseScale.value * prev
  const scaleNext = baseScale.value * next
  const centerXNatural = (VIEWPORT / 2 - offsetX.value) / scalePrev
  const centerYNatural = (VIEWPORT / 2 - offsetY.value) / scalePrev
  offsetX.value = VIEWPORT / 2 - centerXNatural * scaleNext
  offsetY.value = VIEWPORT / 2 - centerYNatural * scaleNext
  clampOffsets()
})

let dragging = false
let lastX = 0
let lastY = 0

function onPointerDown(event: PointerEvent) {
  dragging = true
  lastX = event.clientX
  lastY = event.clientY
  ;(event.target as HTMLElement).setPointerCapture(event.pointerId)
}

function onPointerMove(event: PointerEvent) {
  if (!dragging) return
  offsetX.value += event.clientX - lastX
  offsetY.value += event.clientY - lastY
  lastX = event.clientX
  lastY = event.clientY
  clampOffsets()
}

function onPointerUp() {
  dragging = false
}

function handleCancel() {
  emit('update:visible', false)
}

async function handleConfirm() {
  if (!imgEl.value) return
  const canvas = document.createElement('canvas')
  canvas.width = OUTPUT_SIZE
  canvas.height = OUTPUT_SIZE
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const sx = -offsetX.value / scale.value
  const sy = -offsetY.value / scale.value
  const sSize = VIEWPORT / scale.value

  ctx.drawImage(imgEl.value, sx, sy, sSize, sSize, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE)

  canvas.toBlob(
    (blob) => {
      if (blob) emit('confirm', blob)
    },
    'image/jpeg',
    0.92
  )
}
</script>

<template>
  <Dialog
    :visible="visible"
    modal
    :closable="false"
    :header="t('settings.account.cropTitle')"
    class="crop-dialog"
    :style="{ width: '22rem', maxWidth: '94vw' }"
    @update:visible="(v: boolean) => emit('update:visible', v)"
  >
    <div class="crop-body">
      <div
        class="crop-viewport"
        :style="{ width: `${VIEWPORT}px`, height: `${VIEWPORT}px` }"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerUp"
      >
        <img
          v-if="imageUrl"
          ref="imgEl"
          :src="imageUrl"
          :style="imgStyle"
          class="crop-image"
          draggable="false"
          @load="onImageLoad"
        />
        <div class="crop-mask"></div>
      </div>

      <div class="crop-zoom">
        <i class="pi pi-search-minus"></i>
        <Slider v-model="zoomFactor" :min="1" :max="3" :step="0.01" class="zoom-slider" />
        <i class="pi pi-search-plus"></i>
      </div>
    </div>

    <template #footer>
      <Button :label="t('settings.account.cropCancel')" text severity="secondary" @click="handleCancel" />
      <Button :label="t('settings.account.cropConfirm')" @click="handleConfirm" />
    </template>
  </Dialog>
</template>

<style scoped>
.crop-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.crop-viewport {
  position: relative;
  overflow: hidden;
  border-radius: 50%;
  background: #000;
  touch-action: none;
  cursor: grab;
}

.crop-viewport:active {
  cursor: grabbing;
}

.crop-image {
  position: absolute;
  top: 0;
  left: 0;
  max-width: none;
  user-select: none;
  -webkit-user-drag: none;
}

.crop-mask {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  box-shadow: 0 0 0 1000px rgba(0, 0, 0, 0.001);
  border: 2px solid rgba(255, 255, 255, 0.6);
  pointer-events: none;
}

.crop-zoom {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  width: 100%;
}

.zoom-slider {
  flex: 1;
}
</style>
