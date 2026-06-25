<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import axios from 'axios'
import { io } from 'socket.io-client'

const backendPort = import.meta.env.VITE_BACKEND_PORT || '3000'
const API_BASE = `http://localhost:${backendPort}/api/v1/tickets`
const socket = io(`http://localhost:${backendPort}`)

const counter = ref(0)
const maxSlots = ref(1000)
const sessionToken = ref(null)
const expiresIn = ref(0)
const userId = ref('user_' + Math.floor(Math.random() * 1000000))
const statusMessage = ref('')
const isSuccess = ref(false)
const isLoading = ref(false)

let pollInterval = null
let countdownInterval = null

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

const requestSlot = async () => {
  isLoading.value = true
  statusMessage.value = ''
  isSuccess.value = false
  try {
    const res = await axios.post(`${API_BASE}/request-slot`, { userId: userId.value })
    if (res.data && res.data.success) {
      sessionToken.value = res.data.data.sessionToken
      expiresIn.value = res.data.data.expiresInSeconds
      statusMessage.value = res.data.message
      isSuccess.value = true
      startCountdown()
      fetchCounter()
    }
  } catch (err) {
    if (err.response && err.response.status === 429) {
      statusMessage.value = err.response.data.message
    } else {
      statusMessage.value = 'A server error occurred while processing your request.'
    }
  } finally {
    isLoading.value = false
  }
}

const releaseSlot = async () => {
  isLoading.value = true
  try {
    await axios.post(`${API_BASE}/release-slot`, { userId: userId.value })
    sessionToken.value = null
    expiresIn.value = 0
    clearInterval(countdownInterval)
    statusMessage.value = 'Checkout completed successfully. Slot released.'
    isSuccess.value = true
    userId.value = 'user_' + Math.floor(Math.random() * 1000000) 
    fetchCounter()
  } catch (err) {
    statusMessage.value = 'Failed to release slot.'
    isSuccess.value = false
  } finally {
    isLoading.value = false
  }
}

const startCountdown = () => {
  clearInterval(countdownInterval)
  countdownInterval = setInterval(() => {
    if (expiresIn.value > 0) {
      expiresIn.value--
    } else {
      clearInterval(countdownInterval)
      sessionToken.value = null
      statusMessage.value = 'Time expired. Your session has ended.'
      isSuccess.value = false
    }
  }, 1000)
}

onMounted(() => {
  socket.on('counterUpdate', (data) => {
    counter.value = data.currentCounter
    maxSlots.value = data.maxSlots
  })
})

onUnmounted(() => {
  socket.disconnect()
  clearInterval(countdownInterval)
})
</script>

<template>
  <div class="flex flex-col items-center justify-center min-h-screen px-4 font-sans tracking-wide">
    <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/40 via-[#0b0f19] to-[#0b0f19] -z-10"></div>
    
    <div class="w-full max-w-lg">
      <div class="mb-10 text-center">
        <h1 class="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
          War Ticket System
        </h1>
        <p class="mt-2 text-sm text-gray-400">Dynamic Slot Allocation Protocol</p>
      </div>
      
      <div class="relative overflow-hidden bg-white/5 backdrop-blur-xl border border-white/10 p-10 rounded-3xl shadow-2xl">
        <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
        
        <div class="mb-10 text-center">
          <p class="text-xs font-semibold tracking-widest text-gray-500 uppercase mb-2">Live Availability</p>
          <div class="text-7xl font-black tabular-nums tracking-tighter transition-colors duration-300" :class="{'text-rose-500': counter >= maxSlots, 'text-gray-100': counter < maxSlots}">
            {{ counter }}<span class="text-3xl text-gray-600 font-medium">/{{ maxSlots }}</span>
          </div>
        </div>

        <div v-if="!sessionToken" class="mt-8">
          <button 
            @click="requestSlot" 
            :disabled="isLoading"
            class="w-full group relative flex items-center justify-center px-8 py-4 font-bold text-white transition-all duration-200 bg-indigo-600 rounded-xl hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0b0f19] focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span class="absolute inset-0 w-full h-full -mt-1 rounded-lg opacity-30 bg-gradient-to-b from-transparent via-transparent to-black"></span>
            <span class="relative">{{ isLoading ? 'Processing...' : 'Secure Slot' }}</span>
          </button>
        </div>

        <div v-else class="mt-8 space-y-6">
          <div class="p-6 border border-indigo-500/30 bg-indigo-500/10 rounded-2xl">
            <h3 class="text-lg font-medium text-indigo-300">Slot Secured</h3>
            <p class="mt-1 text-sm text-gray-400">Complete your transaction within the allotted time.</p>
            <div class="mt-6 text-center">
              <p class="text-5xl font-mono font-light text-white tracking-widest drop-shadow-lg">
                {{ Math.floor(expiresIn / 60) }}:{{ (expiresIn % 60).toString().padStart(2, '0') }}
              </p>
            </div>
          </div>
          
          <button 
            @click="releaseSlot" 
            :disabled="isLoading"
            class="w-full px-8 py-4 font-bold text-gray-900 transition-all duration-200 bg-white rounded-xl hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0b0f19] focus:ring-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Complete Checkout
          </button>
        </div>

        <div v-if="statusMessage" class="mt-6">
          <div 
            class="px-4 py-3 text-sm rounded-xl border backdrop-blur-md"
            :class="isSuccess ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'"
          >
            {{ statusMessage }}
          </div>
        </div>
      </div>

      <div class="mt-8 text-center">
        <p class="text-xs text-gray-600 font-mono tracking-widest uppercase">Session ID: <span class="text-gray-400">{{ userId }}</span></p>
      </div>
    </div>
  </div>
</template>
