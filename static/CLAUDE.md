# static/ ディレクトリの実装方針

## スタイリング

- **Tailwind CSS のみ使用**。`<style>` タグやインライン style 属性は使わない
- 動的なスタイル変更は `classList.toggle()` で Tailwind クラスを追加・削除
- 例: `element.classList.toggle("after:content-['*']", isModified)`

## JavaScript / TypeScript

- **インラインスクリプト禁止**。必ず外部 `.ts` ファイルに分離
- 各ページの JS は `ページ名.ts` または `ページ名/index.ts` に配置
- 例: `index.html` → `index.ts`, `chat/index.html` → `chat/index.ts`

## HTML 構成

- MPA (Multi-Page Application) 構成
- 新規ページは `ページ名/index.html` として作成
- `vite.config.ts` の `rollupOptions.input` に追加が必要

## ビルド

```bash
bun run build  # tsc && vite build
```

## 使用ライブラリ

- Vite (ビルドツール)
- Tailwind CSS v4
- daisyUI (Tailwind コンポーネント)
