# Only the web server. The built site is not baked in: docker-compose.yml
# mounts ./dist at /srv, and CI uploads each release there without restarting
# this container — so this image is rebuilt only when this file changes.
FROM node:24-alpine

RUN npm install -g serve@14.2.6

USER node
EXPOSE 3000

# Unknown paths fall back to index.html (client-side routes) through the
# "rewrites" rule in public/serve.json, not through serve's -s flag: -s puts a
# catch-all rewrite first, which shadows the extensionless
# /.well-known/apple-app-site-association that the mobile app's Universal Link
# needs. This CMD and public/serve.json must change together: the new CMD with
# the old serve.json 404s every client-side route, and the old CMD with the
# new serve.json is just the old behaviour. The rule's syntax is specific to
# the pinned serve 14.2.6 (path-to-regexp 3), so a serve bump must re-check
# it. serve.json (redirects, rewrites, cache headers) is still read from /srv
# once, at startup.
CMD ["serve", "/srv", "-l", "3000"]
