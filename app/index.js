//URL: http://localhost:3000
import express from 'express';
import morgan from 'morgan';
import Route from '#routes/index.js';

const baseUrl = process.env.BASE_URL || '/api/v1';

const app = express();
app.use(morgan('common'));
app.use(express.json());

app.set("json replacer", (key, value) =>
  typeof value === "bigint" ? value.toString() : value
);

// Mount the main router at the base URL
app.use(baseUrl, Route);

export default app;