require('dotenv').config()

const app = require('./src/app')
const connectMongo = require('./src/core/database/mongo')

const PORT = process.env.PORT || 4000;

async function startServer() {
  try {
    await connectMongo()

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
    })
  } catch (error) {
    console.error('Server failed to start:', error)
    process.exit(1)
  }
}

startServer();