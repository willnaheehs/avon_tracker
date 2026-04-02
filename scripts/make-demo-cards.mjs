import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

const outDir = resolve(process.cwd(), "demo", "cards");
mkdirSync(outDir, { recursive: true });

const cards = [
  {
    name: "intro",
    eyebrow: "CarePath Demo",
    title: "Provider and client workflows",
    body: "A quick walkthrough of organizations, caseload, and secure note threads.",
    accent: "#0f8df4",
    secondary: "#69c931",
  },
  {
    name: "client",
    eyebrow: "Client Experience",
    title: "Updates flow both ways",
    body: "Clients can review thread history and send clean progress updates back to care teams.",
    accent: "#69c931",
    secondary: "#0f8df4",
  },
  {
    name: "outro",
    eyebrow: "CarePath",
    title: "Built for modern rehab communication",
    body: "Organizations, caseload visibility, and note threads in one calm workspace.",
    accent: "#0f8df4",
    secondary: "#ffbf1f",
  },
];

function html(card) {
  return `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <style>
        * { box-sizing: border-box; }
        body {
          margin: 0;
          width: 1440px;
          height: 960px;
          font-family: Arial, Helvetica, sans-serif;
          background:
            radial-gradient(circle at top left, rgba(14,145,255,0.28), transparent 30%),
            radial-gradient(circle at 78% 22%, rgba(105,201,49,0.24), transparent 28%),
            linear-gradient(140deg, #ecf8ff 0%, #dbf5ee 42%, #fbfbea 100%);
          color: #16322a;
          overflow: hidden;
        }
        .frame {
          width: 100%;
          height: 100%;
          padding: 72px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
        }
        .logo-shell {
          background: rgba(255,255,255,0.82);
          border: 1px solid rgba(255,255,255,0.9);
          border-radius: 40px;
          box-shadow: 0 24px 80px rgba(12,83,121,0.16);
          backdrop-filter: blur(10px);
          padding: 28px 34px;
        }
        .logo-shell img {
          width: 620px;
          height: auto;
          display: block;
        }
        .eyebrow {
          margin-top: 42px;
          padding: 10px 18px;
          border-radius: 999px;
          font-size: 20px;
          font-weight: 800;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: ${card.accent};
          background: rgba(255,255,255,0.74);
        }
        h1 {
          margin: 28px 0 0;
          font-size: 68px;
          line-height: 1.05;
          font-weight: 900;
          max-width: 1100px;
        }
        p {
          margin: 24px 0 0;
          max-width: 940px;
          font-size: 31px;
          line-height: 1.5;
          color: #406657;
        }
        .bar {
          display: flex;
          gap: 14px;
          margin-top: 34px;
        }
        .pill {
          padding: 12px 18px;
          border-radius: 999px;
          font-size: 20px;
          font-weight: 700;
          background: rgba(255,255,255,0.82);
          color: #315447;
          box-shadow: 0 8px 20px rgba(12,83,121,0.08);
        }
        .accent { color: ${card.secondary}; }
      </style>
    </head>
    <body>
      <div class="frame">
        <div class="logo-shell">
          <img src="file://${resolve(process.cwd(), "public", "CarePath.png")}" alt="CarePath logo" />
        </div>
        <div class="eyebrow">${card.eyebrow}</div>
        <h1>${card.title}</h1>
        <p>${card.body}</p>
        <div class="bar">
          <div class="pill">Organizations</div>
          <div class="pill">Caseload</div>
          <div class="pill accent">Secure notes</div>
        </div>
      </div>
    </body>
  </html>`;
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 960 }, deviceScaleFactor: 1 });

for (const card of cards) {
  await page.setContent(html(card), { waitUntil: "networkidle" });
  await page.screenshot({ path: resolve(outDir, `${card.name}.png`) });
}

await browser.close();
console.log(`Saved demo cards to ${outDir}`);
