# Global Graphic Style

## Style Name

`Sky Cottage Pixel`

## Reference Source

Nguon reference duoc lay tu folder [style-references](C:\Users\namdh\.gemini\antigravity\scratch\flappy-plane\assets\style-references), dac biet la:

- [style ghibli mix pixel 1.png](C:\Users\namdh\.gemini\antigravity\scratch\flappy-plane\assets\style-references\style%20ghibli%20mix%20pixel%201.png)
- [style ghibli mix pixel 2.png](C:\Users\namdh\.gemini\antigravity\scratch\flappy-plane\assets\style-references\style%20ghibli%20mix%20pixel%202.png)
- [style ghibli mix pixel 3.png](C:\Users\namdh\.gemini\antigravity\scratch\flappy-plane\assets\style-references\style%20ghibli%20mix%20pixel%203.png)
- [style ghibli mix pixel 4.png](C:\Users\namdh\.gemini\antigravity\scratch\flappy-plane\assets\style-references\style%20ghibli%20mix%20pixel%204.png)

## Visual Direction

Day la global style moi cho toan project:

- painterly pixel art, mep mem, khoi tron, khong sac canh
- fantasy cottage world, floating islands, village roofs, giant trees, crystal ruins
- anh sang am, diu, trong, co cam giac binh minh hoac chieu muon
- mau sac sang nhung khong neon; uu tien pastel pha dat
- nhieu depth layer: foreground foliage, midground village, distant hills, cloud banks
- UI phai an theo the gioi nay, khong duoc tach thanh mot visual language sci-fi / glassmorphism hien dai

## Core Palette

Token duoc dong bo voi [theme.css](C:\Users\namdh\.gemini\antigravity\scratch\flappy-plane\css\theme.css).

- Sky blue: `#8fc8e8`
- Sky pale: `#d9f0f8`
- Cloud cream: `#f8f4de`
- Meadow light: `#c5dc7d`
- Meadow deep: `#7ca35d`
- Forest deep: `#355a47`
- Wood: `#8c6548`
- Roof terracotta: `#c97b5a`
- Lantern gold: `#f3c977`
- Lavender bloom: `#a98ad1`
- Crystal mint: `#8dd9d0`
- Ink outline: `#5c5147`

## Shape Language

- bo goc tron vua phai, khong bo vuong sac
- outline toi, mem, nhe, tranh vien den day
- do vat uu tien silhouette de doc o kich thuoc nho
- texture chia bang 3 cap do sang toi ro rang, khong noise random
- object tu nhien uu tien duong cong: may, doi, tan cay, dong song
- object nhan tao uu tien dang am, co tuoi doi song: nha mai ngoi, cua so, den treo, lo suoi

## Lighting Rules

- key light am va mem
- highlight dung mau kem, vang den, xanh troi nhat
- shadow dung xanh reu, xanh xam, nau toi; khong dung den tuyet doi
- dem van phai am va than thien, su dung midnight blue thay vi den dac

## Pixel Rules

- asset moi nen duoc thiet ke theo logic pixel art du la hien thi bang canvas hay CSS illustration
- block mau lon truoc, chi tiet sau
- khong dung blur that trong sprite; neu can glow thi glow rat tiet che
- anti-aliasing bang cap mau trung gian, khong lam me texture theo kieu painterly full-res

## Global UI Rules

UI cua project khong duoc trong nhu dashboard app thong thuong. Moi panel phai co cam giac la mot thanh phan cua the gioi game.

- nen UI: cream, sky pale, hoac panel giong parchment/painted wood
- vien: ink outline hoac wood border, khong dung border xam mac dinh
- button chinh: terracotta hoac lantern gold
- button phu: sage / forest / cloud blue
- text heading: serif co cam giac truyện cổ
- text body: sans sach, tron, nhe
- icon nen don gian, de doc, co do bong rat nhe

## Component Mapping For This Project

### Dashboard

- hero card nen mo ra nhu 1 postcard phong canh
- game card thumbnail nen la mini scene painterly pixel art, khong phai abstract gradient block
- filter pill nen co chat lieu gom/son mo, khong dung glass dark
- roadmap/status card nen dung palette wood, meadow, cloud

### Flappy Plane

- doi toan bo sky/background sang palette sky-meadow-cloud cua style nay
- plane sprite dung than may bay kem + accent terracotta / cloud blue
- pipe nen duoc xem nhu obstacle trong the gioi cottage fantasy: stone pillar, tree trunk gate, wind totem, crystal arch
- score card, restart button, hud frame nen theo wood + parchment + lantern

### Wisp Forest

- rat hop voi style reference, nhung can doi tu "dark sci-fi glass" sang "enchanted forest pixel"
- panel overlay nen la painted parchment/polished wood thay vi dark translucent glass
- hud card dung muted moss / bark / moonlit teal
- crystal, wisteria, shrine, giant tree la motif uu tien

## How To Apply To Existing Graphic Components

### 1. CSS components

Khi mot thanh phan dang dung mau/box-shadow/border rieng, doi ve token chung:

```css
.component {
  color: var(--theme-text);
  border: 1px solid var(--theme-border);
  border-radius: var(--theme-radius-md);
  background: var(--theme-panel-gradient);
  box-shadow: var(--theme-shadow-soft);
}
```

### 2. Buttons

- CTA chinh: `--theme-button-primary-start` -> `--theme-button-primary-end`
- CTA phu: `--theme-button-secondary-start` -> `--theme-button-secondary-end`
- text tren button uu tien nau toi thay vi trang gay

### 3. Card / panel / HUD

- card thong tin: dung panel cream/wood
- card gameplay: dung panel xanh troi nhat hoac moss nhe
- hud tren canvas: dung opacity vua phai, nhung palette van phai la wood/sage/cloud

### 4. Canvas-drawn assets

Neu mot asset duoc ve bang JS:

1. thay bang palette 6-10 mau toi da
2. tach 3 lop: sky, midground, foreground
3. them 1 diem nhan am: den long, cua so sang, crystal, may bay, dao bay
4. tranh gradient nhieu mau "digital"; thay bang band mau lon co buoc chuyen ro

### 5. Thumbnail / promo art

- luon co horizon ro
- luon co 1 focal object lon
- uu tien storytelling scene thay vi texture trang tri
- dung doi, may, dao bay, nha mai ngoi, song, rung, greenhouse, crystal

## Asset Checklist

Truoc khi them mot asset moi, check:

1. Co dung palette chung chua?
2. Co co silhouette ro o kich thuoc nho khong?
3. Co mot focal point ro khong?
4. Co giu cam giac am, thu cong, fantasy cottage khong?
5. Co lech sang cyberpunk, sci-fi UI, neon, realistic painting, hoac vector flat khong?

## Current Global Token File

Theme token chung nam tai [theme.css](C:\Users\namdh\.gemini\antigravity\scratch\flappy-plane\css\theme.css).

Neu ban muon, buoc tiep theo toi co the refactor tiep:

- [dashboard.css](C:\Users\namdh\.gemini\antigravity\scratch\flappy-plane\css\dashboard.css)
- [style.css](C:\Users\namdh\.gemini\antigravity\scratch\flappy-plane\css\style.css)
- [games/wisp-forest/style.css](C:\Users\namdh\.gemini\antigravity\scratch\flappy-plane\games\wisp-forest\style.css)
- [js/config.js](C:\Users\namdh\.gemini\antigravity\scratch\flappy-plane\js\config.js)

de doi toan bo UI va canvas sang dung style `Sky Cottage Pixel`.
