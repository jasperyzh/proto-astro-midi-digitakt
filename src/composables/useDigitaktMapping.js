import { ref, computed } from 'vue';
import { sendCC, sendNRPN } from '../lib/midi-setup';
import { parameterGroups } from '../data/digitaktParameters';

/**
 * Composable for handling Digitakt parameter mapping and control
 */
export function useDigitaktMapping() {
  const parameterValues = ref({});
  const isNrpnMode = ref(false);
  
  /**
   * Initialize default parameter values
   */
  function initializeParameters() {
    // Reset parameter values with default values from parameter groups
    const values = {};
    
    // Loop through all parameter groups
    Object.values(parameterGroups).forEach(group => {
      // Loop through parameters in each group
      group.parameters.forEach(param => {
        values[`${group.channel}-${param.cc}`] = param.defaultValue || 0;
      });
    });
    
    parameterValues.value = values;
  }
  
  /**
   * Send parameter change to MIDI output
   * @param {Object} output MIDI output device
   * @param {Number} channel MIDI channel
   * @param {Number} cc CC number
   * @param {Number} value Parameter value
   * @param {Object} parameter Full parameter object with NRPN info
   */
  function sendParameterChange(output, channel, cc, value, parameter) {
    if (!output) {
      console.error('No MIDI output device selected');
      return false;
    }
    
    try {
      // Store value in our local state
      const paramKey = `${channel}-${cc}`;
      parameterValues.value[paramKey] = value;
      
      // If NRPN mode and parameter has NRPN mapping, use NRPN
      if (isNrpnMode.value && parameter.nrpn) {
        const [msb, lsb] = parameter.nrpn;
        return sendNRPN(output, channel, [msb, lsb], value);
      } 
      // Otherwise use regular CC
      else {
        return sendCC(output, channel, cc, value);
      }
    } catch (error) {
      console.error('Failed to send parameter change:', error);
      return false;
    }
  }
  
  /**
   * Get current value for a parameter
   * @param {Number} channel MIDI channel
   * @param {Number} cc CC number
   * @returns {Number} Current parameter value
   */
  function getParameterValue(channel, cc) {
    const paramKey = `${channel}-${cc}`;
    return parameterValues.value[paramKey] !== undefined 
      ? parameterValues.value[paramKey] 
      : 0;
  }
  
  /**
   * Toggle between CC and NRPN mode
   */
  function toggleNrpnMode() {
    isNrpnMode.value = !isNrpnMode.value;
  }
  
  return {
    parameterValues,
    isNrpnMode,
    initializeParameters,
    sendParameterChange,
    getParameterValue,
    toggleNrpnMode
  };
}