const { promisify } = require("util")
const jwt = require("jsonwebtoken")
const User = require("../models/userModal")
const catchAsync = require("../utils/catchAsync")
const AppError = require("../utils/appError")


const signToken = (id) => {
    return jwt.sign({ id: id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN })
}

exports.signup = catchAsync(async (req, res, next) => {
    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.password,
        passwordChangedAt: req.body.passwordChangedAt
    })

    const token = signToken(newUser._id)

    res.status(200).json({
        status: "success",
        token,
        data: {
            newUser
        }
    })
})

exports.login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body

    //1) Check if email and password exist
    if (!email || !password) {
        return next(new AppError("Please provide email and passsword", 400))
    }
    //2) Check if user exist and password is correct
    //here in query we are using the select("+password"), bcoz in schema we set select:false, which makes it invisible
    const user = await User.findOne({ email }).select("+password")

    if (!user || !(await user.correctPassword(password, user.password))) {
        return next(new AppError("Incorrect email or password", 401))
    }

    //3) If everything is OK, send token to client
    const token = signToken(user._id)
    res.status(200).json({
        status: "success",
        token
    })

})


exports.protect = catchAsync(async (req, res, next) => {
    //1. Getting the token and check if it's there
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        token = req.headers.authorization.split(" ")[1]
        // console.log(token);

    }
    if (!token) {
        return next(new AppError("You are not loggedin!, Please log in to get access", 401))
    }
    // 2. Verfication token
    //by using promisify we are converting jwt.verify callback-based fn into a fn that return promise
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET)
    // console.log(decoded);

    //3. Check if user still exist
    const currentUser = await User.findById(decoded.id)
    if (!currentUser) {
        return next(new AppError("The user belonging to this token is no longer exist", 401))
    }
    //4. If user change password after token was issued
    if (currentUser.changePasswordAfter(decoded.iat)) {
        return next(new AppError("User recently changed password, Please login again!"), 401)
    }

    //GRANT ACCESS TO PROTECTED ROUTE
    req.user = currentUser
    next()
})


exports.restrictTo = (...roles) => {
    // so by default middleware dont accept parameter, but here we needed so here we are first accepting the roles and the return a function which id middleware

    // roles = ["admin", "lead-guide"]

    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(
                new AppError("You don't have permission to perform this action", 403)
            )
        }
        next()
    }
}