import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import type { RoomSlug } from "../src/rooms/rooms";

const ALL_ROOMS: RoomSlug[] = [
  "recon",
  "checkout",
  "cookiejar",
  "idor",
  "sqli",
  "xss",
  "traversal",
  "jwt",
  "cmdinjection",
];
const PHONE_WIDTHS = [320, 360, 390];

interface SavedGame {
  solved: RoomSlug[];
  finished?: boolean;
  language?: "en" | "es";
}

async function seedGame(page: Page, { solved, finished = false, language = "en" }: SavedGame) {
  await page.addInitScript(
    ({ solved, finished, language }) => {
      localStorage.setItem("breach-room.language", language);
      localStorage.setItem(
        "breach-room.progress",
        JSON.stringify({
          startedAt: 1_000,
          finishedAt: finished ? 601_000 : null,
          solvedRooms: solved,
          hintsUsed: { recon: 3 },
        }),
      );
    },
    { solved, finished, language },
  );
}

async function enterGame(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: /Unwind the string|Desenrollar la cuerda/ }).click();
  await page.locator(".memo__begin").click();
}

async function expectNoViolations(page: Page) {
  const { violations } = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
  const summary = violations.map(({ id, nodes }) => `${id}: ${nodes.map((node) => node.target).join(" | ")}`);
  expect(summary).toEqual([]);
}

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
}

test.describe("automated WCAG checks", () => {
  test("boot screen", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: "Unwind the string" })).toBeVisible();

    await expectNoViolations(page);
  });

  test("memo", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Unwind the string" }).click();
    await expect(page.locator(".memo__begin")).toBeVisible();

    await expectNoViolations(page);
  });

  for (const language of ["en", "es"] as const) {
    test(`department sheet in ${language}`, async ({ page }) => {
      await seedGame(page, { solved: [], language });
      await enterGame(page);

      await expectNoViolations(page);
    });
  }

  for (const slug of ALL_ROOMS) {
    test(`solved debrief for ${slug}`, async ({ page }) => {
      await seedGame(page, { solved: ALL_ROOMS.slice(0, ALL_ROOMS.indexOf(slug) + 1) });
      await enterGame(page);
      const stop = page.locator(".rail__button").nth(ALL_ROOMS.indexOf(slug));
      await stop.click();
      await expect(page.getByRole("img", { name: "Department cleared" })).toBeVisible();

      await expectNoViolations(page);
    });
  }

  test("each toolkit tab", async ({ page }) => {
    await seedGame(page, { solved: [] });
    await enterGame(page);

    for (const tab of ["Browser", "Repeater", "Cookies", "Decoder", "Notes"]) {
      await page.getByRole("button", { name: tab, exact: true }).click();
      await expectNoViolations(page);
    }
  });

  test("response view", async ({ page }) => {
    await seedGame(page, { solved: [] });
    await enterGame(page);
    await page.getByRole("button", { name: "Send" }).click();
    await expect(page.locator(".response__status")).toBeVisible();

    await expectNoViolations(page);
  });

  test("final screen", async ({ page }) => {
    await seedGame(page, { solved: ALL_ROOMS, finished: true });
    await enterGame(page);
    await expect(page.getByRole("heading", { name: "You are out" })).toBeVisible();

    await expectNoViolations(page);
  });
});

test.describe("debrief code", () => {
  for (const { label, width } of [
    { label: "phone", width: 390 },
    { label: "desktop", width: 1440 },
  ]) {
    test(`every room's code is readable without sideways scrolling on ${label}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await seedGame(page, { solved: ALL_ROOMS });
      await enterGame(page);

      for (const index of ALL_ROOMS.keys()) {
        await page.locator(".rail__button").nth(index).click();
        const panels = await page.locator(".code-pair pre").evaluateAll((elements) =>
          elements.map((element) => ({
            overflow: element.scrollWidth - element.clientWidth,
            changedLines: element.querySelectorAll("del, ins").length,
          })),
        );

        expect(panels).toHaveLength(2);
        for (const panel of panels) {
          expect(panel.overflow).toBeLessThanOrEqual(0);
          expect(panel.changedLines).toBeGreaterThan(0);
        }
      }
    });
  }
});

test.describe("keyboard", () => {
  test("the whole opening can be done without a mouse", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Unwind the string" }).focus();
    await page.keyboard.press("Enter");

    await expect(page.getByRole("heading", { name: "Memorandum" })).toBeFocused();
    await page.locator(".memo__begin").focus();
    await page.keyboard.press("Enter");

    await expect(page.getByRole("heading", { name: "Reception" })).toBeFocused();
  });

  test("language can be changed with the arrow keys", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("radio", { name: "English" }).focus();
    await page.keyboard.press("ArrowDown");

    await expect(page.locator("html")).toHaveAttribute("lang", "es");
  });

  test("focus follows the player from a solved room to the next one", async ({ page }) => {
    await seedGame(page, { solved: ["recon"] });
    await enterGame(page);
    await page.getByRole("button", { name: "Send" }).click();
    await expect(page.locator(".response__status")).toBeVisible();

    const stop = page.locator(".rail__button").first();
    await stop.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("heading", { name: "Reception" })).toBeFocused();

    await page.getByRole("button", { name: "Proceed to the next department" }).focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("heading", { name: "Internal Shop" })).toBeFocused();
  });

  test("the debrief takes focus when a flag is accepted", async ({ page }) => {
    await seedGame(page, { solved: [] });
    await enterGame(page);
    await page.getByRole("textbox", { name: "Path" }).fill("/api/rooms/recon/internal/front-desk-terminal");
    await page.getByRole("button", { name: "Send" }).click();
    const flag = await page.locator(".response__headers > div", { hasText: "x-kryptelia-debug" }).locator("dd").textContent();

    await page.getByRole("textbox", { name: "Flag" }).fill(flag ?? "");
    await page.keyboard.press("Enter");

    await expect(page.getByRole("heading", { name: "Compliance review" })).toBeFocused();
  });

  test("focus stays visible on the navy bar and inside the tabs", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await seedGame(page, { solved: [] });
    await enterGame(page);

    await page.getByRole("button", { name: "Toolkit" }).focus();
    await page.keyboard.press("Enter");
    const barFocus = await page.getByRole("button", { name: "Toolkit" }).evaluate((button) => {
      const style = getComputedStyle(button);
      return { ring: style.outlineColor, text: style.color, offset: Number.parseInt(style.outlineOffset, 10) };
    });
    expect(barFocus.ring).toBe(barFocus.text);
    expect(barFocus.offset).toBeLessThan(0);

    await page.getByRole("button", { name: "Repeater", exact: true }).focus();
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Tab");
    const tabOffset = await page.evaluate(() => getComputedStyle(document.activeElement as Element).outlineOffset);
    expect(Number.parseInt(tabOffset, 10)).toBeLessThan(0);
  });

  test("visible focus appears on interactive controls", async ({ page }) => {
    await seedGame(page, { solved: [] });
    await enterGame(page);
    await page.keyboard.press("Tab");

    const outline = await page.evaluate(() => {
      const style = getComputedStyle(document.activeElement as Element);
      return style.outlineStyle === "solid" ? style.outlineWidth : "none";
    });
    expect(outline).toBe("3px");
  });
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("the envelope opens at once and nothing animates", async ({ page }) => {
    await page.goto("/");
    const start = Date.now();
    await page.getByRole("button", { name: "Unwind the string" }).click();
    await expect(page.locator(".memo__begin")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Memorandum" })).toBeFocused();

    expect(Date.now() - start).toBeLessThan(1_000);
  });

  test("the seal is pressed without motion", async ({ page }) => {
    await seedGame(page, { solved: ["recon"] });
    await enterGame(page);
    await page.locator(".rail__button").first().click();

    const animation = await page.locator(".seal").evaluate((seal) => getComputedStyle(seal).animationName);
    expect(animation).toBe("none");
  });
});

test.describe("narrow screens", () => {
  for (const width of PHONE_WIDTHS) {
    test(`nothing overflows at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 700 });
      await seedGame(page, { solved: ALL_ROOMS.slice(0, 7), language: "es" });
      await page.goto("/");
      await expect(page.locator(".action")).toBeVisible();
      await expectNoHorizontalOverflow(page);

      await page.locator(".action").click();
      await page.locator(".memo__begin").click();
      await expectNoHorizontalOverflow(page);

      await page.getByRole("button", { name: "Herramientas" }).click();
      for (const tab of ["Navegador", "Repeater", "Cookies", "Decoder", "Notas"]) {
        await page.getByRole("button", { name: tab, exact: true }).click();
        await expectNoHorizontalOverflow(page);
      }
    });

    test(`the seal stays clear of the sheet heading at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 700 });
      await seedGame(page, { solved: ALL_ROOMS, finished: false, language: "es" });
      await enterGame(page);

      await expectNoHorizontalOverflow(page);

      for (const index of ALL_ROOMS.keys()) {
        await page.locator(".rail__button").nth(index).click();
        const clearance = await page.evaluate(() => {
          const seal = document.querySelector(".seal")?.getBoundingClientRect();
          const range = document.createRange();
          range.selectNodeContents(document.querySelector(".sheet__title") as Node);
          const textRight = [...range.getClientRects()].map((rect) => rect.right);
          return (seal?.left ?? 0) - Math.max(...textRight);
        });
        expect(clearance).toBeGreaterThanOrEqual(0);
      }
    });
  }
});
