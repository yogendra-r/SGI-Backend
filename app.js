const createError = require('http-errors');
const express = require('express');
const path = require('path');

require('dotenv').config();
const logger = require('morgan');

const adminRouter = require('./routes/admin');
const leaderRouter = require('./routes/leaders');
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

// catch 404 and forward to error handler
// app.use(function(req, res, next) {
//   next(createError(404));
// });

// // error handler
// app.use(function(err, req, res, next) {
//   // set locals, only providing error in development
//   res.locals.message = err.message;
//   res.locals.error = req.app.get('env') === 'development' ? err : {};

//   // render the error page
//   res.status(err.status || 500);
//   // res.render('error');
//   res.send("404");
// });

app.listen(3000 , ()=>console.log("server running at 3000"));
module.exports = app;


//inside a angularr app 





           