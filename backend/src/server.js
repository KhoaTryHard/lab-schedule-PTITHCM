require('dotenv').config();

const app = require('./app');

const port = Number(process.env.APP_PORT || 4000);

app.listen(port, () => {
  console.log(`Lab Schedule API is running at http://localhost:${port}/api`);
});
