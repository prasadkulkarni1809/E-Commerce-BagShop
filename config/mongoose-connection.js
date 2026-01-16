const mongoose = require('mongoose');
mongoose.connect("mongodb://127.0.0.1:27017/ecommerce")
.then(function(){                                                             

    console.log("connected to MongoDB")
})              
.catch(function(err){

    console.log(err)
}) 
module.exports= mongoose.connection;