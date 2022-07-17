require('dotenv').config({ path: __dirname + '/.env' })
/**
 * Module exports a function that creates a new Conversation object in the database.
 * 
 * @param {Object} mongoose 
 * @param {String} connectionString 
 * @returns {Object} return the mongoose connection
 */

module.exports = (mongoose, connectionString) => {
  mongoose.connect(connectionString, { useNewUrlParser: true })
  const db = mongoose.connection
  db.on(`error`, console.error.bind(console, `connection error:`))
  db.once(`open`, () => {
    console.log(`Connected to MongoDB`)
  })

  return db
}