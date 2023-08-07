const uid = require("short-uuid");
const Admin = require("./admin.schema");
const User = require("../user/user.schema");
const adminObj = "Admin";

const ResponseEntity = require("../entities/response.entity");

class AdminService {
  static getAdmin = async (req, res) => {
    const firebaseId = req.query.firebaseId;

    if (!firebaseId) {
      return ResponseEntity.errorNullResponse(res);
    }

    const admin = await Admin.findOne({
      firebaseId: firebaseId,
    });

    if (!admin) {
      return ResponseEntity.errorNotFoundResponse(adminObj, res);
    }

    return ResponseEntity.dataResponse(admin, res);
  };

  static createAdmin = async (req, res) => {
    const firebaseId = req.body.firebaseId;
    const email = req.body.email;
    const name = req.body.name;

    if (!firebaseId || !email || !name) {
      return ResponseEntity.errorNullResponse(res);
    }

    const adminBody = {
      firebaseId: firebaseId,
      email: email,
      name: name,
      restaurant: [],
      order: [],
    };

    await Admin.create(adminBody);

    return ResponseEntity.messageResponse("Admin created successfully.", true, res);
  };

  static deleteAdmin = async (req, res) => {
    const firebaseId = req.body.firebaseId;

    if (!firebaseId) {
      return ResponseEntity.errorNullResponse(res);
    }

    const admin = await Admin.findOneAndDelete({
      firebaseId: firebaseId,
    });

    if (!admin) {
      return ResponseEntity.errorNotFoundResponse(adminObj, res);
    }

    return ResponseEntity.messageResponse(
      `Admin with firebaseId ${firebaseId} has been deleted.`,
      true,
      res
    );
  };

  static getAllRestaurant = async (req, res) => {
    const restaurant = await Admin.aggregate([
      {
        $unwind: "$restaurant",
      },
      {
        $project: {
          _id: 0,
          restaurantId: "$restaurant.restaurantId",
          restaurantName: "$restaurant.restaurantName",
          menuList: "$restaurant.menuList",
        },
      },
    ]);

    return ResponseEntity.dataResponse({ restaurant }, res);
  };

  static getOrderStatus = async (req, res) => {
    const firebaseId = req.query.firebaseId;
    const status = req.query.status;

    if (!status || !firebaseId) {
      return ResponseEntity.errorNullResponse(res);
    }

    const order = await Admin.aggregate([
      {
        $unwind: "$order",
      },
      {
        $match: {
          $and: [
            {"firebaseId": firebaseId},
            {"order.status": status,}
          ]
        }
      },
      {
        $project: {
          _id: 0,
          orderId: "$order.orderId",
          status: "$order.status",
        },
      },
    ]);

    return ResponseEntity.dataResponse({ order }, res);
  };

  static searchRestaurant = async (req, res) => {
    const restaurantQuery = req.query.restaurantQuery;

    if (!restaurantQuery) {
      return ResponseEntity.errorNullResponse(res);
    }

    const restaurant = await Admin.aggregate([
      {
        $unwind: "$restaurant",
      },
      {
        $match: {
          $or: [
            {
              "restaurant.restaurantName": {
                $regex: new RegExp(restaurantQuery, "i"),
              },
            },
            {
              "restaurant.menuList.menuName": {
                $regex: new RegExp(restaurantQuery, "i"),
              },
            },
            {
              "restaurant.menuList.description": {
                $regex: new RegExp(restaurantQuery, "i"),
              },
            },
          ],
        },
      },
      {
        $replaceRoot: {
          newRoot: "$restaurant",
        },
      },
    ]);

    return ResponseEntity.dataResponse({ restaurant }, res);
  };

  static addRestaurant = async (req, res) => {
    const firebaseId = req.body.firebaseId;
    const restaurantId = uid.generate();
    const restaurantName = req.body.restaurantName;

    if (!firebaseId || !restaurantId || !restaurantName) {
      return ResponseEntity.errorNullResponse(res);
    }

    const adminFind = await Admin.findOne({
      firebaseId: firebaseId,
    });

    if (!adminFind) {
      return ResponseEntity.errorNotFoundResponse(adminObj, res);
    }

    await Admin.findOneAndUpdate(
      {
        firebaseId: firebaseId,
      },
      {
        $push: {
          restaurant: {
            restaurantId: restaurantId,
            restaurantName: restaurantName,
            menuList: [],
          },
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    return ResponseEntity.messageResponse(
      "Restaurant added successfully.",
      true,
      res
    );
  };

  static editRestaurant = async (req, res) => {
    const restaurantId = req.body.restaurantId;
    const restaurantName = req.body.restaurantName;

    if (!restaurantId || !restaurantName) {
      return ResponseEntity.errorNullResponse(res);
    }

    const restaurant = await Admin.findOneAndUpdate(
      {
        "restaurant.restaurantId": restaurantId,
      },
      {
        $set: {
          "restaurant.$.restaurantName": restaurantName
        }
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!restaurant) {
      return ResponseEntity.errorNotFoundResponse("Restaurant", res);
    }

    return ResponseEntity.messageResponse("Restaurant updated successfully.", true, res);
  };

  static deleteRestaurant = async (req, res) => {
    const restaurantId = req.body.restaurantId;

    if (!restaurantId) {
      return ResponseEntity.errorNullResponse(res);
    }

    const restaurant = await Admin.findOneAndUpdate(
      {
        "restaurant.restaurantId": restaurantId,
      },
      {
        $pull: {
          restaurant: {
            restaurantId: restaurantId
          }
        }
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!restaurant) {
      return ResponseEntity.errorNotFoundResponse("Restaurant", res);
    }

    return ResponseEntity.messageResponse("Restaurant deleted successfully.", true, res);
  };

  static addMenu = async (req, res) => {
    const restaurantId = req.body.restaurantId;
    const menuId = uid.generate();
    const menuName = req.body.menuName;
    const description = req.body.description;
    const price = req.body.price;

    if (!restaurantId || !menuName || !description || !price) {
      return ResponseEntity.errorNullResponse(res);
    }

    const restaurantFind = await Admin.findOne({
      "restaurant.restaurantId": restaurantId,
    });

    if (!restaurantFind) {
      return ResponseEntity.errorNotFoundResponse("Restaurant", res);
    }

    await Admin.findOneAndUpdate(
      {
        "restaurant.restaurantId": restaurantId,
      },
      {
        $push: {
          "restaurant.$.menuList": {
            menuId: menuId,
            menuName: menuName,
            description: description,
            price: (price + 0.0000001),
          },
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    return ResponseEntity.messageResponse("Menu added successfully.", true, res);
  };

  static editMenu = async (req, res) => {
    const restaurantId = req.body.restaurantId;
    const menuId = req.body.menuId;
    const menuName = req.body.menuName;
    const description = req.body.description;
    const price = req.body.price;

    if (!restaurantId || !menuId || !menuName || !description || !price) {
      return ResponseEntity.errorNullResponse(res);
    }

    const restaurantFind = await Admin.findOne({
      "restaurant.restaurantId": restaurantId,
    });

    if (!restaurantFind) {
      return ResponseEntity.errorNotFoundResponse("Restaurant", res);
    }

    const menu = await Admin.findOneAndUpdate(
      {
        "restaurant.menuList.menuId": menuId,
      },
      {
        $set: {
          "restaurant.$.menuList.$[menuList].menuName": menuName,
          "restaurant.$.menuList.$[menuList].description": description,
          "restaurant.$.menuList.$[menuList].price": (price + 0.0000001),
        }
      },
      {
        "multi": false,
        "upsert": false,
        arrayFilters: [
          {
            "menuList.menuId": { $eq: menuId }
          }
        ]
      }
    );

    if (!menu) {
      return ResponseEntity.errorNotFoundResponse("Menu", res);
    }

    return ResponseEntity.messageResponse("Menu updated successfully.", true, res);
  };

  static deleteMenu = async (req, res) => {
    const restaurantId = req.body.restaurantId;
    const menuId = req.body.menuId;

    if (!menuId || !restaurantId) {
      return ResponseEntity.errorNullResponse(res);
    }

    const menu = await Admin.findOneAndUpdate(
      {
        "restaurant.restaurantId": restaurantId,
        "restaurant.menuList.menuId": menuId,
      },
      {
        $pull: {
          "restaurant.0.menuList": {
            menuId: menuId
          }
        }
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!menu) {
      return ResponseEntity.errorNotFoundResponse("Menu", res);
    }

    return ResponseEntity.messageResponse("Menu deleted successfully.", true, res);
  };

  static updateStatus = async (req, res) =>  {
    const orderId = req.body.orderId;

    if (!orderId) {
      return ResponseEntity.errorNullResponse(res);
    }

    const admin = await Admin.findOneAndUpdate(
      {
        "order.orderId": orderId,
      },
      {
        $set: {
          "order.$.status": "Out of delivery" 
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!admin) {
      return ResponseEntity.errorNotFoundResponse("Admin Order", res);
    }

    const user = await User.findOneAndUpdate(
      {
        "order.orderId": orderId,
      },
      {
        $set: {
          "order.$.status": "Out of delivery" 
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!user) {
      return ResponseEntity.errorNotFoundResponse("User Order", res);
    }

    return ResponseEntity.messageResponse("Status updated successfully.", true, res)
  }
}

module.exports = AdminService;
