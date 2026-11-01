import { expect, test, type Page } from "@playwright/test";

const SOLVED_BEFORE_ACCESS_CONTROL = ["recon", "checkout", "cookiejar", "idor", "sqli", "xss", "traversal"];
const DIRECTOR_PAYLOAD = '{"sub":"contractor-1043","role":"director"}';

async function openAccessControl(page: Page) {
  await page.addInitScript((solvedRooms) => {
    localStorage.setItem(
      "breach-room.progress",
      JSON.stringify({ startedAt: Date.now(), solvedRooms, hintsUsed: {} }),
    );
  }, SOLVED_BEFORE_ACCESS_CONTROL);
  await page.goto("/");
  await page.getByRole("button", { name: "Unwind the string" }).click();
  await page.getByRole("button", { name: "Return to your desk" }).click();
  await expect(page.getByRole("heading", { name: "Access Control" })).toBeVisible();
}

async function collectBadge(page: Page): Promise<string> {
  await page.getByRole("button", { name: "Send" }).click();
  const body = page.locator(".kit__code").first();
  await expect(body).toContainText('"token"');
  return JSON.parse((await body.textContent()) ?? "{}").token;
}

const jwtBuilder = (page: Page) => page.locator(".kit__form", { hasText: "Build a JWT" });

async function buildToken(page: Page, algorithm: "none" | "HS256", secret: string): Promise<string> {
  const builder = jwtBuilder(page);
  await page.getByRole("button", { name: "Decoder" }).click();
  await builder.getByLabel("Payload JSON").fill(DIRECTOR_PAYLOAD);
  await builder.getByLabel("Algorithm").selectOption(algorithm);
  await builder.getByLabel("Secret").fill(secret);
  await builder.getByRole("button", { name: "Build" }).click();
  return (await builder.locator(".kit__code").textContent()) ?? "";
}

async function presentAtTheDoor(page: Page, token: string) {
  await page.getByRole("button", { name: "Repeater", exact: true }).click();
  await page.getByRole("textbox", { name: "Path" }).fill("/api/rooms/jwt/door");
  await page.getByRole("textbox", { name: "Headers, one per line" }).fill(`Authorization: Bearer ${token}`);
  await page.getByRole("button", { name: "Send" }).click();
}

async function expectDoorOpens(page: Page) {
  const report = page.locator(".kit__code").filter({ hasText: "DOOR OPEN" });
  await expect(report).toContainText("BREACH{jwt-");
  const flag = (await report.textContent())?.match(/BREACH\{[^}]+}/)?.[0] ?? "";
  await page.getByRole("textbox", { name: "Flag" }).fill(flag);
  await page.getByRole("button", { name: "File the flag" }).click();
  await expect(page.getByRole("img", { name: "Department cleared" })).toBeVisible();
}

test("an unsigned token opens the door", async ({ page }) => {
  await openAccessControl(page);

  await presentAtTheDoor(page, await buildToken(page, "none", ""));

  await expectDoorOpens(page);
});

test("the wordlist cracks the badge and a forged signature opens the door", async ({ page }) => {
  await openAccessControl(page);
  const badge = await collectBadge(page);

  await page.getByRole("button", { name: "Decoder" }).click();
  const cracker = page.locator(".kit__form", { hasText: "Crack a JWT secret" });
  await cracker.getByLabel("Token").fill(badge);
  await cracker.getByRole("button", { name: "Try the wordlist" }).click();
  const result = cracker.locator(".kit__code");
  await expect(result).toContainText("Secret found:");
  const secret = (await result.textContent())?.split(": ")[1] ?? "";

  await presentAtTheDoor(page, await buildToken(page, "HS256", secret));

  await expectDoorOpens(page);
});

test("the issued badge is turned away", async ({ page }) => {
  await openAccessControl(page);
  const badge = await collectBadge(page);

  await presentAtTheDoor(page, badge);

  await expect(page.locator(".kit__code").filter({ hasText: "directors only" })).toBeVisible();
});
