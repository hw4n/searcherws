import { Browser, BrowserContext } from "playwright";
import { chromium } from "playwright-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { extractHref } from "./string_works";

chromium.use(StealthPlugin());

export class BrowserManager {
    private browser: Browser | null = null;
    private context: BrowserContext | null = null;

    async launch() {
        if (this.browser) {
            console.log("Browser is already running");
            return;
        }

        console.log("Launching browser...");
        const headlessMode = process.env.STAGE === "dev" ? false : true;
        console.log(`Headless mode: ${headlessMode ? "enabled" : "disabled"}`);
        this.browser = await chromium.launch({ headless: headlessMode });

        this.context = await this.browser.newContext({
            userAgent:
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:140.0) Gecko/20100101 Firefox/140.0",
            viewport: null,
        });

        console.log("Browser launched successfully");
    }

    async createPage() {
        if (!this.context) {
            throw new Error(
                "Browser context not available. Call launch() first."
            );
        }

        return await this.context.newPage();
    }

    async webSearch(keyword: string) {
        const page = await this.createPage();
        await page.goto(`https://html.duckduckgo.com/html?q=${keyword}`);
        await page.waitForLoadState("domcontentloaded");

        // execute the stuff
        const snippets = await page.evaluate(() => {
            const snippets = document.querySelectorAll(".result__snippet");
            return Array.from(snippets).map((s) => {
                return {
                    href: (s as HTMLAnchorElement).href,
                    text: (s as HTMLAnchorElement).innerText,
                };
            });
        });

        const result = snippets.map((s) => {
            return {
                href: extractHref(s.href) || "",
                text: s.text,
            };
        });

        await page.close();

        return result;
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
            this.context = null;
            console.log("Browser closed");
        }
    }

    isRunning() {
        return this.browser !== null;
    }
}

// 싱글톤 인스턴스
export const browserManager = new BrowserManager();
