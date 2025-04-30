import { html } from 'htm/preact';
import { url, username, password, fetchData } from '../store.js';

export default function NavBar() {
  return html`
    <nav class="navbar is-light" role="navigation" aria-label="main navigation">
      <div class="navbar-brand">
        <a class="navbar-item"><strong>RabbitMQ Management</strong></a>
        <a
          role="button"
          class="navbar-burger"
          aria-label="menu"
          aria-expanded="false"
          onClick=${() => {
            const burger = document.querySelector('.navbar-burger');
            const menu = document.getElementById('navbarMenu');
            burger.classList.toggle('is-active');
            menu.classList.toggle('is-active');
          }}
        >
          <span aria-hidden="true"></span>
          <span aria-hidden="true"></span>
          <span aria-hidden="true"></span>
        </a>
      </div>

      <div id="navbarMenu" class="navbar-menu">
        <div class="navbar-end">
          <div class="navbar-item">
            <input
              class="input"
              type="text"
              placeholder="URL"
              value=${url.value}
              onInput=${e => (url.value = e.target.value)}
            />
          </div>
          <div class="navbar-item">
            <input
              class="input"
              type="text"
              placeholder="Username"
              value=${username.value}
              onInput=${e => (username.value = e.target.value)}
            />
          </div>
          <div class="navbar-item">
            <input
              class="input"
              type="password"
              placeholder="Password"
              value=${password.value}
              onInput=${e => (password.value = e.target.value)}
            />
          </div>
          <div class="navbar-item">
            <button class="button is-primary" onClick=${fetchData}>Connect</button>
          </div>
        </div>
      </div>
    </nav>
  `;
}