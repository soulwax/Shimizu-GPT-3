/**
 * Returns a schema for the conversation model
 * @param {Object} mongoose 
 * @returns {Object} the Conversation Schema class
 */
module.exports = (mongoose) => {
  const conversationSchema = new mongoose.Schema({
    type: String,
    guildID: Number,
    conversations: [
      {
        conversationID: Number,
        userID: Number,
        userName: String,
        messages: [
          {
            messageID: Number,
            message: String,
            timestamp: Date
          }
        ]
      }
    ]
  })
  return mongoose.model('Conversation', conversationSchema)
}
