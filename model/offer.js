import mongoose from 'mongoose';

const offerSchema = new mongoose.Schema({
    name: String,
    description: String,
    discount: Number,
    code: String,
    expireAt: Date
})

export default mongoose.model('Offer', offerSchema);