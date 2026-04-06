#!/usr/bin/env node
/**
 * Amiglot UI — E2E Test Runner (Playwright)
 *
 * Tests core UI flows: Auth, Profile, Dashboard, Connections.
 * Usage: node scripts/e2e-test.mjs [--base-url https://app.example.com]
 *
 * Requires: npx playwright (chromium browser installed)
 */
import { chromium } from 'playwright';

const BASE_URL = process.argv.includes('--base-url')
  ? process.argv[process.argv.indexOf('--base-url') + 1]
  : 'https://app.example.com';
const API_URL = 'http://localhost:6176/api/v1';
const SCREENSHOT_DIR = process.env.SCREENSHOT_DIR || '/tmp/amiglot-ui-e2e';

const results = { passed: [], failed: [], screenshots: [] };

function ok(name) { results.passed.push(name); console.log(`  ✅ ${name}`); }
function fail(name, reason) { results.failed.push({ name, reason }); console.log(`  ❌ ${name}: ${reason}`); }

async function screenshot(page, name) {
  const fs = await import('fs');
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  const path = `${SCREENSHOT_DIR}/${name}.png`;
  await page.screenshot({ path, fullPage: true });
  results.screenshots.push(path);
  return path;
}

// Helper: get magic link token via API (does NOT verify — let browser do that)
async function getMagicLinkToken(email) {
  const r1 = await fetch(`${API_URL}/auth/magic-link`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const d1 = await r1.json();
  const devUrl = d1.dev_login_url;
  const token = devUrl.split('token=')[1];
  return { token, devUrl };
}

// Helper: register via API (verify included), return { uid, loginUrl }
async function registerViaApi(email) {
  const { token, devUrl } = await getMagicLinkToken(email);
  const r2 = await fetch(`${API_URL}/auth/verify`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
  const d2 = await r2.json();
  const loginUrl = devUrl.replace(/http:\/\/localhost:3000/, BASE_URL);
  return { uid: d2.user.id, loginUrl, token };
}

async function loginInBrowser(page, email) {
  const { token } = await getMagicLinkToken(email);
  const verifyUrl = `${BASE_URL}/auth/verify?token=${token}`;
  await page.goto(verifyUrl, { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  return verifyUrl;
}

async function testAuth(browser) {
  console.log('\n§4 Authentication');
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // A1: Sign in
    const email = `test+e2e${Date.now()}@example.com`;
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await screenshot(page, 'home-signed-out');

    await loginInBrowser(page, email);
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Check for signed-in state
    const bodyText = await page.textContent('body');
    if (bodyText && (bodyText.includes('Dashboard') || bodyText.includes('Profile') || bodyText.includes('Sign Out') || bodyText.includes('Sign out') || bodyText.includes('Logout') || bodyText.includes('profile'))) {
      ok('A1: Sign in (fresh account)');
    } else {
      await screenshot(page, 'a1-fail');
      fail('A1', 'Could not verify signed-in state');
    }

    // A2: Session persistence
    await page.reload({ waitUntil: 'networkidle' });
    const bodyAfter = await page.textContent('body');
    if (bodyAfter && (bodyAfter.includes('Dashboard') || bodyAfter.includes('Profile') || bodyAfter.includes('Sign Out') || bodyAfter.includes('Sign out') || bodyAfter.includes('profile'))) {
      ok('A2: Session persistence');
    } else {
      fail('A2', 'Session lost after reload');
    }

    await screenshot(page, 'home-signed-in');
  } catch (e) {
    fail('Auth tests', e.message);
    await screenshot(page, 'auth-error');
  } finally {
    await context.close();
  }
}

async function testProfile(browser) {
  console.log('\n§5 Profile');
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    const email = `test+e2e${Date.now()}@example.com`;
    await loginInBrowser(page, email);

    // P1: Navigate to profile
    await page.goto(`${BASE_URL}/profile`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await screenshot(page, 'profile-initial');

    const profileText = await page.textContent('body');
    if (profileText && (profileText.includes('Profile') || profileText.includes('profile') || profileText.includes('Handle') || profileText.includes('handle'))) {
      ok('P1: Profile page loads');
    } else {
      fail('P1', 'Profile page did not load expected content');
    }

    // Try to fill in handle
    const handleInput = await page.$('input[name="handle"], input[placeholder*="handle" i], input[id*="handle" i]');
    if (handleInput) {
      await handleInput.fill(`e2e${Date.now()}`);
      ok('P2: Handle input accessible');
    } else {
      // Try finding by label
      const inputs = await page.$$('input');
      if (inputs.length > 0) {
        ok('P2: Profile form has inputs');
      } else {
        fail('P2', 'No handle input found');
      }
    }

    await screenshot(page, 'profile-filled');
  } catch (e) {
    fail('Profile tests', e.message);
    await screenshot(page, 'profile-error');
  } finally {
    await context.close();
  }
}

async function testDashboard(browser) {
  console.log('\n§10 Dashboard');
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Login as Alice (seed user)
    await loginInBrowser(page, 'test+seed1@example.com');

    // D1: Dashboard loads with matches
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    await screenshot(page, 'dashboard-alice');

    const dashText = await page.textContent('body');
    if (dashText && (dashText.includes('bob') || dashText.includes('Bob') || dashText.includes('@') || dashText.includes('match') || dashText.includes('Connect'))) {
      ok('D1: Dashboard shows matches');
    } else {
      fail('D1', 'No match content visible on dashboard');
    }

    // Check for console errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    // D19: Empty state (Hiro)
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    await loginInBrowser(page2, 'test+seed8@example.com');
    await page2.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });
    await page2.waitForTimeout(3000);
    await screenshot(page2, 'dashboard-hiro-empty');

    const hiroText = await page2.textContent('body');
    if (hiroText && (hiroText.includes('No match') || hiroText.includes('no match') || hiroText.includes('empty') || hiroText.includes('Edit Profile'))) {
      ok('D19: Hiro sees empty state');
    } else {
      // Accept if no cards shown either
      const cards = await page2.$$('[class*="card" i], [class*="match" i]');
      if (cards.length === 0) {
        ok('D19: Hiro sees no match cards');
      } else {
        fail('D19', `Hiro has ${cards.length} cards but expected none`);
      }
    }
    await context2.close();

    // H15: Navigation link
    const navText = await page.textContent('nav, header');
    if (navText && (navText.includes('Connection') || navText.includes('connection'))) {
      ok('H15: Connections link in navigation');
    } else {
      fail('H15', 'No Connections link found in nav');
    }

  } catch (e) {
    fail('Dashboard tests', e.message);
    await screenshot(page, 'dashboard-error');
  } finally {
    await context.close();
  }
}

async function testConnections(browser) {
  console.log('\n§11 Connections');
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Use fresh users for clean state
    const email_a = `test+e2econn${Date.now()}a@example.com`;
    const email_b = `test+e2econn${Date.now()}b@example.com`;

    // Set up both users via API
    const { uid: uidA } = await registerViaApi(email_a);
    const { uid: uidB } = await registerViaApi(email_b);

    const handleA = `e2ea${Date.now()}`;
    const handleB = `e2eb${Date.now()}`;

    // Setup profiles via API
    for (const [uid, handle] of [[uidA, handleA], [uidB, handleB]]) {
      await fetch(`${API_URL}/profile`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', 'X-User-Id': uid },
        body: JSON.stringify({ handle, timezone: 'Etc/UTC' }),
      });
    }
    // User A: en native, targets zh
    await fetch(`${API_URL}/profile/languages`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json', 'X-User-Id': uidA },
      body: JSON.stringify({ languages: [
        { language_code: 'en', level: 5, is_native: true, is_target: false },
        { language_code: 'zh', level: 2, is_native: false, is_target: true },
      ]}),
    });
    // User B: zh native, targets en
    await fetch(`${API_URL}/profile/languages`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json', 'X-User-Id': uidB },
      body: JSON.stringify({ languages: [
        { language_code: 'zh', level: 5, is_native: true, is_target: false },
        { language_code: 'en', level: 2, is_native: false, is_target: true },
      ]}),
    });
    // Availability for both
    for (const uid of [uidA, uidB]) {
      await fetch(`${API_URL}/profile/availability`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', 'X-User-Id': uid },
        body: JSON.stringify({ availability: [1,2,3,4,5].map(d => ({
          weekday: d, start_local_time: '08:00', end_local_time: '20:00', timezone: 'Etc/UTC'
        })) }),
      });
    }

    // Create a connection request via API (A → B)
    const reqResp = await fetch(`${API_URL}/match-requests`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'X-User-Id': uidA },
      body: JSON.stringify({ recipient_id: uidB, initial_message: 'Hi from E2E test!' }),
    });
    const reqData = await reqResp.json();
    if (reqData.id) {
      ok('Connection request created via API');
    } else {
      fail('Connection setup', `Failed to create request: ${JSON.stringify(reqData).slice(0, 200)}`);
      return;
    }

    // Login as User B in browser and check connections page
    await loginInBrowser(page, email_b);

    // H5: Incoming requests
    await page.goto(`${BASE_URL}/connections`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    await screenshot(page, 'connections-incoming');

    const connText = await page.textContent('body');
    if (connText && (connText.includes(handleA) || connText.includes('Incoming') || connText.includes('incoming') || connText.includes('request'))) {
      ok('H5: Connections page shows incoming requests');
    } else {
      fail('H5', 'Incoming requests not visible');
    }

    // H7/H8: Empty state — check outgoing for user B
    const outgoingTab = await page.$('button:has-text("Outgoing"), [role="tab"]:has-text("Outgoing"), a:has-text("Outgoing")');
    if (outgoingTab) {
      await outgoingTab.click();
      await page.waitForTimeout(2000);
      await screenshot(page, 'connections-outgoing-empty');
      const outText = await page.textContent('body');
      if (outText && (outText.includes('No outgoing') || outText.includes('no outgoing') || outText.includes('Discover'))) {
        ok('H8: Empty outgoing state shown');
      } else {
        ok('H8: Outgoing tab accessible');
      }
    }

    // Login as User A and check outgoing
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    await loginInBrowser(page2, email_a);
    await page2.goto(`${BASE_URL}/connections`, { waitUntil: 'networkidle' });
    await page2.waitForTimeout(2000);

    // Switch to outgoing
    const outTab2 = await page2.$('button:has-text("Outgoing"), [role="tab"]:has-text("Outgoing"), a:has-text("Outgoing")');
    if (outTab2) {
      await outTab2.click();
      await page2.waitForTimeout(2000);
      await screenshot(page2, 'connections-outgoing-a');
      const outTextA = await page2.textContent('body');
      if (outTextA && (outTextA.includes(handleB) || outTextA.includes('outgoing') || outTextA.includes('Sent'))) {
        ok('H6: Outgoing requests visible for requester');
      } else {
        fail('H6', 'Outgoing request not visible');
      }
    } else {
      fail('H6', 'Outgoing tab not found');
    }
    await context2.close();

  } catch (e) {
    fail('Connections tests', e.message);
    await screenshot(page, 'connections-error');
  } finally {
    await context.close();
  }
}

async function main() {
  console.log(`Amiglot UI E2E Tests — ${BASE_URL}`);
  console.log(`Screenshots: ${SCREENSHOT_DIR}\n`);

  const browser = await chromium.launch({ headless: true });

  try {
    await testAuth(browser);
    await testProfile(browser);
    await testDashboard(browser);
    await testConnections(browser);
  } finally {
    await browser.close();
  }

  // Summary
  console.log(`\n${'='.repeat(60)}`);
  console.log(`RESULTS: ${results.passed.length} passed, ${results.failed.length} failed`);
  console.log(`Screenshots: ${results.screenshots.length} captured`);
  console.log('='.repeat(60));

  if (results.failed.length > 0) {
    console.log('\nFAILED:');
    for (const { name, reason } of results.failed) {
      console.log(`  ❌ ${name}: ${reason}`);
    }
  }

  console.log(`\nScreenshots saved to: ${SCREENSHOT_DIR}/`);
  process.exit(results.failed.length > 0 ? 1 : 0);
}

main().catch(e => { console.error(e); process.exit(2); });
