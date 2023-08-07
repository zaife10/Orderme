const ResponseEntity = require("../entities/response.entity");

class ServerService {
  static getServerStatus = async (req, res) => {
    const server = {
      isOnline: true,
    };

    return ResponseEntity.dataResponse(server, res);
  };
}

module.exports = ServerService;
