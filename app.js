const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const session = require("express-session");
const mongooseConfig = require("./config/mongoose_config");
const fileupload = require('express-fileupload');
const path = require('path');
const fs = require('fs');


dotenv.config();


const app = express();
const cors = require('cors');

app.use(cors());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(fileupload());
app.use(cookieParser());
app.use(session({ secret: "cats",
                  resave: true,
                saveUninitialized:true
         }));

const authRoute = require("./routes/auth");
const donorRoute = require("./routes/donor");
const beneficiaryRoute = require("./routes/beneficiary");
const adminRoute = require("./routes/admin");
app.use("/api/user", authRoute);
app.use("/api/donor", donorRoute);
app.use("/api/beneficiary", beneficiaryRoute);
app.use("/api/admin", adminRoute);



const dir = path.join(__dirname, './public/uploads');

const mime = {
    gif: 'image/gif',
    jpg: 'image/jpeg',
    png: 'image/png',
    svg: 'image/svg+xml',
};

app.get('*', function (req, res) {
    const file = path.join(dir, req.path.replace(/\/$/, '/index.html'));
    if (file.indexOf(dir + path.sep) !== 0) {
        return res.status(403).end('Forbidden');
    }
    const type = mime[path.extname(file).slice(1)] || 'text/plain';
    const s = fs.createReadStream(file);
    s.on('open', function () {
        res.set('Content-Type', type);
        s.pipe(res);
    });
    s.on('error', function () {
        res.set('Content-Type', 'text/plain');
        res.status(404).end('Not found');
    });
});


app.use(express.json());

mongoose.connect(process.env.MONGO_URI,
 mongooseConfig, () => console.log("mongoDB connected..."))

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`server running on port ${port}...`));