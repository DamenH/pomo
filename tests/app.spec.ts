import { expect, test } from "@playwright/test";

test("starts, pauses, resets, and switches modes", async ({ page }) => {
	await page.goto("./");
	await expect(page.getByLabel("25:00", { exact: true })).toBeVisible();

	await page.getByRole("button", { name: "Start" }).click();
	await expect(page.getByRole("button", { name: "Pause" })).toBeVisible();
	await expect(page.getByLabel(/24:5[89]/)).toBeVisible({ timeout: 3_000 });
	await expect(page.getByRole("button", { name: /Short/ })).toBeDisabled();

	await page.getByRole("button", { name: "Pause" }).click();
	await page.getByRole("button", { name: "Reset timer" }).click();
	await expect(page.getByLabel("25:00", { exact: true })).toBeVisible();

	await page.getByRole("button", { name: /Short/ }).click();
	await expect(page.getByLabel("05:00", { exact: true })).toBeVisible();
});

test("saves settings and keeps the primary layout inside a short phone viewport", async ({
	page,
}) => {
	await page.setViewportSize({ width: 320, height: 568 });
	await page.goto("./");
	await page.getByRole("button", { name: "Open settings" }).click();
	await page.getByRole("spinbutton", { name: "Focus min", exact: true }).fill("30");
	await page.getByRole("button", { name: "Done" }).click();
	await expect(page.getByLabel("30:00", { exact: true })).toBeVisible();

	const metrics = await page.evaluate(() => ({
		scrollWidth: document.documentElement.scrollWidth,
		clientWidth: document.documentElement.clientWidth,
		scrollHeight: document.documentElement.scrollHeight,
		clientHeight: document.documentElement.clientHeight,
	}));
	expect(metrics.scrollWidth).toBe(metrics.clientWidth);
	expect(metrics.scrollHeight).toBeLessThanOrEqual(metrics.clientHeight + 1);
});

test("ships as an installable offline app", async ({ page, context }) => {
	await page.goto("./");
	await expect
		.poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null))
		.toBe(true);
	await context.setOffline(true);
	await page.reload();
	await expect(page.getByRole("button", { name: "Start" })).toBeVisible();
});
