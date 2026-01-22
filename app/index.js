import express from 'express';
import morgan from 'morgan';
import cors from "cors";
import helmet from "helmet";
import Route from '#routes/index.js';
import cookieParser from 'cookie-parser';
import "dotenv/config";


const baseUrl = process.env.BASE_URL || '/api/v1';
const corsOptions = { 
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173', 
  credentials: true 
};

// Initialize Express app
const app = express();

// Apply security middleware
app.use(helmet());

app.use(morgan('common'));
app.use(cookieParser()); 
app.use(express.json());
app.use(cors(corsOptions));
app.use(express.urlencoded({ extended: false })); // GIS redirect POST form
app.set("json replacer", (key, value) =>
  typeof value === "bigint" ? value.toString() : value
);

// Mount the main router at the base URL
app.use(baseUrl, Route);

export default app;