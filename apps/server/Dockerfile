FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
COPY packages/shared ./packages/shared
COPY apps/server ./apps/server
RUN npm install --workspace=apps/server --workspace=packages/shared
RUN npm run build --workspace=apps/server
EXPOSE 2567
CMD ["node", "apps/server/dist/index.js"]

