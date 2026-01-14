import app from './app/index.js';

const port = process.env.PORT || 8080;

// Listen for requests on port 3000
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});