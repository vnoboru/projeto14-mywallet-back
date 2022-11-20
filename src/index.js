import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import joi from "joi";
import bcrypt from "bcrypt";
import { v4 } from "uuid";
import dayjs from "dayjs";

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

// post para cadastrar um novo usuário
app.post("/sign-up", async (req, res) => {
  const body = req.body;
  //Body do cadastro
  const user = {
    name: body.name,
    email: body.email,
    password: body.password,
    confirmPassword: body.confirmPassword,
  };

  //Schema para verificar os dados enviados
  const userSchema = joi.object({
    name: joi.string().required(),
    email: joi
      .string()
      .pattern(/\S+@\S+\.\S+/)
      .required(),
    password: joi.string().required(),
    confirmPassword: joi.string().required().valid(joi.ref("password")),
  });

  //validação dos dados enviados
  const validation = userSchema.validate(user, { abortEarly: false });
  if (validation.error) {
    const erros = validation.error.details.map((detail) => detail.message);
    res.status(422).send(erros);
    return;
  }

  try {
    //Verificação de conta cadastrada
    const checkAccount = await db
      .collection("users")
      .findOne({ email: body.email });

    if (checkAccount) {
      res.status(409).send("Usuário já foi cadastrado!");
      return;
    }

    //Criptografar a senha
    const hash = await bcrypt.hash(body.password, 10);

    //Inserindo objeto no MongoDB
    await db
      .collection("users")
      .insertOne({ name: body.name, email: body.email, password: hash });
    res.status(201).send("Usuário foi cadastrado com sucesso!");
  } catch {
    res.status(422).send("Erro ao cadastrar o usuário!");
  }
});

// post para login do usuário
app.post("/sign-in", async (req, res) => {
  const body = req.body;
  //Body do login
  const user = {
    email: body.email,
    password: body.password,
  };

  //schema para verificar os dados enviados
  const userSchema = joi.object({
    email: joi.string().required(),
    password: joi.string().required(),
  });

  //validação dos dados enviados
  const validation = userSchema.validate(user, { abortEarly: false });
  if (validation.error) {
    const erros = validation.error.details.map((detail) => detail.message);
    res.status(422).send(erros);
    return;
  }

  try {
    //Verificação da existência da conta
    const userData = await db
      .collection("users")
      .findOne({ email: body.email });

    const passwordCompare = await bcrypt.compare(
      body.password,
      userData.password
    );

    if (userData && passwordCompare) {
      const token = v4();
      console.log(token);
      //Inserindo objeto no MongoDB
      await db
        .collection("sessionsHome")
        .insertOne({ token, user: userData._id, name: userData.name });

      const user = await db.collection("sessionsHome").findOne({ token });

      delete user._id;
      res.send(userData).status(200);
    } else {
      res.status(401).send("Usuário e/ou senha estão incorretos. ");
    }
  } catch {
    res.status(401).send("Usuário e/ou senha estão incorretos. ");
  }
});

app.post("/account", async (req, res) => {
  const { authorization } = req.headers;
  const body = req.body;
  //Body formato de envio dos valores
  const finances = {
    description: body.description,
    value: body.value,
    type: body.type,
  };

  const userSchema = joi.object({
    description: joi.string().required(),
    value: joi.number().required(),
    type: joi.string().required(),
  });

  //validação dos dados enviados
  const type = body.type === "income" || body.type === "outcome";
  const validation = userSchema.validate(finances, { abortEarly: false });

  if (validation.error || !type) {
    const erros = validation.error.details.map((detail) => detail.message);
    res.status(422).send(erros);
    return;
  }

  const token = authorization?.replace("Bearer", "").trim();
  console.log(token);
  if (!token) {
    res.sendStatus(401);
    return;
  }

  try {
    const accountSession = await db
      .collection("sessionsHome")
      .findOne({ token });

    if (!accountSession) {
      res.sendStatus(401);
      return;
    }

    await db.collection("balances").insertOne({
      user: accountSession.user,
      date: dayjs().format("DD/MM"),
      ...finances,
    });
    res.sendStatus(201);
  } catch {
    res.status(404).send("Token inválido");
  }
});
//Pegar as informações do usuário
app.get("/account", async (req, res) => {
  //Obtenção do token
  const { authorization } = req.headers;
  const token = authorization?.replace("Bearer", "").trim();

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

app.delete("/logout", async (req, res) => {
  const { authorization } = req.headers;
  const token = authorization?.replace("Bearer", "").trim();
  if (!token) {
    res.sendStatus(401);
    return;
  }

  try {
    const accountSession = await db
      .collection("sessionsHome")
      .findOne({ token });

    if (!accountSession) {
      res.sendStatus(401);
      return;
    }

    await db.collection("sessionsHome").deleteOne({ token });
    res.sendStatus(200);
  } catch {
    res.status(404).send("Token inválido");
  }
});
app.listen(5000, () => console.log("Server running in port: 5000"));
