const router = require("express").Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const uuid = require("uuidv4").uuid;

const adminUser = require("../models/Admin");
const beneficiaryUser = require("../models/Beneficiary");
const donorUser = require("../models/Donor");

router.get("/overview-all", verifyToken, (req, res) => {
    jwt.verify(req.token, "secretonesharekey", (err, authData) => {
        if (err) return res.status(201).json({error: "Something bad happened, Please try again", err})
        if (authData) {
            return findUsers();
        }
    })
})

function findUsers(){
    donorUser.find((err, donorUsers) => {
        if (err) return res.status(201).json({error: "Something bad happened, Please try again", err});
        if (donorUsers){
            beneficiaryUser.find((err, beneficiaryUsers) => {
                if (err) return res.status(201).json({error: "Something bad happened, Please try again", err});
                if (beneficiaryUsers){
                    const users = [...donorUsers, ...beneficiaryUsers];
                    return res.status(201).json({
                        success: "Request processed successfully",
                        users
                    })
                }
            })
        }
    })
}


router.post("/approve-request", verifyToken, (req, res) => {
    const { requestId } = req.body;
    jwt.verify(req.token, "secretonesharekey", (err, authData) => {
        if (err) return res.status(201).json({error: "Something bad happened, Please try again", err})
        if (authData) {
            beneficiaryUser.find((err, data) => {
                if (err) return res.status(201).json({error: "Something bad happened, Please try again", err})
                if (data) {
                    data.forEach(user => {
                        user.requestss.forEach(req => {
                            if (req.id === requestId){
                                req.approved = true;

                                user.markModified("requests");
                                user.save()
                                .then(newData => {
                                    return findUsers();
                                })
                                .catch(err => {
                                return res.status(201).json({error: "Something bad happened, Please try again", err})
                                })
                            }
                        })
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
            donorUser.find( (err, data) => {
                if (err) return res.status(201).json({error: "Something bad happened, Please try again", err})
                if (data) {
                    data.forEach(user => {
                        user.donations.forEach(donation => {
                            if (donation.id === donationId){
                                donation.approved = true;

                                user.markModified("donations");
                                user.save()
                                .then(newData => {
                                    return findUsers()
                                })
                                .catch(err => {
                                return res.status(201).json({error: "Something bad happened, Please try again", err})
                                })
                            }
                        })
                    })
                }
            })
        }
    })
})

router.post("/delete-donor", verifyToken, (req, res) => {
    const { id } = req.body;
    jwt.verify(req.token, "secretonesharekey", (err, authData) => {
        if (err) return res.status(201).json({error: "Something bad happened, Please try again", err});
        if (authData) {
            donorUser.deleteOne({ id }, (err) => {
                if (err) return res.status(201).json({error: "Something bad happened, Please try again", err});

                return findUsers();
            })
        }
    })
})


router.post("/delete-beneficiary", verifyToken, (req, res) => {
    const { id } = req.body;
    jwt.verify(req.token, "secretonesharekey", (err, authData) => {
        if (err) return res.status(201).json({error: "Something bad happened, Please try again", err});
        if (authData) {
            beneficiaryUser.deleteOne({ id }, (err) => {
                if (err) return res.status(201).json({error: "Something bad happened, Please try again", err});
                return findUsers();
            })
        }
    })
})

router.post("/change-password", verifyToken, (req, res) => {
    const { oldPassword, newPassword } = req.body;
    jwt.verify(req.token, "secretonesharekey", (err, authData) => {
        if (err){
            res.status(403).json({error: "Unathorized, Please login again", err})
        }
        else {
            adminUser.findOne({ email: authData.user.email }, (err, user) => {
                if (err) return res.status(201).json({error: "Something bad happened, Please try again", err});
                if (user){
                    bcrypt.compare(oldPassword, user.password, (err, result) => {
                        if (err) return res.status(201).json({error: "Something bad happened, Please try again", err});
                        if (!result) {
                            return res.status(201).json({error: "Incorrect Old Password"})
                        }
                        else if (result) {
                            bcrypt.hash(newPassword, 10, (err, hash) => {
                                if (err) return res.status(201).json({error: "Something bad happened, Please try again", err});
                                user.password = hash;
                                user.save()
                                .then(newUser => {
                                    return res.status(201).json({success: "Password change successful", newUser});
                                })
                                .catch(err => {
                                    return res.status(201).json({error: "Something bad happened, Please try again", err})
                                })
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