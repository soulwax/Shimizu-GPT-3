/**
 * Returns a schema for the Guild model
 * @param {Object} mongoose
 * @returns {Object} the Server Guild class
 */
module.exports = (mongoose) => {
  const guildSchema = new mongoose.Schema({
    guildID: {
      type: String,
      required: true
    },
    guildName: {
      type: String,
      required: true
    },
    premise: {
      type: String,
      required: true,
      default: 'is a chat bot that pretends to be a real discord member'
    },
    tokens: {
      type: Number,
      required: true,
      default: 360
    },
    completionMode: {
      type: Boolean,
      required: true,
      default: false
    },
    chanceToRespond: {
      type: Number,
      required: true,
      default: 0.05
    },
    whitelistedChannels: {
      type: [String],
      required: false
    },
    blacklistedChannels: {
      type: [String],
      required: false
    }
  })

  //TODO: define helper functions for the guild model
  
  return mongoose.model('Guild', guildSchema)
}
