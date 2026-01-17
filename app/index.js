//URL: http://localhost:3000
import express from 'express';
import morgan from 'morgan';
import cors from "cors";
import Route from '#routes/index.js';
import "dotenv/config";


const baseUrl = process.env.BASE_URL || '/api/v1';
const corsOptions = { 
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173', 
  credentials: true 
};


const app = express();
app.use(morgan('common'));
app.use(express.json());
app.use(cors(corsOptions));
app.set("json replacer", (key, value) =>
  typeof value === "bigint" ? value.toString() : value
);

// Mount the main router at the base URL
app.use(baseUrl, Route);

export default app;