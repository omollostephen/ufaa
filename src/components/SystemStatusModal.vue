<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center">
    <div class="absolute inset-0 bg-black opacity-50" @click="close"></div>

    <div class="bg-white rounded-lg shadow-2xl max-w-xl w-full mx-4 z-10 p-6">
      <header class="flex items-center gap-4 mb-4">
        <img :src="system.logo" class="h-12 w-12 object-contain rounded-md border" />
        <div class="flex-1">
          <h3 class="text-lg font-semibold text-gray-900">{{ system.name }}</h3>
          <p class="text-sm text-gray-500">{{ system.description }}</p>
        </div>
        <div class="flex items-center gap-2">
          <button
            @click="refresh"
            class="text-sm px-3 py-1 bg-white border rounded hover:bg-gray-50"
          >
            Refresh
          </button>
          <button
            @click="close"
            class="text-sm px-3 py-1 bg-red-50 text-red-700 border rounded hover:bg-red-100"
          >
            Close
          </button>
        </div>
      </header>

      <section class="space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-xs text-gray-500">URL</div>
            <a
              :href="system.url || '#'"
              target="_blank"
              rel="noopener"
              class="text-blue-600 hover:underline text-sm"
              >{{ system.url || 'Not configured' }}</a
            >
          </div>
          <div class="text-right">
            <div :class="statusBadgeClass + ' inline-block px-3 py-1 rounded-full text-sm'">
              {{ statusText }}
            </div>
            <div class="text-xs text-gray-500 mt-1">{{ status.details }}</div>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-6 text-sm">
          <div>
            <div class="text-xs text-gray-500">Latency</div>
            <div class="text-gray-800">{{ status.latency ?? '—' }}</div>
          </div>
          <div>
            <div class="text-xs text-gray-500">Status Code</div>
            <div class="text-gray-800">{{ status.statusCode ?? '—' }}</div>
          </div>
          <div>
            <div class="text-xs text-gray-500">Checked</div>
            <div class="text-gray-800">{{ status.checkedAt ?? '—' }}</div>
          </div>
          <div>
            <div class="text-xs text-gray-500">Notes</div>
            <div class="text-gray-800">
              {{ status.up === undefined ? '—' : status.up ? 'Responsive' : 'Not responsive' }}
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { checkSystemStatus } from '../services/statusService'

const props = defineProps({
  system: { type: Object, required: true },
})
const emits = defineEmits(['close'])

const status = ref(props.system.status || {})

watch(
  () => props.system,
  (v) => {
    status.value = v.status || {}
  },
)

const statusText = computed(() => {
  if (status.value.checking) return 'Checking...'
  if (status.value.up === true) return 'Up'
  if (status.value.up === false) return 'Down'
  return 'Unknown'
})

const statusBadgeClass = computed(() => {
  if (status.value.checking) return 'bg-gray-400'
  if (status.value.up === true) return 'bg-green-600'
  if (status.value.up === false) return 'bg-red-600'
  return 'bg-gray-400'
})

async function refresh() {
  status.value = { checking: true }
  try {
    const s = await checkSystemStatus(props.system)
    status.value = s
  } catch (err) {
    status.value = { up: false, details: 'Refresh failed' }
  }
}

function close() {
  emits('close')
}
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
