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
    guildID: {
      type: String,
      required: true
    },
    conversations: [
      {
        conversationID: {
          type: Number,
          required: true
        },
        userID: {
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
            messageID: {
              type: Number,
              required: true
            },
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
