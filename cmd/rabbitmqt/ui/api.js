/**
 * API Service: handles HTTP calls to RabbitMQ Management API via proxy.
 */
export default class ApiService {
  /**
   * @param {Object} config
   * @param {import('@preact/signals').Signal<string>} config.urlSignal - Base URL signal.
   * @param {import('@preact/signals').Signal<string>} config.usernameSignal - Username signal.
   * @param {import('@preact-signals').Signal<string>} config.passwordSignal - Password signal.
   * @param {import('@preact-signals').Signal<boolean>} config.fastModeSignal - Fast mode toggle signal.
   */
  constructor({ urlSignal, usernameSignal, passwordSignal, fastModeSignal }) {
    this.urlSignal = urlSignal;
    this.usernameSignal = usernameSignal;
    this.passwordSignal = passwordSignal;
    this.fastModeSignal = fastModeSignal;
  }

  /**
   * Proxy API GET requests with Basic Auth and optional fast mode parameters.
   * @param {string} path - API endpoint path (e.g., '/api/overview').
   * @param {Object<string, string>} [extraHeaders] - Optional additional headers to include.
   * @returns {Promise<Response>}
   */
  async proxyFetch(path, extraHeaders = {}) {
    const base = this.urlSignal.value.replace(/\/$/, '');
    let fullPath = base + path;
    if (this.fastModeSignal.value && !path.startsWith('/api/channels')) {
      const fastParams = 'enable_queue_totals=true&disable_stats=true';
      fullPath += (fullPath.includes('?') ? '&' : '?') + fastParams;
    }
    const prefix = typeof window !== 'undefined'
      ? window.location.pathname.replace(/\/$/, '')
      : '';
    const proxyUrl = `${prefix}/proxy/${fullPath}`;
    const headers = {};
    if (this.usernameSignal.value) {
      headers['Authorization'] = 'Basic ' + btoa(
        this.usernameSignal.value + ':' + this.passwordSignal.value
      );
    }
    for (const [k, v] of Object.entries(extraHeaders)) {
      if (v != null) headers[k] = v;
    }
    const res = await fetch(proxyUrl, { method: 'GET', headers });
    if (!res.ok) {
      if (res.status === 400) {
        let errJson = null;
        try { errJson = await res.clone().json(); } catch (_) {}
        if (errJson && errJson.error === 'page_out_of_range') {
          return res;
        }
      }
      let errMsg;
      try {
        const errObj = await res.clone().json();
        errMsg = errObj.reason || errObj.error || `${res.status} ${res.statusText}`;
      } catch (_) {
        errMsg = `${res.status} ${res.statusText}`;
      }
      throw new Error(errMsg);
    }
    return res;
  }

  /**
   * Fetch overview data from /api/overview.
   * @returns {Promise<any>} Parsed JSON overview data.
   */
  async fetchOverview() {
    const res = await this.proxyFetch('/api/overview');
    return res.json();
  }

  /**
   * Fetch virtual hosts list from /api/vhosts.
   * @returns {Promise<string[]>} Array of vhost names.
   */
  async fetchVhosts() {
    const res = await this.proxyFetch('/api/vhosts');
    return res.json();
  }
}