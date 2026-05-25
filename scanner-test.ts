const apiKey = process.env.OPENAI_API_KEY
const dbUrl = process.env.DATABASE_URL
const port = 3000
function connectToDatabase() {
  return dbUrl
}
