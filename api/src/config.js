const { APP_PORT, MONGO_URI } = process.env;

module.exports = {
  appPort: APP_PORT | 3000,
  mongoURI: MONGO_URI || "mongodb://mongo:27017/opsgrant",
};
