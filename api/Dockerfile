FROM node:21.7.1
LABEL author="Umar Adamu Jere"
WORKDIR /app
COPY package.json .
RUN ["npm", "install"]
COPY src ./src
EXPOSE 3000
CMD ["npm", "start"]
