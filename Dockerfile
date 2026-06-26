FROM oven/bun:1 as builder

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
RUN mkdir -p public && bun run build

FROM oven/bun:1-slim as runner

WORKDIR /app

COPY --from=builder /app/package.json ./
COPY --from=builder /app/bun.lock ./
RUN bun install --frozen-lockfile --production

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/.next/static ./.next/static
RUN mkdir -p public
COPY --from=builder /app/public ./public

EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
  CMD bun -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)).then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# Run as the non-root user shipped in the oven/bun image.
USER bun

CMD ["bun", "run", "start"]
