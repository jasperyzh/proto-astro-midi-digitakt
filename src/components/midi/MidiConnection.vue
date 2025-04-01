<template>
  <div class="digitakt-panel">
    <h2 class="text-lg font-semibold mb-4">MIDI Connection</h2>
    
    <div class="mb-4">
      <div class="flex items-center mb-2">
        <div class="w-3 h-3 rounded-full mr-2" :class="statusIndicatorClass"></div>
        <span>{{ connectionStatusText }}</span>
      </div>
      
      <div class="flex space-x-2 mb-4">
        <button 
          @click="initialize" 
          class="digitakt-button"
          :disabled="isInitialized && midiState.connectionStatus === 'connected'"
          :class="{ 'opacity-50': isConnecting }"
        >
          {{ isConnecting ? 'Connecting...' : 'Initialize MIDI' }}
        </button>
        
        <button 
          @click="showVirtualMidiHelp = !showVirtualMidiHelp" 
          class="digitakt-button text-sm"
        >
          Need Help?
        </button>
      </div>
      
      <div v-if="error" class="text-red-500 mb-4">
        {{ error }}
      </div>
      
      <div v-if="showVirtualMidiHelp" class="bg-digitakt-secondary p-4 rounded mb-4 text-sm">
        <h3 class="font-medium mb-2">Troubleshooting MIDI Connection</h3>
        <p class="mb-2">If you're unable to connect to your Digitakt:</p>
        <ol class="list-decimal list-inside pl-2 space-y-1">
          <li>Ensure you're using Chrome, Edge, or Opera (Firefox/Safari need extensions)</li>
          <li>Check that your Digitakt is properly connected via USB</li>
          <li>Try using a virtual MIDI loopback for testing</li>
        </ol>
        <p class="mt-2 text-xs">
          For macOS: Install <a href="https://www.nerds.de/en/loopbe1.html" target="_blank" class="text-digitakt-accent underline">loopMIDI</a> or similar.<br>
          For Windows: Try <a href="https://www.tobias-erichsen.de/software/loopmidi.html" target="_blank" class="text-digitakt-accent underline">loopMIDI</a>.<br>
          For Linux: Use <a href="https://github.com/jackaudio/jack-example-tools" target="_blank" class="text-digitakt-accent underline">JACK</a> or <a href="https://github.com/x42/virtual_midi_keyboard" target="_blank" class="text-digitakt-accent underline">virtual_midi_keyboard</a>.
        </p>
      </div>
    </div>
    
    <div v-if="isInitialized && midiState.connectionStatus === 'connected'">
      <div class="mb-4">
        <label class="block mb-1">Input Device</label>
        <select 
          v-model="selectedInputId" 
          @change="handleInputChange"
          class="w-full bg-digitakt-primary border border-digitakt-secondary p-2 rounded"
        >
          <option value="">-- Select Input --</option>
          <option 
            v-for="device in midiState.inputs" 
            :key="device.id" 
            :value="device.id"
          >
            {{ device.name }} ({{ device.manufacturer }})
          </option>
        </select>
      </div>
      
      <div class="mb-4">
        <label class="block mb-1">Output Device</label>
        <select 
          v-model="selectedOutputId" 
          @change="handleOutputChange"
          class="w-full bg-digitakt-primary border border-digitakt-secondary p-2 rounded"
        >
          <option value="">-- Select Output --</option>
          <option 
            v-for="device in midiState.outputs" 
            :key="device.id" 
            :value="device.id"
          >
            {{ device.name }} ({{ device.manufacturer }})
          </option>
        </select>
      </div>
      
      <div class="flex items-center mt-4">
        <label class="flex items-center cursor-pointer">
          <input 
            type="checkbox" 
            v-model="midiState.isNrpnMode"
            class="sr-only"
          />
          <div class="relative w-10 h-6 bg-digitakt-secondary rounded-full transition">
            <div 
              class="absolute left-1 top-1 bg-digitakt-accent w-4 h-4 rounded-full transition-transform"
              :class="{ 'translate-x-4': midiState.isNrpnMode }"
            ></div>
          </div>
          <span class="ml-2">NRPN Mode</span>
        </label>
      </div>
      
      <div class="flex space-x-2 mt-4">
        <button 
          @click="refreshDevices" 
          class="digitakt-button"
        >
          Refresh Devices
        </button>
        
        <button 
          @click="testMidiOutput"
          class="digitakt-button"
          :disabled="!midiState.selectedOutput"
        >
          Test Output
        </button>
        
        <button 
          @click="showDigitaktHelp = true"
          class="digitakt-button"
        >
          Digitakt MIDI Setup
        </button>
      </div>
      
      <!-- Digitakt MIDI Setup Help Modal -->
      <div v-if="showDigitaktHelp" class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
        <div class="max-w-2xl w-full max-h-screen overflow-auto">
          <DigitaktMidiHelp @close="showDigitaktHelp = false" />
        </div>
      </div>
    </div>
    
    <!-- Debug Info -->
    <div class="mt-6 p-3 bg-digitakt-primary rounded border border-digitakt-secondary">
      <h3 class="text-sm font-semibold mb-2">Debug Information</h3>
      <div class="text-xs font-mono">
        <div>WebMIDI.js Enabled: {{ isInitialized ? 'Yes' : 'No' }}</div>
        <div>Connection Status: {{ connectionStatusText }}</div>
        <div>Available Inputs: {{ midiState.inputs.length }}</div>
        <div>Available Outputs: {{ midiState.outputs.length }}</div>
        <div v-if="midiState.selectedInput">Selected Input: {{ midiState.selectedInput.name }}</div>
        <div v-if="midiState.selectedOutput">Selected Output: {{ midiState.selectedOutput.name }}</div>
        <div>NRPN Mode: {{ midiState.isNrpnMode ? 'Enabled' : 'Disabled' }}</div>
        
        <!-- MIDI Input Activity Indicator -->
        <div v-if="midiState.selectedInput" class="mt-2 flex items-center">
          <span class="mr-2">Input Activity:</span>
          <span 
            class="inline-block w-3 h-3 rounded-full"
            :class="{ 
              'bg-green-500 animate-pulse': hasRecentInput, 
              'bg-digitakt-secondary': !hasRecentInput 
            }"
          ></span>
          <span v-if="midiState.lastInputMessage" class="ml-2">
            Last message: {{ formatMidiMessageType(midiState.lastInputMessage) }}
          </span>
        </div>
        
        <div v-if="error" class="text-red-500 mt-2">Last Error: {{ error }}</div>
      </div>
      <div class="mt-3">
        <p class="text-xs text-digitakt-muted">
          Note: Web MIDI requires Chrome, Edge, or Opera. Firefox and Safari require extensions.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useMidiConnection } from '../../composables/useMidiConnection';
import { useDigitaktMapping } from '../../composables/useDigitaktMapping';
import { midiState as globalMidiState, sendCC } from '../../stores/midiStore';
import DigitaktMidiHelp from './DigitaktMidiHelp.vue';

// Initialize composables
const { 
  midiState, 
  isInitialized, 
  isConnecting, 
  error, 
  statusIndicatorClass, 
  connectionStatusText, 
  initialize, 
  refreshDevices, 
  connectInput, 
  connectOutput 
} = useMidiConnection();

/**
 * Test MIDI output by sending a sequence of CC messages
 * This helps verify the device is correctly receiving data
 */
function testMidiOutput() {
  if (!midiState.selectedOutput) {
    error.value = "No output device selected";
    return;
  }
  
  try {
    // Send test messages to various channels and CCs
    // First to channel 0 (audio track 1)
    sendCC(null, 0, 74, 64); // Filter cutoff
    setTimeout(() => sendCC(null, 0, 74, 0), 200);
    
    // Then to channel 8 (MIDI track 9) - test VAL5 parameter
    setTimeout(() => {
      sendCC(null, 8, 74, 127); // VAL5 max  
      setTimeout(() => sendCC(null, 8, 74, 0), 200); // Reset to 0
    }, 400);
    
    console.log("Test MIDI messages sent to device:", midiState.selectedOutput.name);
  } catch (err) {
    error.value = `Test failed: ${err.message}`;
    console.error("MIDI test failed:", err);
  }
}

const { isNrpnMode, toggleNrpnMode } = useDigitaktMapping();

// Local state
const selectedInputId = ref('');
const selectedOutputId = ref('');
const showDebugInfo = ref(true); // Set to true to display debug info
const showVirtualMidiHelp = ref(false);
const showDigitaktHelp = ref(false);
const hasRecentInput = ref(false);
let inputActivityTimeout = null;

// Format MIDI message type for display
function formatMidiMessageType(event) {
  if (!event || !event.message) return 'Unknown';
  
  // Format based on message type
  switch (event.message.type) {
    case 'noteon':
      return `Note On: ${event.note ? event.note.name + event.note.octave : 'Unknown'} (ch:${event.message.channel})`;
    case 'noteoff':
      return `Note Off: ${event.note ? event.note.name + event.note.octave : 'Unknown'} (ch:${event.message.channel})`;
    case 'controlchange':
      return `CC: ${event.controller ? event.controller.number : event.data[1]} = ${event.value || event.data[2]} (ch:${event.message.channel})`;
    case 'programchange':
      return `Program: ${event.program ? event.program.number : event.data[1]} (ch:${event.message.channel})`;
    case 'sysex':
      return `SysEx: ${event.message.data.length} bytes`;
    default:
      return `${event.message.type || 'Unknown'} (ch:${event.message.channel})`;
  }
}

// Watch for NRPN mode changes from the composable
function handleNrpnToggle() {
  midiState.isNrpnMode = isNrpnMode.value;
}

// Handle input device selection
function handleInputChange() {
  connectInput(selectedInputId.value);
  if (midiState.selectedInput) {
    console.log(`Connected to input: ${midiState.selectedInput.name}`);
  }
}

// Handle output device selection
function handleOutputChange() {
  connectOutput(selectedOutputId.value);
  if (midiState.selectedOutput) {
    console.log(`Connected to output: ${midiState.selectedOutput.name}`);
    
    // Sync with global midiStore
    globalMidiState.selectedOutput = midiState.selectedOutput;
  }
}

// Update input activity indicator
function setupInputActivityMonitor() {
  return watch(() => midiState.lastInputMessage, (newMessage) => {
    if (newMessage) {
      // Set activity indicator to active
      hasRecentInput.value = true;
      
      // Clear existing timeout
      if (inputActivityTimeout) {
        clearTimeout(inputActivityTimeout);
      }
      
      // Reset after 500ms
      inputActivityTimeout = setTimeout(() => {
        hasRecentInput.value = false;
      }, 500);
    }
  });
}

onMounted(() => {
  // Update UI if device is already selected
  if (midiState.selectedInput) {
    selectedInputId.value = midiState.selectedInput.id;
  }
  
  if (midiState.selectedOutput) {
    selectedOutputId.value = midiState.selectedOutput.id;
    // Sync with global store
    globalMidiState.selectedOutput = midiState.selectedOutput;
  }
  
  // Add watchers to sync the MIDI state 
  watch(() => midiState.selectedOutput, (newOutput) => {
    if (newOutput) {
      globalMidiState.selectedOutput = newOutput;
    }
  });
  
  watch(() => midiState.selectedInput, (newInput) => {
    if (newInput) {
      globalMidiState.selectedInput = newInput;
    }
  });
  
  // Sync NRPN mode between states
  watch(() => midiState.isNrpnMode, (newMode) => {
    globalMidiState.isNrpnMode = newMode;
  });
  
  // Setup MIDI activity monitoring
  setupInputActivityMonitor();
});

onUnmounted(() => {
  // Clean up timers
  if (inputActivityTimeout) {
    clearTimeout(inputActivityTimeout);
  }
});
</script>