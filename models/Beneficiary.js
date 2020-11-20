const mongoose = require("mongoose");

const beneficiarySchema = new mongoose.Schema({
   name: {
     type: String,
     required: true
   },
   password: {
    type: String,
    required: true
  },
  accountType: {
    type: String,
    required: true
  },
  accountSubtype: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  userState: {
    type: String,
    required: true
  },
  userLGA: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  requests: [mongoose.Schema.Types.Mixed]
})

module.exports = mongoose.model("beneficiaryUser", beneficiarySchema);