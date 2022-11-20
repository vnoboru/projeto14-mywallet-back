import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import joi from "joi";
import bcrypt from "bcrypt";
import { v4 } from "uuid";

const app = express();
app.use(express.json());
app.use(cors());

// conectando ao banco de dados
let db;
dotenv.config();
const mongoClient = new MongoClient(process.env.MONGO_URI);
const promise = mongoClient.connect();
promise.then(() => {
  db = mongoClient.db("usersDB");
  console.log("Conectado ao banco de dados");
});
promise.catch((err) => console.log(err));

// post para cadastrar um novo usuário
app.post("/sign-up", async (req, res) => {
  const body = req.body;
  console.log("body do cadastro", body);
  const user = {
    name: body.name,
    email: body.email,
    password: body.password,
    confirmPassword: body.confirmPassword,
  };

  //schema para verificar os dados enviados
  const schema = joi.object({
    name: joi.string().required(),
    email: joi.string().required(),
    password: joi.string().required(),
    confirmPassword: joi.string().required().valid(joi.ref("password")),
  });

  //validação dos dados enviados
  const validation = schema.validate(user);
  if (validation.error) {
    console.log("Erro ao cadastrar usuário", validation.error);
    res.status(422).send("Erro ao cadastrar usuario");
    return;
  }

  try {
    //Verificação de conta cadastrada
    const checkAccount = await db
      .collection("users")
      .findOne({ email: body.email });

    if (checkAccount) {
      res.status(409).send("User já cadastrado");
      console.log("User já cadastrado");
      return;
    }

    const hash = await bcrypt.hash(body.password, 10);

    //Inserindo objeto
    await db
      .collection("users")
      .insertOne({ name: body.name, email: body.email, password: hash });
    console.log("user cadastrado", user);
    res.sendStatus(201);
  } catch {
    res.status(422).send("Erro ao cadastrar");
  }
});

// post para login do usuário
app.post("/sign-in", async (req, res) => {
  const body = req.body;
  const user = {
    email: body.email,
    password: body.password,
  };

  //schema para verificar os dados enviados
  const schema = joi.object({
    email: joi.string().required(),
    password: joi.string().required(),
  });

  //validação dos dados enviados
  const validation = schema.validate(user);
  if (validation.error) {
    console.log("Erro ao logar o usuário", validation.error);
    res.status(422).send("Erro ao logar o usuario");
    return;
  }

  try {
    //Verificação da existência da conta
    const userData = await db
      .collection("users")
      .findOne({ email: body.email });
    if (userData && (await bcrypt.compare(body.password, userData.password))) {
      const token = v4();
      await db
        .collection("sessionsHome")
        .insertOne({ token, user: userData._id });
      res.send(userData).status(200);
    } else {
      res.status(401).send("Usuário e/ou senha estão incorretos. ");
    }
  } catch {
    res.status(401).send("Usuário e/ou senha estão incorretos. ");
  }
});

app.listen(5000, () => console.log("Server running in port: 5000"));
