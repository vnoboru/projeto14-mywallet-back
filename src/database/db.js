import { MongoClient } from "mongodb";
import dotenv from "dotenv";

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

export default db;
