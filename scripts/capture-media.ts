import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { chromium } from "@playwright/test";

import { getNumberArg, getStringArg, parseCliArgs } from "./lib/cli";
import { writeJsonFile } from "./lib/io";

const args = parseCliArgs(process.argv.slice(2));
const replaySource = getStringArg(args, "source", "sample") ?? "sample";
const outDirectory =
  getStringArg(args, "out-dir", "artifacts/media/latest") ??
  "artifacts/media/latest";
const pageUrl =
  getStringArg(
    args,
    "url",
    `http://127.0.0.1:3000/play?view=replay&source=${replaySource}`,
  ) ?? `http://127.0.0.1:3000/play?view=replay&source=${replaySource}`;
const frameCount = Math.max(2, getNumberArg(args, "frames", 8) ?? 8);
const viewportWidth = getNumberArg(args, "width", 1600) ?? 1600;
const viewportHeight = getNumberArg(args, "height", 900) ?? 900;

const ensureFfmpeg = () => {
  const result = spawnSync("ffmpeg", ["-version"], { stdio: "ignore" });
  return result.status === 0;
};

const createGif = (frameDirectory: string, outputPath: string) => {
  const result = spawnSync(
    "ffmpeg",
    [
      "-y",
      "-framerate",
      "4",
      "-i",
      join(frameDirectory, "frame-%03d.png"),
      "-vf",
      "scale=1280:-1:flags=lanczos",
      outputPath,
    ],
    { stdio: "inherit" },
  );

  if (result.status !== 0) {
    throw new Error("ffmpeg could not generate the replay GIF.");
  }
};

const main = async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: viewportWidth, height: viewportHeight },
  });
  const outputRoot = resolve(outDirectory);
  const screenshotPath = resolve(outputRoot, "replay-cover.png");
  const gifPath = resolve(outputRoot, "replay-timeline.gif");
  const tempFrameDirectory = mkdtempSync(join(tmpdir(), "blackout-manor-"));

  try {
    mkdirSync(outputRoot, { recursive: true });
    await page.goto(pageUrl, { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { name: "Replay theater" }).waitFor();
    await page.screenshot({
      path: screenshotPath,
      fullPage: true,
    });

    const scrubber = page.locator("input.timeline-scrubber");
    const maxValue = Number.parseInt(
      (await scrubber.getAttribute("max")) ?? "0",
      10,
    );

    for (let index = 0; index < frameCount; index += 1) {
      const frameValue =
        frameCount === 1
          ? 0
          : Math.round((index / Math.max(1, frameCount - 1)) * maxValue);
      const framePath = join(
        tempFrameDirectory,
        `frame-${String(index).padStart(3, "0")}.png`,
      );

      await scrubber.evaluate((element, nextValue) => {
        const input = element as HTMLInputElement;
        input.value = String(nextValue);
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
      }, frameValue);
      await page.waitForTimeout(200);
      await page.screenshot({
        path: framePath,
        fullPage: true,
      });
    }

    if (ensureFfmpeg()) {
      createGif(tempFrameDirectory, gifPath);
    }

    const manifestPath = writeJsonFile(
      resolve(outputRoot, "media-manifest.json"),
      JSON.stringify(
        {
          pageUrl,
          screenshot: screenshotPath,
          gif: existsSync(gifPath) ? gifPath : null,
          frames: frameCount,
        },
        null,
        2,
      ),
    );

    console.info(`page: ${pageUrl}`);
    console.info(`screenshot: ${screenshotPath}`);
    if (existsSync(gifPath)) {
      console.info(`gif: ${gifPath}`);
    } else {
      console.info("gif: skipped (ffmpeg not available)");
    }
    console.info(`manifest: ${manifestPath}`);
  } finally {
    await browser.close();
    rmSync(tempFrameDirectory, { recursive: true, force: true });
  }
};

void main();
