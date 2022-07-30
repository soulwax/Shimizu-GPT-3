/**
 * Returns a schema for the conversation model
 * @param {Object} mongoose 
 * @returns {Object} the Conversation Schema class
 */
module.exports = (mongoose) => {
  const conversationSchema = new mongoose.Schema({
    type: {
      type: String,
      enum: ['private', 'channel'],
      default: 'channel'
    },
    guildId: {
      type: String,
      required: true
    },
    channelId: {
      type: String,
      required: true
    },
    conversation: [
      {
        userId: {
          type: String,
          required: true
        },
        userName: {
          type: String,
          required: true,
          default: 'Unknown'
        },
        messages: [
          {
            message: {
              type: String,
              required: true,
              default: ''
            },
            timestamp: {
              type: Date,
              required: true,
              default: Date.now
            }
          }
        ]
      }
    ]
  })

  //TODO: define helper functions for the conversation model

  return mongoose.model('Conversation', conversationSchema)
}
