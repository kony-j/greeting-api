# greeting-api

문자(이름)를 받아 `"안녕하세요, {이름}님"`을 응답하는 간단한 TypeScript + Node.js API입니다.
외부 런타임 패키지(Express 등) 없이 Node.js 내장 `http` 모듈만 사용했습니다. 가볍게 시작해서, 필요할 때 Express 같은 프레임워크로 쉽게 확장할 수 있는 구조입니다.

---

## 1. 개발 환경 설치 (Windows 11)

### 1) nvm-windows 설치 (Node.js 버전 관리)

Windows에서는 macOS/Linux용 `nvm`이 아니라 **nvm-windows**를 사용합니다.

1. [nvm-windows Releases 페이지](https://github.com/coreybutler/nvm-windows/releases)에서 최신 버전의 `nvm-setup.exe`를 다운로드합니다. (2026년 8월 기준 최신 안정 버전: 1.2.2)
2. 설치 파일을 실행합니다. 관리자 권한이 필요할 수 있습니다.
3. 설치가 끝나면 새 터미널(PowerShell 또는 명령 프롬프트)을 열고 아래 명령으로 설치를 확인합니다.

   ```powershell
   nvm version
   ```

> 참고: 기존에 공식 Node.js 설치 프로그램으로 Node를 설치한 적이 있다면, nvm-windows 설치 전에 제어판에서 먼저 제거하는 것이 충돌을 방지하는 데 도움이 됩니다.

### 2) Node.js 설치

2026년 8월 기준 Node.js **Active LTS는 v24(코드명 Krypton)**입니다. 실무 프로젝트에는 LTS 버전을 사용하는 것을 권장합니다.

```powershell
nvm install 24
nvm use 24
node -v
npm -v
```

### 3) TypeScript

TypeScript는 프로젝트별로 `devDependencies`에 설치해서 사용합니다(전역 설치 불필요). 아래 "프로젝트 실행" 단계에서 `npm install`로 함께 설치됩니다.

### 4) 코드 에디터: VS Code + Claude Code 확장

1. [VS Code](https://code.visualstudio.com/)를 설치합니다 (버전 1.94.0 이상 필요).
2. VS Code를 열고 `Ctrl+Shift+X`로 확장(Extensions) 보기를 엽니다.
3. "Claude Code"를 검색해서 설치합니다. (또는 [마켓플레이스 페이지](https://marketplace.visualstudio.com/items?itemName=anthropic.claude-code)에서 바로 설치)
4. 설치 후 에디터 오른쪽 위의 반짝이는 아이콘(Spark 아이콘)을 클릭하거나, 하단 상태 표시줄의 "✱ Claude Code"를 클릭해 패널을 엽니다.
5. 처음 열면 로그인 화면이 나타납니다. Anthropic 계정(Claude 구독 또는 Console 계정)으로 로그인하면 바로 사용할 수 있습니다.

> 참고: VS Code 확장은 채팅 패널용 CLI를 자체 내장하고 있지만, 터미널에서 `claude` 명령을 직접 쓰려면 [별도로 CLI를 설치](https://code.claude.com/docs/en/setup)해야 합니다. 확장만으로도 이번 프로젝트를 개발하기에는 충분합니다.

### 5) (선택) Git

버전 관리를 위해 [Git for Windows](https://git-scm.com/download/win) 설치를 권장합니다.

---

## 2. 프로젝트 실행하기

### 압축 해제 및 의존성 설치

프로젝트 폴더(`greeting-api`)를 원하는 위치에 압축 해제한 뒤, PowerShell에서 해당 폴더로 이동합니다.

```powershell
cd greeting-api
npm install
```

### 개발 모드로 실행 (코드 변경 시 자동 재시작)

```powershell
npm run dev
```

### 프로덕션 빌드 후 실행

```powershell
npm run build
npm start
```

정상적으로 실행되면 아래와 같은 메시지가 출력됩니다.

```
greeting-api가 http://localhost:3000 에서 실행 중입니다.
```

포트를 바꾸고 싶다면 `.env.example`을 참고해 `.env` 파일을 만들거나, 환경변수로 지정하세요.

```powershell
$env:PORT=4000; npm run dev
```

### 타입 검사만 실행

```powershell
npm run typecheck
```

---

## 3. API 명세

### 헬스체크

`GET /`

```json
{ "status": "ok", "service": "greeting-api" }
```

### 인사말 조회 — GET (경로 파라미터)

`GET /api/greet/:name`

예: `GET /api/greet/홍길동`

```json
{ "message": "안녕하세요, 홍길동님" }
```

### 인사말 조회 — GET (쿼리 파라미터)

`GET /api/greet?name=홍길동`

```json
{ "message": "안녕하세요, 홍길동님" }
```

### 인사말 조회 — POST

`POST /api/greet`

Request body:

```json
{ "name": "홍길동" }
```

Response:

```json
{ "message": "안녕하세요, 홍길동님" }
```

### 오류 응답

- `name`이 없거나 빈 문자열이거나 50자를 초과하면 `400 Bad Request`
  ```json
  { "error": "name은 1~50자의 비어있지 않은 문자열이어야 합니다." }
  ```
- 존재하지 않는 경로는 `404 Not Found`
- 서버 내부 오류는 `500 Internal Server Error`

### curl로 테스트하기 (PowerShell)

```powershell
curl http://localhost:3000/
curl http://localhost:3000/api/greet/홍길동
curl "http://localhost:3000/api/greet?name=주인"
curl -Method POST -Uri http://localhost:3000/api/greet -Body '{"name":"클로드"}' -ContentType "application/json"
```

> PowerShell의 `curl`은 `Invoke-WebRequest`의 별칭이라 옵션 형식이 다를 수 있습니다. 실제 `curl.exe`를 쓰고 싶다면 `curl.exe`로 명시하거나, VS Code 확장으로 [REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client) 같은 확장을 설치해 `.http` 파일로 테스트하는 것도 편합니다.

---

## 4. 프로젝트 구조

```
greeting-api/
├── src/
│   ├── index.ts        # 서버 진입점, 라우팅
│   ├── greeting.ts      # 이름 검증 및 인사말 생성 (순수 함수)
│   └── http-utils.ts    # JSON 응답/요청 파싱 헬퍼
├── package.json
├── tsconfig.json
├── .gitignore
└── .env.example
```

---

## 5. 다음 확장 아이디어

이 프로젝트 설명("Hello world 출력 같은 간단한 API를 만들고 점점 확장")에 맞춰, 다음과 같은 방향으로 확장해볼 수 있습니다.

- Express나 Fastify 같은 프레임워크 도입 (라우팅/미들웨어 생태계 활용)
- 요청 로깅 미들웨어 추가
- Jest/Vitest로 `greeting.ts`의 단위 테스트 작성
- 여러 언어의 인사말 지원 (예: `?lang=en` → `Hello, {name}!`)
- 데이터베이스 연동, 인증 등 실제 API 기능 추가

---

## 참고 자료

- [Node.js 릴리스 정보](https://nodejs.org/en/about/previous-releases)
- [nvm-windows](https://github.com/coreybutler/nvm-windows)
- [Claude Code — VS Code 사용 가이드](https://code.claude.com/docs/en/vs-code)
