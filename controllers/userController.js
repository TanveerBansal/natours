const User = require("../models/userModal")
const AppError = require("../utils/appError")
const catchAsync = require("../utils/catchAsync")

const filterObj = (obj, ...allowedFields) => {
    const newObj = {};
    Object.keys(obj).forEach((el) => {
        if (allowedFields.includes(el)) newObj[el] = obj[el]
    })
    return newObj
}

exports.getAllUsers = catchAsync(async (req, res) => {
    const users = await User.find({})
    res.status(200).json({
        status: "success",
        results: users.length,
        data: { users }
    })
})

exports.updateMe = catchAsync(async (req, res, next) => {
    // 1) Create error if user POSTs password data
    if (req.body.password || req.body.passwordConfirm) {
        return next(new AppError("This route is not for password update"), 400)
    }
    // 2) FIltered out unwanted fiels name that are not allowed
    const filteredBody = filterObj(req.body, "name", "email")
    // 3) Update user document
    const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, { new: true, runValidators: true })
    res.status(200).json({
        status: 'success',
        updatedUser
    })
})

exports.deleteMe = catchAsync(async (req,res,next)=>{
    await User.findByIdAndUpdate(req.user.id, {active:false})

    res.status(204).json({
        status: "success",
        data:null
    })
})

exports.getUser = (req, res) => {
    res.status(500).json({
        status: "error",
        message: "This route is not yet defined"
    })
}
exports.createUser = (req, res) => {
    res.status(500).json({
        status: "error",
        message: "This route is not yet defined"
    })
}
exports.updateUser = (req, res) => {
    res.status(500).json({
        status: "error",
        message: "This route is not yet defined"
    })
}
exports.deleteUser = (req, res) => {
    res.status(500).json({
        status: "error",
        message: "This route is not yet defined"
    })
}