import { ref, reactive } from 'vue';

// Create shared state outside the function so it persists across imports
const messageLog = ref([]);
const MAX_LOG_SIZE = 100;

const debugState = reactive({
  latency: {
    lastMessageTime: null,
    averageLatency: null,
    measurements: []
  },
  errors: [],
  statistics: {
    totalMessages: 0,
    messagesByType: {},
    messagesByChannel: {}
  }
});

/**
 * Composable for MIDI message debugging and monitoring
 * Uses a singleton pattern to share state across imports
 */
export function useMidiDebugger() {
  /**
   * Log a MIDI message with detailed information
   * @param {Object} message The MIDI message to log
   */
  function logMessage(message) {
    // Add timestamp if not present
    if (!message.timestamp) {
      message.timestamp = Date.now();
    }

    console.warn("🔍 [MIDI DEBUGGER] Logging message:", message);
    
    // Update latency tracking
    if (debugState.latency.lastMessageTime) {
      const latency = message.timestamp - debugState.latency.lastMessageTime;
      debugState.latency.measurements.push(latency);
      
      // Only keep the last 50 measurements
      if (debugState.latency.measurements.length > 50) {
        debugState.latency.measurements.shift();
      }
      
      // Calculate average latency
      const sum = debugState.latency.measurements.reduce((a, b) => a + b, 0);
      debugState.latency.averageLatency = sum / debugState.latency.measurements.length;
    }
    debugState.latency.lastMessageTime = message.timestamp;
    
    // Update statistics
    debugState.statistics.totalMessages++;
    
    // Update message type count
    if (message.type) {
      if (!debugState.statistics.messagesByType[message.type]) {
        debugState.statistics.messagesByType[message.type] = 0;
      }
      debugState.statistics.messagesByType[message.type]++;
    }
    
    // Update channel count
    if (message.channel) {
      if (!debugState.statistics.messagesByChannel[message.channel]) {
        debugState.statistics.messagesByChannel[message.channel] = 0;
      }
      debugState.statistics.messagesByChannel[message.channel]++;
    }
    
    console.warn("🔍 [MIDI DEBUGGER] Adding message to log:", JSON.stringify(message.details || {}, null, 2));
    
    // Add to log
    messageLog.value.unshift(message);
    
    // Trim log if it exceeds maximum size
    if (messageLog.value.length > MAX_LOG_SIZE) {
      messageLog.value.length = MAX_LOG_SIZE;
    }
  }
  
  /**
   * Log an error that occurred during MIDI processing
   * @param {Error|String} error The error to log
   */
  function logError(error) {
    const errorObj = {
      message: typeof error === 'string' ? error : error.message,
      timestamp: Date.now(),
      stack: error.stack
    };
    
    debugState.errors.push(errorObj);
    
    // Keep only the last 20 errors
    if (debugState.errors.length > 20) {
      debugState.errors.shift();
    }
    
    // Also add to message log
    logMessage({
      type: 'error',
      message: errorObj.message,
      timestamp: errorObj.timestamp
    });
  }
  
  /**
   * Clear all logged messages
   */
  function clearLog() {
    messageLog.value = [];
    debugState.statistics.totalMessages = 0;
    debugState.statistics.messagesByType = {};
    debugState.statistics.messagesByChannel = {};
  }
  
  /**
   * Reset latency measurements
   */
  function resetLatencyStats() {
    debugState.latency = {
      lastMessageTime: null,
      averageLatency: null,
      measurements: []
    };
  }
  
  /**
   * Format MIDI data for display
   * @param {Array} data Raw MIDI message data
   * @returns {String} Formatted hex string
   */
  function formatMidiData(data) {
    if (!data || !Array.isArray(data)) return 'N/A';
    return data.map(b => b.toString(16).padStart(2, '0')).join(' ');
  }
  
  return {
    messageLog,
    debugState,
    logMessage,
    logError,
    clearLog,
    resetLatencyStats,
    formatMidiData
  };
}