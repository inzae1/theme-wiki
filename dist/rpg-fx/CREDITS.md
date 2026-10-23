# Pixel effects attribution

Original PNG sheets are distributed without recoloring or image modification.

- Free Pixel Effects Pack, CodeManu / Davit Masia — CC0 / public domain.
  https://opengameart.org/content/free-pixel-effects-pack
  https://opengameart.org/sites/default/files/Free%20Pixel%20Effects%20Pack.zip
- Animated Explosions, ansimuz — CC0.
  https://opengameart.org/content/animated-explosions
  https://opengameart.org/sites/default/files/explosions-pack.zip

Credit is retained voluntarily. Class-specific timing, placement, projectiles, constructs and composition are implemented by theme-wiki.


## Additional skill materials — 2026-10-21
- sword-slash.png: tbbk, Pixel art sword slash effect, CC0. Original 192×141 sheet, 3×3 frames of 64×47. https://opengameart.org/content/pixel-art-sword-slash-effect
- arcane/blood/fire/ice/light/nature blade and spear PNGs: Cethiel, Elemental Weapons - Effect, CC0. Original files unchanged; displayed with pixel sampling in skill-specific choreography. https://opengameart.org/content/elemental-weapons-effect


## Semantic replacements — 2026-10-21
- ground-floor.png: hernandack, Floor Effects Pixelart, CC0. Original floors_fx1.png unchanged. https://opengameart.org/content/floor-effects-pixelart
- dust-impact.png: Spring Spring; spritesheet conversion posted by 2D_PlatformerGuy, CC0. Original jump_effect.png unchanged. https://opengameart.org/content/dust-animation
- poison-mist.png / ice-geyser.png / dirge-aura.png: Soluna Software, CC0 (Effect95.png / Effect47.png / Aura38.png). Originals unchanged. https://opengameart.org/content/explosion-effects-and-more
- smoke-01.png … smoke-19.png: Mikodrak, 2D Spell Effects, CC0. Individual original frames from fx10_blackExplosion, renamed only. https://opengameart.org/content/2d-spell-effects
- blood-burst.png / blood-spray.png: para, Animated particle effects #2, CC0 (blood_hit_01.png / blood_hit_03.png). Originals unchanged. https://opengameart.org/content/animated-particle-effects-2
- dragon-form.png: Blarumyrran, Dragons, CC0 (pisilohepunane3.png). Original unchanged. https://opengameart.org/content/dragons
- bomb-blast.png: Umplix, Bomb Animation 24p DX, CC0 (bomb_spritesheet.png). Original unchanged. https://opengameart.org/content/bomb-animation-24p-dx
- vines.png: Matt Rumble, Vines, CC0 (Vines.png). Original unchanged. https://opengameart.org/content/vines

## Sprite replacement for geometric placeholder FX (2026-10-21)
- dragonhide-shield.png / holy-shield.png: LordNeo, kite shield [64x64], CC0. Original dragonhide and gold images unchanged. https://opengameart.org/content/kite-shield-64x64
- holy-wings.png / arcane-wings.png: Cethiel, Angel Shield Effect, CC0. Original variants 17 / 19 unchanged. Static source sprites are animated by scaling/placement/fade; these are not frame sequences. https://opengameart.org/content/angel-shield-effect
- music-blue.png / music-gold.png / music-purple.png: Cethiel, Music - Magic Effect, CC0. Original/Gold/Purple 25 original 150px frames packed into 5×5 runtime atlases without recoloring or resampling. Each row is a separate five-frame musical motif. https://opengameart.org/content/music-magic-effect
- nature-regrowth.png: Cethiel, Nature - Magic Effect, CC0. Original 0-1 through 0-5 images packed into equally padded atlas cells, original pixels preserved. https://opengameart.org/content/nature-magic-effect
- lightning-spark.png: 13rice, Radial lightning effect, CC0. Original pixelated_tilesheet.png, 4×2 frames of 64px. https://opengameart.org/content/radial-lightning-effect
- blast-fire.png / blast-heavy.png: Soluna Software, CC0. Original Explosion03.png / Explosion21.png, 4×4 frames of 128px. https://opengameart.org/content/explosion-effects-and-more

## Weapon-family attack animations (2026-10-21)
Viktor Hahn (Viktor.Hahn@web.de), also credited as Unnamed — Pixelated attack/hit animations and More pixelated attack/hit animations. Licensed under [Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/).
Sources: https://opengameart.org/content/pixelated-attackhit-animations and https://opengameart.org/content/more-pixelated-attackhit-animations
Runtime copies were renamed only, without recoloring: melee-punch.png, melee-jab.png, melee-thrust.png, melee-saber.png, melee-fan.png, melee-reap.png, melee-claw.png, melee-bloodcut.png, melee-stab.png, melee-armorbreak.png, melee-baghit.png, melee-shatter.png, melee-shock.png. Frame placement, size and playback are controlled by game code.

## Original project artwork
The ten *-authored.png effect/plant assets and four summon-*.png undead sprites were generated specifically for this project using the built-in image generation tool. Original transparent PNGs are preserved; cropping, motion and scaling occur at runtime. Metadata is recorded in authored-manifest.json and undead-manifest.json.

The elemental spirit and elemental king (summon-spirit.png / summon-king.png) are additional original transparent sprites generated with the built-in image generation tool. Ghosts retain a separate existing model.

## Cheonbin profession redesign — 2026-10-21
- cheonbin-ancient-tree.png and cheonbin-thorn-sentry.png: project-specific images generated with imagegen. Original transparent PNGs preserved; crop geometry and display size are applied only at runtime.
- Cheonbin physical hit, ground dust and energy contact animations use the existing credited punch/shock, floor/dust and spark sheets. Timing and placement are authored per skill.
- GIF previews in the workspace outputs are derived previews of the credited source animation sheets, resized with pixel sampling and composited on a game-colored background. They are not newly authored explosion artwork.

## Metal profession redesign — 2026-10-21
- ../rpg-pixels-v2/characters/seunguk-metal.png: original transparent avatar generated with imagegen, preserved unchanged and cropped at runtime.
- Metal sound pressure, amplifier cabinets and feedback animation are authored canvas drawings; contact dust and punch/shock sheets retain the credits above.

## Fused elemental summon — 2026-10-21
- summon-fusion.png: original transparent image generated using imagegen; fire, water, earth and wind combined in one creature. Original PNG preserved; runtime alpha-occupancy crop only.
- Four lesser elemental silhouettes and elemental attack geometry are original canvas pixel drawings in rpg-fusion-fx.js. Each has a different silhouette and attack choreography.

## Knight profession redesign — 2026-10-21
- knight-war-standard.png: original transparent pixel battle standard generated with imagegen; original asset preserved, alpha occupancy crop and cloth sway applied at runtime.
- 28 knight skill choreographies, shield/hammer/lance drawings, sanctuary floor sigils, half-dragon animation and locomotion trails are authored in rpg-knight-fx.js. Existing credited shock, dust, stab, jab and spark sheets provide contact animations.
- Art and actor motion remain separate; rpg-motion.js transforms the character sprite body and limbs.
- knight-dragon-wings.png: additional original transparent image generated with imagegen. Original preserved; two runtime source crops animate the wings around the visible character body.
- knight-sanctuary.png: original transparent sanctuary mosaic generated with imagegen. Rendered beneath actors as a following sanctuary aura whose radius is defined by the gameplay kit; original PNG preserved.

## Gunner redesign and knight tier distinction — 2026-10-21
- gunner-siege-cannon.png and templar-greatshield.png: original transparent sprites generated with imagegen, originals preserved with runtime alpha-occupancy source crops.
- rpg-gunner-fx.js draws engine-owned bullets, rune ammunition, arcing shells, blast events and emplacement state. Existing credited impact animation sheets provide contact frames.
- First-tier paladin aura is radius 180 with 35% damage and 1% HP per second; second-tier crusader gets mobile holy assault waves and templar gets an ornate sustained greatshield wall.

## Merchant workshop units (2026-10-22)

`merchant-units.png`: original artwork generated for this project with the built-in image generation tool. Six sprites: attack turret, protective core, siege turret, larva, chimera, perfected chimera. Original alpha preserved; source crops and animations implemented in `rpg-merchant-fx.js`. Prompt: see `merchant-art-prompt.txt`. Existing credited impact sheets remain in use for contact sparks and dust.

## Original priest marks and barriers — 2026-10-22

Created for this game with OpenAI's built-in image generation tool: `priest-brand-atlas.png` (inquisitor judgement crest), `priest-seal-atlas.png` (four-talisman exorcist binding barrier), `priest-chapel-atlas.png` (high priest cathedral sanctuary). Each sheet contains eight frames; runtime preserves source alpha and uses explicit frame timing. The corresponding `*-preview.gif` files preview those eight frames. Final prompts: [priest-art-prompts.txt](priest-art-prompts.txt). These are original generated assets, not downloaded third-party game sprites.

## Original gunner effect atlases — 2026-10-22

Created for this game with OpenAI's built-in image generation tool: `gunner-frag-atlas.png` (grenade fragments), `gunner-rocket-atlas.png` (directional rocket flame), `gunner-cluster-atlas.png` (opening cluster-shell payload), `gunner-rune-atlas.png` (arcane cartridge seal), `gunner-artillery-atlas.png` (earth-and-smoke mortar impact). All five are eight-frame 4x2 sheets with preserved alpha. Matching `*-preview.gif` files preview their frames. Prompts: [gunner-art-prompts.txt](gunner-art-prompts.txt). Runtime timing is tied to actual projectile impact and separation events.


### Element fusion summoner dual-orb avatar
`rpg-pixels-v2/characters/keunho-orbs.png` was created using the built-in OpenAI image generation tool, based on the existing project character sheet. Transparent alpha preserved.


### r76 elemental fusion transition
`fusion-transition-atlas.png` and its GIF preview were created with the built-in OpenAI image generation tool. Eight transparent animation frames; reverse frame order provides the split transition. Generated alpha is preserved in the runtime atlas. Prompt: `fusion-transition-prompt.txt`.


### r76 lich soul ritual
`lich-ritual-atlas.png` and its GIF preview use original built-in OpenAI image generation artwork. The eight source frames are cropped and packed into equal transparent atlas cells; the first frame supplies the phylactery prop. Prompt: `lich-ritual-prompt.txt`.


### r76 Harmonist elemental attack animations
Five original eight-frame transparent image atlases: `element-fire-attack-atlas.png`, `element-water-attack-atlas.png`, `element-wind-attack-atlas.png`, `element-earth-attack-atlas.png`, and `element-fusion-attack-atlas.png`. Created using the built-in OpenAI image generation tool; source alpha preserved. Corresponding GIF previews and individual prompt files are supplied.


### r78 K-pop idol
`rpg-pixels-v2/characters/seunguk-idol.png` was created using the built-in OpenAI image generation tool from the existing bard avatar, with user-approved K-pop styling. Transparent alpha preserved. Prompt: `rpg-pixels-v2/characters/seunguk-idol-prompt.txt`. Four original animated SVG effect strips in `rpg-fx/idol/` are authored by `scripts/build-rpg-idol-fx.py`.

## r79 — 최승영 궁수 계열 전용 애니메이션

- `archer/archer-atlas.png`: 25행·200프레임. 목제 화살, 정밀 강철 화살, 숲 화살, 거궁·파쇄·천리일섬, 룬·쌍성·분열·폭우 마탄, 바람·돌풍·폭풍 화살, 사냥 화살·깃털, 조준·명중·덫·바람·치유 연출은 프로젝트 전용으로 직접 제작.
- 늑대·매·곰 원화와 네 가지 자세는 내장 image_gen으로 생성. 원본 `archer/beasts-source.png`, 정확한 프롬프트 `archer/beasts-prompt.txt`. 생성된 투명도를 유지한 채 프레임을 잘라 게임용 아틀라스에 배치.
- 재생성: `scripts/build-rpg-archer-fx.py`. 직업별 GIF 7종도 동일 프레임을 사용하며, GIF의 초록색 배경은 미리보기 전용. 게임은 투명 PNG 아틀라스를 사용해 실제 충돌·접근·속박 시점에 맞춰 재생.

## r80 — 최현석 판정 및 전용 타격 연출

- `warrior/warrior-impact-source.png`: 내장 image_gen으로 제작한 혈액 회수·참수·지면 파괴·철갑 충격 원화. 정확한 프롬프트는 `warrior/warrior-impact-prompt.txt`.
- `warrior/warrior-impact-atlas.png`: 원화 투명도를 유지해 4단계 애니메이션으로 배치. 재생성은 `scripts/build-rpg-warrior-impact.py`.
- 직업별 전용 타격 GIF 4종은 게임과 같은 프레임을 사용한다. GIF 배경은 미리보기용이며 게임에는 투명 PNG가 사용된다.
- 준비 연출·강화 상태는 기존 직업별 SVG를 사용하고, 실제 타격·회수·균열·충격은 명중 이벤트를 기준으로 재생해 중복된 가짜 타격 연출을 줄였다.

## r81 — 박종찬 검사 계열

- `sword/sword-source.png`: 내장 image_gen으로 제작한 검사·검성·마검사·검귀·수라·룬나이트·소울브링어 전용 원화. 정확한 생성 프롬프트: `sword/sword-prompt.txt`.
- `sword/sword-atlas.png`, `sword/rune-glyph.png`: 생성 원화의 투명도를 유지해 분리한 게임용 프레임. 재생성: `scripts/build-rpg-sword-fx.py`.
- 직업별 GIF 7종은 같은 프레임을 사용한다. GIF의 초록 배경은 미리보기용이며 게임은 투명 PNG를 사용한다.

## Greatsword branch (2026-10-23)

Warrior / Vanguard / Dark Knight avatars were created specifically for this project with the built-in ImageGen tool. Original transparent PNGs and prompts: `greatsword-design/`. Gameplay sprite atlas: `../rpg-pixels-v2/characters/jongchan-greatsword-avatars.png`. Physical sword trails, segmented barricade and dark shockwaves are original Canvas animations in `rpg-greatsword-fx.js`; no third-party effect asset was added.

## r95 — 박종찬 전체 28개 스킬 원화 애니메이션

- 검사·검성·워리어·검귀·수라·뱅가드·다크나이트의 28개 기술에 프로젝트 전용 원화를 내장 ImageGen으로 생성했다. 외부 게임 리소스를 가져오지 않았다.
- 투명 원본 9장: `jongchan-painted/sources/`. 전체 생성 프롬프트와 원본 해시: `jongchan-painted/manifest.json`, `data/design/r95-jongchan-painted-sources.json`.
- `scripts/build-rpg-jongchan-painted.py`로 28개 투명 GIF와 같은 프레임의 PNG 아틀라스를 만든다. 게임은 실제 시전·명중·회전·방어 시점에 맞춰 PNG 프레임을 재생한다. GIF는 같은 그림의 반복 감상용 내보내기다.
- 전체 감상 페이지: `../rpg-jongchan-gif-gallery.html`. 피해 계수·스킬 판정은 이 연출 변경으로 수정하지 않았다.

## r96 — 박종찬 대검 3직업 SD 아바타

워리어·뱅가드·다크나이트는 기존 `characters/jongchan.png`를 얼굴·체형·도트 스타일 참조로 삼아 내장 ImageGen으로 재제작했다. 원본 3장·프롬프트·프레임 메타데이터는 `greatsword-design/sd-r96/`. 게임용 아틀라스는 `../rpg-pixels-v2/characters/jongchan-greatsword-sd.png`, 재생성은 `scripts/build-rpg-jongchan-sd-avatars.py`. 몸 높이·발 기준으로 렌더 크기와 앵커를 맞췄고 기존 검사·검성·검귀·수라는 유지했다.
