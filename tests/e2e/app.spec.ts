import { test, expect } from "@playwright/test";

test("solves the first mission through the visible command interface", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("Controlled Git command").fill("commit checkpoint");
  await page.getByRole("button", { name: "Run command" }).click();
  await expect(page.getByText("Objective met")).toBeVisible();
  await page.screenshot({ path: "docs/demo.png", fullPage: true });
});
test("shows an invalid command error without claiming a win", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("Controlled Git command").fill("merge main");
  await page.getByRole("button", { name: "Run command" }).click();
  await expect(
    page.getByText("merge is not permitted in this mission."),
  ).toBeVisible();
});
test("moves to another mission and exposes its objective", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Name the flank/ }).click();
  await expect(
    page
      .locator(".brief")
      .getByText("Create a feature branch from the current checkpoint."),
  ).toBeVisible();
});
