<template>
  <div class="w-full max-w-screen-2xl mx-auto px-6 py-10">
    <!-- HEADER -->
    <header class="bg-white shadow-sm">
      <div class="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <!-- Logo -->
        <div class="flex items-center gap-3">
          <img src="/src/assets/icons/ufaa.jfif" class="h-10" />
          <span class="text-2xl font-semibold text-gray-800">UFAA</span>
        </div>

        <!-- Navigation -->
        <nav class="hidden md:flex gap-8 text-gray-600 font-medium">
          <router-link to="/" class="hover:text-black">Home</router-link>
          <router-link to="/admin" class="hover:text-black">Manage Systems</router-link>
          <a href="#" class="hover:text-black">Help & Support</a>
        </nav>

        <!-- Right side -->
        <div class="flex items-center gap-4">
          <button class="text-gray-600">Sign in</button>
          <button class="bg-green-600 text-white px-5 py-2 rounded-full">Register</button>
        </div>
      </div>
    </header>

    <!-- PAGE CONTENT -->
    <div class="max-w-7xl mx-auto px-6 py-10">
      <!-- Title + Search -->
      <div class="flex flex-col md:flex-row md:items-center md:justify-between mb-10">
        <h1 class="text-4xl font-bold text-gray-800 mb-6 md:mb-0">MIS Monitoring Dashboard</h1>

        <div class="relative w-full md:w-96">
          <input
            v-model="search"
            type="text"
            placeholder="Search System..."
            class="w-full border rounded-full px-5 py-3 focus:outline-none focus:ring focus:ring-gray-200"
          />
          <span class="absolute right-4 top-3 text-gray-400"> 🔍 </span>
        </div>
      </div>
      <!-- AGENCY GRID -->

      <div v-if="filteredSystems.length === 0" class="text-center text-gray-500">
        No systems found.
      </div>

      <!-- Upcoming refresh warning -->
      <div v-if="showWarning" class="fixed top-6 right-6 z-50">
        <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4 shadow-lg rounded-md">
          <div class="flex items-center gap-3">
            <div class="text-sm text-yellow-800">
              Refreshing in <strong>{{ remainingSeconds }}</strong> seconds
            </div>
            <button @click="refreshNow" class="ml-2 bg-yellow-600 text-white px-3 py-1 rounded">
              Refresh now
            </button>
            <button @click="dismissWarning" class="ml-2 text-sm text-gray-600">Dismiss</button>
          </div>
        </div>
      </div>

      <div
        v-if="filteredSystems.length !== 0"
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <div
          v-for="system in filteredSystems"
          :key="system.name"
          class="bg-white border rounded-xl p-6 hover:shadow-lg transition-transform transform hover:-translate-y-1"
        >
          <div class="flex flex-col h-full">
            <div class="flex items-start gap-4 mb-4">
              <div class="flex-shrink-0">
                <img :src="system.logo" class="h-14 w-14 object-contain rounded-md border" />
              </div>

              <div class="flex-1">
                <div class="flex items-start justify-between gap-3">
                  <h2
                    class="font-semibold text-xl text-gray-900 leading-tight flex-1 pr-3 break-words"
                  >
                    {{ system.name }}
                  </h2>
                  <span
                    :class="
                      statusBadgeClass(system) + ' text-sm px-2 py-1 rounded-full flex-shrink-0'
                    "
                    >{{ statusText(system) }}</span
                  >
                </div>
              </div>
            </div>
            <div class="flex-1 pb-5">
              <p class="text-sm text-gray-500 mt-2">{{ system.description }}</p>
            </div>
            <div class="mt-auto pt-4 border-t flex items-center justify-between">
              <a
                href="#"
                @click.prevent.stop="openUrl(system)"
                class="text-sm text-blue-600 hover:underline"
                >Open</a
              >

              <button
                @click.stop="openModal(system)"
                type="button"
                class="bg-blue-600 hover:bg-blue-700 hover:cursor-pointer text-white px-4 py-2 rounded-md shadow-sm"
              >
                Status
              </button>
            </div>
          </div>
        </div>
      </div>

      <SystemStatusModal v-if="selectedSystem" :system="selectedSystem" @close="closeModal" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
const API_BASE = import.meta.env.VITE_API_BASE || ''
import SystemStatusModal from '../components/SystemStatusModal.vue'
import { checkSystemStatus } from '../services/statusService'

const search = ref('')

const modalVisible = ref(false)
const selectedSystem = ref(null)
const systems = ref([
  {
    name: 'ERP',
    logo: '/src/assets/icons/erp.png',
    description: 'Promote the production of Kenya’s essential agricultural products.',
    url: 'https://erp.ufaa.go.ke/bc/SignIn?ReturnUrl=%2Fbc%2F',
  },
  {
    name: 'Mail',
    logo: '/src/assets/icons/ufaa.jfif',
    description: 'Provide sustainable financing through participative programs.',
    url: 'outlook://',
  },
  {
    name: 'Printers',
    logo: '/src/assets/icons/myq.png',
    description: "Information services supporting Kenya's agricultural sector.",
    url: 'http://192.168.40.192:8080/en/',
  },
  {
    name: 'Helpdesk',
    logo: '/src/assets/icons/helpDesk.png',
    description: 'Develop and promote scheduled crops in Kenya.',
    url: 'https://service.ufaa.go.ke/',
  },
  {
    name: 'Sharepoint',
    logo: '/src/assets/icons/sharepoint.png',
    description: 'Protect consumers and businesses from counterfeit goods.',
    url: 'https://ufaakenya.sharepoint.com/',
  },
  {
    name: 'Kaspersky',
    logo: '/src/assets/icons/kaspersky.png',
    description: 'Higher education institution supporting academic excellence.',
    url: 'https://192.168.40.22:8081/login?locale=en',
  },
  {
    name: 'Search Portal',
    logo: '/src/assets/icons/ufaa.jfif',
    description: 'Higher education institution supporting academic excellence.',
    url: 'https://search.ufaa.go.ke/site/login',
  },
  {
    name: 'Notice Board',
    logo: '/src/assets/icons/ufaa.jfif',
    description: 'Higher education institution supporting academic excellence.',
    url: '',
  },
  {
    name: 'Fleet',
    logo: '/src/assets/icons/ufaa.jfif',
    description: 'Higher education institution supporting academic excellence.',
    url: '',
  },
  {
    name: 'Registry System',
    logo: '/src/assets/icons/ufaa.jfif',
    description: 'Higher education institution supporting academic excellence.',
    url: '',
  },
  {
    name: 'LMS',
    logo: '/src/assets/icons/ufaa.jfif',
    description: 'Higher education institution supporting academic excellence.',
    url: '',
  },
  {
    name: 'DataLake',
    logo: '/src/assets/icons/ufaa.jfif',
    description: 'Higher education institution supporting academic excellence.',
    url: 'https://datalake.ufaa.go.ke/Identity/Account/Login/',
  },
  {
    name: 'Website',
    logo: '/src/assets/icons/ufaa.jfif',
    description: 'Higher education institution supporting academic excellence.',
    url: 'https://www.ufaa.go.ke/',
  },
  {
    name: 'Client Portal',
    logo: '/src/assets/icons/ufaa.jfif',
    description: 'Higher education institution supporting academic excellence.',
    url: 'https://reunify.ufaa.go.ke/site/login',
  },
  {
    name: 'WhatsApp',
    logo: '/src/assets/icons/ufaa.jfif',
    description: 'WhatsApp messaging gateway for claims search and claiming.',
    // url: 'https://web.whatsapp.com/send/?phone=2540140100100&text&type=phone_number&app_absent=0',
    url: 'https://wa.me/2540140100100',
  },
  {
    name: 'USSD',
    logo: '/src/assets/icons/ufaa.jfif',
    description: 'USSD service for quick user interactions (*361#).',
    url: '',
  },
])

// LIVE FILTERING
const filteredSystems = computed(() => {
  return systems.value.filter((system) => {
    return (
      system.name.toLowerCase().includes(search.value.toLowerCase()) ||
      system.description.toLowerCase().includes(search.value.toLowerCase())
    )
  })
})

function statusText(system) {
  if (!system || !system.status) return 'Unknown'
  if (system.status.checking) return 'Checking'
  if (system.status.up === true) return 'Up'
  if (system.status.up === false) return 'Down'
  return 'Unknown'
}

function statusBadgeClass(system) {
  if (!system || !system.status) return 'bg-gray-400 text-white'
  if (system.status.checking) return 'bg-gray-400 text-white'
  if (system.status.up === true) return 'bg-green-600 text-white'
  if (system.status.up === false) return 'bg-red-600 text-white'
  return 'bg-gray-400 text-white'
}

async function checkAllStatuses() {
  const concurrency = 4
  let idx = 0

  async function worker() {
    while (true) {
      const i = idx++
      if (i >= systems.value.length) return
      const s = systems.value[i]
      systems.value[i] = { ...s, status: { checking: true } }
      try {
        const res = await checkSystemStatus(s)
        systems.value[i] = { ...s, status: res }
      } catch (e) {
        systems.value[i] = { ...s, status: { up: false, details: 'Check failed' } }
      }
    }
  }

  const workers = []
  for (let i = 0; i < concurrency; i++) workers.push(worker())
  await Promise.all(workers)
}

onMounted(() => {
  checkAllStatuses()
  startAutoRefresh()
  // merge persisted systems saved via admin server
  ;(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/systems`)
      if (res.ok) {
        const added = await res.json()
        // prepend added systems (avoid duplicates by name)
        for (const a of added) {
          if (!systems.value.some((s) => s.name === a.name)) systems.value.unshift(a)
        }
        // newly loaded persisted systems need status checks
        // run a status check pass so they show status immediately
        await checkAllStatuses()
      }
    } catch (e) {
      // ignore if server not available
    }
  })()
})

// Auto-refresh timer: refresh every 5 minutes and show a warning when <20s
const refreshIntervalMs = 300 * 1000
const nextRefresh = ref(Date.now() + refreshIntervalMs)
const remainingSeconds = ref(Math.max(0, Math.ceil((nextRefresh.value - Date.now()) / 1000)))
const dismissed = ref(false)

const showWarning = computed(() => {
  return !dismissed.value && remainingSeconds.value > 0 && remainingSeconds.value <= 20
})

let timerId = null
function startAutoRefresh() {
  // ensure we start with current remaining
  remainingSeconds.value = Math.max(0, Math.ceil((nextRefresh.value - Date.now()) / 1000))
  timerId = setInterval(async () => {
    const now = Date.now()
    if (now >= nextRefresh.value) {
      // perform refresh
      await checkAllStatuses()
      // reset timer
      nextRefresh.value = Date.now() + refreshIntervalMs
      remainingSeconds.value = Math.ceil(refreshIntervalMs / 1000)
      dismissed.value = false
    } else {
      remainingSeconds.value = Math.max(0, Math.ceil((nextRefresh.value - now) / 1000))
    }
  }, 1000)
}

onUnmounted(() => {
  if (timerId) clearInterval(timerId)
})

async function refreshNow() {
  dismissed.value = false
  nextRefresh.value = Date.now() + refreshIntervalMs
  remainingSeconds.value = Math.ceil(refreshIntervalMs / 1000)
  await checkAllStatuses()
}

function dismissWarning() {
  dismissed.value = true
}

async function openModal(system) {
  // make modal show current status if already available, otherwise fetch
  selectedSystem.value = { ...system, status: system.status || { checking: true } }
  try {
    const status = await checkSystemStatus(system)
    selectedSystem.value = { ...system, status }
    // also reflect latest status in main list
    const i = systems.value.findIndex((x) => x.name === system.name)
    if (i >= 0) systems.value[i] = { ...systems.value[i], status }
  } catch (err) {
    selectedSystem.value = { ...system, status: { up: false, details: 'Failed to check status' } }
  }
}

function closeModal() {
  selectedSystem.value = null
}

function openUrl(system) {
  if (!system || !system.url) return
  const url = String(system.url).trim()
  // If it's http(s), open in new tab. For custom schemes (outlook:, outlook://, mailto:), navigate the window to trigger OS handler.
  try {
    const m = url.match(/^([a-zA-Z][a-zA-Z0-9+.-]*):/)
    const scheme = m ? m[1].toLowerCase() : null
    if (scheme === 'http' || scheme === 'https') {
      window.open(url, '_blank')
    } else {
      // custom protocol or mailto - use location to trigger app
      window.location.href = url
    }
  } catch (e) {
    // fallback
    window.location.href = url
  }
}
</script>
