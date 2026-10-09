<template>
  <div class="share-backdrop" @click.self="$emit('close')">
    <section class="share-dialog" role="dialog" aria-modal="true" aria-labelledby="share-title">
      <header class="share-head">
        <h2 id="share-title"><AppIcon name="share" /> Beyblade teilen</h2>
        <button type="button" class="icon-button" aria-label="Schließen" @click="$emit('close')"><AppIcon name="close-x" /></button>
      </header>

      <div class="share-preview">
        <img v-if="imageUrl" :src="imageUrl" :alt="`Vorschau von ${bey.name}`" />
        <span v-else>Bild wird erstellt …</span>
      </div>

      <div class="share-actions">
        <button v-if="canShareFiles" type="button" class="primary share-native" :disabled="!image" @click="nativeShare"><AppIcon name="share" /> Teilen …</button>
        <a class="secondary" :href="whatsapp" target="_blank" rel="noopener"><AppIcon name="message-round" /> WhatsApp</a>
        <a class="secondary" :href="mail"><AppIcon name="mail" /> E-Mail</a>
        <button type="button" class="secondary" @click="copyLink"><AppIcon :name="copied ? 'done-v' : 'share'" /> {{ copied ? 'Kopiert' : 'Link kopieren' }}</button>
        <button type="button" class="secondary" :disabled="!image" @click="downloadBlob(image, fileName(bey, 'png'))"><AppIcon name="picture" /> Bild speichern</button>
        <button type="button" class="secondary" @click="downloadBlob(jsonBlob, fileName(bey, 'json'))"><AppIcon name="download" /> Projektdatei</button>
      </div>

      <p class="share-hint">
        <template v-if="canShareFiles">„Teilen …“ schickt Bild und Projektdatei zusammen, z. B. per WhatsApp. </template>
        WhatsApp und E-Mail senden einen Link, mit dem sich dein Beyblade direkt öffnen lässt. Das Bild kannst du mit „Bild speichern“ zusätzlich anhängen.
      </p>
    </section>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import AppIcon from './AppIcon.vue'
import { shareUrl, shareText, whatsappUrl, mailUrl, fileName, downloadBlob } from '../utils/share.js'

const props = defineProps({
  bey: { type: Object, required: true },
  image: { type: Blob, default: null }
})
defineEmits(['close'])

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
