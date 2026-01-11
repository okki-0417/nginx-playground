# nginx-web-server

nginx で Web サーバーを学ぶ。

## 構成

| ディレクトリ | 説明 |
|-------------|------|
| `nginx.d/` | nginx 設定 |
| `static/` | フロントエンド (Vite + Tailwind + daisyUI) |
| `api/` | API サーバー |
| `wordpress/` | WordPress テーマ |

## URL マッピング

| URL | 配信元 | プロトコル |
|-----|--------|-----------|
| `https://localhost/` | nginx (static/dist) | 静的ファイル |
| `https://localhost/api/*` | Bun (localhost:3000, 3001) | HTTP proxy + ロードバランシング |
| `https://localhost/api/ws` | Bun | WebSocket |
| `https://localhost/wordpress/*` | WordPress (PHP-FPM) | FastCGI |

## 起動方法

```bash
# 全部一括起動
make all

# ロードバランシング確認時
PORT=3000 bun --watch api/server.ts  # ターミナル1
PORT=3001 bun --watch api/server.ts  # ターミナル2
```

## 実装済み

### 静的ファイル配信
- `static/` ディレクトリにフロントエンドコード
- `try_files` ディレクティブで存在しないファイルは404

### アプリケーションサーバーへのプロキシ
- `/api/` パスを Bun サーバーにプロキシ
- 環境変数でポート指定可能で、複数起動できる

### WordPress サイト配信
- `/wordpress/` パスを PHP-FPM に FastCGI プロトコルでプロキシ
- WordPress コンテナを `wordpress/` ディレクトリにマウントさせるためにごちゃごちゃしているs

### SSL/TLS 終端
- mkcert でローカル開発用証明書を発行
- nginx で SSL 終端、HTTP → HTTPS リダイレクト
- 証明書: `localhost.pem`, `localhost-key.pem`

### WebSocket プロキシ
- チャット機能を実装
- nginx で Upgrade ヘッダーを転送
- localhost/chat で動作確認可能

### HTTP/2
- `http2 on;` ディレクティブで有効化
- 1接続で複数リクエストを同時処理（多重化）

### ロードバランシング
- upstream ブロックで複数サーバーを定義
- デフォルトはラウンドロビン方式

## TODO

- [ ] **キャッシュ**: nginx でのレスポンスキャッシュ、Cache-Control ヘッダー
- [ ] **gzip/brotli 圧縮**: 静的ファイルの圧縮配信
- [ ] **レート制限**: `limit_req` でリクエスト制限
- [ ] **ヘルスチェック**: バックエンドの死活監視
- [ ] **ログ分析**: アクセスログの解析、エラーログの監視
- [ ] **セキュリティヘッダー**: CORS, CSP, HSTS などの設定
