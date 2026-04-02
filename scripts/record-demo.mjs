import { mkdirSync, readdirSync, renameSync, writeFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "playwright";

const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const baseUrl = process.env.DEMO_BASE_URL || "http://127.0.0.1:3000";
const demoDir = resolve(process.cwd(), "demo");
const rawVideoDir = resolve(demoDir, "raw-videos");
mkdirSync(rawVideoDir, { recursive: true });

function latestDemoAccountsPath() {
  const files = readdirSync(demoDir)
    .filter((file) => file.startsWith("demo-accounts-") && file.endsWith(".json"))
    .sort();
  const latest = files.at(-1);
  if (!latest) {
    throw new Error("No demo account file found in /demo.");
  }
  return resolve(demoDir, latest);
}

const demoAccounts = JSON.parse(await readFile(latestDemoAccountsPath(), "utf8"));

async function pause(page, ms) {
  await page.waitForTimeout(ms);
}

async function waitForWorkspace(page) {
  await page.waitForLoadState("domcontentloaded");
  await page.locator("text=CAREPATH").first().waitFor({ state: "visible", timeout: 15000 });

  const contentTargets = [
    page.locator("text=Organizations").first(),
    page.locator("text=Caseload").first(),
    page.locator("text=Threads").first(),
    page.locator("text=My Threads").first(),
    page.locator("text=Create a Client Note").first(),
    page.locator("text=Send a Note").first(),
    page.locator("text=Notes").first(),
  ];

  await Promise.any(
    contentTargets.map((target) => target.waitFor({ state: "visible", timeout: 15000 }))
  );
  await pause(page, 1200);
}

async function login(page, email, password) {
  await page.goto(`${baseUrl}/login`, { waitUntil: "networkidle" });
  await page.locator('[data-login-ready="true"]').waitFor({ state: "visible", timeout: 15000 });
  await pause(page, 600);
  await page.locator('input[type="email"]').first().fill(email);
  await pause(page, 200);
  await page.locator('input[type="password"]').first().fill(password);
  await pause(page, 200);
  await page.getByRole("button", { name: "Sign In" }).click();
  await page.waitForFunction(() => window.location.pathname === "/interactions", null, {
    timeout: 20000,
  });
  await waitForWorkspace(page);
}

function newestVideo() {
  return readdirSync(rawVideoDir)
    .filter((file) => file.endsWith(".webm"))
    .map((file) => resolve(rawVideoDir, file))
    .sort()
    .at(-1);
}

async function recordProviderFlow(browser) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 960 },
    recordVideo: { dir: rawVideoDir, size: { width: 1440, height: 960 } },
  });
  const page = await context.newPage();

  console.log("Recording provider flow...");
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await pause(page, 1800);
  await login(page, demoAccounts.provider.email, demoAccounts.provider.password);

  await page.goto(`${baseUrl}/team`, { waitUntil: "networkidle" });
  await waitForWorkspace(page);

  await page.goto(`${baseUrl}/players`, { waitUntil: "networkidle" });
  await waitForWorkspace(page);

  await page.goto(`${baseUrl}/interactions`, { waitUntil: "networkidle" });
  await waitForWorkspace(page);

  await page.goto(`${baseUrl}/players/${demoAccounts.clients[0].clientId}/interactions`, {
    waitUntil: "networkidle",
  });
  await waitForWorkspace(page);

  await page.goto(`${baseUrl}/interactions/new`, { waitUntil: "networkidle" });
  await waitForWorkspace(page);

  await context.close();
  const videoPath = newestVideo();
  if (!videoPath) throw new Error("Provider video was not created.");
  const finalPath = resolve(demoDir, "provider-demo.webm");
  renameSync(videoPath, finalPath);
  return finalPath;
}

async function recordClientFlow(browser) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 960 },
    recordVideo: { dir: rawVideoDir, size: { width: 1440, height: 960 } },
  });
  const page = await context.newPage();
  const client = demoAccounts.clients[0];

  console.log("Recording client flow...");
  await login(page, client.email, client.password);

  await page.goto(`${baseUrl}/interactions`, { waitUntil: "networkidle" });
  await waitForWorkspace(page);

  await page.goto(`${baseUrl}/players/${client.clientId}/interactions`, { waitUntil: "networkidle" });
  await waitForWorkspace(page);

  await page.goto(`${baseUrl}/interactions/new`, { waitUntil: "networkidle" });
  await waitForWorkspace(page);

  await context.close();
  const videoPath = newestVideo();
  if (!videoPath) throw new Error("Client video was not created.");
  const finalPath = resolve(demoDir, "client-demo.webm");
  renameSync(videoPath, finalPath);
  return finalPath;
}

async function main() {
  const browser = await chromium.launch({
    executablePath: chromePath,
    headless: true,
  });

  const providerVideo = await recordProviderFlow(browser);
  const clientVideo = await recordClientFlow(browser);
  await browser.close();

  const manifestPath = resolve(demoDir, "demo-video-manifest.json");
  writeFileSync(
    manifestPath,
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        providerVideo,
        clientVideo,
      },
      null,
      2
    )}\n`,
    "utf8"
  );

  console.log(`Recorded provider clip: ${providerVideo}`);
  console.log(`Recorded client clip: ${clientVideo}`);
  console.log(`Saved manifest to ${manifestPath}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
