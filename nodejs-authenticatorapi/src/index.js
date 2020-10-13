
const ioc =  require( __dirname + "/vendor/IoC.js");
const express = require('express');
const bodyParser = require('body-parser');
//................................................... CONFIGURE 
const app = express();
const port = process.env.PORT || 3000

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

//................................................... ROUTE 
app.get('/', (req, res) => {
  ioc.get('DefaultController').home(req, res);
});

app.post('/generate', (req, res) => {
  ioc.get('DefaultController').generate(req, res);
});

app.post('/verify', (req, res) => {
  ioc.get('DefaultController').verify(req, res);
});

//................................................... ON INIT 
app.listen(port, () => {
  console.log(`app listening at http://localhost:${port}`)
})
