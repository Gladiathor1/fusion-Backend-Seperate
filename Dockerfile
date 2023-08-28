FROM node:alpine as SERVER

WORKDIR /server


COPY ./package.json ./package.json

RUN npm install

COPY ./src ./src
COPY ./tsconfig.json ./tsconfig.json

RUN CI=true sh -c "cd /server && mkdir data && npm run start && rm -rf data"

ENV PORT 3000

CMD ["npm", "run", "start"]