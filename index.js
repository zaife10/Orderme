const express = require("express");
const { connectDB } = require("./src/db/db.connect");
const { indexModule } = require("./module");

const app = express();
const port = process.env.PORT || 2802;

const main = async () => {
  const isConnected = await connectDB();

  if (isConnected) {
    const mainApp = () => {
      indexModule(app, express);
      app.listen(port, () => {
        console.log(`Listening to port ${port}...`);
      });
    };

    return mainApp();
  }

  console.log("Connection failed.");

  return null;
};

main();
