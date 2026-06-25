<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import axios from 'axios'
import { io } from 'socket.io-client'

const BACKEND_URL = ''
const API_BASE = `${BACKEND_URL}/api/v1/tickets`
const socket = io(BACKEND_URL)

const counter = ref(0)
const maxSlots = ref(1000)
const newMaxSlots = ref(1000)
const botCount = ref(100)
const statusMessage = ref('')
const isBotLoading = ref(false)
const isSimulationRunning = ref(false)
const activeBotsCount = ref(0)

const updateMaxSlots = async () => {
  if (newMaxSlots.value < 1) return
  try {
    await axios.post(`${API_BASE}/max-slots`, { maxSlots: newMaxSlots.value })
    statusMessage.value = `Max slots updated to ${newMaxSlots.value}.`
    setTimeout(() => { statusMessage.value = '' }, 3000)
  } catch (err) {
    statusMessage.value = 'Failed to update max slots.'
  }
}

const startBots = async () => {
  if (botCount.value < 1) return
  isBotLoading.value = true
  try {
    const res = await axios.post(`${API_BASE}/start-bots`, { botCount: botCount.value })
    statusMessage.value = res.data.message
    setTimeout(() => { statusMessage.value = '' }, 5000)
  } catch (err) {
    statusMessage.value = 'Failed to start bots.'
  } finally {
    isBotLoading.value = false
  }
}

const stopBots = async () => {
  isBotLoading.value = true
  try {
    const res = await axios.post(`${API_BASE}/stop-bots`)
    statusMessage.value = res.data.message
    setTimeout(() => { statusMessage.value = '' }, 5000)
  } catch (err) {
    statusMessage.value = 'Failed to stop bots.'
  } finally {
    isBotLoading.value = false
  }
}

const resetPool = async () => {
  if (!confirm('Are you sure you want to forcibly reset the entire slot pool?')) return
  try {
    await axios.post(`${API_BASE}/reset-pool`)
    statusMessage.value = 'Pool successfully reset.'
    setTimeout(() => { statusMessage.value = '' }, 3000)
  } catch (err) {
    statusMessage.value = 'Failed to reset pool.'
  }
}

onMounted(() => {
  socket.on('counterUpdate', (data) => {
    counter.value = data.currentCounter
    maxSlots.value = data.maxSlots
    isSimulationRunning.value = data.isSimulationRunning
    activeBotsCount.value = data.activeBots
    if (newMaxSlots.value === 1000 && data.maxSlots !== 1000) {
      newMaxSlots.value = data.maxSlots
    }
  })
})

onUnmounted(() => {
  socket.disconnect()
})
</script>

<template>
  <div class="max-w-[800px] mx-auto px-6 py-12">
    <!-- Breadcrumb -->
    <div class="flex items-center space-x-2 text-sm text-ink mb-8">
      <router-link to="/" class="hover:underline cursor-pointer">Home</router-link>
      <span class="text-muted">›</span>
      <span class="text-muted">Administration</span>
    </div>

    <div class="mb-10">
      <h1 class="text-[32px] font-semibold tracking-tight text-ink">System Administration</h1>
      <p class="text-muted text-base mt-2">Manage the live slot pool capacity and monitor active sessions.</p>
    </div>

    <!-- Stats Card -->
    <div class="bg-canvas border border-hairline rounded-2xl p-8 mb-8 shadow-sm">
      <div class="flex justify-between items-center pb-8 border-b border-hairline">
        <div>
          <h2 class="text-lg font-semibold text-ink">Live Capacity</h2>
          <p class="text-sm text-muted mt-1">Current active checkouts</p>
        </div>
        <div class="text-right">
          <div class="text-5xl font-bold tracking-tight text-ink">
            {{ counter }}
          </div>
          <div class="text-sm text-muted mt-1 font-medium">of {{ maxSlots }} slots filled</div>
        </div>
      </div>

      <div class="pt-8 flex items-center justify-between border-b border-hairline pb-8">
        <div class="pr-8">
          <h3 class="text-base font-semibold text-ink">Update Max Slots</h3>
          <p class="text-sm text-muted mt-1">Change the maximum allowed concurrent sessions.</p>
        </div>
        <div class="flex items-center space-x-3">
          <input 
            type="number" 
            v-model="newMaxSlots" 
            min="1"
            class="w-24 px-3 py-2 border border-hairline rounded-lg text-ink focus:outline-none focus:ring-2 focus:ring-ink focus:border-transparent"
          />
          <button 
            @click="updateMaxSlots" 
            class="flex-shrink-0 px-6 py-2.5 bg-ink text-white hover:bg-black font-semibold text-sm rounded-lg transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-ink"
          >
            Update
          </button>
        </div>
      </div>

      <!-- Bot Simulation Area -->
      <div class="pt-8 flex items-center justify-between border-b border-hairline pb-8">
        <div class="pr-8">
          <h3 class="text-base font-semibold text-ink">Continuous Bot Simulation</h3>
          <p class="text-sm text-muted mt-1">Simulate concurrent traffic spikes by spawning automated users that loop continuously until stopped.</p>
          <div v-if="isSimulationRunning" class="mt-2 text-sm font-medium text-[#ff385c] flex items-center space-x-2">
            <span class="relative flex h-3 w-3">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ff385c] opacity-75"></span>
              <span class="relative inline-flex rounded-full h-3 w-3 bg-[#ff385c]"></span>
            </span>
            <span>Simulation Running ({{ activeBotsCount }} active bots)</span>
          </div>
        </div>
        <div class="flex items-center space-x-3">
          <input 
            v-if="!isSimulationRunning"
            type="number" 
            v-model="botCount" 
            min="1"
            max="10000"
            class="w-24 px-3 py-2 border border-hairline rounded-lg text-ink focus:outline-none focus:ring-2 focus:ring-ink focus:border-transparent"
          />
          <button 
            v-if="!isSimulationRunning"
            @click="startBots" 
            :disabled="isBotLoading"
            class="flex-shrink-0 px-6 py-2.5 bg-[#ff385c] text-white hover:bg-[#e00b41] font-semibold text-sm rounded-lg transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-[#ff385c] disabled:opacity-50"
          >
            {{ isBotLoading ? 'Starting...' : 'Start Bots' }}
          </button>
          <button 
            v-else
            @click="stopBots" 
            :disabled="isBotLoading"
            class="flex-shrink-0 px-6 py-2.5 bg-ink text-white hover:bg-black font-semibold text-sm rounded-lg transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-ink disabled:opacity-50"
          >
            {{ isBotLoading ? 'Stopping...' : 'Stop Bots' }}
          </button>
        </div>
      </div>

      <!-- Action Area -->
      <div class="pt-8 flex items-center justify-between">
        <div class="pr-8">
          <h3 class="text-base font-semibold text-ink">Force Reset Pool</h3>
          <p class="text-sm text-muted mt-1">Instantly drops all active sessions and resets the counter to 0. Use with caution.</p>
        </div>
        <button 
          @click="resetPool" 
          class="flex-shrink-0 px-6 py-3 bg-canvas border border-ink text-ink hover:bg-surface-soft font-semibold text-sm rounded-lg transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-ink"
        >
          Reset Now
        </button>
      </div>

      <div v-if="statusMessage" class="mt-6 p-4 bg-surface-soft rounded-lg text-sm text-ink font-medium border border-hairline">
        {{ statusMessage }}
      </div>
    </div>
  </div>
</template>
