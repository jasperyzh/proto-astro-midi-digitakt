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
    
    <div class="grid grid-cols-2 gap-4">
      <div 
        v-for="(param, index) in parameters" 
        :key="param.id" 
        class="flex flex-col items-center"
      >
        <div class="text-center mb-2 relative w-full">
          <input 
            v-model="param.name" 
            class="text-center w-full bg-digitakt-dark border-digitakt-secondary px-2 py-1 rounded text-sm mb-1"
            @change="updateParameter(index, 'name', param.name)"
          />
          
          <div class="flex w-full justify-between text-xs mb-1">
            <label class="flex items-center">
              CC:
              <input 
                v-model.number="param.cc" 
                type="number" 
                min="0" 
                max="127" 
                class="w-12 bg-digitakt-dark border-digitakt-secondary px-1 rounded text-center ml-1"
                @change="updateParameter(index, 'cc', param.cc)"
              />
            </label>
          </div>
        </div>
        
        <div class="mb-2 w-full">
          <div class="digitakt-knob relative mx-auto" @mousedown="startDrag($event, param)" @touchstart="startDrag($event, param)">
            <div 
              class="absolute w-1 h-6 bg-digitakt-text" 
              :style="getKnobRotationStyle(param.value, param.min, param.max)"
            ></div>
          </div>
          <div class="text-center mt-1">{{ param.value }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref, reactive } from 'vue';
import { useMidiConnection } from '../../composables/useMidiConnection';
import { midiState, sendCC, sendNRPN } from '../../stores/midiStore';

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  initialParameters: {
    type: Array,
    default: () => []
  },
  channel: {
    type: Number,
    default: 0 // MIDI channel 1
  }
});

// Initialize selectedChannel with the prop value
const selectedChannel = ref(props.channel);

// Create a reactive copy of the parameters
const parameters = reactive(
  props.initialParameters.length > 0 
    ? JSON.parse(JSON.stringify(props.initialParameters))
    : [
        {
          id: "custom_1",
          name: "Control 1",
          type: "knob",
          min: 0,
          max: 127,
          value: 0,
          cc: 1
        },
        {
          id: "custom_2",
          name: "Control 2",
          type: "knob",
          min: 0,
          max: 127,
          value: 0,
          cc: 2
        },
        {
          id: "custom_3",
          name: "Control 3",
          type: "knob",
          min: 0,
          max: 127,
          value: 0,
          cc: 3
        },
        {
          id: "custom_4",
          name: "Control 4",
          type: "knob",
          min: 0,
          max: 127,
          value: 0,
          cc: 4
        }
      ]
);

// Knob rotation control
let dragTarget = null;
let startY = 0;
let startValue = 0;

function updateParameter(index, property, value) {
  parameters[index][property] = value;
}

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