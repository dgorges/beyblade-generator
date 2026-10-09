<template>
  <dialog ref="dialog" class="b_share-dialog bJS_share-dialog" aria-labelledby="share-title" aria-describedby="share-hint" @close="$emit('close')" @click="onBackdrop">
    <div class="b_share-dialog__inner">
      <header class="b_share-dialog__head">
        <h2 id="share-title" class="b_share-dialog__title"><AppIcon name="share" /> Beyblade teilen</h2>
        <button type="button" class="b_button b_button--plain" aria-label="Dialog schließen" @click="close"><AppIcon name="close-x" /></button>
      </header>

      <figure class="b_share-dialog__preview" aria-live="polite">
        <img v-if="imageUrl" class="b_share-dialog__image" :src="imageUrl" :alt="`Vorschaubild von ${bey.name}`" />
        <span v-else>Bild wird erstellt …</span>
      </figure>

      <div class="b_share-dialog__actions">
        <button v-if="canShareFiles" type="button" class="b_button b_button--primary b_button--wide" :disabled="!image" @click="nativeShare"><AppIcon name="share" /> Teilen …</button>
        <a class="b_button" :href="whatsapp" target="_blank" rel="noopener"><AppIcon name="message-round" /> WhatsApp<span class="b_visually-hidden"> (öffnet in neuem Fenster)</span></a>
        <a class="b_button" :href="mail"><AppIcon name="mail" /> E-Mail</a>
        <button type="button" class="b_button" @click="copyLink"><AppIcon :name="copied ? 'done-v' : 'share'" /> {{ copied ? 'Kopiert' : 'Link kopieren' }}</button>
        <button type="button" class="b_button" :disabled="!image" @click="downloadBlob(image, fileName(bey, 'png'))"><AppIcon name="picture" /> Bild speichern</button>
        <button type="button" class="b_button" @click="downloadBlob(jsonBlob, fileName(bey, 'json'))"><AppIcon name="download" /> Projektdatei</button>
      </div>
      <p class="b_visually-hidden" aria-live="polite">{{ copied ? 'Link in die Zwischenablage kopiert' : '' }}</p>

      <p id="share-hint" class="b_share-dialog__hint">
        <template v-if="canShareFiles">„Teilen …“ schickt Bild und Projektdatei zusammen, z. B. per WhatsApp. </template>
        WhatsApp und E-Mail senden einen Link, mit dem sich dein Beyblade direkt öffnen lässt. Das Bild kannst du mit „Bild speichern“ zusätzlich anhängen.
      </p>
    </div>
  </dialog>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import AppIcon from './AppIcon.vue'
import { shareUrl, shareText, whatsappUrl, mailUrl, fileName, downloadBlob } from '../utils/share.js'

const props = defineProps({
  bey: { type: Object, required: true },
  image: { type: Blob, default: null }
})
defineEmits(['close'])

const dialog = ref(null)

onMounted(() => dialog.value?.showModal())

function close() {
  dialog.value?.close()
}

function onBackdrop(event) {
  if (event.target === dialog.value) close()
}

const copied = ref(false)
const url = computed(() => shareUrl(props.bey))
const whatsapp = computed(() => whatsappUrl(props.bey, url.value))
const mail = computed(() => mailUrl(props.bey, url.value))
const jsonBlob = computed(() => {
  const { activeStep, ...data } = props.bey
  return new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
})

const imageUrl = ref('')
watch(() => props.image, (blob, _, onCleanup) => {
  if (!blob) return
  imageUrl.value = URL.createObjectURL(blob)
  onCleanup(() => URL.revokeObjectURL(imageUrl.value))
}, { immediate: true })
onBeforeUnmount(() => { if (imageUrl.value) URL.revokeObjectURL(imageUrl.value) })

const canShareFiles = computed(() => {
  try {
    const probe = new File(['x'], 'x.png', { type: 'image/png' })
    return !!navigator.canShare?.({ files: [probe] })
  } catch {
    return false
  }
})

async function nativeShare() {
  const files = [
    new File([props.image], fileName(props.bey, 'png'), { type: 'image/png' }),
    new File([jsonBlob.value], fileName(props.bey, 'json'), { type: 'application/json' })
  ]
  const data = { title: props.bey.name, text: shareText(props.bey, url.value), files }
  try {
    await navigator.share(navigator.canShare(data) ? data : { title: data.title, text: data.text, files: files.slice(0, 1) })
  } catch {}
}

async function copyLink() {
  try {
    await navigator.clipboard.writeText(url.value)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch {}
}
</script>
