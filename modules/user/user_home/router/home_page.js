const Data = require("../../auth/model")
const Products = require("../../../store/products/model")
const AdminData = require("../../../admin/login/model")
const ActiveUser = require("../../../../middlewares")
const AdminAdsStory = require("../../../admin/advertisement/model")
const StoreStory = require("../../../store/story/model")
const StoreAds = require("../../../store/advertisement/model")
const { ObjectId } = require("mongodb")

const route = async (req,res,next) => {
    try {
        let { kuserData ,params, query ,body } = req;
        let actives = [];
        let current_time = new Date();

        let _data = await Data.findOneAndUpdate({ _id: kuserData.id },
          {
            $set: {
              location: {
                type: "Point",
                coordinates: [parseFloat(body.long), parseFloat(body.lat)],
              },
            },
          },{upsert: true}
        );
        //{'$set': {'location': {'type': "Point", 'coordinates': [user ['lon'], user ['lat']]}}}
        await ActiveUser.active.active_control(req.active);
        for(let [key,value] of req.active){
            actives.push(key);            
        }
        await AdminData.findOneAndUpdate({ role: { $in: ["admin"] } },
            { 
                $set: {
                    active: actives.map(i => i)
                }
            }
        );
        
        if(query.search){
          let product_data = await Products.aggregate([
            {
              $geoNear: {
                near: {
                  type: "Point",
                  coordinates: [parseFloat(query.long), parseFloat(query.lat)],
                },
                spherical: true,
                maxDistance: query.dst
                  ? parseFloat(query.dst) * 1609.34
                  : 6.25 * 1609.34,
                distanceMultiplier: 1 / 1609.34,
                distanceField: "ProductDst",
              },
            },
            {
              $match: {
                $and: [
                  {
                    $or:[
                      // { $text: { $search: query.search } },
                      { title: {$regex: query.search , $options: "i"} }
                    ]
                  },
                  {
                    is_approved: "yes",
                  },
                  {
                    "variants.sizes": {
                      $elemMatch: {
                        price: {
                          $gte: query.minPrc ? parseFloat(query.minPrc) : 0,
                          $lte: query.maxPrc ? parseFloat(query.maxPrc) : 1000000,
                        },
                      },
                    },
                  },
                ],
              },
            },
            {
              $project: {
                _id: 0,
                item: "$$ROOT",
                is_favorite:{ $in:[ObjectId(kuserData.id),"$favorite"]},
              }
            },
            { $skip: parseInt(query.skip) },
            { $limit: parseInt(query.limit) },
          ]);
          let store_story =  await StoreStory.aggregate([
            {
              $geoNear: {
                near: {
                  type: "Point",
                  coordinates: [parseFloat(query.long), parseFloat(query.lat)],
                },
                spherical: true,
                maxDistance: query.dst
                  ? parseFloat(query.dst) * 1609.34
                  : 900 * 1609.34,
                distanceMultiplier: 1 / 1609.34,
                distanceField: "StoreStoryDst",
              },
            },
            {
              $match: {
                language: _data.language,
              },
            },
          ]);
          let admin_ads_story = await AdminAdsStory.aggregate([
            {
              $geoNear: {
                near: {
                  type: "Point",
                  coordinates: [parseFloat(query.long), parseFloat(query.lat)],
                },
                spherical: true,
                maxDistance: query.dst
                  ? parseFloat(query.dst) * 1609.34
                  : 6.25 * 1609.34,
                distanceMultiplier: 1 / 1609.34,
                distanceField: "AdminStoryDst",
              },
            },
            {
              $match: {
                $and: [
                  {
                    banner_story_time: { $gte: current_time },
                  },
                  { ads_which: "Story" },
                ],
              },
            },
          ]);
          let store_ads = await StoreAds.aggregate([
            {
              $geoNear: {
                near: {
                  type: "Point",
                  coordinates: [parseFloat(query.long), parseFloat(query.lat)],
                },
                spherical: true,
                maxDistance: query.dst
                  ? parseFloat(query.dst) * 1609.34
                  : 900 * 1609.34,
                distanceMultiplier: 1 / 1609.34,
                distanceField: "StoreStoryDst",
              },
            },
            {
              $match:{
                $and:[
                  { is_approved: "yes" },
                  { banner_story_time: { $gte: current_time } },
                  { ads_which: "Story"  }
                ]
              }
            }
          ])
          
          return res
          .status(200)
          .send({
            status: true,
            message: "Products and StoreStory are success ",
            data: { product_data, store_story, admin_ads_story, store_ads },
          });
        }else{
          let product_data = await Products.aggregate([
            {
              $geoNear: {
                near: {
                  type: "Point",
                  coordinates: [parseFloat(query.long), parseFloat(query.lat)],
                },
                spherical: true,
                maxDistance: query.dst
                  ? parseFloat(query.dst) * 1609.34
                  : 6.25 * 1609.34,
                distanceMultiplier: 1 / 1609.34,
                distanceField: "ProductDst",
              },
            },
            {
              $match: {
                $and: [
                  {
                    is_approved: "yes",
                  },
                  {
                    "variants.sizes": {
                      $elemMatch: {
                        price: {
                          $gte: query.minPrc ? parseFloat(query.minPrc) : 0,
                          $lte: query.maxPrc ? parseFloat(query.maxPrc) : 1000000,
                        }
                      },
                    },
                  },
                ],
              },
            },
            {
              $project: {
                _id: 0,
                item: "$$ROOT",
                is_favorite:{ $in:[ObjectId(kuserData.id),"$favorite"]},
              }
            },
            { $skip: parseInt(query.skip) },
            { $limit: parseInt(query.limit) },
          ]);
          let store_story =  await StoreStory.aggregate([
            {
              $geoNear: {
                near: {
                  type: "Point",
                  coordinates: [parseFloat(query.long), parseFloat(query.lat)],
                },
                spherical: true,
                maxDistance: query.dst
                  ? parseFloat(query.dst) * 1609.34
                  : 900 * 1609.34,
                distanceMultiplier: 1 / 1609.34,
                distanceField: "StoreStoryDst",
              },
            },
            {
              $match: {
                language: _data.language,
              },
            },
          ]);
          let admin_ads_story = await AdminAdsStory.aggregate([
            {
              $geoNear: {
                near: {
                  type: "Point",
                  coordinates: [parseFloat(query.long), parseFloat(query.lat)],
                },
                spherical: true,
                maxDistance: query.dst
                  ? parseFloat(query.dst) * 1609.34
                  : 6.25 * 1609.34,
                distanceMultiplier: 1 / 1609.34,
                distanceField: "AdminStoryDst",
              },
            },
            {
              $match: {
                $and: [
                  {
                    banner_story_time: { $gte: current_time },
                  },
                  { ads_which: "Story" },
                ],
              },
            },
          ]);
          let store_ads = await StoreAds.aggregate([
            {
              $geoNear: {
                near: {
                  type: "Point",
                  coordinates: [parseFloat(query.long), parseFloat(query.lat)],
                },
                spherical: true,
                maxDistance: query.dst
                  ? parseFloat(query.dst) * 1609.34
                  : 900 * 1609.34,
                distanceMultiplier: 1 / 1609.34,
                distanceField: "StoreStoryDst",
              },
            },
            {
              $match:{
                $and:[
                  { is_approved: "yes" },
                  { banner_story_time: { $gte: current_time } },
                  { ads_which: "Story"  }
                ]
              }
            }
          ])

          return res
          .status(200)
          .send({
            status: true,
            message: "Products and StoreStory are success ",
            data: { product_data, store_story, admin_ads_story, store_ads },
          });
        }
    } catch (error) {
      if (error.name === "MongoError" && error.code === 11000) {
        return res.status(422).send({
          status: false,
          message: `User/Home Page , Mongdo Already exists: ${error}`,
        });
      } else {
        if (error.code === 27){
          return res.status(422).send({
            status: false,
            message: `We Don't Have Any Data`,
            data: null,
          });
        }else{
          return res.status(422).send({
            status: false,
            message: `User Home Page Error , ${error}`,
            data: null,
          });
        }
      }
    }
};

module.exports = route;