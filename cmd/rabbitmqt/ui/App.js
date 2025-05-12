import { html } from 'htm/preact';
import { activeTab, theme, toggleTheme, fastMode } from './store.js';
import { NavBar, Tabs, Toasts } from './components/Layout.js';
import { Overview, Vhosts, Exchanges, Queues, Connections, Channels, Policies, Limits } from './components/Pages.js';

/**
 * App component: root of the RabbitMQT UI.
 * Renders toast notifications, navigation bar, tabs, and page views based on the activeTab state.
 * Utilizes Preact and HTM for component rendering.
 */
export default function App() {
  return html`
  <div class="flex flex-col min-h-screen">
      <${Toasts}/>
      <${NavBar}/>

      <section class="py-6 flex-grow">
        <div class="w-full px-4">
          <${Tabs}/>

          <div class="m-4">
            <div hidden=${activeTab.value !== 'overview'}><${Overview}/></div>
            <div hidden=${activeTab.value !== 'vhosts'}><${Vhosts}/></div>
            <div hidden=${activeTab.value !== 'connections'}><${Connections}/></div>
            <div hidden=${activeTab.value !== 'channels'}>${!fastMode.value ? html`<${Channels}/>` : 'Not available in fast mode'}</div>
            <div hidden=${activeTab.value !== 'exchanges'}><${Exchanges}/></div>
            <div hidden=${activeTab.value !== 'queues'}><${Queues}/></div>
            <div hidden=${activeTab.value !== 'policies'}><${Policies}/></div>
            <div hidden=${activeTab.value !== 'limits'}><${Limits}/></div>
          </div>
        </div>
      </section>
      <footer class="flex items-center justify-center gap-2 text-xs text-gray-500 py-2">
        <span>Made with <i class="mdi mdi-heart text-red-500"></i> by Conrado</span>
        <button
          class="btn btn-ghost btn-xs p-1"
          type="button"
          title="Toggle dark/light mode"
          onClick=${toggleTheme}
        >
          <i class=${`mdi ${theme.value === 'dark' ? 'mdi-weather-sunny' : 'mdi-weather-night'} text-xs`}></i>
        </button>
      </footer>
    </div>
  `;
}