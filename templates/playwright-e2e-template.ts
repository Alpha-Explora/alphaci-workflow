// Template file: dependency modules are installed in tribe repositories, not in central-workflow.
import { chromium, firefox, webkit } from 'playwright';

type BrowserName = 'chromium' | 'firefox' | 'webkit';

const baseUrl: string = process.env.E2E_BASE_URL || 'http://localhost:3000';
const requestedBrowser = (process.env.E2E_BROWSER || 'chromium').toLowerCase();

function resolveBrowser(browserName: string): BrowserName {
  if (browserName === 'firefox' || browserName === 'webkit') {
    return browserName;
  }

  return 'chromium';
}

function launchBrowser(browserName: BrowserName) {
  switch (browserName) {
    case 'firefox':
      return firefox.launch({ headless: true });
    case 'webkit':
      return webkit.launch({ headless: true });
    default:
      return chromium.launch({ headless: true });
  }
}

async function runSmoke(): Promise<void> {
  const browserName = resolveBrowser(requestedBrowser);
  const browser = await launchBrowser(browserName);

  try {
    // A protected Vercel preview answers with a sign-in redirect unless the
    // project's Protection Bypass for Automation secret is sent.
    const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
    const page = await browser.newPage(
      bypass
        ? {
            extraHTTPHeaders: {
              'x-vercel-protection-bypass': bypass,
              'x-vercel-set-bypass-cookie': 'true',
            },
          }
        : {},
    );
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });

    const bodyText = (await page.textContent('body')) || '';
    if (bodyText.trim().length === 0) {
      throw new Error('Smoke check failed: page body text is empty');
    }

    console.log(`Playwright smoke passed on ${browserName} against ${baseUrl}`);
  } finally {
    await browser.close();
  }
}

try {
  await runSmoke();
} catch (error) {
  console.error('Playwright smoke failed');
  console.error(error);
  process.exit(1);
}
