import { describe, expect, it, vi } from "vitest";
import { waitForApi } from "./waitForApi";

const skipSleep = () => Promise.resolve();

describe("waitForApi", () => {
  it("resolves as soon as the api answers", async () => {
    const checkHealth = vi.fn().mockResolvedValue(true);

    await waitForApi({ checkHealth, signal: new AbortController().signal, sleep: skipSleep });

    expect(checkHealth).toHaveBeenCalledOnce();
  });

  it("keeps polling while the api sleeps", async () => {
    const checkHealth = vi.fn().mockResolvedValueOnce(false).mockResolvedValueOnce(false).mockResolvedValue(true);

    await waitForApi({ checkHealth, signal: new AbortController().signal, sleep: skipSleep });

    expect(checkHealth).toHaveBeenCalledTimes(3);
  });

  it("stops polling once aborted", async () => {
    const controller = new AbortController();
    const checkHealth = vi.fn().mockImplementation(async () => {
      controller.abort();
      return false;
    });

    await waitForApi({ checkHealth, signal: controller.signal, sleep: skipSleep });

    expect(checkHealth).toHaveBeenCalledOnce();
  });
});
