import {register, login} from "./auth.controller.js"
import express from "express"

const router = express.Router();

router.post('/register', register);
router.post('/login', login);

module.exports = router;




