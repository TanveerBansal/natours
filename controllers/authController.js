const crypto = require("crypto")
const { promisify } = require("util")
const jwt = require("jsonwebtoken")
const User = require("../models/userModal")
const catchAsync = require("../utils/catchAsync")
const AppError = require("../utils/AppError")
const sendEmail = require("../utils/email")
const bcrypt = require("bcryptjs/dist/bcrypt")


const signToken = (id) => {
    return jwt.sign({ id: id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN })
}

const createSendToken = (user, statusCode, res) => {
    const token = signToken(user._id)
    const cookieOptions = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
        httpOnly: true,
    }
    if (process.env.NODE_ENV === "production") cookieOptions.secure = true;
    res.cookie('jwt', token, cookieOptions)

    // to dont show the user password in response
    user.password = undefined

    res.status(statusCode).json({
        status: "success",
        token,
        data: { user }
    })
}

exports.signup = catchAsync(async (req, res, next) => {
    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        role: req.body.role,
        password: req.body.password,
        passwordConfirm: req.body.password,
        passwordChangedAt: req.body.passwordChangedAt
    })

    createSendToken(newUser, 201, res)
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

exports.logout = (req, res) => {
    res.cookie('jwt', 'loggedout', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true
    });
    res.status(200).json({ status: 'success' });
};

exports.isLoggedIn = async (req, res, next) => {
    if (req.cookies.jwt) {
        try {
            // 1) verify token
            const decoded = await promisify(jwt.verify)(
                req.cookies.jwt,
                process.env.JWT_SECRET
            );

            // 2) Check if user still exists
            const currentUser = await User.findById(decoded.id);
            if (!currentUser) {
                return next();
            }

            // 3) Check if user changed password after the token was issued
            if (currentUser.changedPasswordAfter(decoded.iat)) {
                return next();
            }

            // THERE IS A LOGGED IN USER
            res.locals.user = currentUser;
            return next();
        } catch (err) {
            return next();
        }
    }
    next();
};

exports.protect = catchAsync(async (req, res, next) => {
    //1. Getting the token and check if it's there
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        token = req.headers.authorization.split(" ")[1]
    } else if (req.cookies.jwt) {
        token = req.cookies.jwt;
    }
    if (!token) {
        return next(new AppError("You are not loggedin!, Please log in to get access", 401))
    }
    // 2. Verfication token
    //by using promisify we are converting jwt.verify callback-based fn into a fn that return promise
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET)

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

exports.forgotPassword = catchAsync(async (req, res, next) => {

    // 1 Get the user based on the email
    const user = await User.findOne({ email: req.body.email })

    if (!user) {
        return next(new AppError("There is no user with this email address", 404))
    }
    // 2 Generate the random token
    const resetToken = user.createPasswordResetToken()
    await user.save({ validateBeforeSave: false })

    // 3 Send it to user email
    const resetURL = `${req.protocol}://${req.get("host")}/api/v1/user/resetPassword/${resetToken}`
    const message = `Forgot your password? Submit a request with your new password and password confirm to: ${resetURL}`

    try {
        // await sendEmail({
        //     email: req.body.email,
        //     subject: `Your password reset token (Valid only for 10 min)`,
        //     message
        // })

        res.status(200).json({
            status: "success",
            message: "Token send to email",
            resetURL
        })
    } catch (err) {
        console.log("errr", err);

        user.passwordResetExpires = undefined
        user.passwordResetToken = undefined
        await user.save({ validateBeforeSave: false })
        return next(new AppError("There was an error sending the mail, Please try again later!"), 500)
    }



})

exports.resetPassword = catchAsync(async (req, res, next) => {
    // 1 Get the user based on the token
    const hashedToken = crypto.createHash("sha256").update(req.params.token).digest('hex')

    const user = await User.findOne({ passwordResetToken: hashedToken, passwordResetExpires: { $gt: Date.now() } })

    // 2 If the session is not expired and there is user, set the password
    if (!user) {
        return next(new AppError(`Token is invalid or has expired.`, 400))
    }
    //  3 Update the changePasswordAt property for the user
    user.password = req.body.password
    user.passwordConfirm = req.body.passwordConfirm
    user.passwordResetToken = undefined
    user.passwordResetExpires = undefined

    await user.save()

    // 4 Log in the user, send the JWT
    const token = signToken(user._id)

    res.status(200).json({
        status: "success",
        token,
        data: {
            user
        }
    })
})

exports.updatePassword = catchAsync(async (req, res, next) => {
    // 1 Get user from collection
    const { password, passwordCurrent, passwordConfirm } = req.body

    const user = await User.findById(req.user.id).select("+password")

    // 2 check if posted current password is correct
    if (!user || !(user.correctPassword(passwordCurrent, user.password))) {
        return next(new AppError("Incorrect password", 401))
    }

    // 3 If correct, update password
    user.password = password
    user.passwordConfirm = passwordConfirm

    await user.save()
    // 4 Log user in, send JWT
    const token = signToken(user._id)

    res.status(200).json({
        status: true,
        token,

    })

})