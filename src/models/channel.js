const mongoose = require('mongoose')
const { Schema } = mongoose
/**
 * Returns a schema for the conversation model
 * @param {Object} mongoose
 * @returns {Object} the Conversation Schema class
 */

const channelSchema = new Schema({
  channelId: {
    type: String,
    required: true,
    unique: true
    },
    channelName: {
        type: String,
        required: true,
    },
    isWhiteListed: {
        type: Boolean,
    },
    isBlackListed: {
        type: Boolean,
    }
})


// Prototype helper functions
channelSchema.methods = {}

module.exports = mongoose.model('Channel', channelSchema)
