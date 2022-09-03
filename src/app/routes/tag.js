const router = require("express").Router();
const tag_controller = require("../controllers/tag");
const auth = require("../middlewares/auth");
const admin = require("../middlewares/admin");
const {createValidator, updateValidator} = require("../utils/validator/tag");


router.post("/", [auth, admin, createValidator], tag_controller.create);
router.patch("/:id",  [auth, admin, updateValidator], tag_controller.update);
router.get("/", tag_controller.get_all);
router.get("/:id", tag_controller.get_one);
router.delete("/:id", [auth, admin], tag_controller.delete);

module.exports = router;