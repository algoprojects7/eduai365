import reactConfig from '@eduai365/eslint-config/react';

export default [
  ...reactConfig,
  {
    ignores: ['.next/**', 'node_modules/**'],
  },
];
