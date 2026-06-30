# ClearTone ShortForm

여러 숏폼 영상과 제품 카드를 하나의 반응형 iframe 페이지로 공유하는 GitHub Pages용 정적 프로젝트입니다.

## 공개 페이지

- 홈: https://kshpartner.github.io/ClearToneShortForm/
- iframe 페이지: https://kshpartner.github.io/ClearToneShortForm/embed.html
- 관리자: https://kshpartner.github.io/ClearToneShortForm/admin.html

## 외부 사이트에 붙이는 코드

```html
<iframe
  src="https://kshpartner.github.io/ClearToneShortForm/embed.html"
  width="100%"
  height="720"
  style="border:0;border-radius:18px;overflow:hidden;width:100%;max-width:100%"
  loading="lazy"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
  allowfullscreen>
</iframe>
```

기본값은 무음 자동 재생과 반복 재생입니다. 필요하면 URL에 `?autoplay=0` 또는 `?loop=0`을 붙여 끌 수 있습니다.

## 관리자 사용

`admin.html`에서 아래 값을 입력하고 카드를 추가/수정/삭제한 뒤 `GitHub에 저장`을 누르면 `js/data.js`가 업데이트됩니다.

- GitHub Token: repo 쓰기 권한이 있는 토큰
- 저장소: `kshpartner/ClearToneShortForm`
- 브랜치: `main`
- 데이터 파일: `js/data.js`

토큰은 브라우저 세션에만 저장되며 저장소 파일에는 기록되지 않습니다.

## 카드 데이터

각 카드에는 아래 값이 들어갑니다.

- `embedUrl`: YouTube watch, shorts, youtu.be, embed URL 또는 일반 iframe URL
- `image`: 제품 이미지 URL, 비워두면 이미지 없는 카드로 표시
- `productUrl`: CTA 클릭 시 이동할 제품 페이지 URL
- `brand`: 브랜드명
- `title`: 카드 제목
- `description`: 카드 설명
