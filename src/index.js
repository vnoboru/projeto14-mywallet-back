import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import joi from "joi";
import bcrypt from "bcrypt";
import { v4 } from "uuid";
import dayjs from "dayjs";
import { postAccount } from "./controllers/account.controller.js";
import {
  deleteUser,
  postSignIn,
  postSignUp,
} from "./controllers/auth.controller.js";

const app = express();
app.use(express.json());
app.use(cors());

// conectando ao banco de dados
let db;
dotenv.config();
const mongoClient = new MongoClient(process.env.MONGO_URI);

try {
  mongoClient.connect();
  db = mongoClient.db("usersDB");
  console.log("Conectado ao banco de dados");
} catch (err) {
  console.log(err);
}

app.post("/sign-up", postSignUp);
app.post("/sign-in", postSignIn);
app.post("/account", postAccount);

//Pegar as informações do usuário
app.get("/account", async (req, res) => {
  //Obtenção do token
  const { authorization } = req.headers;
  const token = authorization?.replace("Bearer ", "").trim();

  if (!token) {
    res.sendStatus(401);
    return;
  }

  try {
    const session = await db.collection("sessionsHome").findOne({ token });

    if (!session) {
      res.sendStatus(401);
      return;
    }

    const user = await db
      .collection("balances")
      .findOne({ user: session.user })
      .toArray();
    if (!user) {
      res.sendStatus(404);
      return;
    }

    user.map((d) => {
      delete d._id;
      delete d.user;
    });
    res.send(user).status(200);
  } catch {
    res.status(404).send("Token inválido");
  }
});

app.delete("/logout", deleteUser);
app.listen(5000, () => console.log("Server running in port: 5000"));
