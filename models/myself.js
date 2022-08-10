module.exports = (mongoose) => {
    const myselfSchema = new mongoose.Schema({
        myId: {
            type: Number,
            required: true
        },
        name: {
            type: String,
            required: true
        },
        model: {
            type: String,
            default: 'text-davinci-002'
        },
        apiKey: {
            type: String,
            required: true
        },
        temperature: {
            type: Number,
            min: 0,
            max: 1,
            required: true,
            default: 0.5
        },
        top_p: {
            type: Number,
            min: 0,
            max: 1,
            required: true,
            default: 0.95
        },
        frequency_penalty: {
            type: Number,
            min: 0,
            max: 1,
            required: true,
            default: 0.0
        },
        presence_penalty: {
            type: Number,
            min: 0,
            max: 1,
            required: true,
            default: 0.0
        },
        stop: {
            type: [String],
            required: true,
            default: ['Shimizu', '\n']
        },
        chanceToRespond: {
            type: Number,
            min: 0,
            max: 1,
            required: true,
            default: 0.05
        },
        rawMode: {
            type: Boolean,
            required: true,
            default: false
        },
        completionMode: {
            type: Boolean,
            required: true,
            default: false
        }
    });
    return mongoose.model('Myself', myselfSchema);
}