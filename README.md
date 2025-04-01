# Digitakt Web MIDI Controller

A web-based MIDI control interface for the Elektron Digitakt drum machine/sampler, built with AstroJS, Vue3, and Tailwind CSS.

![Digitakt Web MIDI Controller](https://via.placeholder.com/800x450.png?text=Digitakt+Web+MIDI+Controller)

## Features

- 🎛️ Interactive parameter controls (knobs, sliders, toggles)
- 🔌 Web MIDI API connection for seamless integration
- 📊 Real-time MIDI message monitoring
- 💾 Preset saving/loading system
- 📱 Responsive design for desktop and mobile
- 🔄 Support for both CC and NRPN MIDI messages
- 🧪 Advanced SysEx and debugging tools

## Requirements

- Modern web browser with Web MIDI API support (Chrome, Edge, Opera)
- Elektron Digitakt connected via USB or any MIDI device
- Node.js 18+ for development

## Getting Started

1. Clone this repository
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`
4. Open the application in your browser: `http://localhost:4321`

## Usage

1. **Connect Your MIDI Device**
   - Connect your Digitakt or other MIDI device to your computer via USB
   - Ensure your browser has permission to access MIDI devices

2. **Initialize MIDI**
   - Click the "Initialize MIDI" button
   - Select your device from both input and output dropdown menus
   - If you encounter issues, click the "Need Help?" button for troubleshooting information

3. **Control Parameters**
   - Use the knobs, sliders, and buttons to control different parameters
   - Toggle between CC and NRPN modes for different resolution control
   - Monitor incoming and outgoing MIDI messages in the MIDI Monitor

4. **Save & Load Presets**
   - Save your current parameter settings as presets
   - Load presets with a single click
   - Import/export presets as JSON for sharing

5. **Debug Features**
   - Use the MIDI Monitor for real-time message inspection
   - Analyze MIDI communication with latency statistics
   - Create and send custom SysEx messages with the SysEx Tool

## Architecture

The application follows a layered architecture with clear separation of concerns:

### Core Components

1. **MIDI Communication Layer**
   - `lib/midi-setup.js` - Core Web MIDI API integration
   - `stores/midiStore.js` - Global reactive MIDI state
   - `composables/useMidiConnection.js` - MIDI connection management composable

2. **UI Components**
   - `components/midi/MidiConnection.vue` - Connection interface
   - `components/midi/MidiMonitor.vue` - Message monitoring
   - `components/midi/ParameterControl.vue` - Parameter controls
   - `components/midi/PresetManager.vue` - Preset management
   - `components/debug/SysExTool.vue` - SysEx message tools

3. **Data Management**
   - `data/digitaktParameters.js` - Parameter definitions and mappings
   - `composables/useDigitaktMapping.js` - Specific device mappings
   - `composables/useMidiDebugger.js` - Debugging utilities

4. **Page Layout**
   - `pages/index.astro` - Main application page
   - `layouts/Layout.astro` - Shared layout components

### Data Flow

1. **MIDI Initialization**:
   - User clicks "Initialize MIDI"
   - `useMidiConnection` composable calls `initMidi()`
   - WebMIDI.js initializes and requests MIDI access
   - Available devices are listed in the dropdown menus

2. **MIDI Input**:
   - Device sends MIDI messages
   - Messages are captured by event listeners
   - Messages are parsed and logged in the MIDI Monitor
   - Statistics and latency measurements are updated

3. **MIDI Output**:
   - User adjusts parameters using controls
   - Parameter values are converted to MIDI messages
   - Messages are sent to the selected output device
   - Sent messages are logged in the MIDI Monitor

4. **Preset Management**:
   - User saves parameter state as a preset
   - Preset data is stored in browser localStorage
   - Presets can be loaded or exported/imported as JSON

## Browser Compatibility

The Web MIDI API is currently supported in:
- Google Chrome
- Microsoft Edge
- Opera

Firefox and Safari require extensions or special configurations to use Web MIDI.

## Troubleshooting

If you encounter issues with MIDI connections:

1. **Browser Support**
   - Ensure you're using Chrome, Edge, or Opera
   - For Firefox/Safari, install Web MIDI API extensions

2. **Device Connectivity**
   - Check that your MIDI device is properly connected via USB
   - Ensure your browser has permission to access MIDI devices

3. **Virtual MIDI**
   - For testing without hardware, use virtual MIDI tools:
     - Windows: loopMIDI
     - macOS: IAC Driver or loopMIDI
     - Linux: JACK or virtual_midi_keyboard

4. **Debug Info**
   - Check the debug information section for connection details
   - Use browser console for more detailed error messages

## Project Structure

```
/
├── src/
│   ├── components/
│   │   ├── midi/
│   │   │   ├── MidiConnection.vue    # MIDI device connection interface
│   │   │   ├── MidiMonitor.vue       # MIDI message monitoring
│   │   │   ├── ParameterControl.vue  # Parameter control component
│   │   │   └── PresetManager.vue     # Preset saving/loading system
│   │   └── debug/
│   │       ├── MidiScope.vue         # Advanced MIDI visualization
│   │       └── SysExTool.vue         # SysEx message creator/analyzer
│   ├── composables/
│   │   ├── useDigitaktMapping.js     # Digitakt-specific mappings
│   │   ├── useMidiConnection.js      # MIDI connection management
│   │   └── useMidiDebugger.js        # Debugging utilities
│   ├── data/
│   │   └── digitaktParameters.js     # Parameter definitions and mappings
│   ├── layouts/
│   │   └── Layout.astro              # Main layout component
│   ├── lib/
│   │   └── midi-setup.js             # Core Web MIDI API integration
│   ├── pages/
│   │   └── index.astro               # Main application page
│   ├── stores/
│   │   └── midiStore.js              # Global reactive MIDI state
│   └── styles/
│       └── global.css                # Global CSS including Tailwind
└── public/
    └── favicon.svg                   # Site favicon
```

## Development

- **Start development server**: `npm run dev`
- **Build for production**: `npm run build`
- **Preview production build**: `npm run preview`

## MIDI Implementation

This controller supports both standard MIDI CC messages and NRPN messages for higher precision control. 

- **CC Mode**: Uses standard 7-bit MIDI Control Change messages (0-127)
- **NRPN Mode**: Uses Non-Registered Parameter Numbers for 14-bit resolution (0-16383)

The parameter mappings are based on the Elektron Digitakt MIDI Implementation Chart.

## License

MIT License

## Acknowledgements

- Built with [Astro](https://astro.build/)
- UI Components with [Vue 3](https://v3.vuejs.org/)
- Styling with [Tailwind CSS](https://tailwindcss.com/)
- MIDI interface with [WebMidi.js](https://webmidijs.org/)
- Utility Composition API from [VueUse](https://vueuse.org/)

