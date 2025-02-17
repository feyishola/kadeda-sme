const mongoose = require("mongoose")
const { mongoURI } = require("../config")


module.exports = async () => {
    dbConn = mongoose.connection;
    mongoose.set('strictQuery', false);
    dbConn
        .on("connected", () => {
            console.log("Connected to mongoDb");
        })
        .on("connecting", () => {
            console.log("Connecting to mongo");
        })
        .on("error", (error) => {
            console.log(`Error connecting to mongoDb >> ${error.message}`);
        })
        .on("disconnected", () => {
            console.log("Disconnected from mongo");
            setTimeout(async () => {
                console.log("Reconnecting to mongo");
                await mongoose.connect(mongoURI, {
                })
            }, 5000);
        })
    await mongoose.connect(mongoURI, {
    })
}