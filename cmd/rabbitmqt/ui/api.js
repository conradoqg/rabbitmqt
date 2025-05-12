/**
 * api.js - API Service for RabbitMQT UI.
 *
 * Provides methods to proxy HTTP requests from the web UI to the RabbitMQ Management HTTP API.
 * Supports GET and generic requests, authentication via Basic Auth, fast mode parameters,
 * list fetching with pagination, and convenience methods (e.g., purging queues, fetching resources).
 *
 * @example
 * const api = new ApiService({ urlSignal, usernameSignal, passwordSignal, fastModeSignal });
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
   * Generic request via proxy for methods other than GET (e.g., DELETE).
   * @param {string} method - HTTP method.
   * @param {string} path - API endpoint path.
   * @param {Object<string, string>} [extraHeaders] - Optional headers.
   * @returns {Promise<Response>}
   */
  async request(method, path, extraHeaders = {}) {
    const base = this.urlSignal.value.replace(/\/$/, '');
    let fullPath = base + path;
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
    const res = await fetch(proxyUrl, { method, headers });
    if (!res.ok) {
      let errMsg;
      try {
        errMsg = await res.text() || `${res.status} ${res.statusText}`;
      } catch {
        errMsg = `${res.status} ${res.statusText}`;
      }
      throw new Error(errMsg);
    }
    return res;
  }

  /**
   * Purge all messages from a queue.
   * @param {string} vhost - Virtual host name.
   * @param {string} queueName - Name of the queue.
   * @returns {Promise<void>} resolved when deletion succeeds.
   */
  async purgeQueue(vhost, queueName) {
    const encVh = vhost === '/' ? '%252F' : encodeURIComponent(vhost);
    const encName = encodeURIComponent(queueName);
    const endpoint = `/api/queues/${encVh}/${encName}/contents`;
    await this.request('DELETE', endpoint);
  }

  /**
   * Fetch a paginated, sorted, filtered list for a given resource.
   * @param {string} route - Resource endpoint (e.g., 'queues').
   * @param {Object} [opts] - Query options.
   * @param {string} opts.vhost - Virtual host filter.
   * @param {number} opts.page
   * @param {number} opts.pageSize
   * @param {string} opts.sortField
   * @param {boolean} opts.sortReverse
   * @param {string} opts.searchName
   * @param {boolean} opts.useRegex
   * @returns {Promise<any>} JSON response object.
   */
  async fetchList(route, {
    vhost = 'all',
    page = 1,
    pageSize = 10,
    sortField = 'name',
    sortReverse = false,
    searchName = '',
    useRegex = false,
  } = {}) {
    const extraHeaders = {};
    const encVh = vhost === '/' ? '%252F' : encodeURIComponent(vhost);
    let path;
    if (route === 'connections' || route === 'channels') {
      path = `/api/${route}`;
      if (vhost !== 'all') {
        extraHeaders['X-Vhost'] = vhost;
      }
    } else {
      path = vhost === 'all'
        ? `/api/${route}`
        : `/api/${route}/${encVh}`;
    }
    let params = `?page=${page}&page_size=${pageSize}` +
      `&sort=${sortField}` +
      `&sort_reverse=${sortReverse}`;
    if (searchName) {
      params += `&name=${encodeURIComponent(searchName)}`;
    }
    params += `&use_regex=${useRegex}`;
    const res = await this.proxyFetch(path + params, extraHeaders);
    return res.json();
  }

  /** Resource-specific fetch methods as convenience wrappers **/
  fetchExchanges(opts)   { return this.fetchList('exchanges', opts); }
  fetchQueues(opts)      { return this.fetchList('queues', opts); }
  fetchConnections(opts) { return this.fetchList('connections', opts); }
  fetchChannels(opts)    { return this.fetchList('channels', opts); }

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
  /**
   * Fetch full list of resource items (no pagination), for client-side processing.
   * @param {string} route - Resource endpoint (e.g., 'queues', 'limits').
   * @param {Object} [opts] - Options including vhost filter.
   * @param {string} opts.vhost - Virtual host filter.
   * @returns {Promise<any[]>} Array of items.
   */
  async fetchAll(route, { vhost = 'all' } = {}) {
    let apiRoute = route;
    if (route === 'limits') apiRoute = 'vhost-limits';
    const extraHeaders = {};
    const encVh = vhost === '/' ? '%252F' : encodeURIComponent(vhost);
    let path;
    if (route === 'vhosts') {
      path = vhost === 'all' ? '/api/vhosts' : `/api/vhosts/${encVh}`;
    } else if (
      apiRoute === 'connections' ||
      apiRoute === 'channels' ||
      apiRoute === 'policies' ||
      apiRoute === 'vhost-limits'
    ) {
      path = `/api/${apiRoute}`;
      if (vhost !== 'all') extraHeaders['X-Vhost'] = vhost;
    } else {
      path = vhost === 'all' ? `/api/${route}` : `/api/${route}/${encVh}`;
    }
    const res = await this.proxyFetch(path, extraHeaders);
    const jsonData = await res.json();
    // Extract items array; wrap single object into array for vhosts endpoint
    let items;
    if (route === 'vhosts') {
      items = Array.isArray(jsonData) ? jsonData : [jsonData];
    } else {
      items = Array.isArray(jsonData) ? jsonData : (jsonData.items || []);
    }
    // For limits endpoint, use vhost as the name property for client-side search
    if (route === 'limits') {
      items = items.map(item => ({ ...item, name: item.vhost }));
    }
    return items;
  }
}