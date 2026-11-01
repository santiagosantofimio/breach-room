import { expect, test, type Page } from "@playwright/test";

const SOLVED_BEFORE_DIAGNOSTICS = ["recon", "checkout", "cookiejar", "idor", "sqli", "xss", "traversal", "jwt"];

async function openDiagnostics(page: Page) {
  await page.addInitScript((solvedRooms) => {
    if (localStorage.getItem("breach-room.progress") === null) {
      localStorage.setItem(
        "breach-room.progress",
        JSON.stringify({ startedAt: Date.now() - 600_000, solvedRooms, hintsUsed: { recon: 1 } }),
      );
    }
  }, SOLVED_BEFORE_DIAGNOSTICS);
  await page.goto("/");
  await page.getByRole("button", { name: "Unwind the string" }).click();
  await page.getByRole("button", { name: "Return to your desk" }).click();
  await expect(page.getByRole("heading", { name: "Diagnostics" })).toBeVisible();
}

async function pingFromRepeater(page: Page, host: string) {
  await page.getByRole("button", { name: "Repeater" }).click();
  await page.getByLabel("Method").selectOption("POST");
  await page.getByRole("textbox", { name: "Path" }).fill("/api/rooms/cmdinjection/ping");
  await page.getByRole("textbox", { name: "Body" }).fill(JSON.stringify({ host }));
  await page.getByRole("button", { name: "Send" }).click();
}

test("the last room leads to a final screen with a downloadable card", async ({ page }) => {
  await openDiagnostics(page);

  await pingFromRepeater(page, "127.0.0.1; cat /vault/escape.key");
  const report = page.locator(".kit__code").last();
  await expect(report).toContainText("BREACH{cmdinjection-");
  const flag = (await report.textContent())?.match(/BREACH\{[^}]+}/)?.[0] ?? "";

  await page.getByRole("textbox", { name: "Flag" }).fill(flag);
  await page.getByRole("button", { name: "File the flag" }).click();
  await page.getByRole("button", { name: "Leave the building" }).click();

  await expect(page.getByRole("heading", { name: "You are out" })).toBeVisible();
  await expect(page.getByText("Senior Door Consultant")).toBeVisible();

  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download the evidence" }).click();
  expect((await download).suggestedFilename()).toBe("breach-room-escape.png");

  const canvasSize = await page
    .locator(".finale__card")
    .evaluate((canvas: HTMLCanvasElement) => [canvas.width, canvas.height, canvas.toDataURL().length]);
  expect(canvasSize.slice(0, 2)).toEqual([1200, 630]);
  expect(canvasSize[2]).toBeGreaterThan(20_000);
});

test("a finished game can be played again from the start", async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem("seeded") === null) {
      sessionStorage.setItem("seeded", "1");
      localStorage.setItem(
        "breach-room.progress",
        JSON.stringify({
          startedAt: 1_000,
          finishedAt: 601_000,
          solvedRooms: ["recon", "checkout", "cookiejar", "idor", "sqli", "xss", "traversal", "jwt", "cmdinjection"],
          hintsUsed: {},
        }),
      );
    }
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Unwind the string" }).click();
  await page.getByRole("button", { name: "Return to your desk" }).click();

  await expect(page.getByText("Chief Exit Officer")).toBeVisible();
  await page.getByRole("button", { name: "Get misrouted again" }).click();

  await page.getByRole("button", { name: "Unwind the string" }).click();
  await expect(page.getByRole("button", { name: "Report to Reception" })).toBeVisible();
});
