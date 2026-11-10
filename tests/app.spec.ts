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

for (const viewport of [
	{ width: 320, height: 568 },
	{ width: 667, height: 375 },
]) {
	test(`settings controls stay inside ${viewport.width}×${viewport.height}`, async ({
		page,
	}) => {
		await page.setViewportSize(viewport);
		await page.goto("./");
		await page.getByRole("button", { name: "Open settings" }).click();

		const dialog = page.locator("dialog");
		const done = page.getByRole("button", { name: "Done", exact: true });
		const footer = dialog.locator("footer");
		const close = page.getByRole("button", { name: "Close settings" });
		for (const control of [dialog, close, footer, done]) {
			const bounds = await control.boundingBox();
			expect(bounds).not.toBeNull();
			expect(bounds!.y).toBeGreaterThanOrEqual(0);
			expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(viewport.height);
		}

		const dialogBounds = (await dialog.boundingBox())!;
		const footerBounds = (await footer.boundingBox())!;
		const doneBounds = (await done.boundingBox())!;
		expect(footerBounds.y + footerBounds.height).toBeLessThanOrEqual(
			dialogBounds.y + dialogBounds.height + 1,
		);
		expect(
			footerBounds.y + footerBounds.height - doneBounds.y - doneBounds.height,
		).toBeGreaterThanOrEqual(16);
		expect(doneBounds.x - footerBounds.x).toBeGreaterThanOrEqual(16);
		expect(
			footerBounds.x + footerBounds.width - doneBounds.x - doneBounds.width,
		).toBeGreaterThanOrEqual(16);

		await page.getByRole("radio", { name: "dark", exact: true }).click();
		await expect(done).toBeInViewport({ ratio: 1 });
		await expect(close).toBeInViewport({ ratio: 1 });
		await done.click();
		await expect(dialog).not.toBeVisible();
		await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
	});
}

test("settings footer follows the visible viewport when browser UI reduces its height", async ({
	page,
}) => {
	await page.setViewportSize({ width: 360, height: 740 });
	await page.goto("./");
	await page.evaluate(() => {
		Object.defineProperty(window.visualViewport, "height", {
			configurable: true,
			value: 560,
		});
	});
	await page.getByRole("button", { name: "Open settings" }).click();
	const footer = page.locator("dialog footer");
	const done = page.getByRole("button", { name: "Done", exact: true });
	for (const height of [560, 480]) {
		await page.evaluate((height) => {
			Object.defineProperty(window.visualViewport, "height", {
				configurable: true,
				value: height,
			});
			window.visualViewport!.dispatchEvent(new Event("resize"));
		}, height);
		const footerBounds = (await footer.boundingBox())!;
		const doneBounds = (await done.boundingBox())!;
		expect(footerBounds.y + footerBounds.height).toBeLessThanOrEqual(height + 1);
		expect(
			footerBounds.y + footerBounds.height - doneBounds.y - doneBounds.height,
		).toBeGreaterThanOrEqual(16);
	}
});

test("copies the build hash from settings", async ({ page, context }) => {
	await context.grantPermissions(["clipboard-read", "clipboard-write"]);
	await page.goto("./");
	await page.getByRole("button", { name: "Open settings" }).click();
	const version = page.getByRole("button", { name: "Copy build version" });
	const label = await version.innerText();
	expect(label).toMatch(/^Build [a-f0-9]{10}$/);
	await version.click();
	await expect(page.getByRole("status")).toHaveText("Copied");
	expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
		label.replace("Build ", ""),
	);
});
