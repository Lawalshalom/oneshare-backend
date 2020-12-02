const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const donorUser = require("../models/Donor");
const beneficiaryUser = require("../models/Beneficiary");
const adminUser = require("../models/Admin");

router.post("/register-user", (req, res) => {
    const { name, password, email, accountType, accountSubtype, userState, userLGA } = req.body;

    donorUser.findOne({ email }, (err, user) => {
        if (err) return res.status(201).json({error: "Something bad happened, Please try again", err});
        if (user) {
            return res.status(201).send({ error: "Email already registered as donor account!"})
        }
        else {
            beneficiaryUser.findOne({ email }, (err, user) => {
                if (err) return res.status(201).json({error: "Something bad happened, Please try again", err});
                if (user) {
                    return res.status(201).send({ error: "Email already registered as beneficiary account!"})
                }
                else {
                if (accountType === "donor"){
                    const user = new donorUser({
                        name,
                        password,
                        email,
                        accountType,
                        accountSubtype,
                        userState,
                        userLGA
                    });
                    bcrypt.hash(user.password, 10, (err, hash) => {
                        if (err) return res.status(201).json({error: "Something bad happened, Please try again", err});
                        user.password = hash;
                        user.save()
                        .then(savedUser => {
                           res.status(201).json({success: "Registration successful", user: savedUser});
                        })
                        .catch(err => {
                            return res.status(201).json({error: "Something bad happened, Please try again", err})
                        });
                    });
                }
                else if (accountType === "beneficiary") {
                const user = new beneficiaryUser({
                    name,
                    password,
                    email,
                    accountType,
                    accountSubtype,
                    userState,
                    userLGA
                });
                bcrypt.hash(user.password, 10, (err, hash) => {
                    if (err) return res.status(201).json({error: "Something bad happened, Please try again", err});
                    user.password = hash;

                    user.save()
                    .then(savedUser => {
                        res.status(201).json({success: "Registration successful", user: savedUser});
                    })
                    .catch(err => {
                        return res.status(201).json({error: "Something bad happened, Please try again", err})
                    });
                    });
                }
            }
        })
    }
});
});

router.post("/register-admin", (req, res) => {
    const { name, email, password, secretKey } = req.body;

    if (!name ||!email || !password || !secretKey){
        return res.status(201).json({error: "Please fill in all fields"});
    }
    else{
        adminUser.findOne({email}, (err, admin) => {
            if (err) return res.status(201).json({error: "Something bad happened, Please try again", err});

            if (admin){
                return res.status(201).json({error: "email already registered as admin"})
            }
            else{
                const user = new adminUser({
                    name,
                    email,
                    password,
                    secretKey
                })
                    bcrypt.hash(user.password, 10, (err, hash) => {
                        if (err) return res.status(201).json({error: "Something bad happened, Please try again", err});
                        user.password = hash;
                        user.save()
                        .then(savedUser => {
                            res.status(201).json({success: "registration successful", user: savedUser});
                        })
                        .catch(err => {
                            return res.status(201).json({error: "Something bad happened, Please try again", err})
                        });
                });
            };
        });
    };
})

router.post('/user-login', (req, res) => {
    const { email, password } = req.body;
    donorUser.findOne({ email }, (err, user) => {
        if (err) return res.status(201).json({error: "Something bad happened, Please try again", err});
        if (user){
            bcrypt.compare(password, user.password, (err, isMatch) => {
                if (err) return res.status(201).json({error: "Something bad happened, Please try again", err});

                if (isMatch){
                    jwt.sign({user}, "secretonesharekey", {expiresIn: "48hr"}, (err, token) => {
                        if (err) return res.status(201).json({error: "Something bad happened, Please try again", err});
                        return res.status(201).json({ success: "login successful", user, token })
                    })
                }
                else return res.status(201).json({error: "Password Incorrect"});
            })
        }
        else{
            beneficiaryUser.findOne({ email }, (err, user) => {
                if (err) return res.status(201).json({error: "Something bad happened, Please try again", err});
                if (user){
                    bcrypt.compare(password, user.password, (err, isMatch) => {
                        if (err) return res.status(201).json({error: "Something bad happened, Please try again", err});

                        if (isMatch){
                            jwt.sign({user}, "secretonesharekey", {expiresIn: "48h"} ,(err, token) => {
                                if (err) return res.status(201).json({error: "Something bad happened, Please try again", err});
                                return res.status(201).json({ success: "login successful", user, token })
                            })
                         }
                        else return res.status(201).json({error: "Password Incorrect"});
                    })
                }
                else return res.status(201).json({error: "Email is not registered"});
            });
        }
    })
});


router.post("/admin-login", (req, res) => {
    const { email, password } = req.body;
    adminUser.findOne({ email }, (err, user) => {
        if (err) return res.status(201).json({error: "Something bad happened, Please try again", err});
        if (user){
            bcrypt.compare(password, user.password, (err, isMatch) => {
                if (err) return res.status(201).json({error: "Something bad happened, Please try again", err});

                if (isMatch){
                    jwt.sign({user}, "secretonesharekey", {expiresIn: "48h"} ,(err, token) => {
                        if (err) return res.status(201).json({error: "Something bad happened, Please try again", err});
                        return res.status(201).json({ success: "login successful", user, token })
                    })
                 }
                else return res.status(201).json({error: "Password Incorrect"});
            })
        }
        else return res.status(201).json({error: "email is not registered as admin"});
    });
})

module.exports = router;