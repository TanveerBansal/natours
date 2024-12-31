const fs = require("fs")
const Tour = require("../models/tourModel")
const APIfeatures = require("../utilis/apifeatures")


exports.aliasTopTours = (req, res, next) => {
    req.query.limit = "5"
    req.query.sort = "-ratingsAverage,price"
    req.query.fields = "name,ratingsAverage,price,difficulty,summary"
    next()
}



exports.getAllTours = async (req, res) => {
    try {

        //BUILDING QUERY-----
        // // 1A-FILTERING
        // const queryObj = { ...req.query }
        // const excludedFields = ["sort", "page", "limit", "fields"]
        // excludedFields.forEach(el => delete queryObj[el])

        // // 1B-ADVANCE FILTERING
        // let queryStr = JSON.stringify(queryObj)
        // queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`)

        // let query = Tour.find(JSON.parse(queryStr))

        //2 SORTING
        // if (req.query.sort) {
        //     const sortBy = req.query.sort.split(",").join(" ")
        //     query = query.sort(sortBy)
        // }
        // else {
        //     query = query.sort("-createdAt")
        // }

        //3 FIELD LIMITING
        // if (req.query.fields) {
        //     const fields = req.query.fields.split(",").join(" ")
        //     query.select(fields)
        // }
        // else {
        //     query = query.select("-__v")
        // }

        //4 PAGINATION
        // const page = Number(req.query.page) || 1
        // const limit = Number(req.query.limit) || 100
        // const skip = (page - 1) * limit
        // query = query.skip(skip).limit(limit)

        // if (req.query.page) {
        //     const numTours = await Tour.countDocuments()
        //     if (skip >= numTours) {
        //         throw new Error("This page does not exist")
        //     }
        // }

        //EXECUTEING QUERY----
        const features = new APIfeatures(Tour.find(), req.query).filter().sort().limitFields().pagination()
        const tours = await features.query

        //SEND RESPONSE----
        res.status(200).json({
            status: "success",
            result: tours.length,
            time: req.requestTime,
            data: {
                tours: tours
            }

        })
    }
    catch (err) {
        res.status(400).json({
            status: "fails",
            message: err
        })
    }

}

exports.getTour = async (req, res) => {

    try {
        const tour = await Tour.findById(req.params.id)
        res.status(200).json({
            status: "success",
            data: {
                tour
            }
        })
    }
    catch (err) {
        res.status(404).json({
            status: "fail",
            message: err || "Id not exists"
        })
    }

}




exports.createTour = async (req, res) => {

    try {
        const newTour = await Tour.create(req.body)
        res.status(201).json({
            status: "success",
            data: {
                tours: newTour
            }
        })
    }
    catch (err) {
        res.status(400).json({
            success: "fail",
            message: err.message
        })
    }


}

exports.updateTour = async (req, res) => {
    try {
        const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
        res.status(200).json({
            status: "success",
            data: {
                tour
            }
        })
    }
    catch (err) {
        res.status(400).json({
            status: "fail",
            message: err
        })
    }

}

exports.deleteTour = async (req, res) => {
    try {
        await Tour.findByIdAndDelete(req.params.id)
        res.status(204).json({
            status: "success",
            data: "Deleted sucessfully"
        })
    }
    catch (err) {
        res.status(404).json({
            success: "fail",
            message: err.message
        })
    }

}

exports.getTourStats = async (req, res) => {
    try {
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
    } catch (err) {
        res.status(404).json({
            success: "fail",
            message: err.message
        })
    }
}

exports.getMonthlyPlan = async (req, res) => {
    try {
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
                    numofStarts : -1
                }
            },
            {
                $limit : 12
            }
        ])
        res.status(200).json({
            status: "success",
            data: plan
        })

    } catch (err) {
        res.status(404).json({
            success: "fail",
            message: err.message
        })
    }
}