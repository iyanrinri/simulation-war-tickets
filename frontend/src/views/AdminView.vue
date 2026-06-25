<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import axios from 'axios'
import { io } from 'socket.io-client'

const backendPort = import.meta.env.VITE_BACKEND_PORT || '3000'
const API_BASE = `http://localhost:${backendPort}/api/v1/tickets`
const socket = io(`http://localhost:${backendPort}`)

const counter = ref(0)
const maxSlots = ref(1000)
const statusMessage = ref('')
let pollInterval = null

const fetchCounter = async () => {
  try {
    const res = await axios.get(`${API_BASE}/slot-counter`)
    if (res.data && res.data.success) {
      counter.value = res.data.data.currentCounter
      maxSlots.value = res.data.data.maxSlots
    }
  } catch (err) {
    console.error('Error fetching counter', err)
  }
}

const resetPool = async () => {
  if (!confirm('Are you sure you want to forcibly reset the entire slot pool?')) return
  try {
    await axios.post(`${API_BASE}/reset-pool`)
    statusMessage.value = 'Pool successfully reset.'
    fetchCounter()
  } catch (err) {
    statusMessage.value = 'Failed to reset pool.'
  }
}

onMounted(() => {
  socket.on('counterUpdate', (data) => {
    counter.value = data.currentCounter
    maxSlots.value = data.maxSlots
  })
})

onUnmounted(() => {
  socket.disconnect()
})
</script>

<template>
  <div class="flex flex-col items-center justify-center min-h-screen px-4 font-sans tracking-wide">
    <div class="absolute inset-0 bg-[#0b0f19] -z-10"></div>
    
    <div class="w-full max-w-md">
      <div class="mb-8 text-center">
        <h1 class="text-2xl font-bold tracking-tight text-white">System Administration</h1>
        <p class="mt-2 text-sm text-gray-400">Simulation Control Panel</p>
      </div>
      
      <div class="p-8 bg-white/5 border border-white/10 backdrop-blur-xl rounded-3xl shadow-2xl relative overflow-hidden">
        <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 to-orange-500"></div>

        <div class="mb-8 text-center">
          <p class="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Current Load</p>
          <div class="text-5xl font-black text-white tabular-nums tracking-tighter">
            {{ counter }}<span class="text-2xl text-gray-600 font-medium">/{{ maxSlots }}</span>
          </div>
        </div>

        <button 
          @click="resetPool" 
          class="w-full px-6 py-4 text-sm font-bold text-rose-400 transition-all duration-200 bg-rose-500/10 border border-rose-500/20 rounded-xl hover:bg-rose-500/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0b0f19] focus:ring-rose-500"
        >
          Force Reset Pool
        </button>

        <div v-if="statusMessage" class="mt-6 p-4 text-sm text-center text-rose-300 bg-rose-500/10 rounded-xl border border-rose-500/20 backdrop-blur-md">
          {{ statusMessage }}
        </div>
      </div>
      
      <div class="mt-8 text-center">
        <router-link to="/" class="text-xs font-medium tracking-widest uppercase text-indigo-400 hover:text-indigo-300 transition-colors">
          Return to Interface
        </router-link>
      </div>
    </div>
  </div>
</template>
