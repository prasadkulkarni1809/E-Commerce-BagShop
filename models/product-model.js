const mongoose = require('mongoose');


const productSchema =mongoose.Schema({
image:Buffer,
name:String,

discount :{
    type: Number,
    default:0
},
bgcolor : String,
panelcolor :String,
textcolor: String,
price:Number,
});

module.exports = mongoose.model("product",productSchema);
