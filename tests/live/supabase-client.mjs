// Minimal fetch adapter for the app's real transport. No admin/service-role key.
export function httpClient({ url, key, token = null }) {
  const request = async (path, { method = 'GET', body, headers = {} } = {}) => {
    const response = await fetch(url + path, { method,
      headers: { apikey: key, ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...headers },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal: AbortSignal.timeout(20000) });
    const text = await response.text();
    let data; try { data = text ? JSON.parse(text) : null; } catch { data = null; }
    return response.ok ? { data, error: null, status: response.status }
      : { data: null, error: { code: data?.code || String(response.status), message: data?.message || data?.msg || response.statusText }, status: response.status };
  };
  return { request, rpc: (name, body) => request('/rest/v1/rpc/' + name, { method: 'POST', body }),
    from(table) {
      let select = '*'; const filters = new URLSearchParams();
      const query = () => '/rest/v1/' + table + '?select=' + encodeURIComponent(select) + (filters.size ? '&' + filters : '');
      return { select(value = '*') { select = value; return this; },
        eq(column, value) { filters.set(column, 'eq.' + value); return this; },
        range(from, to) { return request(query(), { headers: { Range: `${from}-${to}` } }); },
        async maybeSingle() { const result = await request(query()); return { ...result, data: result.data?.[0] || null }; },
      };
    } };
}
