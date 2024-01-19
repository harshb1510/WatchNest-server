import UserModel from '../model/user.js'
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import ProductModel from "../model/product.js"
import Razorpay from 'razorpay';
import mongoose from 'mongoose';
import crypto from 'crypto';


export async function coupon(req,res){
    try{
        const code = req.body.coupon;
        console.log(code);
        const _id = req.params.id;
        const user=await UserModel.findById({_id});
        if(!user) return res.status(401).send("User not found");
        const validCoupon = await offer.findOne({code:code});
        if (!validCoupon) {
            return res.status(400).send({ error: "Invalid Coupon" });
        }
        //get discount from coupon
        const discount = validCoupon.discount;
        res.status(200).send({message:"Sent",discount});
    }
    catch(error){
        console.error(error);
        res.status(500).send({error:error.message || "Internal Server Error"});
    }
}


export async function saveOrder(req,res){
    try{
        const _id = req.params.id;
        const order = req.body;
        const user=await UserModel.findById({_id});
        if(!user) return res.status(401).send("User not found");
        user.orders.push(order);
        await user.save();
        res.status(200).send({message:"Order saved successfully"});
    }catch(error){
        console.error(error);
        res.status(500).send({error:error.message || "Internal Server Error"});
    }
}

export async function orders(req,res){
    try{
    const razorpay = new Razorpay({
        key_id:process.env.RAZORPAY_PUBLIC_ID,
        key_secret:process.env.RAZORPAY_SECRET_ID
    }); 
    const order = {
        amount:req.body.cartTotalAmount*100,
        currency:"INR",
        receipt:crypto.randomBytes(10).toString('hex'),
    };
    razorpay.orders.create(order, (error, order) => {
        if (error) {
            console.log(error);
            return res.status(500).send({ message: "Something went wrong" });
        }
        const orderDetails={
            items:req.body.cartItems,
            totalAmount:req.body.cartTotalAmount,
            date:Date.now(),
            razorpayOrderId:order.id
        }
        return res.status(200).json({data:order
        ,orderDetails});
    });
}catch{
    console.error(error);
    res.status(500).send({ error: error.message || "Internal Server Error" });
}
}


export async function verifyPayment(req,res){
    try {
        const {razorpay_order_id,razorpay_payment_id,razorpay_signature}=req.body;
        const sign = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSign = crypto.createHmac("sha256", process.env.RAZORPAY_SECRET_ID).update(sign.toString()).digest("hex");
        if(razorpay_signature===expectedSign){
           return res.status(200).json({message:"Payment verified Successfull"});
        }else{
        return res.status(400).json({message:"Payment verification failed"});
    }
        
    } catch (error) {
        
    }
}
        

export async function register(req, res) {
    try {
        const { firstName,lastName,email,password } = req.body;
        // Check the existing username

        // Check for an existing email
        const existEmail = await UserModel.findOne({ email });
         if (existEmail) {
            res.status(400).send({ error: "Please use a unique email" });
        } else {
            if (password) {
                const hashedPassword = await bcrypt.hashSync(password, 10);

                const user = new UserModel({
                    firstName,
                    lastName,
                    email,
                    password: hashedPassword,
                });

                // Save the user and handle the result
                try {
                    const result = await user.save();
                    res.status(201).send({ msg: "User registered successfully" });
                    
                } catch (error) {
                    console.error(error);
                    res.status(500).send({ error });
                }
            }
        }
    } catch (error) {
        console.error(error);
        res.status(500).send({ error });
    }
}



export async function login(req, res) {
    try {
        const { email, password } = req.body;

        // Check for an existing email
        const user = await UserModel.findOne({ email });

        if (!user) {
            return res.status(404).send({ error: "User not found" });
        }

        const passwordCheck = await bcrypt.compare(password, user.password);

        if (!passwordCheck) {
            return res.status(400).send({ error: "Password does not match" });
        }

        // Create jwt token
        const token = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.JWTPRIVATEKEY,
            { expiresIn: "24h" }
        );

        return res.status(200).send({
            msg: "Login Successful...!",
            token
        });

    } catch (error) {
        return res.status(500).send({ error: error.message || "Internal Server Error" });
    }
}


export async function getUser(req, res) {
    try {
        const { _id } = req.params;
        const user = await UserModel.findOne({ _id }); // Await here
        if (!user) {
            throw new Error("No User found");
        } else {
            return res.status(201).json(user);
        }
    } catch (error) {
        console.error(error); // Log the error for debugging
        res.status(500).send({ error: error.message || "Internal Server Error" });
    }
}

export async function updateCart(req, res) {
    try {
        const { id } = req.params;
        const product = req.body;
        const productId = product._id;

        const user = await UserModel.findOne({ _id: id });

        if (!user) {
            throw new Error("No User found");
        }

        const { cartItems, cartTotalQuantity, cartTotalAmount } = updateCartItems(user.cart, product);
        await UserModel.updateOne({ _id: id }, {
            $set: {
                "cart.cartItems": cartItems,
                "cart.cartTotalQuantity": cartTotalQuantity,
                "cart.cartTotalAmount": cartTotalAmount,
            },
        });

        res.status(200).send({ message: "Done" });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send({ error: "Internal Server Error" });
    }
}

function updateCartItems(cart, product) {
    const cartItems = [...cart.cartItems];
    const existingProductIndex = cartItems.findIndex(item => item.product._id.toString() === product._id.toString());

    if (existingProductIndex !== -1) {
        // Product already exists in the cart
        cartItems[existingProductIndex].cartQuantity += 1;
    } else {
        // Product doesn't exist in the cart, add it
        cartItems.push({ product, cartQuantity: 1 });
    }

    const cartTotalQuantity = cart.cartTotalQuantity + 1;
    const cartTotalAmount = cart.cartTotalAmount + product.price;

    return { cartItems, cartTotalQuantity, cartTotalAmount };
}


export async function clearCart(req,res){
    try {
        const { _id } = req.params;
        const user = await UserModel.findOne({ _id });
    
        if (!user) {
            throw new Error("No User found");
        } else {
            await UserModel.updateOne({ _id }, {
                $set: {
                    "cart.cartItems": [],
                    "cart.cartTotalQuantity": 0,
                    "cart.cartTotalAmount": 0,
                },
            });
        }
    
        res.status(200).send({ message: "Done" });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send({ error: "Internal Server Error" });
    }
}

export async function decreaseQuantity(req, res) {
    try {
        const { _id, cartId } = req.params;
        const user = await UserModel.findOne({ _id });

        if (!user) {
            throw new Error("No User found");
        } else {
            const cartItems = user.cart.cartItems;
            const existingProductIndex = cartItems.findIndex((item) => item._id.toString() === cartId.toString());

            if (existingProductIndex !== -1) {
                if (cartItems[existingProductIndex].cartQuantity > 1) {
                    const cartTotalQuantity = user.cart.cartTotalQuantity - 1;
                    const cartTotalAmount = user.cart.cartTotalAmount - cartItems[existingProductIndex].product.price;

                    cartItems[existingProductIndex].cartQuantity -= 1;

                    await UserModel.updateOne({ _id }, {
                        $set: {
                            "cart.cartItems": cartItems,
                            "cart.cartTotalQuantity": cartTotalQuantity,
                            "cart.cartTotalAmount": cartTotalAmount,
                        },
                    });
                } else {
                    // If cart quantity is 1, remove the item from the cart
                    const removedItem = cartItems.splice(existingProductIndex, 1)[0];

                    await UserModel.updateOne({ _id }, {
                        $set: {
                            "cart.cartItems": cartItems,
                            "cart.cartTotalQuantity": user.cart.cartTotalQuantity - 1,
                            "cart.cartTotalAmount": user.cart.cartTotalAmount - removedItem.product.price,
                        },
                    });
                }
            }
        }

        res.status(200).send({ message: "Done" });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send({ error: "Internal Server Error" });
    }
}

// export async function increaseQuantity(req, res) {
//     try {
//         const { _id, cartId } = req.params;
//         const user = await UserModel.findOne({ _id });
        
//         if (!user) {
//             throw new Error("No User found");
//         } else {
//             const cartItems = user.cart.cartItems;
//             console.log(cartItems);
//             const existingProductIndex = cartItems.findIndex((item) => item._id.toString() === cartId.toString());

//             if (existingProductIndex !== -1) {
//                 const cartTotalQuantity = user.cart.cartTotalQuantity + 1;
//                 const cartTotalAmount = user.cart.cartTotalAmount + cartItems[existingProductIndex].product.price;

//                 cartItems[existingProductIndex].cartQuantity += 1;

//                 await UserModel.updateOne({ _id }, {
//                     $set: {
//                         "cart.cartItems": cartItems,
//                         "cart.cartTotalQuantity": cartTotalQuantity,
//                         "cart.cartTotalAmount": cartTotalAmount,
//                     },
//                 });
//             }
//         }

//         res.status(200).send({ message: "Done" });
//     } catch (error) {
//         console.error("Error:", error);
//         res.status(500).send({ error: "Internal Server Error" });
//     }
// }


export async function getCartTotal(req,res){
    try {
        const { _id } = req.params;
        const user = await UserModel.findOne({ _id });
    
        if (!user) {
            throw new Error("No User found");
        } else {
            return res.status(201).json(user.cart.cartTotalAmount);
        }
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: error.message || "Internal Server Error" });
    }
}


export async function removeItemCart(req,res){
    try {
        const { _id, cartId } = req.params;
        const user = await UserModel.findOne({ _id });
    
        if (!user) {
            throw new Error("No User found");
        } else {
            const cartItems = user.cart.cartItems;
            const existingProductIndex = cartItems.findIndex((item) => item._id.toString() === cartId.toString());
    
            if (existingProductIndex !== -1) {
                const cartTotalQuantity = user.cart.cartTotalQuantity - cartItems[existingProductIndex].cartQuantity;
                const cartTotalAmount = user.cart.cartTotalAmount - (cartItems[existingProductIndex].product.price * cartItems[existingProductIndex].cartQuantity);
    
                cartItems.splice(existingProductIndex, 1);
    
                await UserModel.updateOne({ _id }, {
                    $set: {
                        "cart.cartItems": cartItems,
                        "cart.cartTotalQuantity": cartTotalQuantity,
                        "cart.cartTotalAmount": cartTotalAmount,
                    },
                });
            }
        }
    
        res.status(200).send({ message: "Done" });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send({ error: "Internal Server Error" });
    }
}



export async function getCart(req, res) {
    try {
      const id = req.params._id;
  
      // Check if id is a valid ObjectId
      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ error: 'Invalid ObjectId' });
      }
  
      const user = await UserModel.findOne({ _id: id });
      if (!user) {
        throw new Error('No User found');
      } else {
        return res.status(201).json(user.cart);
      }
    } catch (error) {
      console.error(error);
      res.status(500).send({ error: error.message || 'Internal Server Error' });
    }
  }

export async function product(req,res){
    try{
        const products = await ProductModel.find();
        res.send(products);
    }catch(error){
        console.error(error);
        res.status(500).send({error:error.message || "Internal Server Error"});
    }
}

export async function getOrders(req,res){
    try{
        const  _id  = req.params._id;
        const user = await UserModel.findOne({ _id });
    
        if (!user) {
            throw new Error("No User found");
        } else {
            return res.status(201).json(user.orders);
        }
    }catch(error){
        console.error(error);
        res.status(500).send({error:error.message || "Internal Server Error"});
    }
}

