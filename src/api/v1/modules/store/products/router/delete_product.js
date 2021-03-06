const ApiError = require("../../../../errors/ApiError");
const Data = require("../model");
const storage = require("../../../../scripts/images");

const route = async (req, res, next) => {
  try {
    let { userData, params } = req;

    let data = await Data.findOneAndDelete({
      $and: [{ author: userData.id }, { _id: params.id }],
    })
      .select("variants.images._id")
      .lean();

    if (!data)
      return next(new ApiError("Product delete didn't match", 404, []));

    for (let i = 0; i < data.variants.length; i++) {
      data.variants[i].images.map(async (i) => {
        await storage.Delete(i._id);
      });
    }

    return res.send({
      status: 200,
      message: "Single product delete success",
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
