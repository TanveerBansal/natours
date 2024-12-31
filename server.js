const mongoose = require("mongoose")
const dotenv = require("dotenv")

process.on("uncaughtException", (err) => {
    console.log("UNCAUGHT EXCEPTION: SHUTING DOWN...");
    console.log(err);
    process.exit(1)    // 0 for success, and 1 for uncaught exception
})

dotenv.config({ path: "./config.env" })
const app = require("./index")

// console.log(process.env)

// const DB = process.env.DATABASE_LOCAL
const DB = process.env.DATABASE_ATLAS



mongoose.connect(DB)
    .then((con) => {
        console.log("Db connection sucessful")
    })



const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
})

process.on("unhandledRejection", (err) => {
    console.log(err.name, err.message)
    console.log("UNHANDLED REJECTION: SHUTING DOWN...");
    server.close(() => {
        process.exit(1)    // 0 for success, and 1 for uncaught exception
    })
})


