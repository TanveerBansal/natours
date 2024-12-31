const fs = require("fs")
const Tour = require("../models/tourModel")

// const tours = JSON.parse(fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`))

/*
exports.checkId = (req, res, next, val) => {
    console.log(`Tour ID is: ${val}`);

    if (Number(req.params.id) > tours.length) {
        return res.status(404).json({
            status: "fails",
            message: "Invalid ID"
        })
    }
    next()
}
    */

/*
exports.checkBody = (req, res, next) => {
    if (!req.body.name || !req.body.price) {
        return res.status(400).json({
            status: 'fail',
            message: "Name and Price is needed"
        })
    }
    next()
}
*/

exports.aliasTopTours = (req,res,next)=>{
    req.query.limit = "5"
    req.query.sort = "-ratingsAverage,price"
    req.query.fields = "name,ratingsAverage,price,difficulty,summary"
    next()
}

exports.getAllTours = async (req, res) => {
    try {

        // WAY OF USING QUERY 
        // const tours  = await Tour.find({duration: 5, difficulty: "easy"})    //one way
        // const tours = await Tour.find().where("duration").equals(5).where("difficulty").equals("easy")     //second mongoose method


        // console.log(req.query);


        //BUILDING QUERY-----
        // 1A-FILTERING
        const queryObj = { ...req.query }
        const excludedFields = ["sort", "page", "limit", "fields"]
        excludedFields.forEach(el => delete queryObj[el])
        // console.log(req.query, queryObj);

        // 1B-ADVANCE FILTERING
        let queryStr = JSON.stringify(queryObj)
        queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`)
        // console.log(JSON.parse(queryStr));

        let query = Tour.find(JSON.parse(queryStr))

        //2 SORTING
        if (req.query.sort) {
            const sortBy = req.query.sort.split(",").join(" ")
            // console.log(sortBy)
            query = query.sort(sortBy)
        }
        else {
            query = query.sort("-createdAt")
        }

        //3 FIELD LIMITING
        if (req.query.fields) {
            const fields = req.query.fields.split(",").join(" ")
            query.select(fields)
        }
        else {
            query = query.select("-__v")
        }

        //4 PAGINATION
        const page = Number(req.query.page) || 1
        const limit = Number(req.query.limit) || 100
        const skip = (page - 1) * limit
        query = query.skip(skip).limit(limit)

        if (req.query.page) {
            const numTours = await Tour.countDocuments()
            if (skip >= numTours) {
                throw new Error("This page does not exist")
            }
        }

        //EXECUTEING QUERY----
        const tours = await query

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
    //console.log(req.params)     //req.params is where all the varialbe we difine in route is stored

    // const id = Number(req.params.id)

    try {
        const tour = await Tour.findById(req.params.id)
        //upper methos is alternate of Tour.findOne({_id:req.params.id})
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
    // console.log(req.body);
    /*
    const newId = tours[tours.length - 1].id + 1
    const newTour = Object.assign({ id: newId }, req.body)// object.assign allow to creating a new object by merging into existing object

    tours.push(newTour)
    fs.writeFile(`${__dirname}/../dev-data/data/tours-simple.json`, JSON.stringify(tours), (err) => {
        if(err){
            return res.status(400).json({message: err.message})
        }
        res.status(201).json({
            status: "success",
            data: {
                tours: newTour
            }
        })
    })
     */

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