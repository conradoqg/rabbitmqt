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
            <div hidden=${activeTab.value !== 'overview'}><${Overview}/></div>
            <div hidden=${activeTab.value !== 'exchanges'}><${Exchanges}/></div>
            <div hidden=${activeTab.value !== 'queues'}><${Queues}/></div>
          </div>
        </div>
      </section>
    </div>
  `;
}