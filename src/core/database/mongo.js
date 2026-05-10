const mongoose = require("mongoose");

async function connectMongo() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB connected successfully - " + process.env.MONGO_URI);
    } catch (error) {
        console.error(`❌ MongoDB connection failed: ${process.env.MONGO_URI}`, error.message);
        process.exit(1);
    }
}

module.exports = connectMongo;