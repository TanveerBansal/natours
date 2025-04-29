const Tour = require("../models/tourModel")
const APIfeatures = require("../utils/apifeatures")
const AppError = require("../utils/AppError")
const catchAsync = require("../utils/catchAsync")
const { deleteOne, updateOne, createOne, getOne ,getAll } = require("./handlerFactory")

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