class ResponseEntity {
  constructor({ isSuccess = false, message, data }) {
    this.isSuccess = isSuccess;
    this.message = message;
    this.data = data;
  }

  static dataResponse = (obj, res) => {
    const response = new ResponseEntity({
      isSuccess: true,
      data: obj,
    });

    return res.json(response);
  };

  static messageResponse = (msg, result, res) => {
    const response = new ResponseEntity({
      isSuccess: result,
      message: msg,
    });

    return res.json(response);
  };


  static errorNullResponse = (res) => {
    const response = new ResponseEntity({
      message: "Required parameter is empty.",
    });

    return res.json(response);
  };

  static errorNotFoundResponse = (obj, res) => {
    const response = new ResponseEntity({ message: `${obj} not found.` });

    return res.json(response);
  };
}

module.exports = ResponseEntity;
