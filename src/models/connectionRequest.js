const mongoose = require('mongoose');

const connectionRequestSchema = new mongoose.Schema({
    fromUserId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    toUserId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    status: {
        type: String,
        required: true,
        enum: {
          values : ['interested', 'rejected', 'ignored', 'accepted'],
          message: `{VALUE} is not valid `
        }
    }
},
{
    timestamps: true
});

//compound index
connectionRequestSchema.index({fromUserId: 1, toUserId: 1});

//Kind of a middleware
connectionRequestSchema.pre('save', async function(next){
    const connectionRequest = this;
    //Check if fromUserId and toUserId are same
    if(connectionRequest.fromUserId.equals(connectionRequest.toUserId)){
        throw new Error("You cannot send request to yourself");
    } 

    next();

});
const ConnectionRequest = mongoose.model('ConnectionRequest', connectionRequestSchema);

module.exports = ConnectionRequest;