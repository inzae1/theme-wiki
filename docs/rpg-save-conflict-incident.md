# 2026-10-22 저장 충돌 재시도 장애

원인: 저장·랭킹의 결정적인 버전 충돌에 직렬화 재시도용 SQLSTATE 40001을 사용했다. PostgREST 14의 재시도 문제와 결합해 요청 하나가 무한 트랜잭션 재시도를 일으켰다. 대시보드에서 최근 1시간 PostgreSQL 오류 355,164건, SAVE_CONFLICT 및 RANKING_SAVE_CONFLICT 반복을 확인했다. 공개 랭킹 조회도 시간 초과했다.

Supabase 공식 설명: https://supabase.com/docs/guides/troubleshooting/high-cpu-and-infinite-transaction-retries-when-using-custom-error-codes-in-rpc-functions-77326b

복구: 게임 프로젝트 fxkdlcqheyireuuykzzw의 기존 함수 4개 정의를 확인·보관하고, 오류 코드 리터럴만 PT409로 변경했다. 소유자, 권한, SECURITY INVOKER, 버전 비교·소유권 검사는 유지했다. 사용자 저장·랭킹 행을 수정하거나 DB 백업을 복원하지 않았다. 변경 후 네 함수 모두 이전 코드 제거·PT409 존재·security invoker 유지가 확인됐다. authenticator 연결 조회에서는 idle 연결만 남아 강제 종료는 하지 않았다. 공개 랭킹 API가 HTTP 200으로 약 0.09초에 응답했다.

브라우저 클라이언트도 저장 충돌 후 최신 저장 조회가 실패하더라도 충돌로 분류하고 자동 저장을 멈추도록 수정했다. 기존 40001 오류와 새 PT409, 일반 P0001+SAVE_CONFLICT를 모두 처리한다. 구버전 기기나 실패한 저장이 최신 저장을 덮어쓰도록 변경하지 않았다.

주의: 이미 클라우드 저장에 실패한 플레이 진행은 서버에 없을 수 있다. 이를 복구했다고 주장하지 않는다. 플레이 기기의 로컬 저장은 유지하며, 원격 저장 불러오기 전 기존 비교·백업 흐름을 사용한다.
