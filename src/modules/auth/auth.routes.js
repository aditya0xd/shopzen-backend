import {register, login} from "./auth.controller.js"
import express from "express"
import limiter from './limiter.middleware'

const router = express.Router();

router.post('/register',limiter, register);
router.post('/login',limiter, login);

module.exports = router;




