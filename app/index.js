//URL: http://localhost:3000
import express from 'express';
import morgan from 'morgan';
import allRoute from './routes/index.js';
const baseUrl = process.env.BASE_URL || '/api/v1';



const app = express();
app.use(morgan('combined'));

app.set("json replacer", (key, value) =>
  typeof value === "bigint" ? value.toString() : value
);

app.use(`${baseUrl}/health`, (req, res) => {
  res.status(200).send({ status: 'OK' });
});

app.use(baseUrl, allRoute);



export default app;