import {Router} from "express";
const router = Router();
import * as controller from '../controller/appController.js';

//post requests
router.route("/register").post(controller.register);//register user
router.route("/login").post(controller.login);//login user
router.route("/user/:id/cart").post(controller.updateCart);
router.route("/user/:id/orders").post(controller.orders);
router.route("/user/:id/verify").post(controller.verifyPayment);
router.route("/user/:id/saveOrder").post(controller.saveOrder);
router.route("/user/:id/coupon").post(controller.coupon);

//delete request
router.route("/user/:_id/cart/:cartId").delete(controller.removeItemCart);
router.route("/user/:_id/cart").delete(controller.clearCart);

//patch request
router.route("/user/:_id/cart/:cartId").patch(controller.decreaseQuantity);

//put request
// router.route('/user/:_id/cart/:cartId').put(controller.increaseQuantity);
//get request
router.route("/user/:_id").get(controller.getUser);
router.route("/user/:_id/cartData").get(controller.getCart);
router.route("/products").get(controller.product);
router.route("/user/:_id/cartTotal").get(controller.getCartTotal);
router.route("/user/:_id/placedOrders").get(controller.getOrders);


export default router;

