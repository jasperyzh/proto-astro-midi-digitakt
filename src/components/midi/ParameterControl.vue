<template>
  <div class="digitakt-panel">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-lg font-semibold">{{ title }}</h2>
      <div class="flex items-center space-x-2">
        <label for="channel-select" class="text-sm">Channel:</label>
        <select 
          id="channel-select" 
          v-model="selectedChannel" 
          class="digitakt-select bg-digitakt-dark border-digitakt-accent text-digitakt-text px-2 py-1 rounded text-sm"
        >
          <option v-for="n in 16" :key="n-1" :value="n-1">{{ n }}</option>
        </select>
      </div>
    </div>
    
    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      <div 
        v-for="param in parameters" 
        :key="param.id" 
        class="flex flex-col items-center"
      >
        <!-- Knob Control -->
        <div v-if="param.type === 'knob'" class="flex flex-col items-center mb-2 w-full">
          <!-- Combined Label -->
          <div class="text-center text-xs mb-1 truncate w-full" :title="param.name"> 
            {{ param.name }} 
            <span v-if="param.cc !== undefined" class="text-gray-400">(CC:{{ param.cc }})</span>
            <span v-else-if="param.nrpn !== undefined" class="text-gray-400">(NRPN:{{ param.nrpn }})</span>
          </div>
          <!-- Knob Visual -->
          <div class="digitakt-knob relative mb-1" @mousedown="startDrag($event, param)" @touchstart="startDrag($event, param)">
            <div 
              class="absolute w-1 h-6 bg-digitakt-text" 
              :style="getKnobRotationStyle(param.value, param.min, param.max)"
            ></div>
          </div>
          <!-- Value Display -->
          <div class="text-center text-sm font-mono">{{ param.value }}</div>
        </div>
        
        <!-- Slider Control -->
        <div v-else-if="param.type === 'slider'" class="w-full flex flex-col items-center mb-2">
          <!-- Combined Label -->
          <div class="text-center text-xs mb-1 truncate w-full" :title="param.name">
            {{ param.name }}
            <span v-if="param.cc !== undefined" class="text-gray-400">(CC:{{ param.cc }})</span>
            <span v-else-if="param.nrpn !== undefined" class="text-gray-400">(NRPN:{{ param.nrpn }})</span>
          </div>
          <!-- Slider Input -->
          <input 
            type="range"
            v-model.number="param.value"
            :min="param.min"
            :max="param.max"
            :step="param.step || 1"
            class="digitakt-slider w-full"
            @input="sendParameterChange(param)"
          />
          <!-- Value/Range Display -->
          <div class="flex justify-between text-xs mt-1 w-full font-mono">
            <span>{{ param.min }}</span>
            <span class="font-bold">{{ param.value }}</span>
            <span>{{ param.max }}</span>
          </div>
        </div>
        
        <!-- Toggle Control -->
        <div v-else-if="param.type === 'toggle'" class="flex flex-col items-center mb-2 w-full">
          <!-- Combined Label -->
          <div class="text-center text-xs mb-1 truncate w-full" :title="param.name">
            {{ param.name }}
            <span v-if="param.cc !== undefined" class="text-gray-400">(CC:{{ param.cc }})</span>
            <span v-else-if="param.nrpn !== undefined" class="text-gray-400">(NRPN:{{ param.nrpn }})</span>
          </div>
          <!-- Toggle Button -->
          <button 
            @click="toggleParameter(param)"
            class="digitakt-button px-3 py-1" 
            :class="{ 'bg-digitakt-accent text-black': param.value === param.max }"
          >
            {{ param.value === param.min ? (param.offLabel || 'OFF') : (param.onLabel || 'ON') }}
            <!-- Show value if not simple ON/OFF -->
            <span v-if="param.offLabel === undefined && param.onLabel === undefined" class="font-mono">({{ param.value }})</span>
          </button>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, inject, ref } from 'vue';
import { useMidiConnection } from '../../composables/useMidiConnection';
import { midiState, sendCC, sendNRPN } from '../../stores/midiStore';

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  parameters: {
    type: Array,
    required: true
  },
  channel: {
    type: Number,
    default: 0 // MIDI channel 1
  }
});

// Initialize selectedChannel with the prop value
const selectedChannel = ref(props.channel);

// Knob rotation control
let dragTarget = null;
let startY = 0;
let startValue = 0;

function startDrag(event, param) {
  // Prevent default behavior to avoid text selection, etc.
  event.preventDefault();
  
  // Store the parameter we're adjusting
  dragTarget = param;
  
  // Get the starting position
  startY = event.type === 'mousedown' ? event.clientY : event.touches[0].clientY;
  startValue = param.value;
  
  // Add event listeners for movement and release
  if (event.type === 'mousedown') {
    document.addEventListener('mousemove', handleDrag);
    document.addEventListener('mouseup', stopDrag);
  } else {
    document.addEventListener('touchmove', handleDrag, { passive: false });
    document.addEventListener('touchend', stopDrag);
  }
}

function handleDrag(event) {
  if (!dragTarget) return;
  
  // Prevent scrolling on touch devices
  event.preventDefault();
  
  // Calculate new value based on vertical movement
  const currentY = event.type === 'mousemove' ? event.clientY : event.touches[0].clientY;
  const deltaY = startY - currentY;
  
  // Adjust sensitivity based on range
  const range = dragTarget.max - dragTarget.min;
  const sensitivity = Math.max(100, range) / 100;
  
  // Calculate new value with sensitivity adjustment
  let newValue = startValue + (deltaY * sensitivity);
  
  // Clamp the value to the allowed range
  newValue = Math.max(dragTarget.min, Math.min(dragTarget.max, newValue));
  
  // Update the value and send MIDI 
  dragTarget.value = Math.round(newValue);
  sendParameterChange(dragTarget);
}

function stopDrag() {
  dragTarget = null;
  document.removeEventListener('mousemove', handleDrag);
  document.removeEventListener('mouseup', stopDrag);
  document.removeEventListener('touchmove', handleDrag);
  document.removeEventListener('touchend', stopDrag);
}

function getKnobRotationStyle(value, min, max) {
  // Calculate angle (from -150 to 150 degrees)
  const percentage = (value - min) / (max - min);
  const angle = -150 + (percentage * 300);
  
  // Return transform style
  return {
    transform: `translate(-50%, 0) rotate(${angle}deg)`,
    transformOrigin: 'bottom center',
    left: '50%',
    bottom: '8px'
  };
}

function toggleParameter(param) {
  param.value = param.value === param.min ? param.max : param.min;
  sendParameterChange(param);
}

// Get connection state from our composable
const { midiState: connectionState } = useMidiConnection();

function sendParameterChange(param) {
  // Get output from WebMidi directly if possible
  try {
    if (midiState.isNrpnMode && param.nrpn !== undefined) {
      // Send as NRPN (14-bit resolution)
      console.log(`Sending NRPN: ch:${selectedChannel.value}, param:${param.nrpn}, value:${param.value}`);
      sendNRPN(null, selectedChannel.value, param.nrpn, param.value);
    } else if (param.cc !== undefined) {
      // Send as CC (7-bit resolution)
      console.log(`Sending CC: ch:${selectedChannel.value}, cc:${param.cc}, value:${param.value}`);
      sendCC(null, selectedChannel.value, param.cc, param.value);
    } else {
      console.warn(`Parameter ${param.name} has no MIDI mapping defined`);
    }
  } catch (err) {
    console.error(`MIDI send error: ${err.message}`);
  }
}

onMounted(() => {
  // No specific initialization needed here
});

onUnmounted(() => {
  // Clean up any event listeners
  document.removeEventListener('mousemove', handleDrag);
  document.removeEventListener('mouseup', stopDrag);
  document.removeEventListener('touchmove', handleDrag);
  document.removeEventListener('touchend', stopDrag);
});
</script>