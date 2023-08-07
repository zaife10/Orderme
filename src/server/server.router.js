const express = require("express");
const serverRouter = express.Router();
const ServerService = require("./server.service");

//GET
serverRouter.route("/server/status").get(ServerService.getServerStatus);

module.exports = serverRouter;
