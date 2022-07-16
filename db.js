require('dotenv').config({ path: __dirname + '/.env' })

module.exports = (mongoose, connectionString) => {
  mongoose.connect(connectionString, { useNewUrlParser: true })
  const db = mongoose.connection
  db.on(`error`, console.error.bind(console, `connection error:`))
  db.once(`open`, () => {
    console.log(`Connected to MongoDB`)
  })

  return db
}
