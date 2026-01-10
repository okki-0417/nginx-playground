# nginx-web-server

nginx で Web サーバーを構築する学習プロジェクト。

アプリケーションサーバー単体ではなく、nginx をリバースプロキシ / Web サーバーとして使い、異なるプロトコルでのリクエスト転送を学ぶ。

## 構成

```
nginx-web-server/
├── static/                 # フロントエンド (Vite + Tailwind + daisyUI)
│   ├── index.html          # ランディングページ
│   ├── about/
│   ├── contact/
│   ├── pricing/
│   └── dist/               # ビルド出力 → nginx が配信
├── api/                    # API サーバー (Fastify + Bun)
│   └── server/
│       └── server.ts
├── wordpress/              # WordPress テーマ
│   └── themes/
├── nginx.d/                # nginx 設定
│   └── default.conf
└── docker-compose.yml
```

## URL マッピング

| URL | 配信元 | プロトコル |
|-----|--------|-----------|
| `http://localhost:8080/` | nginx (static/dist) | 静的ファイル |
| `http://localhost:8080/api/*` | Fastify (localhost:3000) | HTTP proxy |
| `http://localhost:8080/wordpress/*` | WordPress (PHP-FPM) | FastCGI |

## 学んだこと

### nginx の役割
- **静的ファイル配信**: HTML, CSS, JS, 画像を高速に配信
- **リバースプロキシ**: バックエンドサーバーへのリクエスト転送
- **プロトコル変換**: HTTP → FastCGI など異なるプロトコルへの橋渡し

### プロトコルの違い
| 転送先 | nginx 設定 | 用途 |
|--------|-----------|------|
| HTTP サーバー (Fastify, Express) | `proxy_pass` | API サーバー |
| FastCGI (PHP-FPM) | `fastcgi_pass` | PHP アプリ |

### Docker での構成
- `wordpress:fpm` は PHP-FPM のみ (HTTP サーバーなし)
- `wordpress:latest` は Apache 内蔵
- nginx と PHP-FPM で volume を共有 (静的ファイルを nginx が配信するため)

### フロントエンド開発
- Vite で MPA (Multi-Page Application) 構成
- Tailwind CSS v4 + daisyUI でスタイリング
- ビルド時にテンプレート結合 (Handlebars など) も可能

## 起動方法

```bash
# フロントエンドをビルド
cd static && bun run build

# API サーバーを起動
cd api/server && bun server.ts

# Docker コンテナを起動
docker compose up -d

# nginx 設定をリロード
docker compose exec nginx nginx -s reload
```

## TODO: さらに学べること

- [ ] **SSL/TLS 終端**: Let's Encrypt で HTTPS 化、nginx で SSL 終端
- [ ] **ロードバランシング**: 複数のバックエンドサーバーへの分散
- [ ] **キャッシュ**: nginx でのレスポンスキャッシュ、Cache-Control ヘッダー
- [ ] **gzip/brotli 圧縮**: 静的ファイルの圧縮配信
- [ ] **レート制限**: `limit_req` でリクエスト制限
- [ ] **WebSocket プロキシ**: `proxy_pass` + Upgrade ヘッダーで WebSocket 対応
- [ ] **HTTP/2**: より効率的なプロトコル
- [ ] **ヘルスチェック**: バックエンドの死活監視
- [ ] **ログ分析**: アクセスログの解析、エラーログの監視
- [ ] **セキュリティヘッダー**: CORS, CSP, HSTS などの設定
