import app from './app/index.js';
const port = process.env.PORT || 3000;

// Define a simple route to test the server
app.get('/', (req, res) => {
  res.sendStatus(200)
});


// Listen for requests on port 3000
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});