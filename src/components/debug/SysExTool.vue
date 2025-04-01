<template>
  <div class="digitakt-panel">
    <h2 class="text-lg font-semibold mb-4">SysEx Tool</h2>
    
    <div class="mb-4">
      <p class="text-sm text-digitakt-muted mb-2">
        Send and receive System Exclusive (SysEx) messages to your Digitakt. SysEx messages can be used for device backup, preset transfer, and advanced configurations.
      </p>
      
      <div class="flex justify-between items-center mb-2">
        <span class="text-sm font-medium">SysEx Messages</span>
        <div class="flex space-x-2">
          <button 
            @click="requestDigitaktBackup" 
            class="digitakt-button text-sm"
            :disabled="!hasOutputDevice"
          >
            Request Backup
          </button>
        </div>
      </div>
    </div>
    
    <!-- SysEx Message Builder -->
    <div class="bg-digitakt-primary border border-digitakt-secondary rounded p-3 mb-4">
      <h3 class="text-sm font-medium mb-2">SysEx Message Builder</h3>
      
      <div class="mb-3">
        <label class="block text-sm mb-1">Manufacturer ID</label>
        <select 
          v-model="sysexBuilder.manufacturerId" 
          class="w-full bg-digitakt-primary border border-digitakt-secondary p-2 rounded text-sm"
        >
          <option value="00-20-3C">Elektron (00 20 3C)</option>
          <option value="7E">Universal Non-Realtime (7E)</option>
          <option value="7F">Universal Realtime (7F)</option>
          <option value="custom">Custom...</option>
        </select>
        
        <div v-if="sysexBuilder.manufacturerId === 'custom'" class="mt-2">
          <input 
            v-model="sysexBuilder.customManufacturerId" 
            type="text" 
            placeholder="Custom ID (hex, e.g., '41' for Roland)" 
            class="w-full bg-digitakt-primary border border-digitakt-secondary p-2 rounded text-sm"
          />
        </div>
      </div>
      
      <div class="mb-3">
        <label class="block text-sm mb-1">Device ID</label>
        <div class="flex space-x-2">
          <input 
            v-model.number="sysexBuilder.deviceId" 
            type="number" 
            min="0" 
            max="127" 
            class="w-full bg-digitakt-primary border border-digitakt-secondary p-2 rounded text-sm"
          />
          <button @click="sysexBuilder.deviceId = 0" class="digitakt-button text-xs">
            Reset
          </button>
        </div>
      </div>
      
      <div class="mb-3">
        <label class="block text-sm mb-1">Data (hex bytes, space-separated)</label>
        <textarea 
          v-model="sysexBuilder.data" 
          rows="3" 
          placeholder="Enter data bytes in hex format (e.g., '01 02 03')" 
          class="w-full bg-digitakt-primary border border-digitakt-secondary p-2 rounded text-sm font-mono"
        ></textarea>
      </div>
      
      <div class="mb-3">
        <label class="block text-sm mb-1">Preview</label>
        <div class="bg-black p-2 rounded font-mono text-xs overflow-x-auto whitespace-nowrap">
          F0 {{ getFormattedManufacturerId }} {{ sysexBuilder.deviceId.toString(16).padStart(2, '0') }} {{ sysexBuilder.data }} F7
        </div>
      </div>
      
      <button 
        @click="sendCustomSysEx" 
        class="digitakt-button"
        :disabled="!hasOutputDevice || !isValidSysEx"
      >
        Send SysEx
      </button>
    </div>
    
    <!-- Received SysEx Messages -->
    <div class="bg-digitakt-primary border border-digitakt-secondary rounded p-3">
      <div class="flex justify-between items-center mb-2">
        <h3 class="text-sm font-medium">Received SysEx Messages</h3>
        <button @click="clearReceivedMessages" class="digitakt-button text-xs">
          Clear
        </button>
      </div>
      
      <div class="max-h-48 overflow-y-auto">
        <div 
          v-for="(message, index) in receivedSysExMessages" 
          :key="index"
          class="mb-2 border-b border-digitakt-secondary pb-2"
        >
          <div class="flex justify-between text-xs mb-1">
            <span class="text-digitakt-accent">{{ formatTime(message.timestamp) }}</span>
            <span>{{ message.bytes.length }} bytes</span>
          </div>
          <div class="bg-black p-2 rounded font-mono text-xs overflow-x-auto whitespace-nowrap">
            {{ formatSysExMessage(message.bytes) }}
          </div>
        </div>
        
        <div v-if="receivedSysExMessages.length === 0" class="text-digitakt-muted text-center p-4 text-sm italic">
          No SysEx messages received yet.
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

// Component state
const sysexBuilder = ref({
  manufacturerId: '00-20-3C', // Default to Elektron
  customManufacturerId: '',
  deviceId: 0, // Default to global device ID
  data: '01 00', // Default data
});

const receivedSysExMessages = ref([]);

// Computed properties
const getFormattedManufacturerId = computed(() => {
  if (sysexBuilder.value.manufacturerId === 'custom') {
    return sysexBuilder.value.customManufacturerId;
  }
  return sysexBuilder.value.manufacturerId;
});

const isValidSysEx = computed(() => {
  // Validate data format (should be hex bytes)
  const dataRegex = /^([0-9A-Fa-f]{1,2}\s*)+$/;
  return dataRegex.test(sysexBuilder.value.data);
});

const hasOutputDevice = computed(() => {
  // In a real implementation, this would check if there's a selected MIDI output
  // For now, we'll return true for demonstration
  return true;
});

// Methods
function sendCustomSysEx() {
  if (!hasOutputDevice.value || !isValidSysEx.value) return;
  
  // Convert the builder values to a proper SysEx message
  const manufacturerIdBytes = parseManufacturerId(sysexBuilder.value.manufacturerId);
  const deviceIdByte = sysexBuilder.value.deviceId;
  const dataBytes = sysexBuilder.value.data
    .split(/\s+/)
    .filter(Boolean)
    .map(byte => parseInt(byte, 16));
  
  // Construct the full SysEx message
  const sysexMessage = [
    0xF0, // Start of SysEx
    ...manufacturerIdBytes,
    deviceIdByte,
    ...dataBytes,
    0xF7  // End of SysEx
  ];
  
  console.log('Sending SysEx message:', sysexMessage);
  
  // In a real implementation, you would send this to the MIDI output
  // For demonstration, we'll add it to our received messages as a loopback
  receivedSysExMessages.value.unshift({
    timestamp: Date.now(),
    bytes: sysexMessage,
    source: 'sent'
  });
}

function requestDigitaktBackup() {
  if (!hasOutputDevice.value) return;
  
  // Elektron Digitakt backup request message (simplified example)
  const sysexMessage = [
    0xF0, // Start of SysEx
    0x00, 0x20, 0x3C, // Elektron manufacturer ID
    0x01, // Device ID for Digitakt
    0x00, 0x01, // Command to request backup
    0xF7  // End of SysEx
  ];
  
  console.log('Requesting Digitakt backup via SysEx');
  
  // In a real implementation, you would send this to the MIDI output
  // For demonstration, we'll add it to our received messages as a loopback
  receivedSysExMessages.value.unshift({
    timestamp: Date.now(),
    bytes: sysexMessage,
    source: 'sent'
  });
  
  // Simulate receiving a backup after a delay (for demonstration)
  setTimeout(() => {
    const simulatedBackupResponse = [
      0xF0, // Start of SysEx
      0x00, 0x20, 0x3C, // Elektron manufacturer ID
      0x01, // Device ID for Digitakt
      0x00, 0x02, // Backup data header
      // Simulated backup data (would be much longer in reality)
      0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08,
      0x09, 0x0A, 0x0B, 0x0C, 0x0D, 0x0E, 0x0F, 0x10,
      // ... many more bytes in a real backup
      0xF7  // End of SysEx
    ];
    
    receivedSysExMessages.value.unshift({
      timestamp: Date.now(),
      bytes: simulatedBackupResponse,
      source: 'received'
    });
  }, 1500);
}

function clearReceivedMessages() {
  receivedSysExMessages.value = [];
}

// Helper functions
function parseManufacturerId(id) {
  if (id === 'custom') {
    return sysexBuilder.value.customManufacturerId
      .split(/\s+|-+/)
      .filter(Boolean)
      .map(byte => parseInt(byte, 16));
  }
  
  // Handle built-in manufacturer IDs
  if (id === '7E' || id === '7F') {
    return [parseInt(id, 16)];
  }
  
  // Elektron ID format: 00-20-3C
  return id.split('-').map(byte => parseInt(byte, 16));
}

function formatSysExMessage(bytes) {
  if (!bytes || !bytes.length) return '';
  
  return bytes.map(byte => byte.toString(16).padStart(2, '0').toUpperCase()).join(' ');
}

function formatTime(timestamp) {
  if (!timestamp) return '--:--:--';
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}
</script>