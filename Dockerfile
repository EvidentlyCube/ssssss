FROM node:22.2.0-alpine

USER root

# Use production node environment by default.
ENV NODE_ENV=production

USER node

WORKDIR /home/node/ssssss

COPY --chown=node:node . .

# RUN git clone https://github.com/EvidentlyCube/ssssss.git . \
RUN cd Backend && npm ci \
    && npm cache clean --force

# Run the application.
ENTRYPOINT []
CMD ["npm", "start"]