# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

nginx をリバースプロキシ / Web サーバーとして使い、異なるプロトコルでのリクエスト転送を学ぶプロジェクト。

## Architecture

```
Browser → nginx (Docker)
            ├── /           → static/dist (静的ファイル)
            ├── /api/*      → Fastify API (host.docker.internal:3000, HTTP proxy)
            └── /wordpress/* → WordPress PHP-FPM (FastCGI)
```

- **nginx**: SSL終端、静的ファイル配信、リバースプロキシ
- **static/**: Vite + Tailwind CSS v4 + daisyUI のフロントエンド (MPA構成)
- **api/**: Fastify + Bun の API サーバー (ホストマシンで実行)
- **wordpress/**: PHP-FPM で動作する WordPress (Docker内)

## Commands

```bash
# フロントエンドをビルド
cd static && bun run build

# API サーバーを起動 (ホストマシンで実行)
cd api && bun run start       # または bun run dev でwatch mode

# Docker コンテナを起動
docker compose up -d

# nginx 設定をリロード
docker compose exec nginx nginx -s reload

# コンテナを停止・再起動
docker compose down && docker compose up -d
```

## URL Mapping

| URL | 配信元 | プロトコル |
|-----|--------|-----------|
| `https://localhost/` | nginx (static/dist) | 静的ファイル |
| `https://localhost/api/*` | Fastify (localhost:3000) | HTTP proxy |
| `https://localhost/wordpress/*` | WordPress (PHP-FPM) | FastCGI |

## SSL Certificates (Local Development)

mkcert で発行した証明書を使用:
- `localhost.pem` - サーバー証明書
- `localhost-key.pem` - 秘密鍵

```bash
# 証明書を発行 (初回のみ)
mkcert -install
mkcert localhost
```

## Key Files

- `nginx.d/default.conf` - nginx 設定 (SSL、プロキシ、FastCGI)
- `docker-compose.yml` - コンテナ構成 (nginx, wordpress, mysql)
- `static/vite.config.ts` - フロントエンドビルド設定
- `api/server.ts` - API サーバーエントリポイント

## Bun Usage

このプロジェクトでは Node.js の代わりに Bun を使用:
- `bun run <script>` でスクリプト実行
- `bun install` で依存関係インストール
- Bun は自動的に .env をロードするため dotenv 不要
