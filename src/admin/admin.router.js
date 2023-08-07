const express = require("express");
const adminRouter = express.Router();
const AdminService = require("./admin.service");

//GET
adminRouter.route("/admin/info").get(AdminService.getAdmin);
adminRouter.route("/admin/restaurant-list").get(AdminService.getAllRestaurant);
adminRouter.route("/admin/order-status").get(AdminService.getOrderStatus);
adminRouter
  .route("/admin/search-restaurant")
  .get(AdminService.searchRestaurant);

//POST
adminRouter.route("/admin/create").post(AdminService.createAdmin);

//PATCH
adminRouter.route("/admin/add-restaurant").patch(AdminService.addRestaurant);
adminRouter.route("/admin/edit-restaurant").patch(AdminService.editRestaurant);
adminRouter.route("/admin/delete-restaurant").patch(AdminService.deleteRestaurant);
adminRouter.route("/admin/add-menu").patch(AdminService.addMenu);
adminRouter.route("/admin/edit-menu").patch(AdminService.editMenu);
adminRouter.route("/admin/delete-menu").patch(AdminService.deleteMenu);
adminRouter.route("/admin/update-status").patch(AdminService.updateStatus);

//DELETE
adminRouter.route("/admin/delete").delete(AdminService.deleteAdmin);

module.exports = adminRouter;
