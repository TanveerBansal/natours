const catchAsync = require("../utils/catchAsync")
const AppError = require("../utils/AppError");
const APIfeatures = require("../utils/apifeatures");

exports.deleteOne = (Model) => (
    catchAsync(async (req, res, next) => {
        const doc = await Model.findByIdAndDelete(req.params.id);
        if (!doc) {
            return next(new AppError("No document found with this ID", 404))
        }
        return res.status(204).json({
            status: "success",
            data: null
        })
    })
)

exports.updateOne = (Model) => {
    return catchAsync(async (req, res, next) => {
        const doc = await Model.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
        if (!doc) {
            return next(new AppError(`No document found with Id ${req.params.id}`, 404))
        }
        res.status(200).json({
            status: "success",
            data: {
                data: doc
            }
        })

    })
}

exports.createOne = (Model) => (
    catchAsync(async (req, res, next) => {

        const doc = await Model.create(req.body)
        res.status(201).json({
            status: "success",
            data: {
                tours: doc
            }
        })
    })
)

exports.getOne = (Model, popOptions) => (
    catchAsync(async (req, res, next) => {        
        let query = Model.findById(req.params.id);
        if (popOptions) query = await query.populate(popOptions).explain();

        const doc = await query;
        if (!doc) {
            return next(new AppError(`No document found with Id ${req.params.id}`, 404))
        }
        res.status(200).json({
            status: "success",
            data: {
                doc
            }
        })
    }
    ))

exports.getAll = (Model) => (
    catchAsync(async (req, res, next) => {
        //EXECUTEING QUERY----
        // let query = 
        const features = new APIfeatures(Model.find(), req.query).filter().sort().limitFields().pagination()
        // const doc = await features.query.explain()
        const doc = await features.query

        //SEND RESPONSE----
        res.status(200).json({
            status: "success",
            result: doc.length,
            time: req.requestTime,
            data: {
                data: doc
            }

        })


    })
)
