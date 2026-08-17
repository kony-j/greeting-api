/**
 * 인사말 생성 관련 순수 함수 모음.
 * 외부 프레임워크에 의존하지 않아 단독으로 테스트하기 쉽습니다.
 */

export const MAX_NAME_LENGTH = 50;

/**
 * 입력받은 이름 값을 검증하고 정리한다.
 * - 문자열이 아니거나 비어있으면 null 반환
 * - 앞뒤 공백 제거, 최대 길이(50자) 제한
 */
export function sanitizeName(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (trimmed.length === 0) return null;
  if (trimmed.length > MAX_NAME_LENGTH) return null;
  return trimmed;
}

/** "안녕하세요, {이름}님" 형식의 인사말을 생성한다. */
export function buildGreeting(name: string): string {
  return `안녕하세요, ${name}님`;
}
