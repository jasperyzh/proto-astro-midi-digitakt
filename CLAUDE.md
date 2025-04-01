# Proto-Astro-MIDI Guide

## Build & Development Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Code Style Guidelines
- **Framework**: Astro + Vue 3 with Composition API and `<script setup>`
- **Styling**: Tailwind CSS with custom digitakt theme colors
- **Naming**:
  - PascalCase for components
  - camelCase for variables, functions, and Vue refs
  - kebab-case for CSS classes
- **Component Structure**: 
  - Astro (.astro) for pages and layouts
  - Vue (.vue) for interactive components
- **State Management**: Use reactive Vue state with stores in `src/stores/`
- **Error Handling**: Use try/catch blocks with specific error messages
- **MIDI Communication**: Always handle device connections/errors gracefully
- **Type Safety**: Follows Astro's strict TypeScript configuration
- **Imports**: Group and order by: 1) External libs 2) Components 3) Utils/Stores

## Project Structure
- `src/components/midi/` - MIDI-specific Vue components
- `src/stores/` - Reactive state management 
- `src/data/` - Static configuration data
- `src/styles/` - Global CSS and digitakt theme components