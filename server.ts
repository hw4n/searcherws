import Fastify from "fastify";
import { browserManager } from "./browser.js";

export function createServer() {
    const fastify = Fastify({
        logger: true,
    });

    fastify.get("/", function (request, reply) {
        reply.send({ hello: "world" });
    });

    // 브라우저 상태 확인
    fastify.get("/browser/status", function (request, reply) {
        reply.send({
            isRunning: browserManager.isRunning(),
            status: browserManager.isRunning() ? "running" : "stopped",
        });
    });

    // 브라우저 시작
    fastify.post("/browser/start", async function (request, reply) {
        try {
            if (browserManager.isRunning()) {
                reply.send({
                    success: false,
                    message: "Browser is already running",
                });
                return;
            }

            await browserManager.launch();
            reply.send({
                success: true,
                message: "Browser started successfully",
            });
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : "Unknown error";
            reply.status(500).send({ success: false, error: errorMessage });
        }
    });

    // 브라우저 종료
    fastify.post("/browser/stop", async function (request, reply) {
        try {
            await browserManager.close();
            reply.send({
                success: true,
                message: "Browser stopped successfully",
            });
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : "Unknown error";
            reply.status(500).send({ success: false, error: errorMessage });
        }
    });

    fastify.post("/browser/search", async function (request, reply) {
        try {
            if (!browserManager.isRunning()) {
                reply.status(400).send({
                    success: false,
                    message: "Browser is not running",
                });
                return;
            }

            // console.log("request.body", request.body);
            // request.body { args: '{"keyword":"xxxxxxxxxxx"}' }
            const { args } = request.body as { args: string };
            const { keyword } = JSON.parse(args);

            const snippets = await browserManager.webSearch(keyword);

            reply.send({
                keyword,
                success: true,
                snippets,
            });
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : "Unknown error";
            reply.status(500).send({ success: false, error: errorMessage });
        }
    });

    return fastify;
}

export async function startServer(port = 3000) {
    const fastify = createServer();

    // 사용 가능한 포트 찾기
    let currentPort = port;
    while (currentPort < port + 100) {
        try {
            const address = await fastify.listen({ port: currentPort });
            fastify.log.info(`Server is listening on ${address}`);
            return fastify;
        } catch (err: any) {
            if (err.code === "EADDRINUSE") {
                currentPort++;
                continue;
            }
            fastify.log.error(err);
            process.exit(1);
        }
    }

    fastify.log.error(`Could not find available port starting from ${port}`);
    process.exit(1);
}
