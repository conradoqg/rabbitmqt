import { html } from 'htm/preact';
import { activeTab } from './store.js';
import { NavBar, Tabs, Toasts } from './components/Layout.js';
import Overview from './components/Overview.js';
import { Exchanges, Queues, Connections, Channels } from './components/Pages.js';

export default function App() {
  return html`
    <div class="h-screen flex flex-col">
      <${Toasts}/>
      <${NavBar}/>

      <section class="py-6">
        <div class="w-full px-4">
          <${Tabs}/>

          <div class="m-4">
            <div hidden=${activeTab.value !== 'overview'}><${Overview}/></div>
            <div hidden=${activeTab.value !== 'connections'}><${Connections}/></div>
            <div hidden=${activeTab.value !== 'channels'}><${Channels}/></div>
            <div hidden=${activeTab.value !== 'exchanges'}><${Exchanges}/></div>
            <div hidden=${activeTab.value !== 'queues'}><${Queues}/></div>
          </div>
        </div>
      </section>
    </div>
  `;
}