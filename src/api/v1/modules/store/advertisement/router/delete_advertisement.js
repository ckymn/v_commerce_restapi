const Data = require("../model");
const storage = require("../../../../scripts/images");
const ApiError = require("../../../../errors/ApiError");

const route = async (req, res, next) => {
  try {
    let { userData, params } = req;

    let data = await Data.findOneAndDelete({
      $and: [{ author: userData.id }, { _id: params.id }],
    });
    if (!data)
      return next(
        new ApiError("Delete store advertisement not found", 404, [])
      );
    return res.send({
      status: 200,
      message: "Delete Store story success",
      data,
    });
  } catch (error) {
    if (error.name === "MongoError" && error.code === 11000) {
      next(new ApiError(error?.message, 422));
    }
    if (error.code === 27) {
      next(new ApiError("We Don't Have Any Data", 204, []));
    }
    next(new ApiError(error?.message));
  }
};
module.exports = route;
