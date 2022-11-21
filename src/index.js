import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import accountRoutes from "./routes/account.routes.js";
import usersRoutes from "./routes/users.routes.js";

const app = express();
app.use(express.json());
app.use(cors());

dotenv.config();

app.use(accountRoutes);
app.use(usersRoutes);

app.listen(5000, () => console.log("Server running in port: 5000"));
