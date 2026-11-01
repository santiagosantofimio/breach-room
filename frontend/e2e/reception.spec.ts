import { expect, test, type Page } from "@playwright/test";

async function visit(page: Page, path: string) {
  await page.getByRole("textbox", { name: "Path" }).fill(path);
  await page.getByRole("button", { name: "Send" }).click();
}

test("a player solves Reception with the toolkit alone", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Unwind the string" }).click();
  await page.getByRole("button", { name: "Report to Reception" }).click();
  await expect(page.getByRole("heading", { name: "Reception" })).toBeVisible();

  await visit(page, "/api/rooms/recon/robots.txt");
  const robots = await page.locator(".kit__code").first().textContent();
  const hiddenPath = robots?.match(/Disallow:\s*(\S+)/)?.[1] ?? "";
  expect(hiddenPath).not.toBe("");

  await visit(page, hiddenPath);
  const debugHeader = page.locator(".response__headers > div", { hasText: "x-kryptelia-debug" }).locator("dd");
  const flag = await debugHeader.textContent();
  expect(flag).toMatch(/^BREACH\{recon-[0-9a-f]{16}}$/);

  await page.getByRole("textbox", { name: "Flag" }).fill(flag ?? "");
  await page.getByRole("button", { name: "File the flag" }).click();

  await expect(page.getByRole("img", { name: "Department cleared" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Compliance review" })).toBeVisible();
  await expect(page.getByText("A02:2025 Security Misconfiguration")).toBeVisible();
});

test("a wrong flag keeps the door closed", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Unwind the string" }).click();
  await page.getByRole("button", { name: "Report to Reception" }).click();

  await page.getByRole("textbox", { name: "Flag" }).fill("BREACH{recon-0000000000000000}");
  await page.getByRole("button", { name: "File the flag" }).click();

  await expect(page.getByRole("alert")).toContainText("does not belong to this department");
  await expect(page.getByRole("img", { name: "Department cleared" })).toBeHidden();
});
