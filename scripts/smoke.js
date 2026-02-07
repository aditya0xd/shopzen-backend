require('dotenv').config();

const fetch = global.fetch;

const PORT = process.env.PORT || 5000;
const BASE = `http://localhost:${PORT}`;

const log = (label, obj) => console.log(`\n=== ${label} ===\n`, typeof obj === 'string' ? obj : JSON.stringify(obj, null, 2));

const run = async () => {
  try {
    const h = await fetch(`${BASE}/health`);
    log('health', await h.json());

    const p = await fetch(`${BASE}/api/v1/products`);
    log('products', await p.json());

    const email = `smoke+${Date.now()}@example.com`;
    const password = 'password123';

    const reg = await fetch(`${BASE}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    log('register status', { status: reg.status });
    const regBody = await reg.json().catch(() => null);
    log('register body', regBody);

    const login = await fetch(`${BASE}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    log('login status', { status: login.status });
    const loginBody = await login.json().catch(() => null);
    log('login body', loginBody);

    if (loginBody && loginBody.accessToken) {
      const me = await fetch(`${BASE}/api/v1/auth/me`, {
        headers: { Authorization: `Bearer ${loginBody.accessToken}` }
      });
      log('me status', { status: me.status });
      const meBody = await me.json().catch(() => null);
      log('me body', meBody);
    } else {
      console.error('No access token received, skipping /me test');
      process.exit(1);
    }

    console.log('\nSmoke tests completed');
    process.exit(0);
  } catch (err) {
    console.error('Smoke test error:', err);
    process.exit(2);
  }
};

run();
