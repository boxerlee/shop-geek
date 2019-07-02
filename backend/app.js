var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var cors = require('cors');
var mongoose = require('mongoose');
var session = require('express-session');
var expressValidator = require('express-validator');
var fileUpload = require('express-fileupload');
var AWS=require('aws-sdk');

//Init app
var app = express();

app.use(express.static(path.join(__dirname, 'public')));
app.use(fileUpload());
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(bodyParser.json());
app.use(session({
  secret: 'secret developer',
  resave: true,
  saveUninitialized: true,
  //cookie:{secure:true}
}));
//custom validator for images
app.use(expressValidator({
  customValidators: {
    isImage: (value, filename) => {

      var extension = (path.extname(filename)).toLowerCase();

      switch (extension) {
        case '.jpg':
          return '.jpg';
        case '.jpeg':
          return '.jpeg';
        case '.png':
          return '.png';
        default:
          return false;
      }
    }
  }
}));
app.use(cors());

require('dotenv').config();

//Connect to DB
mongoose.connect(process.env.mongoURI, {
  useNewUrlParser: true
});
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
  console.log('Connected to MongoDB');
});

//s3
AWS.config.update({
  accessKeyId: process.env.ACCESS_KEY_ID,
  secretAccessKey: process.env.SECRET_ACCESS_KEY
});

//models
var Category = require('./models/category');
var Product = require('./models/product');


//Routes
var adminCategory = require('./routes/adminRoutes/adminCategory');
var addCategory = require('./routes/adminRoutes/addCategory');
var editCategory = require('./routes/adminRoutes/editCategory');
var deleteCategory = require('./routes/adminRoutes/deleteCategory');
var adminProduct = require('./routes/adminRoutes/adminProduct');
var addProduct = require('./routes/adminRoutes/addProduct');

//Middlewares
app.use('/admin/categories', adminCategory);
app.use('/admin/add-category', addCategory);
app.use('/admin/edit-category', editCategory);
app.use('/admin/delete-category', deleteCategory);
app.use('/admin/add-product', addProduct);
app.use('/admin/products', adminProduct);


//Start the server
var port = 3000;
app.listen(process.env.PORT || port, () => {
  console.log('Server started on port ' + port)
});