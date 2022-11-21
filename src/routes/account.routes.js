import { Router } from "express";
import tokenValidation from "../middlewares/tokenValidation.middleware.js";

import { getAccount, postAccount } from "../controllers/account.controller.js";

const router = Router();

router.post("/account", postAccount);
router.get("/account", tokenValidation, getAccount);

export default router;
