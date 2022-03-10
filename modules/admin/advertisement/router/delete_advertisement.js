const Data = require("../model")
const storage = require("../../../../uploads/images");
const ApiError = require("../../../../errors/ApiError");

const route = async (req, res, next) => {
    try {
        let { params } = req;

        let data = await Data.findOneAndDelete({ _id: params.id  });
        if(!data)
            return next(new ApiError("Delete advertisement didn't match",404,data));

        for(let i = 0; i < data.img.length; i++){
          await storage.Delete(data.img[i]._id)
        }
        
        return res.status(200).send({ status: true, message: "Delete Advertisement story success",data })

    } catch (error) {
        if (error.name === "MongoError" && error.code === 11000) {
          next(new ApiError(error?.message, 422));
        }
        if (error.code === 27) {
          next(new ApiError("We Don't Have Any Data", 500));
        }
        next(new ApiError(error?.message, 500));
    }
}

module.exports = route