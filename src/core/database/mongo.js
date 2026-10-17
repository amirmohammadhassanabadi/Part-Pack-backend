const mongoose = require("mongoose");
const { installAccountValidators } = require("./accountValidators");

async function connectMongo() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        await installAccountValidators(mongoose.connection.db);
        console.log("MongoDB connected; account validation enforced");
    } catch (error) {
        console.error("MongoDB connection or account validation failed:", error.message);
        process.exit(1);
    }
}

module.exports = connectMongo;
