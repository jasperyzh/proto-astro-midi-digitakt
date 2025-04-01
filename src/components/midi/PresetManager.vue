<template>
  <div class="digitakt-panel">
    <h2 class="text-lg font-semibold mb-4">Preset Manager</h2>
    
    <div class="grid grid-cols-2 gap-4 mb-4">
      <button @click="savePreset" class="digitakt-button">
        Save Preset
      </button>
      <button @click="loadPreset" class="digitakt-button">
        Load Preset
      </button>
      <button @click="exportPresets" class="digitakt-button">
        Export Presets
      </button>
      <button @click="importPresets" class="digitakt-button">
        Import Presets
      </button>
    </div>
    
    <div v-if="presets.length > 0" class="mb-4">
      <label class="block mb-1">Saved Presets</label>
      <select 
        v-model="selectedPresetIndex" 
        class="w-full bg-digitakt-primary border border-digitakt-secondary p-2 rounded"
      >
        <option 
          v-for="(preset, index) in presets" 
          :key="index" 
          :value="index"
        >
          {{ preset.name }} ({{ formatDate(preset.date) }})
        </option>
      </select>
    </div>
    
    <div v-show="isModalVisible" class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div class="digitakt-panel w-full max-w-md">
        <h3 class="text-lg font-semibold mb-4">{{ modalTitle }}</h3>
        
        <div v-if="modalMode === 'save'">
          <input 
            type="text" 
            v-model="newPresetName" 
            placeholder="Enter preset name"
            class="w-full bg-digitakt-primary border border-digitakt-secondary p-2 rounded mb-4"
          />
        </div>
        
        <div v-if="modalMode === 'import'" class="mb-4">
          <label class="block mb-2">Paste JSON data below</label>
          <textarea 
            v-model="importData" 
            class="w-full bg-digitakt-primary border border-digitakt-secondary p-2 rounded h-32"
          ></textarea>
        </div>
        
        <div v-if="modalMode === 'export'" class="mb-4">
          <label class="block mb-2">Copy this JSON data</label>
          <textarea 
            v-model="exportData" 
            class="w-full bg-digitakt-primary border border-digitakt-secondary p-2 rounded h-32"
            readonly
            @focus="$event.target.select()"
          ></textarea>
        </div>
        
        <div class="flex justify-between">
          <button @click="confirmModal" class="digitakt-button bg-digitakt-accent text-black">
            {{ confirmButtonText }}
          </button>
          <button @click="closeModal" class="digitakt-button">
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { createParameterSnapshot, restoreParameterValues, parameterGroups } from '../../data/digitaktParameters';

// Presets state
const presets = ref([]);
const selectedPresetIndex = ref(-1);

// Modal state
const isModalVisible = ref(false);
const modalMode = ref('');
const newPresetName = ref('');
const importData = ref('');
const exportData = ref('');

// Load presets from localStorage on component mount
onMounted(() => {
  loadPresetsFromStorage();
});

function loadPresetsFromStorage() {
  const storedPresets = localStorage.getItem('digitaktPresets');
  if (storedPresets) {
    try {
      presets.value = JSON.parse(storedPresets);
    } catch (error) {
      console.error('Failed to load presets:', error);
      presets.value = [];
    }
  }
}

function savePresetsToStorage() {
  localStorage.setItem('digitaktPresets', JSON.stringify(presets.value));
}

function savePreset() {
  modalMode.value = 'save';
  newPresetName.value = `Preset ${presets.value.length + 1}`;
  isModalVisible.value = true;
}

function loadPreset() {
  if (selectedPresetIndex.value >= 0 && selectedPresetIndex.value < presets.value.length) {
    const preset = presets.value[selectedPresetIndex.value];
    restoreParameterValues(preset.data);
  }
}

function exportPresets() {
  modalMode.value = 'export';
  exportData.value = JSON.stringify(presets.value, null, 2);
  isModalVisible.value = true;
}

function importPresets() {
  modalMode.value = 'import';
  importData.value = '';
  isModalVisible.value = true;
}

function confirmModal() {
  if (modalMode.value === 'save') {
    const newPreset = {
      name: newPresetName.value || `Preset ${presets.value.length + 1}`,
      date: new Date().toISOString(),
      data: createParameterSnapshot()
    };
    
    presets.value.push(newPreset);
    selectedPresetIndex.value = presets.value.length - 1;
    savePresetsToStorage();
  } 
  else if (modalMode.value === 'import') {
    try {
      const importedPresets = JSON.parse(importData.value);
      
      if (Array.isArray(importedPresets)) {
        presets.value = [...presets.value, ...importedPresets];
        savePresetsToStorage();
      }
    } catch (error) {
      console.error('Failed to import presets:', error);
      // TODO: Add user-facing error message
    }
  }
  
  closeModal();
}

function closeModal() {
  isModalVisible.value = false;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString();
}

const modalTitle = computed(() => {
  switch (modalMode.value) {
    case 'save': return 'Save Preset';
    case 'import': return 'Import Presets';
    case 'export': return 'Export Presets';
    default: return 'Modal';
  }
});

const confirmButtonText = computed(() => {
  switch (modalMode.value) {
    case 'save': return 'Save';
    case 'import': return 'Import';
    case 'export': return 'Done';
    default: return 'Confirm';
  }
});

// For compatibility with options API
import { onMounted, watch } from 'vue';
</script> 