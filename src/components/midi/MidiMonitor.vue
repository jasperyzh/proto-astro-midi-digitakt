<template>
  <div class="digitakt-panel">
    <h2 class="text-lg font-semibold mb-4">MIDI Monitor</h2>
    
    <div class="flex justify-between mb-2">
      <div>
        <span 
          class="inline-block w-3 h-3 rounded-full mr-1 bg-green-500"
          :class="{ 'animate-pulse': hasRecentActivity }"
        ></span>
        <span class="text-sm">Activity</span>
      </div>
      
      <div class="flex space-x-2">
        <button @click="resetLatencyStats" class="digitakt-button text-sm">
          Reset Stats
        </button>
        <button @click="clearLog" class="digitakt-button text-sm">
          Clear Log
        </button>
        <button @click="addTestMessage" class="digitakt-button text-sm bg-blue-500">
          Test
        </button>
        <button @click="testMidiAButton" class="digitakt-button text-sm bg-green-500">
          Test MIDI A
        </button>
        <button @click="toggleDebug" class="digitakt-button text-sm" :class="{ 'bg-red-500': showRawDebug }">
          Debug
        </button>
      </div>
    </div>
    
    <!-- MIDI Monitor Tabs -->
    <div class="mb-4">
      <div class="flex border-b border-digitakt-secondary">
        <button 
          v-for="tab in tabs" 
          :key="tab.id"
          @click="activeTab = tab.id"
          class="py-2 px-4 text-sm"
          :class="{ 
            'border-b-2 border-digitakt-accent font-medium': activeTab === tab.id,
            'text-digitakt-muted': activeTab !== tab.id 
          }"
        >
          {{ tab.label }}
          <span 
            v-if="tab.id === 'messages' && messageLog.length > 0"
            class="ml-1 bg-digitakt-accent text-xs text-black rounded-full px-1.5 py-0.5"
          >
            {{ messageLog.length }}
          </span>
          <span 
            v-if="tab.id === 'errors' && debugState.errors.length > 0"
            class="ml-1 bg-red-500 text-xs text-black rounded-full px-1.5 py-0.5"
          >
            {{ debugState.errors.length }}
          </span>
        </button>
      </div>
    </div>
    
    <!-- Message Log Tab -->
    <div v-if="activeTab === 'messages'" class="bg-digitakt-primary border border-digitakt-secondary rounded h-60 overflow-y-auto p-2 font-mono text-sm">
      <div 
        v-for="(entry, index) in messageLog" 
        :key="index"
        class="mb-1 border-b border-digitakt-secondary pb-1 flex flex-col"
      >
        <div class="flex justify-between mb-1">
          <div :class="getMessageTypeClass(entry.type)" class="font-semibold">
            {{ getMessageTypeLabel(entry) }}
          </div>
          <div class="text-digitakt-muted text-xs ml-2">
            {{ formatTime(entry.timestamp) }}
          </div>
        </div>
        
        <div class="flex flex-col">
          <!-- Note Message -->
          <div v-if="entry.details && ['Note On', 'Note Off'].includes(entry.details.messageType)" class="flex items-center text-sm">
            <span class="mr-2">Ch: {{ entry.channel }}</span>
            <span class="mr-2">{{ entry.details.note || 'Unknown' }} ({{ entry.details.noteNumber }})</span>
            <span v-if="entry.details.velocity !== undefined">Vel: {{ entry.details.velocity }}</span>
          </div>
          
          <!-- CC Message -->
          <div v-else-if="entry.details && entry.details.messageType === 'Control Change'" class="flex items-center text-sm">
            <span class="mr-2">Ch: {{ entry.channel }}</span>
            <span class="mr-2">CC: {{ entry.details.controller }}</span>
            <span>Value: {{ entry.details.value }}</span>
          </div>
          
          <!-- System or Other Messages -->
          <div v-else-if="entry.message" class="text-sm">
            {{ entry.message }}
          </div>
          
          <div v-else class="text-sm">
            {{ formatRawData(entry) }}
          </div>
          
          <!-- Raw Data Display -->
          <div v-if="entry.rawData" class="text-digitakt-muted text-xs mt-1">
            {{ formatMidiData(entry.rawData) }}
          </div>
          
          <!-- Debug raw entry data (hidden by default) -->
          <pre v-if="showRawDebug" class="text-xs text-gray-400 mt-1 bg-black/20 p-1 rounded overflow-x-auto">
            {{ JSON.stringify(entry, null, 2) }}
          </pre>
        </div>
      </div>
      
      <div v-if="messageLog.length === 0" class="text-digitakt-muted italic text-center mt-20">
        No MIDI messages recorded
      </div>
    </div>
    
    <!-- Statistics Tab -->
    <div v-if="activeTab === 'stats'" class="bg-digitakt-primary border border-digitakt-secondary rounded h-60 overflow-y-auto p-3 text-sm">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <h3 class="font-medium mb-2">Message Stats</h3>
          <div class="space-y-1">
            <div class="flex justify-between">
              <span>Total Messages:</span>
              <span class="font-mono">{{ debugState.statistics.totalMessages }}</span>
            </div>
            
            <div v-for="(count, type) in debugState.statistics.messagesByType" :key="type" class="flex justify-between">
              <span>{{ type }}:</span>
              <span class="font-mono">{{ count }}</span>
            </div>
          </div>
        </div>
        
        <div>
          <h3 class="font-medium mb-2">Latency</h3>
          <div class="space-y-1">
            <div class="flex justify-between">
              <span>Average:</span>
              <span class="font-mono">{{ formatLatency(debugState.latency.averageLatency) }}</span>
            </div>
            <div v-if="debugState.latency.measurements.length > 0" class="mt-2">
              <div class="w-full h-16 bg-digitakt-secondary rounded overflow-hidden relative">
                <div class="absolute inset-0 flex items-end">
                  <div 
                    v-for="(value, i) in latencyBars" 
                    :key="i" 
                    class="w-1 bg-digitakt-accent mx-0.5"
                    :style="{ height: `${value}%` }"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="mt-4">
        <h3 class="font-medium mb-2">Channel Activity</h3>
        <div class="grid grid-cols-8 gap-1">
          <div v-for="i in 16" :key="i" class="text-center">
            <div 
              class="w-6 h-6 rounded-full mx-auto flex items-center justify-center text-xs"
              :class="getChannelActivityClass(i)"
            >
              {{ i }}
            </div>
            <div class="text-xs mt-1">{{ debugState.statistics.messagesByChannel[i] || 0 }}</div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Errors Tab -->
    <div v-if="activeTab === 'errors'" class="bg-digitakt-primary border border-digitakt-secondary rounded h-60 overflow-y-auto p-2 font-mono text-sm">
      <div 
        v-for="(error, index) in debugState.errors" 
        :key="index"
        class="mb-2 border-b border-digitakt-secondary pb-2 text-red-400"
      >
        <div class="font-bold">{{ formatTime(error.timestamp) }}</div>
        <div>{{ error.message }}</div>
      </div>
      
      <div v-if="debugState.errors.length === 0" class="text-digitakt-muted italic text-center mt-20">
        No errors recorded (that's good!)
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import { useMidiDebugger } from '../../composables/useMidiDebugger';

// Initialize our MIDI debugger
const { 
  messageLog, 
  debugState, 
  logMessage, 
  logError, 
  clearLog, 
  resetLatencyStats,
  formatMidiData
} = useMidiDebugger();

// Debug logging
// console.log("Initial messageLog:", messageLog.value);

// Set up a watcher to log changes
watch(messageLog, (newVal) => {
  console.log("messageLog updated:", newVal);
}, { deep: true });

// Local state
const hasRecentActivity = ref(false);
const activeTab = ref('messages');
const showRawDebug = ref(false);
let activityTimeout = null;

const tabs = [
  { id: 'messages', label: 'Messages' },
  { id: 'stats', label: 'Statistics' },
  { id: 'errors', label: 'Errors' }
];

// Compute bars for latency visualization
const latencyBars = computed(() => {
  if (!debugState.latency.measurements.length) return [];
  
  // Get last 20 measurements maximum
  const data = debugState.latency.measurements.slice(-20);
  const max = Math.max(...data, 50); // At least 50ms for scale
  
  return data.map(v => Math.min(Math.round((v / max) * 100), 100));
});

function getMessageTypeClass(type) {
  switch (type) {
    case 'input': return 'text-blue-400';
    case 'output': return 'text-green-400';
    case 'error': return 'text-red-400';
    case 'system': return 'text-yellow-400';
    default: return 'text-digitakt-muted';
  }
}

function getChannelActivityClass(channel) {
  const count = debugState.statistics.messagesByChannel[channel] || 0;
  if (count === 0) return 'bg-digitakt-secondary text-digitakt-muted';
  if (count < 5) return 'bg-digitakt-secondary text-digitakt-text';
  if (count < 20) return 'bg-digitakt-accent/50 text-digitakt-text';
  return 'bg-digitakt-accent text-black';
}

function formatTime(timestamp) {
  if (!timestamp) return '--:--:--';
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}

function formatLatency(ms) {
  if (ms === null || ms === undefined) return '-- ms';
  return `${Math.round(ms)} ms`;
}

// For activity indicator animation

function setupActivityIndicator() {
  const unwatch = watch(() => messageLog.value.length, (newLength, oldLength) => {
    if (newLength > oldLength) {
      hasRecentActivity.value = true;
      
      // Clear the existing timeout if it exists
      if (activityTimeout) {
        clearTimeout(activityTimeout);
      }
      
      // Set a new timeout to turn off the activity indicator
      activityTimeout = setTimeout(() => {
        hasRecentActivity.value = false;
      }, 500);
    }
  });
  
  return unwatch;
}

onMounted(() => {
  setupActivityIndicator();
});

onUnmounted(() => {
  if (activityTimeout) {
    clearTimeout(activityTimeout);
  }
});

// Helper to get a cleaned message type label
function getMessageTypeLabel(entry) {
  if (entry.type === 'input' && entry.details && entry.details.messageType) {
    return entry.details.messageType;
  }
  
  if (entry.type === 'system' && entry.message && entry.message.startsWith('Connected to')) {
    return 'Connection';
  }
  
  return entry.type.charAt(0).toUpperCase() + entry.type.slice(1);
}

// Helper to format raw data when other info is missing
function formatRawData(entry) {
  if (!entry.rawData || !entry.rawData.length) return 'No data';
  
  const status = entry.rawData[0] & 0xF0;
  const channel = (entry.rawData[0] & 0x0F) + 1;
  
  switch (status) {
    case 0x80:
      return `Note Off (Ch: ${channel})`;
    case 0x90:
      return `Note On (Ch: ${channel})`;
    case 0xB0:
      return `Control Change (Ch: ${channel})`;
    default:
      return `MIDI Message (Status: 0x${status.toString(16)})`;
  }
}

function toggleDebug() {
  showRawDebug.value = !showRawDebug.value;
}

// Function to add a test message to the monitor
function addTestMessage() {
  // Create a test message in the format expected from Digitakt
  // Channel 9 (MIDI channel 10), Note 72 (MIDI A key), Velocity 127
  const testMessage = {
    type: 'input',
    message: 'Test Message - Digitakt MIDI A',
    timestamp: new Date(),
    channel: 10,
    rawData: [0x99, 0x48, 0x7F], // Note ON, MIDI A (72), velocity 127
    details: {
      messageType: 'Note On',
      note: 'Digitakt: MIDI A',
      noteNumber: 72,
      velocity: 127
    }
  };
  
  // Add the test message to the log
  logMessage(testMessage);
  console.warn("📊 [TEST] Added test MIDI A message to log", testMessage);
}

// Test specific MIDI A button
function testMidiAButton() {
  // This creates a simulated MIDI message as if MIDI A was pressed
  // Digitakt MIDI A button is note 72 (A4) on channel 10 (9 zero-indexed)
  const midiAMessage = {
    type: 'input',
    message: 'MIDI A Button Test',
    timestamp: new Date(),
    channel: 10, 
    rawData: [0x99, 72, 127], // Channel 10 Note On, Note 72 (A4/MIDI A), Velocity 127
    details: {
      messageType: 'Note On',
      note: 'Digitakt: MIDI A',
      noteNumber: 72,
      velocity: 127
    }
  };
  
  // Log with distinctive output
  console.warn("🎹 [MIDI A TEST] Simulating MIDI A button press", midiAMessage);
  logMessage(midiAMessage);
}
</script>