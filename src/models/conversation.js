const mongoose = require('mongoose')
const { Schema } = mongoose
/**
 * Returns a schema for the conversation model
 * @param {Object} mongoose
 * @returns {Object} the Conversation Schema class
 */

const messageSchema = new Schema({
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    required: true
  },
  author: {
    type: String,
    required: true
  }
})

const conversationSchema = new Schema({
  channelId: {
    type: String,
    required: true,
    unique: true
  },
  messages: [messageSchema]
})

// Prototype helper functions
conversationSchema.methods = {}

module.exports = mongoose.model('Conversation', conversationSchema)
