# server/Dockerfile
# Node.js Web Service用（必要な場合のみ）

FROM node:18-alpine

WORKDIR /app

# パッケージファイルをコピー
COPY package*.json ./
COPY tsconfig.json ./

# 依存関係をインストール
RUN npm ci --only=production

# ソースコードをコピー
COPY src ./src

# TypeScriptをビルド
RUN npm run build

# ポート公開
EXPOSE 10000

# 本番環境での起動
CMD ["npm", "start"]