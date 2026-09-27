import { mount } from 'svelte';
import '@neon-grid/kit-core/theme.css';
import App from './App.svelte';

const target = document.getElementById('app');
if (!target) throw new Error('Missing Svelte mount element');

export default mount(App, { target });
