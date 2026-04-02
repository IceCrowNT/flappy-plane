# Global Graphic Style

## Style Name

`Ghibli Pixel Adventure`

## Reference Source

Nguon reference duoc lay tu folder [style-references](C:\Users\namdh\.gemini\antigravity\scratch\flappy-plane\assets\style-references).

Cum reference moi cho thay day khong chi la mot world "cottage meadow", ma la mot he visual thong nhat co the mo rong qua nhieu biome:

- meadow village
- enchanted forest
- floating islands
- crystal sanctum
- mushroom night grove
- desert ruins
- arctic aurora
- underwater ruins
- light steampunk sky world

## Global Direction

Day la global style moi cua toan project:

- pixel art mem, painterly, cinematic
- khung canh luon co storytelling ro, khong chi la texture trang tri
- fantasy phiêu lưu am ap, than thien, kham pha, khong cyberpunk, khong sci-fi UI hien dai
- hinh khoi tron, mep mem, outline toi vua phai
- mau sac giau khong khi, nhieu lop do sau, nhung van sach va de doc o kich thuoc nho

## World Bible

Tat ca asset va UI moi phai co cam giac nam trong cung mot vu tru hinh anh:

- nhan vat nho so voi canh, nhan manh su ky vi cua the gioi
- moi scene co mot focal point ro: nha, dao bay, cay lon, crystal, den long, tau bay, cong ruins
- foreground, midground, background tach lop ro
- anh sang luon co huong, co nhiet do mau, co mood
- du la ngay, dem, bang gia, sa mac hay duoi nuoc, style van giu chat "Ghibli x pixel"

## Core Invariants

Nhung diem nay khong duoc doi, du biome co thay doi:

1. Pixel art painterly, khong vector flat.
2. Outline mem bang mau toi pha nau/xam/xanh, khong dung vien den gac.
3. Palette khong neon gay, luon co lop mau trung gian.
4. Asset luon co chieu sau va atmospheric perspective.
5. UI phai an vao the gioi game, khong tach thanh app dashboard hien dai.
6. Highlight uu tien lantern glow, sky glow, crystal glow, moon glow thay vi effect digital.

## Master Palette

Token tong nam tai [theme.css](C:\Users\namdh\.gemini\antigravity\scratch\flappy-plane\css\theme.css).

### Base world

- Sky blue: `#8fc8e8`
- Sky pale: `#dff1f8`
- Cloud cream: `#f8f4de`
- Ink: `#5c5147`
- Text warm: `#4d433b`
- Wood: `#8c6548`
- Roof terracotta: `#c97b5a`
- Lantern gold: `#f3c977`

### Nature biome

- Meadow light: `#c5dc7d`
- Meadow deep: `#7ca35d`
- Forest: `#355a47`
- Moss: `#6f8e5f`
- Wisteria / lavender: `#a98ad1`

### Crystal / magic biome

- Crystal mint: `#8dd9d0`
- Crystal blue: `#7cc8f2`
- Moon violet: `#7e6bc4`
- Glow cyan: `#9be7ff`

### Warm earth biome

- Sand light: `#e6cf9f`
- Sand deep: `#c9a46b`
- Stone ruin: `#b8ae9b`
- Sun haze: `#f7e3b3`

### Cold biome

- Ice pale: `#d8f3ff`
- Ice blue: `#8ecae8`
- Aurora mint: `#79e2c3`
- Night blue: `#36557a`

### Underwater biome

- Sea blue: `#4aa8d8`
- Deep sea: `#276487`
- Coral pink: `#d989ae`
- Pearl glow: `#d9f5ff`

## Biome System

Khi tao asset moi, khong invent style moi. Chi chon mot trong cac biome sau va van giu core invariants:

### Meadow / Village

- palette: sky, cloud, meadow, terracotta, wood
- motif: doi co, lang nho, song nho, dao bay, den long, airship

### Enchanted Forest

- palette: forest, moss, lantern gold, lavender, crystal mint
- motif: giant tree, treehouse, rope bridge, shrine, spirit light

### Crystal / Ruins

- palette: crystal blue, mint, stone, cloud, soft gold
- motif: ruins, giant crystals, floating temple, treasure chamber

### Mushroom Night

- palette: moon violet, mushroom glow, lantern gold, teal, forest dark
- motif: mushroom forest, dem tim xanh, snail glow, boardwalk

### Desert / Ancient

- palette: sand, stone, sun haze, cactus green, shadow brown
- motif: ancient gate, temple, scorpion, oasis, carved pillars

### Arctic / Aurora

- palette: ice pale, ice blue, aurora mint, night blue, pearl white
- motif: bear, ice castle, frozen island, northern sky

### Underwater

- palette: sea blue, deep sea, crystal cyan, coral pink, pearl glow
- motif: diver, ray, ruins, statue, chest, bubble light

### Light Steampunk Sky

- palette: brass-wood, sky blue, cloud cream, copper, soot brown
- motif: telescope, gear console, airship, observatory, floating station

## Shape Language

- duong cong uu tien cho may, cay, doi, dong song, mushroom cap
- khoi kien truc co dang co tich: mai ngoi, cua so tron, tower nho, greenhouse, shrine gate
- machine trong world steampunk van phai mem va hand-crafted, tranh industrial hard-edge
- character silhouette ro, dau hoi to, phu kien ro, de doc o tile nho

## Lighting Rules

- moi scene phai co key light ro: mat troi, mat trang, den long, crystal, aurora, nuoc phan xa
- shadow mau, khong pha den cuc manh
- glow luon mem, loang nhe, khong bloom gay
- chuyen sang dem van giu su de thuong, tranh horror

## UI Rules

UI cua project phai duoc xem la mot phan cua adventure journal / game shell:

- panel sang kieu parchment, painted wood, moss glass, hoac cloud card
- border dung ink/wood/stone tones, khong dung xam mac dinh
- CTA chinh dung lantern gold hoac terracotta
- CTA phu dung sage, cloud blue, moss
- heading serif co tinh truyện cổ
- body sans mem, sach
- pixel font chi dung cho score/HUD retro neu that su can

## Component Mapping For This Repo

### Dashboard

- dashboard nen la travel poster cua world, khong phai app portal
- hero card dang postcard phong canh
- game card la mini scene theo tung biome
- roadmap/status card co the chon palette meadow / wood / crystal tuy ngữ cảnh

### Flappy Plane

- uu tien biome `Meadow / Village` ket hop `Light Steampunk Sky`
- plane nen la cottage-sky machine: kem, wood, brass, cloud blue
- pipe/obstacle nen thanh tree gate, tower pillar, crystal arch, floating post
- background nen co doi, may, lang, air routes, floating islands

### Wisp Forest

- uu tien biome `Enchanted Forest` ket hop `Crystal / Ruins`
- hud/panel khong dark sci-fi glass
- dung moss, bark, parchment, crystal glow

## How To Apply To Existing Graphic Components

### 1. CSS components

Mọi component UI phai map ve token `--theme-*`:

```css
.component {
  color: var(--theme-text);
  border: 1px solid var(--theme-border);
  border-radius: var(--theme-radius-md);
  background: var(--theme-panel-gradient);
  box-shadow: var(--theme-shadow-soft);
}
```

Neu component thuoc biome rung/crystal, co the doi sang panel bien the biome thay vi invent mau moi.

### 2. Buttons

- primary: `--theme-button-primary-start` -> `--theme-button-primary-end`
- secondary: `--theme-button-secondary-start` -> `--theme-button-secondary-end`
- tertiary theo biome: crystal, moss, desert, aurora, sea

### 3. Card / panel / HUD

- card thong tin: cream / parchment / cloud
- card gameplay: moss / bark / crystal / stone theo biome
- hud tren canvas nen trong, nhe, van doc tot tren background painterly

### 4. Canvas-drawn assets

Neu asset duoc ve bang JS:

1. chon biome truoc khi ve
2. gioi han palette trong 6-12 mau chinh
3. chia canh theo foreground / midground / background
4. co 1 focal point va 1 light source ro
5. uu tien silhouette ro hon la chi tiet vuon vat

### 5. Promo / thumbnail art

- luon co horizon ro hoac chieu sau ro
- scene phai ke chuyen
- co 1 vat the lon nhan dien ngay o thumb size
- tranh abstract gradient block

## Command Guidance For Other Threads

Khi giao viec cho thread khac, nen chi ro:

- style: `Ghibli Pixel Adventure`
- reference source: `assets/style-references`
- style doc: `docs/global-graphic-style.md`
- token file: `css/theme.css`
- biome can ap dung cho surface do

Vi du:

`Refactor Flappy Plane theo global style Ghibli Pixel Adventure, uu tien biome Meadow/Village + Light Steampunk Sky, dung assets/style-references lam reference bat buoc.`

## Current Global Token File

Theme token chung nam tai [theme.css](C:\Users\namdh\.gemini\antigravity\scratch\flappy-plane\css\theme.css).
