const router = require("express").Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const uuid = require("uuidv4").uuid;

const donorUser = require("../models/Donor");


router.post("/user", verifyToken, (req, res) => {
    jwt.verify(req.token, "secretonesharekey", (err, authData) => {
        if (err) return res.status(201).json({error: "Something bad happened, Please try again", err})
            if (authData) {
                res.status(201).json({ authData });
            }
        })
    });

router.post("/create-donation", verifyToken, (req, res) => {
    jwt.verify(req.token, "secretonesharekey", (err, authData) => {
        if (err){
            res.status(403).json({error: "Unathorized, Please login again", err})
        }
        else {
            const { picture, donationType, donationDetails } = req.body;
            const donationItem = {
                picture,
                donationType,
                donationDetails,
                donationState: authData.user.userState,
                donationLGA: authData.user.userLGA,
                dateCreated: Date.now(),
                approved: false,
                completed: false,
                id: uuid()
            }

            donorUser.findOne({ email: authData.user.email }, (err, user) => {
                if (err) return res.status(201).json({error: "Something bad happened, Please try again", err});
                user.donations.push(donationItem);
                user.save()
                .then(newUser => {
                    res.status(201).json({
                        success: "Donation added successfully",
                        user: newUser
                    })
                })
                .catch(err => {
                return res.status(201).json({error: "Something bad happened, Please try again", err})
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