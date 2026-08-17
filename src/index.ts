import http from "node:http";
import type { IncomingMessage, ServerResponse } from "node:http";
import { URL } from "node:url";
import { sanitizeName, buildGreeting } from "./greeting";
import { sendJson, readJsonBody } from "./http-utils";

const PORT = Number(process.env.PORT) || 3000;
const GREET_PATH = "/api/greet";

async function handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
  const { pathname, searchParams } = url;

  // 헬스체크: GET /
  if (req.method === "GET" && pathname === "/") {
    sendJson(res, 200, { status: "ok", service: "greeting-api" });
    return;
  }

  // GET /api/greet?name=홍길동  또는  GET /api/greet/홍길동
  if (req.method === "GET" && (pathname === GREET_PATH || pathname.startsWith(`${GREET_PATH}/`))) {
    const nameFromPath = pathname.startsWith(`${GREET_PATH}/`)
      ? decodeURIComponent(pathname.slice(GREET_PATH.length + 1))
      : null;
    const name = sanitizeName(nameFromPath ?? searchParams.get("name"));

    if (!name) {
      sendJson(res, 400, { error: "name은 1~50자의 비어있지 않은 문자열이어야 합니다." });
      return;
    }
    sendJson(res, 200, { message: buildGreeting(name) });
    return;
  }

  // POST /api/greet  body: { "name": "홍길동" }
  if (req.method === "POST" && pathname === GREET_PATH) {
    try {
      const body = await readJsonBody(req);
      const name = sanitizeName((body as { name?: unknown } | undefined)?.name);
      if (!name) {
        sendJson(res, 400, { error: "요청 본문에 name(1~50자의 비어있지 않은 문자열)이 필요합니다." });
        return;
      }
      sendJson(res, 200, { message: buildGreeting(name) });
    } catch (err) {
      sendJson(res, 400, { error: err instanceof Error ? err.message : "잘못된 요청입니다." });
    }
    return;
  }

  sendJson(res, 404, { error: `요청한 경로를 찾을 수 없습니다: ${pathname}` });
}

const server = http.createServer((req, res) => {
  handleRequest(req, res).catch((err: unknown) => {
    console.error(err);
    sendJson(res, 500, { error: "서버 내부 오류가 발생했습니다." });
  });
});

server.listen(PORT, () => {
  console.log(`greeting-api가 http://localhost:${PORT} 에서 실행 중입니다.`);
});
