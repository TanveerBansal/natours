const multer = require('multer');
const sharp = require('sharp');
const User = require("../models/userModal")
const AppError = require("../utils/AppError")
const catchAsync = require("../utils/catchAsync")
const { deleteOne, updateOne, getOne, getAll } = require("./handlerFactory")

//--- Saving the file to the Disk Storage (used when don't need and file processing)
// const multerStorage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         cb(null, 'public/img/users');
//     },
//     filename: (req, file, cb) => {
//         const ext = file.mimetype.split('/')[1]
//         cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//     }
// })

// ---The file is temp. stored on main memory as buffer for processing.
const multerStorage = multer.memoryStorage();


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

exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = (req, res, next) => {
    if (!req.file) return next();
    req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`
    sharp(req.file.buffer).resize(500, 500).toFormat('jpeg').jpeg({ quality: 90 }).toFile(`public/img/users/${req.file.filename}`);
    next();
}

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
    if (req.file) filteredBody.photo = req.file.filename
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