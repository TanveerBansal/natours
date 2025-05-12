const Tour = require("../models/tourModel")
const APIfeatures = require("../utils/apifeatures")
const AppError = require("../utils/AppError")
const catchAsync = require("../utils/catchAsync")
const { deleteOne, updateOne, createOne, getOne, getAll } = require("./handlerFactory")

exports.aliasTopTours = (req, res, next) => {
    req.query.limit = "5"
    req.query.sort = "-ratingsAverage,price"
    req.query.fields = "name,ratingsAverage,price,difficulty,summary"
    next()
}



exports.createTour = createOne(Tour)



// exports.getAllTours = catchAsync(async (req, res, next) => {
//     //EXECUTEING QUERY----
//     const features = new APIfeatures(Tour.find(), req.query).filter().sort().limitFields().pagination()
//     const tours = await features.query

//     //SEND RESPONSE----
//     res.status(200).json({
//         status: "success",
//         result: tours.length,
//         time: req.requestTime,
//         data: {
//             tours: tours
//         }

//     })


// })
exports.getAllTours = getAll(Tour)

exports.getTour = getOne(Tour, { path: "reviews" })
exports.updateTour = updateOne(Tour)




// exports.deleteTour = catchAsync(async (req, res, next) => {
//     const tour = await Tour.findByIdAndDelete(req.params.id)
//     if (!tour) {
//         return next(new AppError(`No tour found with Id ${req.params.id}`, 404))
//     }

//     res.status(204).json({
//         status: "success",
//         data: "Deleted sucessfully"
//     })

// })

// with common delete function
exports.deleteTour = deleteOne(Tour)






exports.getTourStats = catchAsync(async (req, res, next) => {
    const stats = await Tour.aggregate([
        {
            $match: { ratingsAverage: { $gte: 4.5 } }
        },
        {
            $group: {
                _id: { $toUpper: "$difficulty" },
                numRating: { $sum: "$ratingsQuantity" },
                numTours: { $sum: 1 },
                avgRating: { $avg: "$ratingsAverage" },
                avgPrice: { $avg: "$price" },
                maxPrice: { $max: "$price" },
                minPrice: { $min: "$price" }
            }
        },
        {
            $sort: { avgPrice: 1 }
        },
        // {
        //     $match: {_id : {$ne: "EASY"}}
        // }
    ])

    res.status(200).json({
        status: "success",
        data: stats
    })

})

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {

    const year = Number(req.params.year)
    const plan = await Tour.aggregate([
        {
            $unwind: "$startDates"
        },
        {
            $match: {
                startDates: {
                    $gte: new Date(`${year}-1-1`),
                    $lte: new Date(`${year}-12-31`)
                }
            }
        },
        {
            $group: {
                _id: { $month: "$startDates" },
                numofStarts: { $sum: 1 },
                tours: { $push: "$name" },
            }
        },
        {
            $addFields: { month: "$_id" }
        },
        {
            $project: {
                _id: 0
            }
        },
        {
            $sort: {
                numofStarts: -1
            }
        },
        {
            $limit: 12
        }
    ])
    res.status(200).json({
        status: "success",
        data: plan
    })

})



// Get The Tour Within Your Location Range
// route:-> tours-within/:distance/center/:latlng/unit/:unit
exports.getToursWithIn = catchAsync(async (req, res, next) => {
    const { distance, latlng, unit } = req.params
    const [lat, lng] = latlng.split(",")

    const radians = unit === "mi" ? distance / 3963.2 : distance / 6378.1
    // Note: here radius(distance) is converted in radians. MongoDB internally performs geospatial calculations on a unit sphere, where distances must be expressed in radians, not kilometers or miles.


    if (!lat || !lng) {
        return next(new AppError("Please provide the latitude and longitude in the format lat,lng"), 400)
    }

    const tours = await Tour.find({
        startLocation: {
            $geoWithin: {
                $centerSphere: [[lng, lat], radians] // Note: here first lng is passed and then lat. Kind of syntax
            }
        }
    })

    res.status(200).json({
        success: true,
        results: tours.length,
        data: {
            data: tours
        }
    })
})




exports.getDistances = catchAsync(async (req, res, next) => {
    const { latlng, unit } = req.params
    const [lat, lng] = latlng.split(",")

    const multiplier = unit === "mi" ? 0.000621371 : 0.001

    if (!lat || !lng) {
        return next(new AppError("Please provide the latitude and longitude in the format lat,lng"), 400)
    }

    const distances = await Tour.aggregate([
        {
            $geoNear: {
                near: {
                    type: "Point",
                    coordinates: [Number(lng), Number(lat)]
                },
                distanceField: "distance",
                distanceMultiplier: multiplier
            }
        },
        {
            $project: {
                distance: 1,
                name: 1,
            }
        }
    ])

    res.status(200).json({
        success: true,
        results: distances.length,
        data: {
            data: distances
        }
    })
})
