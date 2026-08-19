import fs from "node:fs";
import http from "node:http";
import https from "node:https";
import type { IncomingMessage, ServerResponse } from "node:http";
import { URL } from "node:url";
import { loadApiKey, isValidApiKey } from "./auth";
import { sanitizeName, buildGreeting } from "./greeting";
import { sendJson, readJsonBody } from "./http-utils";

const PORT = Number(process.env.PORT) || 3000;
const GREET_PATH = "/api/greet";

/**
 * TLS_CERT_PATH/TLS_KEY_PATH가 설정되어 있으면 HTTPS 서버를,
 * 아니면(개발 환경 한정) HTTP 서버를 생성한다.
 * 프로덕션(NODE_ENV=production)에서 TLS가 설정되지 않으면 시작을 거부한다.
 */
function createServer(requestListener: http.RequestListener): http.Server | https.Server {
  const certPath = process.env.TLS_CERT_PATH;
  const keyPath = process.env.TLS_KEY_PATH;

  if (certPath && keyPath) {
    const cert = fs.readFileSync(certPath);
    const key = fs.readFileSync(keyPath);
    return https.createServer({ cert, key }, requestListener);
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "프로덕션 환경(NODE_ENV=production)에서는 TLS_CERT_PATH와 TLS_KEY_PATH를 반드시 설정해야 합니다.",
    );
  }

  console.warn(
    "⚠️  TLS 인증서(TLS_CERT_PATH/TLS_KEY_PATH)가 설정되지 않아 암호화되지 않은 HTTP로 실행합니다. 개발 환경에서만 사용하세요.",
  );
  return http.createServer(requestListener);
}

const apiKey = loadApiKey();

async function handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
  const { pathname, searchParams } = url;

  // 헬스체크: GET / (인증 불필요, 모니터링/로드밸런서용으로 공개)
  if (req.method === "GET" && pathname === "/") {
    sendJson(res, 200, { status: "ok", service: "greeting-api" });
    return;
  }

  // /api/greet 이하 경로는 API 키 인증 필요
  const isGreetPath = pathname === GREET_PATH || pathname.startsWith(`${GREET_PATH}/`);
  if (isGreetPath && !isValidApiKey(req, apiKey)) {
    sendJson(res, 401, { error: "유효한 API 키가 필요합니다. 'x-api-key' 헤더를 확인하세요." });
    return;
  }

  // GET /api/greet?name=홍길동  또는  GET /api/greet/홍길동
  if (req.method === "GET" && isGreetPath) {
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

const server = createServer((req, res) => {
  handleRequest(req, res).catch((err: unknown) => {
    console.error(err);
    sendJson(res, 500, { error: "서버 내부 오류가 발생했습니다." });
  });
});

server.listen(PORT, () => {
  const protocol = server instanceof https.Server ? "https" : "http";
  console.log(`greeting-api가 ${protocol}://localhost:${PORT} 에서 실행 중입니다.`);
});
