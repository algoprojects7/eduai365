import type { Preview } from '@storybook/react';
import '../src/styles/globals.css';

const preview: Preview = {
  parameters: {
    layout: 'fullscreen',
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'surface',
      values: [
        { name: 'surface', value: '#f8f9ff' },
        { name: 'white', value: '#ffffff' },
        { name: 'cinematic-dark', value: '#0B1120' },
        { name: 'hero-navy', value: '#050A1E' },
      ],
    },
  },
};

export default preview;
