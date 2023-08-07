const uid = require("short-uuid");
const User = require("./user.schema");
const Admin = require("../admin/admin.schema");
const userObj = "User";

const ResponseEntity = require("../entities/response.entity");

class UserService {
  static getUser = async (req, res) => {
    const firebaseId = req.query.firebaseId;

    if (!firebaseId) {
      return ResponseEntity.errorNullResponse(res);
    }

    const user = await User.findOne({
      firebaseId: firebaseId,
    });

    if (!user) {
      return ResponseEntity.errorNotFoundResponse(userObj, res);
    }

    return ResponseEntity.dataResponse(user, res);
  };

  static createUser = async (req, res) => {
    const firebaseId = req.body.firebaseId;
    const email = req.body.email;
    const name = req.body.name;

    if (!firebaseId || !email || !name) {
      return ResponseEntity.errorNullResponse(res);
    }

    const userBody = {
      firebaseId: firebaseId,
      email: email,
      name: name,
      cart: [],
      order: [],
      history: [],
    };

    await User.create(userBody);

    return ResponseEntity.messageResponse("User created successfully.", true, res);
  };

  static addToCart = async (req, res) => {
    const firebaseId = req.body.firebaseId;
    const cartId = uid.generate();
    const restaurantId = req.body.restaurantId;
    const restaurantName = req.body.restaurantName;
    const price = req.body.price;
    const quantity = req.body.quantity;

    const order = {
      menuId: req.body.menuId,
      menuName: req.body.menuName,
      price: price,
      quantity: quantity,
    };

    let cart = {};

    if (
      !firebaseId ||
      !restaurantId ||
      !restaurantName ||
      !order.menuId ||
      !order.menuName ||
      !order.price ||
      !order.quantity
    ) {
      return ResponseEntity.errorNullResponse(res);
    }

    const user = await User.findOne({
      firebaseId: firebaseId,
    });

    if (!user) {
      return ResponseEntity.errorNotFoundResponse(userObj, res);
    }

    const menuId = await User.findOneAndUpdate(
      {
        "cart.menuList.menuId": order.menuId,
      }, 
      {
        $inc: {
          "cart.$[].menuList.$[menuList].quantity": order.quantity,
        }
      },
      {
        "multi": false,
        "upsert": false,
        arrayFilters: [
          {
            "menuList.menuId": { $eq: order.menuId }
          }
        ]
      }
    )

    if (menuId) {
      return ResponseEntity.messageResponse("Updated cart successfully.", true, res);
    }

    cart = await User.findOneAndUpdate(
      {
        "cart.restaurantId": restaurantId,
      },
      {
        $push: {
          "cart.$.menuList": order,
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!cart) {
      cart = await User.findOneAndUpdate(
        {
          firebaseId: firebaseId,
        },
        {
          $push: {
            cart: {
              cartId: cartId,
              restaurantId: restaurantId,
              restaurantName: restaurantName,
              menuList: [order],
            },
          },
        },
        {
          new: true,
          runValidators: true,
        }
      );
    }

    return ResponseEntity.messageResponse("Added to cart successfully.", true, res);
  };

  static checkoutOrder = async (req, res) => {
    const orderId = uid.generate();
    const cartId = req.body.cartId;
    const restaurantId = req.body.restaurantId;

    if (!cartId || !restaurantId) {
      return ResponseEntity.errorNullResponse(res);
    }

    const cart = await User.aggregate([
      {
        $unwind: "$cart",
      },
      {
        $match: {
          "cart.cartId": cartId,
        },
      },
      {
        $project: {
          _id: 0,
          restaurantId: "$cart.restaurantId",
          restaurantName: "$cart.restaurantName",
          menuList: "$cart.menuList",
        },
      },
    ]);

    if (cart.length === 0) {
      return ResponseEntity.errorNotFoundResponse("Cart", res);
    }

    const user = await User.findOne({
      "cart.cartId": cartId
    });

    for (let index = 0; index < user.order.length; index++) {
      if (restaurantId === user.order[index].restaurantId) {
        return ResponseEntity.messageResponse("Order from same restaurant is on going.", false, res);
      }
    }

    const restaurant = await Admin.findOneAndUpdate(
      {
        "restaurant.restaurantId": cart[0].restaurantId,
      },
      {
        $push: {
          order: {
            orderId: orderId,
            restaurantId: cart[0].restaurantId,
            restaurantName: cart[0].restaurantName,
            customerName: user.name,
            status: "In the kitchen",
            orderList: cart[0].menuList,
          },
        },
      }
    )

    if (!restaurant) {
      return ResponseEntity.errorNotFoundResponse("Restaurant", res);
    }

    await User.findOneAndUpdate(
      {
        "cart.cartId": cartId,
      },
      {
        $push: {
          order: {
            orderId: orderId,
            restaurantId: cart[0].restaurantId,
            restaurantName: cart[0].restaurantName,
            status: "In the kitchen",
            orderList: cart[0].menuList,
          },
        },
        $pull: {
          cart: {
            cartId: cartId,
          },
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    return ResponseEntity.messageResponse("Checked out successfully.", true, res);
  };

  static completeOrder = async (req, res) => {
    const historyId = uid.generate();
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
          "order.$.status": "Completed" 
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!admin) {
      return ResponseEntity.errorNotFoundResponse("Order", res);
    }

    const order = await User.aggregate([
      {
        $unwind: "$order",
      },
      {
        $match: {
          "order.orderId": orderId,
        },
      },
      {
        $project: {
          _id: 0,
          historyId: historyId,
          orderId: "$order.orderId",
          restaurantName: "$order.restaurantName",
          status: "Completed",
          completedAt: new Date(),
          orderList: "$order.orderList",
        },
      },
    ]);

    if (order.length === 0) {
      return ResponseEntity.errorNotFoundResponse("Order", res);
    }

    const user = await User.findOneAndUpdate(
      {
        "order.orderId": orderId,
      },
      {
        $push: {
          history: order[0]
        },
        $pull: {
          order: {
            orderId: orderId
          }
        }
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!user) {
      return ResponseEntity.errorNotFoundResponse("Order", res);
    }

    return ResponseEntity.messageResponse("Order completed.", true, res)
  }

  static deleteCart = async (req, res) => {
    const cartId = req.body.cartId;

    if (!cartId) {
      return ResponseEntity.errorNullResponse(res);
    }

    const cart = await User.findOneAndUpdate(
      {
        "cart.cartId": cartId,
      },
      {
        $pull: {
          cart: {
            cartId: cartId,
          },
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!cart) {
      return ResponseEntity.errorNotFoundResponse("Cart", res);
    }

    return ResponseEntity.messageResponse("Deleted cart successfully.", true, res);
  };

  static deleteMenu = async (req, res) => {
    const cartId = req.body.cartId;
    const menuId = req.body.menuId;

    if (!cartId || !menuId) {
      return ResponseEntity.errorNullResponse(res);
    }

    const menu = await User.findOneAndUpdate(
      {
        "cart.cartId": cartId,
        "cart.menuList.menuId": menuId,
      },
      {
        $pull: {
          "cart.$.menuList": {
            menuId: menuId,
          },
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!menu) {
      return ResponseEntity.errorNotFoundResponse("Menu", res);
    }

    return ResponseEntity.messageResponse(
      "Deleted menu in cart successfully.",
      true,
      res
    );
  };

  static cancelOrder = async (req, res) => {
    const historyId = uid.generate();
    const orderId = req.body.orderId;

    if (!orderId) {
      return ResponseEntity.errorNullResponse(res);
    }

    const orderInfo = await User.aggregate([
      {
        $unwind: "$order",
      },
      {
        $match: {
          "order.orderId": orderId,
        },
      },
      {
        $project: {
          _id: 0,
          historyId: historyId,
          orderId: "$order.orderId",
          restaurantName: "$order.restaurantName",
          status: "Cancelled",
          completedAt: new Date(),
          orderList: "$order.orderList",
        },
      },
    ]);

    if (orderInfo.length === 0) {
      return ResponseEntity.errorNotFoundResponse("Order", res);
    }

    const admin = await Admin.findOneAndUpdate(
      {
        "order.orderId": orderId
      },
      {
        $set: {
          "order.$.status": "Cancelled"
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!admin) {
      return ResponseEntity.errorNotFoundResponse("Order", res);
    }

    const order = await User.findOneAndUpdate(
      {
        "order.orderId": orderId
      },
      {
        $push: {
          history: orderInfo[0]
        },
        $pull: {
          order: {
            orderId: orderId
          }
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!order) {
      return ResponseEntity.errorNotFoundResponse("Order", res);
    }

    return ResponseEntity.messageResponse(
      "Order cancelled successfully.",
      true,
      res
    );
  };

  static deleteUser = async (req, res) => {
    const email = req.body.email;

    if (!email) {
      return ResponseEntity.errorNullResponse(res);
    }

    const user = await User.findOneAndDelete({
      email: email,
    });

    if (!user) {
      return ResponseEntity.errorNotFoundResponse(userObj, res);
    }

    return ResponseEntity.messageResponse(
      `User with email ${email} has been deleted.`,
      true,
      res
    );
  };
}

module.exports = UserService;
