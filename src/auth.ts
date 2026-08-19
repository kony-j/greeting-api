/**
 * API 키 기반 인증 관련 함수 모음.
 */

import { randomBytes, timingSafeEqual } from "node:crypto";
import type { IncomingMessage } from "node:http";

export const API_KEY_HEADER = "x-api-key";

/**
 * 서버 시작 시 API_KEY 환경변수를 읽는다.
 * 설정되어 있지 않으면 예외를 던져 서버 기동을 막는다 (fail-closed).
 */
export function loadApiKey(): string {
  const key = process.env.API_KEY;
  if (!key || key.trim().length === 0) {
    throw new Error(
      "API_KEY 환경변수가 설정되지 않았습니다. .env 파일에 API_KEY를 설정하세요. " +
        "(예: PowerShell에서 [Convert]::ToHexString((New-Object byte[] 32 | %{[void](New-Object Random).NextBytes($_); $_})) 로 생성)",
    );
  }
  return key;
}

/**
 * 요청 헤더의 API 키가 서버에 설정된 키와 일치하는지 확인한다.
 * 문자열 길이에 따른 타이밍 차이를 줄이기 위해 crypto.timingSafeEqual을 사용한다.
 */
export function isValidApiKey(req: IncomingMessage, expectedKey: string): boolean {
  const provided = req.headers[API_KEY_HEADER];
  if (typeof provided !== "string" || provided.length === 0) return false;

  const providedBuf = Buffer.from(provided);
  const expectedBuf = Buffer.from(expectedKey);

  if (providedBuf.length !== expectedBuf.length) {
    // 길이가 다르면 timingSafeEqual을 바로 쓸 수 없으므로, 같은 길이의
    // 무작위 버퍼와 비교해 타이밍 차이를 최소화한 뒤 false를 반환한다.
    timingSafeEqual(providedBuf, randomBytes(providedBuf.length));
    return false;
  }
  return timingSafeEqual(providedBuf, expectedBuf);
}
