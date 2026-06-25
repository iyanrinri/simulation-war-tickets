<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import axios from 'axios'
import { io } from 'socket.io-client'

const BACKEND_URL = ''
const API_BASE = `${BACKEND_URL}/api/v1/tickets`
const socket = io(BACKEND_URL)

const counter = ref(0)
const maxSlots = ref(1000)
const sessionToken = ref(null)
const expiresIn = ref(0)
const userId = ref('user_' + Math.floor(Math.random() * 1000000))
const statusMessage = ref('')
const isSuccess = ref(false)
const isLoading = ref(false)
const logs = ref([])

let countdownInterval = null

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
    if (data.logs) {
      // For Shopee live style, we want newest at the bottom
      logs.value = data.logs.slice(0, 6).reverse()
    }
  })
})

onUnmounted(() => {
  socket.disconnect()
  clearInterval(countdownInterval)
})
</script>

<template>
  <div class="max-w-[1128px] mx-auto px-6 xl:px-10 py-8 lg:py-12 pb-32">
    <!-- Breadcrumb -->
    <div class="flex items-center space-x-2 text-sm text-ink mb-6 mt-2 hidden sm:flex">
      <span class="hover:underline cursor-pointer">Simulations</span>
      <span class="text-muted">›</span>
      <span class="hover:underline cursor-pointer">Event Tickets</span>
      <span class="text-muted">›</span>
      <span class="text-muted">Coldplay Tour 2026</span>
    </div>

    <!-- Title Section -->
    <div class="mb-8">
      <h1 class="text-[28px] lg:text-[32px] font-semibold tracking-tight text-ink mb-2">Coldplay World Tour 2026 - Flash Sale Simulation</h1>
      <div class="flex flex-wrap items-center text-sm font-medium">
        <div class="flex items-center space-x-1">
          <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" role="presentation" focusable="false" class="h-4 w-4 fill-current"><path d="M15.094 1.579l-4.124 8.885-9.86 1.27a1 1 0 0 0-.542 1.736l7.293 6.565-1.965 9.852a1 1 0 0 0 1.483 1.061L16 25.951l8.625 4.997a1 1 0 0 0 1.482-1.06l-1.965-9.853 7.293-6.565a1 1 0 0 0-.541-1.735l-9.86-1.271-4.127-8.885a1 1 0 0 0-1.814 0z" fill-rule="evenodd"></path></svg>
          <span>4.95</span>
        </div>
        <span class="mx-2 text-muted">·</span>
        <span class="underline font-semibold cursor-pointer">1,402 reviews</span>
        <span class="mx-2 text-muted">·</span>
        <span class="flex items-center space-x-1 text-muted">
          <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" role="presentation" focusable="false" class="h-4 w-4 fill-current"><path d="M8.5 0a8.5 8.5 0 1 1 0 17 8.5 8.5 0 0 1 0-17zM8.5 2C5.46 2 3 4.46 3 7.5c0 1.94 1.5 4.5 4.5 8.03A12.7 12.7 0 0 0 8.5 16c2.8-3.32 5.5-6 5.5-8.5C14 4.46 11.54 2 8.5 2zM8.5 4.5a3 3 0 1 1 0 6 3 3 0 0 1 0-6z" fill-rule="evenodd"></path></svg>
          <span class="underline font-semibold text-ink cursor-pointer">Jakarta, Indonesia</span>
        </span>
      </div>
    </div>

    <!-- Image Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-2 rounded-xl lg:rounded-2xl overflow-hidden mb-12 h-[300px] lg:h-[400px]">
      <div class="h-full bg-surface-strong w-full relative">
        <img src="https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?q=80&w=1674&auto=format" alt="Concert Stage" class="w-full h-full object-cover hover:opacity-90 transition-opacity" />
      </div>
      <div class="hidden md:grid grid-cols-2 grid-rows-2 gap-2 h-full">
        <img src="https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" class="w-full h-full object-cover hover:opacity-90 transition-opacity" />
        <img src="https://images.unsplash.com/photo-1459749411175-04bf5292ceea?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" class="w-full h-full object-cover hover:opacity-90 transition-opacity" />
        <img src="https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" class="w-full h-full object-cover hover:opacity-90 transition-opacity" />
        <img src="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" class="w-full h-full object-cover hover:opacity-90 transition-opacity" />
      </div>
    </div>

    <!-- Main Content Grid -->
    <div class="flex flex-col lg:flex-row gap-12 lg:gap-24 relative">
      <!-- Left Column: Details -->
      <div class="flex-1">
        <div class="flex justify-between items-start pb-6 border-b border-hairline">
          <div>
            <h2 class="text-[22px] font-semibold mb-1">Hosted by The Simulation Team</h2>
            <p class="text-base text-muted">10,000+ past events · Top Rated</p>
          </div>
          <div class="w-14 h-14 bg-surface-strong rounded-full overflow-hidden flex-shrink-0">
            <img src="https://api.dicebear.com/7.x/notionists/svg?seed=Host" class="w-full h-full object-cover" />
          </div>
        </div>

        <div class="py-8 border-b border-hairline space-y-6">
          <div class="flex items-start space-x-4">
            <svg class="w-6 h-6 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
            <div>
              <h3 class="font-semibold text-lg">Strict Slot Pool Enforcement</h3>
              <p class="text-muted text-base mt-1">This event uses Redis atomic Lua scripts to prevent overselling.</p>
            </div>
          </div>
          <div class="flex items-start space-x-4">
            <svg class="w-6 h-6 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            <div>
              <h3 class="font-semibold text-lg">Real-time Dashboard</h3>
              <p class="text-muted text-base mt-1">Capacities are broadcasted instantly via WebSockets.</p>
            </div>
          </div>
          <div class="flex items-start space-x-4">
            <svg class="w-6 h-6 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <div>
              <h3 class="font-semibold text-lg">Automated TTL Expiry</h3>
              <p class="text-muted text-base mt-1">Inactive checkout sessions automatically return slots to the pool.</p>
            </div>
          </div>
        </div>

        <div class="py-8">
          <h2 class="text-[22px] font-semibold mb-4">About this simulation</h2>
          <p class="text-base text-ink leading-relaxed font-light">
            You are participating in a highly concurrent ticket flash sale simulation. The system strictly limits the maximum concurrent users who can enter the checkout phase. Only those who successfully grab a slot can proceed to payment. If you do not checkout within the allotted time, your slot is released back into the pool.
          </p>
        </div>
      </div>

      <!-- Right Column: Reservation Card (Sticky) -->
      <div class="w-full lg:w-[360px] xl:w-[400px] relative">
        <div class="sticky top-28 bg-canvas border border-hairline rounded-2xl shadow-float p-6">
          <!-- Price and Counter -->
          <div class="flex justify-between items-end mb-6">
            <div>
              <span class="text-[22px] font-semibold text-ink">Free</span>
              <span class="text-base text-ink font-light"> / simulation</span>
            </div>
            <div class="text-right">
              <div class="text-xs font-semibold uppercase tracking-wider text-muted mb-1">Live Slots</div>
              <div class="text-2xl font-bold tracking-tight" :class="{'text-primary': counter >= maxSlots, 'text-ink': counter < maxSlots}">
                {{ counter }}<span class="text-lg text-muted font-normal"> / {{ maxSlots }}</span>
              </div>
            </div>
          </div>

          <!-- Checkout State -->
          <div v-if="!sessionToken">
            <button 
              @click="requestSlot" 
              :disabled="isLoading"
              class="w-full bg-primary hover:bg-primary-active text-white text-base font-semibold py-[14px] rounded-lg transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed mb-4 flex justify-center items-center h-[52px]"
            >
              <span v-if="isLoading" class="flex items-center">
                <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Reserving...
              </span>
              <span v-else>Reserve Slot</span>
            </button>
            <p class="text-center text-sm text-muted">You won't be charged yet</p>
          </div>

          <div v-else class="space-y-4">
            <div class="border border-hairline rounded-lg p-4 bg-surface-soft">
              <div class="flex justify-between items-center mb-2">
                <span class="text-sm font-semibold">Slot Secured</span>
                <span class="text-sm font-semibold px-2 py-1 bg-white border border-hairline rounded-md shadow-sm">
                  {{ Math.floor(expiresIn / 60) }}:{{ (expiresIn % 60).toString().padStart(2, '0') }}
                </span>
              </div>
              <p class="text-xs text-muted">Complete checkout before the timer expires.</p>
            </div>
            
            <button 
              @click="releaseSlot" 
              :disabled="isLoading"
              class="w-full bg-ink hover:bg-black text-white text-base font-semibold py-[14px] rounded-lg transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-ink disabled:opacity-50 disabled:cursor-not-allowed h-[52px]"
            >
              Confirm Checkout
            </button>
          </div>

          <!-- Status Message -->
          <div v-if="statusMessage" class="mt-4 p-3 rounded-lg text-sm border" :class="isSuccess ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-primary-error'">
            {{ statusMessage }}
          </div>

          <!-- Footer of card -->
          <div class="mt-6 pt-4 border-t border-hairline flex justify-between text-sm">
            <span class="text-ink underline cursor-pointer font-medium">Session ID</span>
            <span class="text-muted font-mono text-xs">{{ userId }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Live Activity Logs (Shopee Live Style) -->
    <div class="fixed bottom-8 left-4 sm:left-8 w-64 sm:w-80 pointer-events-none flex flex-col justify-end space-y-2.5 z-50 overflow-hidden" style="max-height: 40vh;">
      <transition-group 
        enter-active-class="transition-all duration-300 ease-out"
        enter-from-class="opacity-0 translate-y-4"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition-all duration-300 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0 -translate-y-4"
      >
        <div v-for="log in logs" :key="log" class="bg-black/75 backdrop-blur-md text-white px-3 py-2.5 rounded-2xl text-xs font-medium flex items-start space-x-2 shadow-lg border border-white/20">
          <!-- Icons based on event type -->
          <svg v-if="log.includes('reserved')" class="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <svg v-else-if="log.includes('released')" class="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
          <svg v-else-if="log.includes('abandoned')" class="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <svg v-else class="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          
          <div class="flex-1 break-words leading-snug">{{ log }}</div>
        </div>
      </transition-group>
    </div>
  </div>
</template>
