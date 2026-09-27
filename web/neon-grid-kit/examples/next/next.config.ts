import type { NextConfig } from 'next';
import { fileURLToPath } from 'node:url';

const config: NextConfig = {
  transpilePackages: ['@neon-grid/kit-react', '@neon-grid/kit-core'],
  turbopack: { root: fileURLToPath(new URL('../..', import.meta.url)) },
  poweredByHeader: false,
};

export default config;
