const express = require("express");
const {
    sendMessage,
    getHistory,
    deleteHistory
} = require("./chat.controller");
const authMiddleware = require("../../middleware/auth.middleware");

const router = express.Router();

router.use(authMiddleware);

router.post("/", sendMessage);
router.get("/history", getHistory);
router.delete("/history", deleteHistory);

module.exports = router;
