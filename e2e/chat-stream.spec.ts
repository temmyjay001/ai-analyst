// e2e/chat-streaming.spec.ts

import { test, expect } from "@playwright/test";

test.describe("Chat Streaming", () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto("/login");
    await page.fill("[name=email]", "test@example.com");
    await page.fill("[name=password]", "password123");
    await page.click("button[type=submit]");
    await page.waitForURL("/app");
  });

  test("should stream a new chat response", async ({ page }) => {
    await page.goto("/app");

    // Type a question
    await page.fill(
      '[placeholder="Ask a question about your data..."]',
      "How many users do we have?"
    );
    await page.click("button[type=submit]");

    // Wait for streaming status
    await expect(page.locator("text=Generating SQL...")).toBeVisible();

    // Wait for SQL to appear
    await expect(page.locator("pre code")).toBeVisible();

    // Wait for interpretation
    await expect(page.locator("text=Analysis")).toBeVisible();

    // Check that message was saved
    await expect(page.locator(".chat-message")).toHaveCount(2); // user + assistant
  });

  test("should continue multi-turn conversation", async ({ page }) => {
    // Test requires Growth plan user
  });
});
