const express = require("express")
const { getAllUsers, getUser, createUser, updateUser, deleteUser, updateMe, deleteMe, getMe, uploadUserPhoto,resizeUserPhoto } = require("../controllers/userController")
const { signup, login, logout, forgotPassword, resetPassword, protect, updatePassword, restrictTo } = require("../controllers/authController")
// const protectRoute = require("../controllers/authController")

const router = express.Router()

router.post("/signup", signup)
router.post("/login", login)
router.post("/logout", logout)
router.post("/forgotPassword", forgotPassword)
router.patch("/resetPassword/:token", resetPassword)

router.use(protect)

router.patch("/updatePassword", updatePassword)
router.get("/getme", getMe, getUser)
router.patch("/updateMe", uploadUserPhoto, resizeUserPhoto, updateMe)
router.delete("/deleteMe", deleteMe)



router.use(restrictTo("admin"))
router.route("/").get(getAllUsers).post(createUser)
router.route("/:id").get(getUser).patch(updateUser).delete(deleteUser)

module.exports = router