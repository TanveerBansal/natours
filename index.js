const path = require("path")
const express = require("express")
const morgan = require("morgan")
const rateLimit = require("express-rate-limit")
const helmet = require("helmet")
const mongoSanatize = require("express-mongo-sanitize")
const xss = require("xss-clean")
const cookieParser = require('cookie-parser');

const tourRouter = require("./routes/tourRoutes")
const userRouter = require("./routes/userRoutes")
const reviewRouter = require("./routes/reviewRoutes")
const viewRouter = require("./routes/viewRoutes")
const AppError = require("./utils/AppError")
const globalErrorHandler = require("./controllers/errorController")
const { customRateLimiter } = require("./utils/customRateLimiter")

const app = express()

app.set('view engine', 'pug')//-> pug templete to render the website on browser throught server
app.set('views setting', path.join(__dirname, "views"))//



//1) MIDDLEWARE

app.use(express.static(path.join(__dirname, 'public')))

// security HTTP headers middleware
app.use(helmet())

if (process.env.NODE_ENV === "development") {
    app.use(morgan("dev"))
}


// Middle ware for API rate limit
//with package-----
const limiter = rateLimit({
    max: 100,
    windowMs: 60 * 60 * 1000,
    message: "Too much request from you side, Please try after an hour."
})

app.use("/api", limiter)

// custom ratelimiter middleware----
// app.use(customRateLimiter)




app.use(express.urlencoded({ extended: true }));
app.use(express.json()) //body parser middleware
app.use(cookieParser());


// Data sanitization against Nosql query attacks
// app.use(mongoSanatize())  //creating some type of issue so commented

// Data sanitization againt XSS
// app.use(xss())       //creating some type of issue so commented


// app.use((req,res,next)=>{
//     console.log("Hello from middleware 1");
//     next()
// })

app.use((req, res, next) => {
    req.requestTime = new Date().toLocaleTimeString()
    // console.log(req.headers)
    next()
})

/*
app.get("/", (req, res) => {
    // res.status(200).send("Hello from server")
    res.status(200).json({ message: "Hello from server", app: "Natours" });
})
app.post("/", (req, res) => {
    res.status(200).json({ message: "you can post at this endpoint..." });
})
*/




//3) ROUTES

app.use('/', viewRouter)


app.use("/api/v1/users", userRouter)
app.use("/api/v1/tours", tourRouter)
app.use("/api/v1/reviews", reviewRouter)

// RESPONSE FOR UNDEFINED ROUTES
// app.all("*", (req, res) => {
//     res.status(404).json({
//         success: "fail",
//         message: `Can't find the ${req.originalUrl} on this server`
//     })
// })

/*
app.all("*", (req, res, next) => {
    //error handled with global error handler middleware
    const err = new Error(`Can't find the ${req.originalUrl} on this server`)
    err.statusCode = 404
    err.status = "fail"

    next(err)
    //when we pass an argument in next fn, express automatically understand its is an error and pass it to error handle middleware
})
*/

app.all("/*wildcard", (req, res, next) => {

    next(new AppError(`Can't find the ${req.originalUrl} on this server`, 404))
})



// GLOBAL ERROR HANGLER MIDDLEWARE
app.use(globalErrorHandler)

module.exports = app