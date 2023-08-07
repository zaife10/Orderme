const adminRouter = require("./src/admin/admin.router");
const userRouter = require("./src/user/user.router");
const serverRouter = require("./src/server/server.router");

const indexModule = (app, express) => {
  app.use(express.json());
  app.use("/order-me-api", adminRouter);
  app.use("/order-me-api", userRouter);
  app.use("/order-me-api", serverRouter);
};

module.exports = { indexModule };
