.PHONY: all build dev up down restart reload api logs clean

# 全部一括実行（ビルド → コンテナ起動 → APIサーバー起動）
all: build up api

# フロントエンドビルド
build:
	cd static && bun run build

# フロントエンド開発サーバー
dev:
	cd static && bun run dev

# Dockerコンテナ起動
up:
	docker compose up -d

# Dockerコンテナ停止
down:
	docker compose down

# コンテナ再起動
restart:
	docker compose down && docker compose up -d

# nginx設定リロード
reload:
	docker compose exec nginx nginx -s reload

# APIサーバー起動（フォアグラウンド）
api:
	cd api && bun run start

# APIサーバー起動（watchモード）
api-dev:
	cd api && bun run dev

# ビルド → リロード
br: build reload

# ログ表示
logs:
	docker compose logs -f

# nginxログのみ
logs-nginx:
	docker compose logs -f nginx

# キャッシュクリア
clean:
	rm -rf static/dist static/node_modules/.vite

# 依存関係インストール
install:
	cd static && bun install
	cd api && bun install

# 型チェック
typecheck:
	cd api && bunx tsc --noEmit
	cd static && bunx tsc --noEmit

# SSL証明書生成（初回のみ）
cert:
	mkcert localhost
