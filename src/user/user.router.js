const express = require("express");
const userRouter = express.Router();
const UserService = require("./user.service");

//GET
userRouter.route("/user/info").get(UserService.getUser);

//POST
userRouter.route("/user/create").post(UserService.createUser);

//PATCH
userRouter.route("/user/add-to-cart").patch(UserService.addToCart);
userRouter.route("/user/checkout-order").patch(UserService.checkoutOrder);
userRouter.route("/user/complete-order").patch(UserService.completeOrder);
userRouter.route("/user/cancel-order").patch(UserService.cancelOrder);

//DELETE
userRouter.route("/user/delete").delete(UserService.deleteUser);
userRouter.route("/user/delete-cart").delete(UserService.deleteCart);
userRouter.route("/user/delete-menu").delete(UserService.deleteMenu);

module.exports = userRouter;
