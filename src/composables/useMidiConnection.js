import { ref, reactive, computed, inject } from 'vue';
import { 
  initMidi, 
  setupMidiConnectionListeners, 
  setupInputListeners 
} from '../lib/midi-setup';
import { useMidiDebugger } from './useMidiDebugger';

/**
 * Composable for handling MIDI connection state and device selection
 */
export function useMidiConnection() {
  const isInitialized = ref(false);
  const isConnecting = ref(false);
  const error = ref(null);
  
  // Initialize the MIDI debugger
  const { logMessage, logError } = useMidiDebugger();
  
  const midiState = reactive({
    inputs: [],
    outputs: [],
    selectedInput: null,
    selectedOutput: null,
    connectionStatus: 'disconnected', // 'disconnected', 'connected', 'error'
    isNrpnMode: false,
    lastInputMessage: null, // Store the last received message
  });
  
  // Computed properties for UI
  const statusIndicatorClass = computed(() => {
    switch (midiState.connectionStatus) {
      case 'connected': return 'bg-green-500';
      case 'disconnected': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  });
  
  const connectionStatusText = computed(() => {
    switch (midiState.connectionStatus) {
      case 'connected': return 'MIDI API Connected';
      case 'disconnected': return 'Not Connected';
      case 'error': return 'Connection Error';
      default: return 'Unknown Status';
    }
  });
  
  /**
   * Initialize WebMIDI.js
   */
  async function initialize() {
    if (isConnecting.value) return;
    
    isConnecting.value = true;
    error.value = null;
    
    try {
      const midi = await initMidi();
      
      // Update state with available devices
      midiState.inputs = midi.inputs.map(input => ({
        id: input.id,
        name: input.name || `Input ${input.id}`,
        manufacturer: input.manufacturer || 'Unknown',
        reference: input
      }));
      
      midiState.outputs = midi.outputs.map(output => ({
        id: output.id,
        name: output.name || `Output ${output.id}`,
        manufacturer: output.manufacturer || 'Unknown',
        reference: output
      }));
      
      // Set connection status
      midiState.connectionStatus = 'connected';
      isInitialized.value = true;
      
      // Setup connection change listeners
      setupMidiConnectionListeners(() => refreshDevices());
      
      // Auto-select Digitakt if present
      autoSelectDigitakt();
      
      return true;
    } catch (err) {
      error.value = err.message;
      midiState.connectionStatus = 'error';
      console.error('MIDI Initialization Error:', err);
      return false;
    } finally {
      isConnecting.value = false;
    }
  }
  
  /**
   * Refresh the list of available MIDI devices
   */
  async function refreshDevices() {
    if (!isInitialized.value) return;
    
    try {
      const midi = await initMidi();
      
      midiState.inputs = midi.inputs.map(input => ({
        id: input.id,
        name: input.name || `Input ${input.id}`,
        manufacturer: input.manufacturer || 'Unknown',
        reference: input
      }));
      
      midiState.outputs = midi.outputs.map(output => ({
        id: output.id,
        name: output.name || `Output ${output.id}`,
        manufacturer: output.manufacturer || 'Unknown',
        reference: output
      }));
      
      console.log("Device list refreshed, found:", midiState.inputs.length, "inputs,", midiState.outputs.length, "outputs");
    } catch (err) {
      console.error("Error refreshing device list:", err);
    }
  }
  
  /**
   * Try to auto-select Digitakt devices if available
   */
  function autoSelectDigitakt() {
    // Look for different possible Digitakt names in MIDI ports
    const digitaktNames = ['digitakt', 'elektron', 'midi 1'];
    
    const digitaktInput = midiState.inputs.find(input => {
      if (!input.name) return false;
      const lowerName = input.name.toLowerCase();
      return digitaktNames.some(term => lowerName.includes(term));
    });
    
    const digitaktOutput = midiState.outputs.find(output => {
      if (!output.name) return false;
      const lowerName = output.name.toLowerCase();
      return digitaktNames.some(term => lowerName.includes(term));
    });
    
    if (digitaktInput) {
      midiState.selectedInput = digitaktInput;
      console.log("Auto-selected Digitakt input:", digitaktInput.name);
    }
    
    if (digitaktOutput) {
      midiState.selectedOutput = digitaktOutput;
      console.log("Auto-selected Digitakt output:", digitaktOutput.name);
    }
  }
  
  /**
   * Connect to a selected MIDI input device
   * @param {String} inputId The ID of the input device to connect to
   */
  function connectInput(inputId) {
    if (!isInitialized.value) return false;
    
    // Disconnect current input if any
    if (midiState.selectedInput && midiState.selectedInput.reference) {
      midiState.selectedInput.reference.removeListener();
      midiState.selectedInput = null;
    }
    
    if (!inputId) return true; // Just disconnecting
    
    const input = midiState.inputs.find(d => d.id === inputId);
    if (!input) return false;
    
    midiState.selectedInput = input;
    
    // Set up message listeners for the selected input
    const messageCallback = (event) => {
      // Store the received message
      midiState.lastInputMessage = event;

      console.log("🎹 [MIDI DEBUG] Received message:", event);

      /**
       * 
       * there is no event.note available, however in midi-setup.js, there is setupInputListeners under input.addListener 'midimessage' able to return event.note.name, event.note.octave?
       * 
       * find out why the differences, and fix these
       */
      
      // Create a structured message object for the log
      const logEntry = {
        type: 'input',
        message: `${event.message.type} on channel ${event.message.channel}`,
        rawData: Array.from(event.message.data),
        timestamp: new Date(),
        channel: event.message.channel, // For statistics
        details: {} // Additional details based on message type
      };
      
      // Add specific details based on message type
      switch (event.message.type) {
        case 'noteon':
        case 'noteoff':
          logEntry.details = {
            note: event.note ? `${event.note.name}${event.note.octave}` : 'Unknown',
            velocity: event.velocity
          };
          logEntry.message = `${event.message.type === 'noteon' ? 'Note On' : 'Note Off'}: ${logEntry.details.note} (Velocity: ${logEntry.details.velocity})`;
          break;
          
        case 'controlchange':
          logEntry.details = {
            controller: event.controller ? event.controller.number : event.data[1],
            value: event.value !== undefined ? event.value : event.data[2]
          };
          logEntry.message = `CC: ${logEntry.details.controller} = ${logEntry.details.value}`;
          break;
          
        case 'programchange':
          logEntry.details = {
            program: event.program ? event.program.number : event.data[1]
          };
          logEntry.message = `Program Change: ${logEntry.details.program}`;
          break;
          
        case 'sysex':
          logEntry.message = `SysEx: ${event.message.data.length} bytes`;
          break;
          
        default:
          // Handle other message types
          logEntry.message = `${event.message.type || 'Unknown'} message received`;
      }
      
      // Log the message to the MIDI debugger
      logMessage(logEntry);
      
      // console.log(`Received from ${input.name}:`, logEntry.message);
    };
    
    // Setup listeners with our callback
    setupInputListeners(input.reference, messageCallback);
    
    return true;
  }
  
  /**
   * Connect to a selected MIDI output device
   * @param {String} outputId The ID of the output device to connect to
   */
  function connectOutput(outputId) {
    if (!isInitialized.value) return false;
    
    if (midiState.selectedOutput) {
      midiState.selectedOutput = null;
    }
    
    if (!outputId) return true; // Just disconnecting
    
    const output = midiState.outputs.find(d => d.id === outputId);
    if (!output) return false;
    
    midiState.selectedOutput = output;
    return true;
  }
  
  return {
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
  };
}