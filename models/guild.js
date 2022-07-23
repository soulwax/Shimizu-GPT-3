/**
 * Returns a schema for the Guild model
 * @param {Object} mongoose
 * @returns {Object} the Server Guild class
 */
module.exports = (mongoose) => {
  const guildSchema = new mongoose.Schema({
    guildID: String,
    guildName: String,
    premise: String,
    tokens: Number,
    completionMode: Boolean,
    chanceToRespond: Number,
    whitelistedChannels: [String],
    blacklistedChannels: [String]
  })
  return mongoose.model('Guild', guildSchema)
}
