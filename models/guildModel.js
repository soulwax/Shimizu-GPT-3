/**
 * Returns a schema for the Guild model
 * @param {Object} mongoose
 * @returns {Object} the Server Guild class
 */
module.exports = (mongoose) => {
  const guildSchema = new mongoose.Schema({
    id: String,
    name: String,
    premise: String,
    tokens: Number,
    completionMode: Boolean,
    chanceToRespond: Number
  })
  return mongoose.model('Guild', guildSchema)
}
