# ClearTone ShortForm

ClearTone 숏폼 영상과 제품 카드를 외부 사이트에 iframe으로 붙이기 위한 정적 공유 페이지입니다. GitHub Pages, Netlify, Vercel 같은 정적 호스팅에 그대로 올릴 수 있습니다.

## 사용 방법

1. `js/data.js`에서 YouTube 영상 ID, 제품명, 설명, 링크, 이미지 URL을 수정합니다.
2. `index.html`을 열어 카드 미리보기와 iframe 코드를 확인합니다.
3. 외부 사이트에는 아래 형식으로 붙입니다.

```html
<iframe
  src="https://YOUR_GITHUB_ID.github.io/ClearToneShortForm/embed.html?item=original"
  width="360"
  height="640"
  style="border:0;border-radius:24px;overflow:hidden"
  loading="lazy"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
  allowfullscreen>
</iframe>
```

## 데이터 수정

`js/data.js`의 각 항목에서 아래 값을 바꾸면 됩니다.

- `id`: iframe URL에 들어가는 고유 값
- `youtubeId`: YouTube 영상 ID
- `brand`, `title`, `description`: 하단 제품 카드 문구
- `productUrl`: 제품 카드 클릭 시 이동할 주소
- `image`: 하단 카드에 표시할 이미지 주소

## GitHub Pages

저장소를 GitHub에 올린 뒤 Settings > Pages에서 `main` 브랜치의 root를 배포 대상으로 선택하면 됩니다.

