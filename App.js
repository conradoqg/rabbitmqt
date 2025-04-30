import { html } from 'htm/preact';
import { activeTab } from './store.js';
import NavBar from './components/NavBar.js';
import Tabs from './components/Tabs.js';
import Overview from './components/Overview.js';
import Exchanges from './components/Exchanges.js';
import Queues from './components/Queues.js';

export default function App() {
  return html`
    <div>
      <${NavBar}/>

      <section class="section">
        <div class="container is-fluid">
          <${Tabs}/>

          <div>
            ${activeTab.value === 'overview' && html`<${Overview}/>`}
            ${activeTab.value === 'exchanges' && html`<${Exchanges}/>`}
            ${activeTab.value === 'queues' && html`<${Queues}/>`}
          </div>
        </div>
      </section>
    </div>
  `;
}