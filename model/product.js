import mongoose from "mongoose";

export const ProductSchema = new mongoose.Schema({
        img: String,
        img2: String,
        title: String,
        New: Boolean,
        oldPrice: Number,
        price: Number,
  });

  export default mongoose.model.Products || mongoose.model("Product",ProductSchema);