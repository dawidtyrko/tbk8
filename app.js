const express = require('express');
const { body, validationResult } = require('express-validator');
const app = express();
const fs = require('fs');
const path = require('path');
const {registrationValidator} = require("./productValidator");
const cors = require('cors');

function inputMiddleware(req, res, next) {
  if(req.body && typeof req.body === 'object'){
    for(const key in req.body){
      if(typeof req.body[key] === 'string'){
        req.body[key] = req.body[key].toLowerCase();
      }
    }
  }
  next()
}

function outputMiddleware(req, res, next) {
  const originalJson = res.json

  res.json = function (data){
    if (Array.isArray(data)){
      data = data.map((item) => ({
        ...item,
            timestamp: new Date().toISOString(),
      }))
    }else if(data && typeof data === 'object'){
      data.timestamp = new Date().toISOString();

    }
    originalJson.call(this, data);
  }
  next()
}
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:8080',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept','Authorization'],
  credentials: true
}));
app.options('*', cors());
app.use(inputMiddleware)
app.use(outputMiddleware)

// File path to products.json
const filePath = path.join(__dirname, 'products.json');

// Load products from file
const loadProducts = () => {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (error) {
    return [];
  }
};

// Save products to file
const saveProducts = (products) => {
  fs.writeFileSync(filePath, JSON.stringify(products, null, 2), 'utf-8');
};

app.get('/api/products', (req, res) => {
  //res.json(products);
  const products = loadProducts();
  res.json(products);
})

app.route('/api/products/:id').get((req, res,next) => {
  try{
    const products = loadProducts();
    let product = products.find((product) => product.id === parseInt(req.params.id));
    if (!product) {
      const error = new Error('Product Not Found');
      error.status = 404;
      return next(error)
    }
    //res.render('products/product.ejs',{product:product});
    res.json(product);
  }catch(err){
    next(err)
  }
})
// POST route to add a new product
app.post('/api/products', registrationValidator, (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const product = req.body;
  const productsList = loadProducts();

  const id = productsList.length ? productsList[productsList.length - 1].id + 1 : 1;

  const newProduct = { id, ...product };
  productsList.push(newProduct);
  saveProducts(productsList);

  res.status(201).json(newProduct); // Return the newly created product
});

app.route('/api/products/:id').put(registrationValidator,(req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const products = loadProducts();
  const id = parseInt(req.params.id);
  const updatedProduct = req.body;

  // Find the index of the product
  const productIndex = products.findIndex((product) => product.id === id);

  if (productIndex === -1) {
    return res.status(404).json({ error: 'Product Not Found' });
  }

  // Replace the product
  products[productIndex] = { id, ...updatedProduct };

  // Save back to the JSON file
  saveProducts(products);

  res.status(200).json(products[productIndex]);
});

app.route('/api/products/:id').patch(registrationValidator, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const products = loadProducts();
  const id = parseInt(req.params.id);
  const updates = req.body;

  // Find the product
  const product = products.find((product) => product.id === id);

  if (!product) {
    return res.status(404).json({ error: 'Product Not Found' });
  }

  // Apply updates
  Object.assign(product, updates);

  // Save back to the JSON file
  saveProducts(products);

  res.status(201).json(product);
});

app.use((req,res,next) => {
  const error = new Error(' Route not found');
  error.status = 404;
  next(error);
})
function errorHandler(err,req,res,next){
  console.error(err.stack)
  const statusCode = err.status || 500;
  res.status(statusCode).json({
    message: err.message || 'internal server error',
    statusCode: statusCode
  })
}
app.use(errorHandler);
// Start the server
app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
