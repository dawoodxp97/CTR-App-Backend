// Importing
import express from "express";
import mongoose from "mongoose";
import Cors from "cors";
import Message from "./dbMessages.js";
import Pusher from "pusher";

// App Cofig
const app = express();
const port = process.env.PORT || 9000;
const pusher = new Pusher({
  appId: "1233871",
  key: "8a3110eb4f1e43cf37aa",
  secret: "8b39d10793dc9e8106e8",
  cluster: "ap2",
  useTLS: true,
});

// Middlewares
app.use(express.json());
app.use(Cors());

//  DB Config
const connection_url =
  "mongodb+srv://admin:HDPhwHbCFYUg8D8n@cluster0.pqjn3.mongodb.net/ctrdb?retryWrites=true&w=majority";
mongoose.connect(connection_url, {
  useCreateIndex: true,
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

db.once("open", () => {
  const msgCollection = db.collection("messagecontents");
  const changeStream = msgCollection.watch();
  changeStream.on("change", (change) => {
    if (change.operationType === "insert") {
      const messageDetails = change.fullDocument;
      pusher.trigger("messages", "inserted", {
        name: messageDetails.name,
        message: messageDetails.message,
        timestamp: messageDetails.timestamp,
        received: messageDetails.received,
      });
    } else {
      console.log("Error Triggering the Pusher");
    }
  });
});

// ????

// Api Routes
app.get("/", (req, res) => res.status(200).send("Hello World"));

app.get("/messages/sync", (req, res) => {
  Message.find((err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(201).send(data);
    }
  });
});

app.post("/messages/new", (req, res) => {
  const dbMessage = req.body;
  Message.create(dbMessage, (err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(201).send(data);
    }
  });
});

// Listen
app.listen(port, () => console.log(`Listening on ${port}`));
