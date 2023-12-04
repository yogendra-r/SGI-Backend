const jwt = require('jsonwebtoken')
const config = require('../config/otherConfig.json')
const multer = require('multer')



//Function for verifying JWT access token
function verifyToken(req, res, next) {
  const token = req.headers.authorization.split(' ')[1];
  console.log(req.headers.authorization)
    var payload
    try {
      if(!token){
        return res.status(403).send({
          msg: 'token is required',
          status : false
        });
      }
      payload = jwt.verify(token, config.JWT.secret )
      console.log(payload,"token")
    } catch (e) {
      if (e instanceof jwt.JsonWebTokenError) {
  
        return res.status(403).send({
          msg: 'Your token is not valid!',
          status : false
        });
      }
      return res.status(400).end()
    }
    req.token = payload
    next()
  }

  
// multer function to upload patient documents
var storage = multer.diskStorage({
  destination: (req, file, callBack) => {
    callBack(null, './reports')
  },
  filename: (req, file, callBack) => {
    req.doc = file.originalname
    callBack(null, req.doc)}
})
var uploadDoc = multer({
  storage: storage
});
  

// multer function to upload patient documents
var storage1 = multer.diskStorage({
  destination: (req, file, callBack) => {
    callBack(null, './receipt')
  },
  filename: (req, file, callBack) => {
    req.doc = file.originalname
    callBack(null, req.doc)}
})
var uploadrec = multer({
  storage: storage1
});
  
module.exports = {
    verifyToken,
    uploadDoc,
    uploadrec
}