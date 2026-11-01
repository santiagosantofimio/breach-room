import { expect, test, type Page } from "@playwright/test";

const SOLVED_BEFORE_MAILBOX = ["recon", "checkout", "cookiejar", "idor", "sqli"];

async function openMailbox(page: Page) {
  await page.addInitScript((solvedRooms) => {
    localStorage.setItem(
      "breach-room.progress",
      JSON.stringify({ startedAt: Date.now(), solvedRooms, hintsUsed: {} }),
    );
  }, SOLVED_BEFORE_MAILBOX);
  await page.goto("/");
  await page.getByRole("button", { name: "Unwind the string" }).click();
  await page.getByRole("button", { name: "Return to your desk" }).click();
  await expect(page.getByRole("heading", { name: "Mailbox" })).toBeVisible();
}

async function searchMail(page: Page, text: string) {
  await page.getByRole("textbox", { name: "Search mail" }).fill(text);
  await page.getByRole("button", { name: "Search", exact: true }).click();
}

const webmail = (page: Page) => page.frameLocator(".mailbox__frame");

test("plain text is only displayed", async ({ page }) => {
  await openMailbox(page);

  await searchMail(page, "payroll");

  await expect(webmail(page).getByText("Results for: payroll")).toBeVisible();
  await expect(page.getByText("The page ran your script")).toBeHidden();
});

test("an injected alert proves execution and yields the flag", async ({ page }) => {
  await openMailbox(page);

  await searchMail(page, "<img src=x onerror=alert(1)>");

  const flag = page.locator(".mailbox__proof .kit__code");
  await expect(flag).toHaveText(/^BREACH\{xss-[0-9a-f]{16}}$/);

  await page.getByRole("textbox", { name: "Flag" }).fill((await flag.textContent()) ?? "");
  await page.getByRole("button", { name: "File the flag" }).click();
  await expect(page.getByRole("img", { name: "Department cleared" })).toBeVisible();
});

test("the injected script cannot reach the game", async ({ page }) => {
  await openMailbox(page);
  const originalTitle = await page.title();

  await searchMail(
    page,
    "<script>try{parent.document.title='breached'}catch(denied){alert(denied.name)}</script>",
  );

  await expect(page.locator(".mailbox__proof")).toBeVisible();
  await expect(page).toHaveTitle(originalTitle);
});

test("the frame keeps an opaque origin", async ({ page }) => {
  await openMailbox(page);

  const frame = page.locator(".mailbox__frame");
  await expect(frame).toHaveAttribute("sandbox", "allow-scripts");

  const readableFromParent = await frame.evaluate((element: HTMLIFrameElement) => {
    try {
      return element.contentDocument !== null;
    } catch {
      return false;
    }
  });
  expect(readableFromParent).toBe(false);
});
