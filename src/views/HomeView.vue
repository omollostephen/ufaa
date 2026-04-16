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
          <a href="#" class="hover:text-blackYou did it!">Home</a>
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
        <h1 class="text-4xl font-bold text-gray-800 mb-6 md:mb-0">Systems</h1>

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
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div
          v-for="system in filteredSystems"
          :key="system.name"
          class="bg-white border rounded-xl p-6 hover:shadow-md transition hover:bg-blue-100 hover:scale-105"
        >
          <a :href="system.url" target="_blank" rel="noopener">
            <img :src="system.logo" class="h-12 mb-4" />

            <h2 class="font-semibold text-lg text-gray-800 mb-2">
              {{ system.name }}
            </h2>

            <p class="text-gray-500 text-sm">
              {{ system.description }}
            </p>
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const search = ref('')

const systems = [
  {
    name: 'Enterprice Resource Planning (ERP)',
    logo: '/src/assets/icons/erp.png',
    description: 'Promote the production of Kenya’s essential agricultural products.',
    url: 'https://erp.ufaa.go.ke/bc/SignIn?ReturnUrl=%2Fbc%2F',
  },
  {
    name: 'Cooporate mail',
    logo: '/src/assets/icons/ufaa.jfif',
    description: 'Provide sustainable financing through participative programs.',
    url: 'outlook://',
  },
  {
    name: 'Printers (MyQ)',
    logo: '/src/assets/icons/myq.png',
    description: "Information services supporting Kenya's agricultural sector.",
    url: 'http://192.168.40.192:8080/en/',
  },
  {
    name: 'Helpdesk Application',
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
    name: 'Kaspersky Security Center',
    logo: '/src/assets/icons/kaspersky.png',
    description: 'Higher education institution supporting academic excellence.',
    url: 'https://192.168.40.22:8081/login?locale=en',
  },
  {
    name: 'Search Portal',
    logo: '/src/assets/icons/ufaa.jfif',
    description: 'Higher education institution supporting academic excellence.',
    url: 'https://omollo.com/',
  },
]

// LIVE FILTERING
const filteredSystems = computed(() => {
  return systems.filter((system) => {
    return (
      system.name.toLowerCase().includes(search.value.toLowerCase()) ||
      system.description.toLowerCase().includes(search.value.toLowerCase())
    )
  })
})
</script>
