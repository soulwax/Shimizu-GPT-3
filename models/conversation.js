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
  conversationSchema.methods.getConversationByChannelID = async function (channelId) {
    return await this.model('Conversation').findOne({ channelId: channelId })
  }
  conversationSchema.methods.getLastMessagesInChannel = async function (channelId, limit) {
    await this.model('Conversation').findOne({ channelId: channelId })
      .then(conversation => {
        // Return the last messages in the conversation sorted by timestamp
        return conversation.conversation.messages.sort((a, b) => {
          return a.timestamp - b.timestamp
        }
        ).slice(0, limit)
      }).catch(err => {
        console.log(err)
      })
  }

  return mongoose.model('Conversation', conversationSchema)
}
