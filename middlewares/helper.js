const jwt = require('jsonwebtoken')
const sequelize = require('../models')
const config = require('../config/otherConfig.json')
const nodemailer = require('nodemailer')

//function to create JWT access token with given data
function createToken(tokendata) {
  var token = jwt.sign(tokendata, config.JWT.secret, {
    algorithm: 'HS256'
  })

  return token
}


 function findDivision(age,gender){
  if(age == 1){
         var division = 5
   }
     else if(age = 2){
       if(gender == 1){
         var division = 1
       }
       else{
        var division = 2
       }
    }
    else if(age = 3){
       if(gender == 1){
         var division = 4
       }
       else{
        var division = 3
       }
     }

    return division
} 


async function findleveldetails(req, res) {
  const leaderdata = await sequelize.query(`select usuarios_nivelresponsable.nombre,nivel_responsable_id,area_id,cabildo_id,grupo_id,distrito_sgip_id from usuarios_usuario inner join usuarios_nivelresponsable on usuarios_nivelresponsable.id=usuarios_usuario.nivel_responsable_id where usuarios_usuario.id = 2`, { type: sequelize.QueryTypes.SELECT })
  // console.log(leaderdata)
  const level = leaderdata[0].nombre
  var Area = `area_id = ` + leaderdata[0].area_id
  var Cabildo = Area + ` and cabildo_id= ` + leaderdata[0].cabildo_id
  var Distrito = Cabildo + ` and distrito_sgip_id= ` + leaderdata[0].distrito_sgip_id
  var Grupo = Distrito + ` and grupo_id= ` + leaderdata[0].grupo_id
  switch (level) {
    case "Nacional":
      var searchdata = `area_id = ` + req.body.area_id;
      break
    case "Área":
      var searchdata = Area
      break;
    case "Cabildo":
      var searchdata = Cabildo
      break;
    case "Distrito":
      var searchdata = Distrito
      break;
    case "Responsable de Grupo":
      var searchdata = Grupo
      break;
  }
  return searchdata
}

async function findRoleDetails(req, res) {
  console.log(req.body)
  if(req.id){
    console.log("one")
    var leaderdata = await sequelize.query(`select usuarios_nivelresponsable.nombre,nacionalidad_id,nivel_responsable_id,area_id,cabildo_id,grupo_id,distrito_sgip_id from usuarios_usuario inner join usuarios_nivelresponsable on usuarios_nivelresponsable.id=usuarios_usuario.nivel_responsable_id where usuarios_usuario.id = ${req.id}`, { type: sequelize.QueryTypes.SELECT })
  }
  else if(req.body.email){
    console.log("two")
    var leaderdata = await sequelize.query(`select usuarios_nivelresponsable.nombre,nacionalidad_id,nivel_responsable_id,area_id,cabildo_id,grupo_id,distrito_sgip_id from usuarios_usuario inner join usuarios_nivelresponsable on usuarios_nivelresponsable.id=usuarios_usuario.nivel_responsable_id where usuarios_usuario.email = "${req.body.email}" `, { type: sequelize.QueryTypes.SELECT })
  }
  else if(req.token){
    console.log("three")
    console.log(req.token.id)
    var leaderdata = await sequelize.query(`select usuarios_nivelresponsable.nombre,nacionalidad_id,nivel_responsable_id,area_id,cabildo_id,grupo_id,distrito_sgip_id from usuarios_usuario inner join usuarios_nivelresponsable on usuarios_nivelresponsable.id=usuarios_usuario.nivel_responsable_id where usuarios_usuario.id = ${req.token.id}`, { type: sequelize.QueryTypes.SELECT })
  }
  console.log(leaderdata)
  var data = {
    "level" : "",
    "area_id" : "",
    "cabildo_id" : "",
    "distrito_id" : "",
    "group_id" : ""
  }
  if(leaderdata.length){
    var level = leaderdata[0].nombre
    data.level = level
  }
  switch (level) {
    case "Área":
      data.area_id = leaderdata[0].area_id
      break;
    case "Cabildo":
      data.area_id = leaderdata[0].area_id
      data.cabildo_id = leaderdata[0].cabildo_id
      break;
    case "Distrito":
      data.area_id = leaderdata[0].area_id
      data.cabildo_id = leaderdata[0].cabildo_id
      data.distrito_id = leaderdata[0].distrito_sgip_id
      break;
    case "Responsable de Grupo":
      data.area_id = leaderdata[0].area_id
      data.cabildo_id = leaderdata[0].cabildo_id
      data.distrito_id = leaderdata[0].distrito_sgip_id
      data.group_id = leaderdata[0].group_id
      break;
  }
  return data
}

async function findlevelId(req, res) {
  const leaderdata = await sequelize.query(`select usuarios_nivelresponsable.nombre,nivel_responsable_id,area_id,cabildo_id,grupo_id,distrito_sgip_id from usuarios_usuario inner join usuarios_nivelresponsable on usuarios_nivelresponsable.id=usuarios_usuario.nivel_responsable_id where email = 'muskan.shu@cisinlabs.com'`, { type: sequelize.QueryTypes.SELECT })
  console.log(leaderdata)
  const level = leaderdata[0].nombre
  var searchdata = {
    area_id : leaderdata[0].area_id,
    cabildo_id : leaderdata[0].cabildo_id,
    distrito_id : leaderdata[0].distrito_sgip_id  
  }
  return searchdata
}




async function sendLoginInfo(req,res){
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: config.SMTP.user,
      pass: config.SMTP.password
    },
    tls: { rejectUnauthorized: false }
  });
  var title = " "
  if(req.body.sexo_id==2){
    title =  "Estimada"
  }
  else if(req.body.sexo_id==3){
    title = "Estimado"
  }
console.log(req.body.primer_nombre, req.body.primer_apellido,req.body.sexo_id,"sending email")
  var mailOptions = {
    from: 'SGI-Panama  <mailto:sgipanama1@gmail.com>',
    to:  `mailto:muskan.shu@cisinlabs.com ,mailto:maires.carlos@gmail.com,motwani.j , mailto:basededatosgip@gmail.com , ${req.email }`,//`${req.token.email} , ${req.email}`,
    // to:  `mailto:muskan.shu@cisinlabs.com,yogendra.r`,
    subject: `Leader signup credentials ${req.heading}`,
    html: `<html> <h3>${req.heading}</h3> <br>
    ${title} ${req.body.primer_nombre} ${req.body.primer_apellido} <br>
    <br>
    Su usuario ha sido registrado en el sistema de base de datos de la SGIP.<br>
    <br>
    Para acceder:<br>
    <br>
    Enlace: http://146.190.171.78/ <br>
    <br>
    Nombre de usuario: ${req.email} <br>
    <br>
    Contraseña: ${req.password}
    
   </html>`
  };
  transporter.sendMail(mailOptions, (erro, info) => {
    if (erro) {
      console.log(erro)
      return false
    }
    return true
})}







module.exports = {
  createToken,
  findleveldetails,
  sendLoginInfo,
  findDivision,
  findRoleDetails,
  findlevelId
}