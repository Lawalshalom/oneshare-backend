const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema({
   name: {
     type: String,
     required: true
   },
   password: {
    type: String,
    required: true
  },
  secretKey: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  }
})

module.exports = mongoose.model("adminUser", adminSchema);