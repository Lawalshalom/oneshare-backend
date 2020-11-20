const router = require("express").Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const uuid = require("uuidv4").uuid;

const adminUser = require("../models/Admin");
const beneficiaryUser = require("../models/Beneficiary");
const donorUser = require("../models/Donor");

router.get("/overview-donor", verifyToken, (req, res) => {
    jwt.verify(req.token, "secretonesharekey", (err, authData) => {
        if (err) return res.status(201).json({error: "Something bad happened, Please try again", err})
        if (authData) {
            donorUser.find((err, users) => {
                if (err) return res.status(201).json({error: "Something bad happened, Please try again", err});
                if (users){
                    return res.status(201).json({ donorUsers: users })
                }
            })
        }
    })
})


router.get("/overview-beneficiary", verifyToken, (req, res) => {
    jwt.verify(req.token, "secretonesharekey", (err, authData) => {
        if (err) return res.status(201).json({error: "Something bad happened, Please try again", err})
        if (authData) {
            beneficiaryUser.find((err, users) => {
                if (err) return res.status(201).json({error: "Something bad happened, Please try again", err});
                if (users){
                    return res.status(201).json({ beneficiaryUsers: users })
                }
            })
        }
    })
})


router.get("/overview-all", verifyToken, (req, res) => {
    jwt.verify(req.token, "secretonesharekey", (err, authData) => {
        if (err) return res.status(201).json({error: "Something bad happened, Please try again", err})
        if (authData) {
            donorUser.find((err, donorUsers) => {
                if (err) return res.status(201).json({error: "Something bad happened, Please try again", err});
                if (donorUsers){
                    beneficiaryUser.find((err, beneficiaryUsers) => {
                        if (err) return res.status(201).json({error: "Something bad happened, Please try again", err});
                        if (beneficiaryUsers){
                            const users = [...donorUsers, ...beneficiaryUsers];
                            return res.status(201).json({ users })
                        }
                    })
                }
            })
        }
    })
})


router.post("/approve-request", verifyToken, (req, res) => {
    const { requestId } = req.body;
    jwt.verify(req.token, "secretonesharekey", (err, authData) => {
        if (err) return res.status(201).json({error: "Something bad happened, Please try again", err})
        if (authData) {
            beneficiaryUser.find({ requests }, (err, data) => {
                if (err) return res.status(201).json({error: "Something bad happened, Please try again", err})
                if (data) {
                    data.forEach(request => {
                        if (request.id === requestId){
                            request.approved = true;

                            data.save()
                            .then(newData => {
                                res.status(201).json({
                                    success: "Request added successfully",
                                    data: newData
                                })
                            })
                            .catch(err => {
                            return res.status(201).json({error: "Something bad happened, Please try again", err})
                            })
                        }
                    })
                }
            })
        }
    })
})



router.post("/approve-donation", verifyToken, (req, res) => {
    const { donationId } = req.body;
    jwt.verify(req.token, "secretonesharekey", (err, authData) => {
        if (err) return res.status(201).json({error: "Something bad happened, Please try again", err})
        if (authData) {
            donorUser.find({ donations }, (err, data) => {
                if (err) return res.status(201).json({error: "Something bad happened, Please try again", err})
                if (data) {
                    data.forEach(donation => {
                        if (donation.id === donationId){
                            donation.approved = true;

                            data.save()
                            .then(newData => {
                                res.status(201).json({
                                    success: "Request added successfully",
                                    data: newData
                                })
                            })
                            .catch(err => {
                            return res.status(201).json({error: "Something bad happened, Please try again", err})
                            })
                        }
                    })
                }
            })
        }
    })
})


function verifyToken(req, res, next){
    const bearerHeader = req.headers['authorization'];
    if (typeof bearerHeader !== "undefined"){
      const bearer = bearerHeader.split(" ");
      const bearerToken = bearer[1];
      req.token = bearerToken;
      next();
    }
    else{
      res.status(403).json({error: "You do not have access, please login"})
    }
}

module.exports = router;