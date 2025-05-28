const multer = require('multer');
const User = require("../models/userModal")
const AppError = require("../utils/AppError")
const catchAsync = require("../utils/catchAsync")
const { deleteOne, updateOne, getOne, getAll } = require("./handlerFactory")


const multerStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/img/users');
    },
    filename: (req, file, cb) => {
        const ext = file.mimetype.split('/')[1]
        cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
    }
})

// This is the filter to check, if the uploaded file is image or not
const multerFilter = (req, file, cb) => {
    if (file?.mimetype?.startsWith('image')) {
        cb(null, true);
    }
    else {
        cb(new AppError('Not an image! Please upload only images.'), false)
    }
}

const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter
})

exports.uploadUserPhoto = upload.single('photo')



const filterObj = (obj, ...allowedFields) => {
    const newObj = {};
    Object.keys(obj).forEach((el) => {
        if (allowedFields.includes(el)) newObj[el] = obj[el]
    })
    return newObj
}

exports.getAllUsers = getAll(User)

exports.getMe = (req, res, next) => {
    req.params.id = req.user.id
    next()
}

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

exports.deleteMe = catchAsync(async (req, res, next) => {
    await User.findByIdAndUpdate(req.user.id, { active: false })

    res.status(204).json({
        status: "success",
        data: null
    })
})

exports.getUser = getOne(User)
exports.createUser = (req, res) => {
    res.status(500).json({
        status: "error",
        message: "This route is not yet defined"
    })
}



exports.updateUser = updateOne(User)


// exports.deleteUser = (req, res) => {
//     res.status(500).json({
//         status: "error",
//         message: "This route is not yet defined"
//     })
// }
exports.deleteUser = deleteOne(User)