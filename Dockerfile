# Only the web server. The built site is not baked in: docker-compose.yml
# mounts ./dist at /srv, and CI uploads each release there without restarting
# this container — so this image is rebuilt only when this file changes.
FROM node:24-alpine

RUN npm install -g serve@14.2.6

USER node
EXPOSE 3000

# -s: unknown paths fall back to index.html (client-side routes). serve.json
# (redirects, cache headers) is read from /srv once, at startup.
CMD ["serve", "-s", "/srv", "-l", "3000"]
