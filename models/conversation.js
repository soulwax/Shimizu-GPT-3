/**
 * Returns a schema for the conversation model
 * @param {Object} mongoose 
 * @returns {Object} the Conversation Schema class
 */

// TODO: Soon to be reworked to support better AI memory of past conversations
module.exports = (mongoose) => {
  const conversationSchema = new mongoose.Schema({
    // Define a mongodb schema for conversations with two keys: channel id and user id, as well as a list of messages, for the user in different channels and for different users in one channel
    type: {
      type: String,
      required: true,
      enum: ['channel', 'user']
    },
    channel: {
      type: String,
      required: true
    },
    user: {
      type: String,
      required: true
    },
    messages: [{
      type: String,
      required: true,
      timestamps: true,
      default: Date.now
    }]
  })

  // Prototype helper functions
  conversationSchema.methods = {

  }

  return mongoose.model('Conversation', conversationSchema)
}
