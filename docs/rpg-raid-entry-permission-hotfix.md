# 레이드 방 생성·입장 권한 복구

지원 역할 패치의 일괄 REVOKE가 기존 authenticated 진입 함수 권한까지 제거했다. public 래퍼는 SECURITY INVOKER이므로 내부 command 실행이 거부됐다. 기존 command EXECUTE만 authenticated에 복구했고 내부 전투 함수는 비공개로 유지했다.

운영 DB에서 실제 authenticated 역할로 임시 계정 2개의 생성·입장·준비·시작을 검증했다. 전체 검증 데이터는 예외 서브트랜잭션 및 ROLLBACK으로 원복했다. 권한 결과: authenticated command=true, anon command=false, authenticated support_cast=false.

생성기·통합 SQL·balance SQL에 진입 권한 복구문을 추가하고 회귀 검사에 authenticated 실행 권한을 추가했다. 정적 사이트 재배포 없이 서버에서 즉시 적용된다.

추가 수정: command의 내보내기 경로에서 PL/pgSQL 변수 n과 ordinality 열 n이 충돌했다. where x.n으로 한정했다. 운영 DB에서 authenticated 역할로 생성·입장·내보내기·재입장·준비·시작·이동을 검증하고 임시 데이터는 원복했다.
