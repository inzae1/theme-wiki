# 박종찬 전체 28개 스킬 원화 애니메이션

검사·검성·워리어·검귀·수라·뱅가드·다크나이트 각각 4개, 총 28개 기술의 전용 투명 애니메이션을 제작했다. 내장 ImageGen으로 만든 투명 원본 9장을 프레임으로 분리해 GIF와 PNG 아틀라스로 내보낸다.

게임은 PNG의 동일 프레임을 실제 시전·타격·투사체·지속 회전 시점에 맞춰 재생한다. 반복 GIF를 그대로 덮지 않으며, 준비/명중/상태 이벤트 중복과 큰 광역 연출의 중복 표시를 제한했다. 기존 계수·자원·쿨다운은 유지한다.

- 감상: `dist/rpg-jongchan-gif-gallery.html`
- 원본·프롬프트·해시: `dist/rpg-fx/jongchan-painted/manifest.json`
- 재생성: `scripts/build-rpg-jongchan-painted.py`
- 검증: `scripts/verify-rpg-jongchan-painted.py`, `scripts/verify-rpg-skill-lab.mjs`, `scripts/verify-rpg-raid-effects.mjs`, `scripts/verify-rpg-greatsword.mjs`, `scripts/verify-rpg-sword.mjs`

48개 2차 직업의 별도 분석은 `docs/rpg-party-role-audit-r95.md`. 이번 배포에서 48개 직업의 역할/수치를 개편하지 않았다.
