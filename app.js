const createError = require('http-errors');
const express = require('express');
const path = require('path');

require('dotenv').config();
const logger = require('morgan');

const adminRouter = require('./routes/admin');
const leaderRouter = require('./routes/leaders');
const donationRouter = require('./routes/donation')

const app = express();
const cors = require('cors')

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/images', express.static(process.cwd() + '/images'))


.use(cors({
    origin: '*',
}))
.use(cors({
    methods: ['GET', 'POST', 'DELETE', 'UPDATE', 'PUT', 'PATCH']
}))

app.all('/' ,(req,res)=>{
  res.send("root url");
})

//leaders
app.use('/api/dev/leaders',leaderRouter)

//admin
app.use('/api/dev/admin', adminRouter);

app.use('/api/dev/donation',donationRouter)

app.listen(8081 , ()=>console.log(`server running at 8080`));
module.exports = app;


//inside a angularr app 





           