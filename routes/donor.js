const router = require("express").Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const uuid = require("uuidv4").uuid;
const path = require("path");
const fs = require("fs");

const donorUser = require("../models/Donor");
const beneficiaryUser = require("../models/Beneficiary");

router.post("/create-donation", verifyToken, (req, res) => {
    jwt.verify(req.token, "secretonesharekey", (err, authData) => {
        if (err){
            res.status(403).json({error: "Unathorized, Please login again", err})
        }
        else {
                if (!req.files){
                    return res.status(201).json({ error: "No file uploaded" });
                }

            const image = req.files.myfile;
            const id = uuid();
            const filePath = path.join( __dirname, '../public/uploads/' + id);

            image.mv(filePath, (error) => {
              if (error) {
               return res.json({ error: 'error', message: error })
              }

                const { donationType, donationDetails } = req.body;
                const { userState, userLGA, accountSubtype, name } = authData.user
                const donationItem = {
                id,
                filePath,
                donationType,
                donationDetails,
                name,
                accountSubtype,
                userState,
                userLGA,
                dateCreated: Date.now(),
                approved: false,
                completed: false,
                beneficiary: null,
                dateCompleted: null
                }

                donorUser.findOne({ email: authData.user.email }, (err, user) => {
                if (err) return res.status(201).json({error: "Something bad happened, Please try again", err});
                user.donations.push(donationItem);
                user.save()
                .then(newUser => {
                    res.status(201).json({
                        success: "Donation added successfully",
                        user: newUser,
                        donationItem
                    })
                })
                .catch(err => {
                return res.status(201).json({error: "Something bad happened, Please try again", err})
                })
                })
            })
        }
    })
});



router.post("/delete-donation", verifyToken, (req, res) => {
    const { donationId } = req.body;
    jwt.verify(req.token, "secretonesharekey", (err, authData) => {
        if (err){
            res.status(403).json({error: "Unathorized, Please login again", err})
        }
        else {
            const filePath = path.join( __dirname, '../public/uploads/' + id);
            fs.unlink(filePath, (err) => {
                if (err) return res.status(201).json({error: "Something bad happened, Please try again", err});
                donorUser.findOne({ email: authData.user.email }, (err, user) => {
                if (err) return res.status(201).json({error: "Something bad happened, Please try again", err})
                if (user){
                    user.donations.forEach(donation => {
                        if (donation.id === donationId){
                            let index = user.donations.indexOf(donation);
                            user.donations.splice(index, 1);
                            user.save()
                            .then(newUser => {
                                res.status(201).json({
                                    success: "Donation deleted successfully",
                                    user: newUser
                                })
                            })
                            .catch(err => {
                            return res.status(201).json({error: "Something bad happened, Please try again", err})
                            })
                        }
                    });
                }
                })
            })
        }
    })
})

router.get("/choose-beneficiary", verifyToken, (req, res) => {
    jwt.verify(req.token, "secretonesharekey", (err, authData) => {
        if (err){
            res.status(403).json({error: "Unathorized, Please login again", err})
        }
        else {
            beneficiaryUser.find((err, users) => {
            if (err) return res.status(201).json({error: "Something bad happened, Please try again", err})
            const requests = [];
            users.forEach(user => {
                requests.push(user.requests);
            })
            return res.status(201).json({requests});
            })
        }
    })
})

router.post("/save-chosen-beneficiary", verifyToken, (req, res) => {
    const { donationId, beneficiary, email } = req.body;
    jwt.verify(req.token, "secretonesharekey", (err, authData) => {
        if (err){
            res.status(403).json({error: "Unathorized, Please login again", err})
        }
        else {
            donorUser.findOne({email}, (err, user) => {
                if (err) return res.status(201).json({error: "Something bad happened, Please try again", err})
               if (user){
                    user.donations.forEach(donation => {
                        if (donation.id === donationId){
                           donation.beneficiary = beneficiary;
                        }
                    })
                    user.save()
                    .then(newUser => {
                        res.status(201).json({
                            success: "Beneficiary added successfully",
                            user: newUser
                        })
                    })
                    .catch(err => {
                    return res.status(201).json({error: "Something bad happened, Please try again", err})
                    })
               }
            })
        }
    })
})

router.post("/complete-donation", verifyToken, (req, res) => {
    const { donationId, donationEmail, requestId, requestEmail } = req.body;
    jwt.verify(req.token, "secretonesharekey", (err, authData) => {
        if (err){
            res.status(403).json({error: "Unathorized, Please login again", err})
        }
        else {
            if (!donationId || !donationEmail || !requestId || !requestEmail){
                return res.json({error: "fields cannot be empty"});
            }
            donorUser.findOne({ email: donationEmail }, (err, user) => {
                if (err) return res.status(201).json({error: "Something bad happened, Please try again", err})
               if (user){
                   user.donations.forEach(donation => {
                       if (donation.id === donationId){
                           donation.completed = true;
                           donation.dateCompleted = Date.now();
                       }
                   })
                   user.save((err, newDonor) => {
                        if (err) return res.status(201).json({error: "Something bad happened, Please try again", err})
                        if (newDonor){
                            beneficiaryUser.findOne({ email: requestEmail }, (err, user) => {
                                if (err) return res.status(201).json({error: "Something bad happened, Please try again", err})
                                if (user){
                                    user.requests.forEach(request => {
                                        if (request.id === requestId){
                                            request.completed = true;
                                            request.dateCompleted = Date.now()
                                        }
                                    })
                                    user.save((err, newBeneficiaryUser) => {
                                        if (err) return res.status(201).json({error: "Something bad happened, Please try again", err})
                                        return res.status(201).json({success: "Donation completed successfully", user: donorUser})
                                    })
                                }
                            })
                        }
                   })
               }
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
            donorUser.findOne({ email: authData.user.email }, (err, user) => {
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