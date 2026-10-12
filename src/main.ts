import '@fontsource-variable/inter/wght.css';
import '@fontsource-variable/literata/wght.css';
import '@fontsource-variable/literata/wght-italic.css';
import './app.css';
import './placing.css';
import './settings.css';
import { mount } from 'svelte';
import App from './App.svelte';
import { nameLanguagesBy } from '$lib/editor/schema';
import { languageName } from '$lib/i18n';

nameLanguagesBy(languageName);

const app = mount(App, { target: document.getElementById('app')! });

export default app;
