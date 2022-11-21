import { Router } from "express";
import {
  deleteUser,
  postSignIn,
  postSignUp,
} from "../controllers/auth.controller.js";
import {
  loginValidation,
  registrationValidation,
} from "../middlewares/authValidation.middleware.js";

const router = Router();

router.post("/sign-up", registrationValidation, postSignUp);
router.post("/sign-in", loginValidation, postSignIn);
router.delete("/logout", deleteUser);

export default router;
