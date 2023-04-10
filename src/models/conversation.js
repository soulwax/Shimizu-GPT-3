/**
 * Returns a schema for the conversation model
 * @param {Object} mongoose
 * @returns {Object} the Conversation Schema class
 */

// TODO: Soon to be reworked to support better AI memory of past conversations
module.exports = (mongoose) => {
  const conversationSchema = new mongoose.Schema({
    // Define a mongodb schema for conversations with two keys: channel id and user id, as well as a list of messages, for the user in different channels and for different users in one channel
    creationDate: { type: Date, default: Date.now },
    type: {
      type: String,
      required: true,
      enum: ['channel', 'user']
    },
    channelId: {
      // channelId is crucial for fype === 'channel', so far I only intend to support channels in non user conversations
      type: String,
      required: true
    },
    channelName: {
      // channelName is for convenience, so that the model can recall a readable name for the channel
      type: String,
      required: true
    },
    userId: {
      // userId is crucial for fype === 'user', if it's a channel conversation, it's the user who started the conversation
      type: String,
      required: true
    },
    username: {
      // if the conversation is of type 'user', this is his username and the the model will call him by
      type: String,
      required: true
    },
    messages: [
      {
        message: {
          type: String,
          required: true
        },
        timestamp: {
          type: Date,
          required: true,
          default: Date.now
        },
        userId: {
          type: String,
          required: true
        },
        username: {
          type: String,
          required: true
        }
      }
    ]
  })

  // Prototype helper functions
  conversationSchema.methods = {}

  return mongoose.model('Conversation', conversationSchema)
}
