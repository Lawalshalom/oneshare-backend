const router = require("express").Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const uuid = require("uuidv4").uuid;

const beneficiaryUser = require("../models/Beneficiary");


router.post("/user", verifyToken, (req, res) => {
    jwt.verify(req.token, "secretonesharekey", (err, authData) => {
        if (err) return res.status(201).json({error: "Something bad happened, Please try again", err})
        if (authData) {
            beneficiaryUser.findOne({ email: authData.user.email }, (err, user) => {
                if (err) return res.status(201).json({error: "Something bad happened, Please try again", err})
                if (user) return res.status(201).json({ user });
            })
        }
    })
});


router.post("/create-request", verifyToken, (req, res) => {
    jwt.verify(req.token, "secretonesharekey", (err, authData) => {
        if (err){
            res.status(403).json({error: "Unathorized, Please login again", err})
        }
        else {
            const { requestType, requestDetails, phoneNumber } = req.body;
            const { userState, userLGA, accountSubtype, name, email } = authData.user
            const requestItem = {
                requestType,
                requestDetails,
                name,
                phoneNumber,
                email,
                accountSubtype,
                userState,
                userLGA,
                dateCreated: Date.now(),
                approved: false,
                completed: false,
                id: uuid()
            }

            beneficiaryUser.findOne({ email: authData.user.email }, (err, user) => {
                if (err) return res.status(201).json({error: "Something bad happened, Please try again", err});
                user.requests.push(requestItem);
                user.save()
                .then(newUser => {
                    res.status(201).json({
                        success: "Request added successfully",
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


router.post("/delete-request", verifyToken, (req, res) => {
    const { requestId } = req.body;
    jwt.verify(req.token, "secretonesharekey", (err, authData) => {
        if (err){
            res.status(403).json({error: "Unathorized, Please login again", err})
        }
        else {
            beneficiaryUser.findOne({ email: authData.user.email }, (err, user) => {
                if (err) return res.status(201).json({error: "Something bad happened, Please try again", err})
                if (user){
                    user.requests.forEach(request => {
                        if (request.id === requestId){
                            let index = user.requests.indexOf(request);
                            user.requests.splice(index, 1);
                            user.save()
                            .then(newUser => {
                                res.status(201).json({
                                    success: "Request deleted successfully",
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
            beneficiaryUser.findOne({ email: authData.user.email }, (err, user) => {
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