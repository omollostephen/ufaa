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
          <a href="#" class="hover:text-black">Help & Support</a>
        </nav>

        <!-- Right side -->
        <div class="flex items-center gap-4">
          <button class="text-gray-600">Sign in</button>
          <button class="bg-green-600 text-white px-5 py-2 rounded-full">Register</button>
        </div>
      </div>
    </header>
  </div>
  <div class="max-w-4xl mx-auto px-6 py-10">
    <h2 class="text-2xl font-semibold mb-4">Manage Systems</h2>

    <form @submit.prevent="addSystem" class="space-y-3 bg-white p-4 rounded shadow">
      <div class="grid grid-cols-2 gap-3">
        <input v-model="form.name" placeholder="Name" class="border p-2" required />
        <input v-model="form.url" placeholder="URL (optional)" class="border p-2" />
      </div>
      <textarea
        v-model="form.description"
        placeholder="Description"
        class="w-full border p-2"
      ></textarea>
      <div class="flex items-center gap-3">
        <input
          type="text"
          v-model="form.ussdCode"
          placeholder="USSD code (e.g. *361#)"
          class="border p-2"
        />
        <input type="file" @change="onFileChange" accept="image/*" />
      </div>
      <div class="flex gap-2">
        <button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded">
          {{ form.id ? 'Save' : 'Add' }}
        </button>
        <button @click.prevent="resetForm" class="px-4 py-2 border rounded">Reset</button>
        <button v-if="form.id" @click.prevent="cancelEdit" class="px-4 py-2 border rounded">
          Cancel
        </button>
      </div>
    </form>

    <div class="mt-6">
      <h3 class="text-lg font-medium mb-2">Added Systems</h3>
      <div v-if="systems.length === 0" class="text-gray-500">No added systems</div>
      <ul class="space-y-3">
        <li
          v-for="s in systems"
          :key="s.id"
          class="flex items-center gap-3 bg-white p-3 rounded shadow"
        >
          <img
            :src="s.logo || '/src/assets/icons/ufaa.jfif'"
            class="h-12 w-12 object-contain rounded"
          />
          <div class="flex-1">
            <div class="font-semibold">{{ s.name }}</div>
            <div class="text-sm text-gray-500">{{ s.description }}</div>
          </div>
          <div class="flex gap-2">
            <button @click="edit(s)" class="px-3 py-1 border rounded">Edit</button>
            <button @click="remove(s)" class="px-3 py-1 bg-red-600 text-white rounded">
              Delete
            </button>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
const API_BASE = import.meta.env.VITE_API_BASE || ''

const systems = ref([])
const form = ref({ id: '', name: '', url: '', description: '', ussdCode: '', logo: '' })
let selectedFile = null

async function load() {
  try {
    const res = await fetch(`${API_BASE}/api/systems`)
    if (res.ok) {
      const ct = res.headers.get('content-type') || ''
      if (ct.includes('application/json')) {
        systems.value = await res.json()
      } else {
        // non-json response (likely index.html) — ignore
        console.warn('/api/systems returned non-json content')
      }
    }
  } catch (e) {
    console.error(e)
  }
}

function onFileChange(e) {
  const f = e.target.files && e.target.files[0]
  if (f) selectedFile = f
}

async function uploadImage() {
  if (!selectedFile) return ''
  const fd = new FormData()
  fd.append('image', selectedFile)
  const res = await fetch(`${API_BASE}/api/upload-image`, { method: 'POST', body: fd })
  if (!res.ok) throw new Error('upload failed')
  const j = await res.json()
  return j.path
}

async function addSystem() {
  try {
    let logo = form.value.logo
    if (selectedFile) {
      logo = await uploadImage()
      selectedFile = null
    }
    const payload = {
      name: form.value.name,
      url: form.value.url,
      description: form.value.description,
      logo,
      ussdCode: form.value.ussdCode,
    }
    if (form.value.id) {
      const res = await fetch(`${API_BASE}/api/systems/${form.value.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('update failed')
      const j = await res.json()
      const idx = systems.value.findIndex((x) => x.id === j.id)
      if (idx >= 0) systems.value[idx] = j
      else systems.value.push(j)
      resetForm()
    } else {
      const res = await fetch(`${API_BASE}/api/systems`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('create failed')
      const j = await res.json()
      systems.value.push(j)
      resetForm()
    }
  } catch (e) {
    alert(e.message || e)
  }
}

function resetForm() {
  form.value = { id: '', name: '', url: '', description: '', ussdCode: '', logo: '' }
  selectedFile = null
}

function edit(s) {
  form.value = {
    id: s.id,
    name: s.name || '',
    url: s.url || '',
    description: s.description || '',
    ussdCode: s.ussdCode || '',
    logo: s.logo || '',
  }
}

function cancelEdit() {
  resetForm()
}

async function remove(s) {
  if (!confirm('Delete system: ' + s.name + '?')) return
  const res = await fetch(`${API_BASE}/api/systems/${s.id}`, { method: 'DELETE' })
  if (res.ok) {
    systems.value = systems.value.filter((x) => x.id !== s.id)
  }
}

onMounted(load)
</script>

<style scoped>
/* minimal styles - uses existing utility classes */
</style>
