import { startServer } from "./server.js";
import { browserManager } from "./browser.js";
import dotenv from "dotenv";

dotenv.config();

async function main() {
    try {
        // API 서버 시작
        console.log("Starting API server...");
        await startServer(3000);

        // 브라우저 백그라운드에서 실행
        console.log("Starting browser in background...");
        await browserManager.launch();

        console.log("All services started successfully!");
    } catch (error) {
        console.error("Error starting services:", error);
        process.exit(1);
    }
}

// 프로세스 종료 시 브라우저 정리
process.on("SIGINT", async () => {
    console.log("\nShutting down...");
    await browserManager.close();
    process.exit(0);
});

process.on("SIGTERM", async () => {
    console.log("\nShutting down...");
    await browserManager.close();
    process.exit(0);
});

main();
