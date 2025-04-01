<template>
  <div class="digitakt-panel">
    <h2 class="text-lg font-semibold mb-4">MIDI Scope</h2>
    
    <div class="mb-4">
      <div class="flex justify-between items-center mb-2">
        <span class="text-sm font-medium">Realtime Parameter Visualization</span>
        <div class="flex space-x-2">
          <button @click="isRecording = !isRecording" class="digitakt-button text-sm">
            {{ isRecording ? 'Pause' : 'Record' }}
          </button>
          <button @click="clearData" class="digitakt-button text-sm">
            Clear
          </button>
        </div>
      </div>
      
      <!-- Parameter selector -->
      <div class="mb-4">
        <label class="block mb-1 text-sm">Parameter to monitor:</label>
        <select 
          v-model="selectedParameter"
          class="w-full bg-digitakt-primary border border-digitakt-secondary p-2 rounded text-sm"
        >
          <option value="">-- Select Parameter --</option>
          <optgroup 
            v-for="(group, groupKey) in parameterGroups" 
            :key="groupKey" 
            :label="group.title"
          >
            <option 
              v-for="param in group.parameters" 
              :key="`${group.channel}-${param.cc}`"
              :value="`${group.channel}-${param.cc}`"
            >
              {{ param.name }} (Ch.{{ group.channel }} CC{{ param.cc }})
            </option>
          </optgroup>
        </select>
      </div>
    </div>
    
    <!-- Visualization Canvas -->
    <div class="bg-digitakt-primary border border-digitakt-secondary rounded p-2">
      <canvas 
        ref="canvas" 
        class="w-full h-36 bg-black rounded"
        @mouseenter="showTooltip = true"
        @mouseleave="showTooltip = false"
        @mousemove="updateTooltipPosition"
      ></canvas>
      
      <!-- Tooltip -->
      <div 
        v-if="showTooltip && tooltipData"
        class="absolute bg-digitakt-secondary px-2 py-1 rounded text-xs shadow-md pointer-events-none"
        :style="{ left: `${tooltipPosition.x}px`, top: `${tooltipPosition.y}px` }"
      >
        Value: {{ tooltipData.value }}<br>
        Time: {{ formatTime(tooltipData.time) }}
      </div>
    </div>
    
    <!-- Data Statistics -->
    <div class="mt-4 grid grid-cols-4 gap-2 text-xs">
      <div class="bg-digitakt-secondary p-2 rounded">
        <div class="text-digitakt-muted">Min</div>
        <div class="font-mono text-lg">{{ stats.min }}</div>
      </div>
      <div class="bg-digitakt-secondary p-2 rounded">
        <div class="text-digitakt-muted">Max</div>
        <div class="font-mono text-lg">{{ stats.max }}</div>
      </div>
      <div class="bg-digitakt-secondary p-2 rounded">
        <div class="text-digitakt-muted">Average</div>
        <div class="font-mono text-lg">{{ stats.avg }}</div>
      </div>
      <div class="bg-digitakt-secondary p-2 rounded">
        <div class="text-digitakt-muted">Samples</div>
        <div class="font-mono text-lg">{{ recordedData.length }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue';
import { parameterGroups } from '../../data/digitaktParameters';

// Canvas reference and visualization state
const canvas = ref(null);
const ctx = ref(null);
const isRecording = ref(false);
const recordedData = ref([]);
const selectedParameter = ref('');
const MAX_DATA_POINTS = 500;

// Tooltip state
const showTooltip = ref(false);
const tooltipPosition = ref({ x: 0, y: 0 });
const tooltipData = ref(null);

// Animation frame reference
let animationFrame = null;

// Stats calculation
const stats = computed(() => {
  if (!recordedData.value.length) {
    return { min: '--', max: '--', avg: '--' };
  }
  
  const values = recordedData.value.map(d => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const sum = values.reduce((a, b) => a + b, 0);
  const avg = Math.round((sum / values.length) * 10) / 10;
  
  return { min, max, avg };
});

// Monitor MIDI messages to capture parameter changes
function monitorMidiMessages(midiMessage) {
  if (!isRecording.value || !selectedParameter.value) return;
  
  // Extract channel and CC from selected parameter
  const [channel, cc] = selectedParameter.value.split('-').map(Number);
  
  // Check if this message matches our monitored parameter
  if (
    midiMessage.type === 'cc' && 
    midiMessage.channel === channel && 
    midiMessage.controller === cc
  ) {
    // Add new data point
    recordedData.value.push({
      time: Date.now(),
      value: midiMessage.value
    });
    
    // Trim data if it exceeds max points
    if (recordedData.value.length > MAX_DATA_POINTS) {
      recordedData.value.shift();
    }
  }
}

// Draw visualization on canvas
function drawVisualization() {
  if (!ctx.value) return;
  
  const canvasWidth = canvas.value.width;
  const canvasHeight = canvas.value.height;
  
  // Clear canvas
  ctx.value.clearRect(0, 0, canvasWidth, canvasHeight);
  
  // If no data, show empty state
  if (!recordedData.value.length) {
    ctx.value.fillStyle = '#666';
    ctx.value.font = '14px sans-serif';
    ctx.value.textAlign = 'center';
    ctx.value.fillText('No data recorded', canvasWidth / 2, canvasHeight / 2);
    return;
  }
  
  // Draw grid
  ctx.value.strokeStyle = '#333';
  ctx.value.lineWidth = 1;
  
  // Horizontal grid lines
  for (let i = 0; i <= 4; i++) {
    const y = i * (canvasHeight / 4);
    ctx.value.beginPath();
    ctx.value.moveTo(0, y);
    ctx.value.lineTo(canvasWidth, y);
    ctx.value.stroke();
  }
  
  // Set up line properties for data
  ctx.value.strokeStyle = '#ff5500';
  ctx.value.lineWidth = 2;
  ctx.value.beginPath();
  
  // Draw data points
  recordedData.value.forEach((point, index) => {
    const x = (index / (recordedData.value.length - 1)) * canvasWidth;
    const y = canvasHeight - (point.value / 127) * canvasHeight;
    
    if (index === 0) {
      ctx.value.moveTo(x, y);
    } else {
      ctx.value.lineTo(x, y);
    }
  });
  
  ctx.value.stroke();
  
  // Draw recording indicator if active
  if (isRecording.value) {
    const now = Date.now();
    const blink = Math.floor(now / 500) % 2 === 0;
    
    if (blink) {
      ctx.value.fillStyle = '#ff5500';
      ctx.value.beginPath();
      ctx.value.arc(15, 15, 6, 0, Math.PI * 2);
      ctx.value.fill();
    }
  }
  
  // Schedule next frame
  animationFrame = requestAnimationFrame(drawVisualization);
}

// Update tooltip position and data on mousemove
function updateTooltipPosition(event) {
  if (!canvas.value || !recordedData.value.length) return;
  
  const rect = canvas.value.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  
  // Convert x position to data index
  const index = Math.min(
    Math.floor((x / rect.width) * recordedData.value.length),
    recordedData.value.length - 1
  );
  
  // Get data point at index
  tooltipData.value = recordedData.value[index];
  
  // Position tooltip
  tooltipPosition.value = {
    x: event.clientX + 10,
    y: event.clientY - 40
  };
}

// Format timestamp for display
function formatTime(timestamp) {
  if (!timestamp) return '--:--:--';
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}

// Clear recorded data
function clearData() {
  recordedData.value = [];
}

// Initialize canvas once mounted
onMounted(() => {
  if (canvas.value) {
    // Set canvas dimensions with higher resolution for sharper rendering
    canvas.value.width = canvas.value.clientWidth * 2;
    canvas.value.height = canvas.value.clientHeight * 2;
    ctx.value = canvas.value.getContext('2d');
    
    // Set scale for high DPI displays
    const scale = window.devicePixelRatio || 1;
    if (scale > 1) {
      ctx.value.scale(scale, scale);
    }
    
    // Start animation
    drawVisualization();
  }
  
  // TODO: In the full implementation, connect to MIDI message stream
  // For now, we'll simulate some data for demonstration
  simulateData();
});

// Clean up animation frame on unmount
onUnmounted(() => {
  if (animationFrame) {
    cancelAnimationFrame(animationFrame);
  }
});

// Simulate data for demonstration purposes
// In real implementation, this would be replaced with real MIDI data
function simulateData() {
  if (!selectedParameter.value) return;
  
  // Only for demonstration - would connect to real MIDI data in actual implementation
  setInterval(() => {
    if (isRecording.value) {
      monitorMidiMessages({
        type: 'cc',
        channel: parseInt(selectedParameter.value.split('-')[0]),
        controller: parseInt(selectedParameter.value.split('-')[1]),
        value: Math.floor(Math.random() * 128)
      });
    }
  }, 200);
}
</script>