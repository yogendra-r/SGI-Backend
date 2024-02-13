const con = require('../config/config');
const leader = require('../models/auth_leader')
const invitee = require('../models/invitees')
const sequelize = require('../models')
const helper = require('../middlewares/helper')
var random = require('random-string-alphanumeric-generator');
const { Op, NUMBER, QueryTypes } = require("sequelize");
const md5 = require('md5');
// const { consoleOrigin } = require('firebase-tools/lib/api');
const Shopify = require('shopify-api-node');
const mysql = require('mysql');
const admin = require('./admin')
const request =require('request')
// Shopify API credentials
const shopifyDomain = 'tienda-soka-sgi-de-panama.myshopify.com';
const apiKey = 'e0c3ba70be7017af800ac708fad95708';
const apiSecret = '471919888f30d0cb1e64992927074c24';
const accessToken = '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';



const shopify = new Shopify({
  shopName: shopifyDomain,
  apiKey: apiKey,
  password: accessToken,
});


async function fetchAndInsertReportData(req,res) {
  try {
   
    const reportData = await shopify.report.list();
    console.log(reportData)
    // const insertQuery = 'INSERT INTO shopify_reports (report_id, title, data) VALUES ?';
    // const values = reportData.map((report) => [report.id, report.title, JSON.stringify(report)]);
    
    // connection.query(insertQuery, [values], (err, result) => {
    //   if (err) throw err;
    //   console.log(`${result.affectedRows} rows inserted.`);
    //   connection.end(); // Close the MySQL connection
    // });
    
  } catch (err) {
    console.error('Error fetching or inserting report data:', err);
    connection.end(); // Close the MySQL connection on error
  }
}


// Call the function to fetch and insert report data
// fetchAndInsertReportData();


//Login API for leaders
async function leaderLogin(req, res) {

    try {
        const { email, password } = req.body
        const result = await leader.findOne({ where: { email: email ,is_blocked : false||0} })
        if (result) {
            if (result.password == md5(password)) {
                var data = await sequelize.query(`select id,area_id,primer_nombre as firstName,primer_apellido as lastName,email from usuarios_usuario where email = "${email}"`,{type : sequelize.QueryTypes.SELECT})
               console.log(data)
                const tokendata = {
                    email: data[0].email,
                    id: data[0].id,
                    first_name: data[0].firstName
                }
                const token = helper.createToken(tokendata)
            
                var date = new Date()
                leader.update({ last_login: date }, { where: { email: email } })

                req.id = data[0].id
                // const data = await sequelize.query(`select id,primer_nombre as firstName,primer_apellido as lastName,email from usuarios_usuario where email = "${email}"`,{type : sequelize.QueryTypes.SELECT})
                var ans = await helper.findRoleDetails(req, res)
                var ar = await sequelize.query(`select nombre from usuarios_area where id = ${data[0].area_id}`,{type : sequelize.QueryTypes.SELECT})
                console.log(ans)
                var heading = " "
                if(ans.level=="Nacional"){
                    var is_admin = 1
                    heading = "ADMIN"
                }else{
                    var is_admin = 0
                }
                console.log(is_admin,"admin")
                // var is_admin = 1
                
                if(ans.level=="Área"){
                    heading = ar[0].nombre
                }
                if(ans.level=="Cabildo"){
                    heading = ar[0].nombre +" " + cb[0].nombre
                }
                if(ans.level=="Distrito"){
                    heading = ar[0].nombre +" " + cb[0].nombre + " " + ds[0].nombre
                }
                ans.level_name = heading

                // console.log(result,"printing")
                return res.status(200).send({
                    message: "login successful",
                    is_admin : is_admin,
                    data: data,
                    level: ans,
                    token: token
                })
            }
            else {
                return res.status(400).send({
                    message: "incorrect password"
                })
            }
        }
        else {
            return res.status(400).send({
                message: "Email does not exists"
            })
        }
    } catch (e) {
        console.log(e)
        return res.status(500).json({ message: 'Server Error' });
    }
}


//Change password for leaders
async function changepassword(req, res) {
    console.log(req.body,"change passwod")
    const token = req.token
    const leader = await sequelize.query(`select email from usuarios_usuario where id = ${req.body.user_id}`,{type : sequelize.QueryTypes.SELECT})
    const result = await sequelize.query(`select * from auth_leader where email = "${leader[0].email}"`,{type : sequelize.QueryTypes.SELECT})
    if (result[0].password == md5(req.body.old_password)) {
        // leader.update(
        //     { password: md5(req.body.new_password) },
        //     { where: { id: token.id } }
        // )
        const result = await sequelize.query(`update auth_leader set password = "${md5(req.body.new_password)}" where email = "${leader[0].email}"`)
        return res.status(200).send({
            message: "Password updated successfuly",
            status: true
        })
    }
    else {
        console.log("change passwod")
        return res.status(400).send({
            message: "Old password is incorrect",
            status: false
        })
    }
}


//Api to get the list of members who have given away their membership
async function givenAwayMembershipMembers(req, res) {
    try {
        let q = `select * from usuarios_usuario where estado_id = 4`;
        const result = await sequelize.query(q, { type: sequelize.QueryTypes.SELECT })
        return res.status(200).send({
            message: "Data fetched successfuly",
            data: result
        });
    } catch (e) {
        console.log(e);
        return res.status(500).json({ message: 'Server Error' });
    }
}



//Api to get the list of members who are passed away  
async function passedAwayMembers(req, res) {
    try {
        let q = `select * from usuarios_usuario where estado_id = 2`;
        const result = await sequelize.query(q, { type: sequelize.QueryTypes.SELECT })
        return res.status(200).send({
            message: "Data fetched successfuly",
            data: result
        });
    } catch (e) {
        console.log(e);
        return res.status(500).json({ message: 'Server Error' });
    }
}



//Api to get the list of members who are passed away 
async function membersMovedToAnotherCountry(req, res) {
    try {
        let q = `select * from usuarios_usuario where estado_id = 5`;
        const result = await sequelize.query(q, { type: sequelize.QueryTypes.SELECT })
        return res.status(200).send({
            message: "Data fetched successfuly",
            data: result
        });
    } catch (e) {
        console.log(e);
        return res.status(500).json({ message: 'Server Error' });
    }
}


//Api for the report of people who have gohonzon under the leader heirarchy 
async function gohonzonreport(req, res) {
    try {
        if (!req.body.area_id) {
            return res.status(400).json({ message: 'Area id is required' });
        }
        else {
            var resp = []
            var searchdata = await helper.findleveldetails(req, res)
            console.log(searchdata, "searchdata")
            var ar = await sequelize.query(`select nombre from usuarios_area where id = ${req.body.area_id}`,{type : sequelize.QueryTypes.SELECT})
            const result = await sequelize.query(
                `SELECT nombre_completo as "Nombre Completo",email as Email, usuarios_area.nombre as Area,
                uc.nombre as Cabildo,ud.nombre as Distrito, usuarios_division.nombre as Division,
            responsable as Responsable, n.nombre as "Nivel Responsable",responsable_gohonzon as "Responsable de gohonzon",direccion as Direccion,telefono as Telefono,celular as Celular FROM usuarios_usuario  inner join usuarios_division  ON 
            usuarios_division.id = usuarios_usuario.division_id  INNER JOIN usuarios_area ON usuarios_area.id = usuarios_usuario.area_id inner join usuarios_nivelresponsable as n 
            inner join usuarios_cabildo as uc on uc.id = usuarios_usuario.cabildo_id inner join usuarios_distritosgip as ud on ud.id = usuarios_usuario.distrito_sgip_id
            where responsable_gohonzon = 1 and estado_id = 1 and ${searchdata} order by nombre_completo`, { type: sequelize.QueryTypes.SELECT })
            if(!result.length){
                return res.status(200).send({
                    message: "No records found",
                    title: `Reporte Informativo : Responsable Gohonzon : SI, ${ar[0].Area}, Activo`,
                    data: [],
                });
            }
            var keys = Object.keys(result[0])
            resp.push(keys)
            for (var i in result) {
                if(result[i].Responsable==1){
                    result[i].Responsable="SI"
                }
                else if(result[i].Responsable==0){
                    result[i].Responsable="NO"
                }
                if(result[i]['Responsable de gohonzon']==1){
                    result[i]['Responsable de gohonzon']="SI"
                }
                else if(  result[i]['Responsable de gohonzon']==0){
                    result[i]['Responsable de gohonzon']="NO"
                }
                resp.push(Object.values(result[i]))
            }
            return res.status(200).send({
                message: "Data fetched successfuly",
                title: `Reporte Informativo : Responsable Gohonzon : SI, ${result[0].Area}, Activo`,
                data: resp,
                filter :{ 
                    "area_id"  : req.body.area_id,
                    "cabildo_id" : null,
                    "district_id" : null,
                    "division_id" :  null,
                    "responsable" : null,
                    "nivel_responsable_id" : null,
                    "responsable_gohonzon" : 1,
                    "estado_id" : 1,
                    "horizontal_group" : null,
                    "nivel_budista" : null,
                    "grupo" : null},
                total : result.length
            });
        }
    }
    catch (e) {
        console.log(e)
    }
}



function getAllActiveMembers(req, res) {
    try {
        let q = `select * from wp_nuevas_suscripciones where ESTADO = 'ACTIVO'`;
        con.query(q, (error, result) => {
            if (error) {
                return res.status(500).json({ message: 'Server Error' });
            }
            return res.json(result);
        })
    } catch (e) {
        console.log(e);
        return res.status(500).json({ message: 'Server Error' });
    }
}



async function test(req, res) {
    try {
        const result = await sequelize.query(`select * from wp_nuevas_suscripciones where ID in(select usuario_id from usuarios_usuario where  usuario_id !="NA" and Usuario_id !=" ") `)
        console.log(result)
        res.send(result[0])
    } catch (e) {
        console.log(e);
        return res.status(500).json({ message: 'Server Error' });
    }
}


async function getdropdowndata(req, res) {
    try {
        var nation = await sequelize.query(`select * from usuarios_nacionalidad order by nombre `, { type: sequelize.QueryTypes.SELECT })
        const division = await sequelize.query(`select * from usuarios_division order by nombre`, { type: sequelize.QueryTypes.SELECT })
        const level = await sequelize.query(`select * from usuarios_nivelresponsable`, { type: sequelize.QueryTypes.SELECT })
        const horizontal = await sequelize.query(`select * from usuarios_grupohorizontal order by nombre`, { type: sequelize.QueryTypes.SELECT })
        const estado = await sequelize.query(`select * from usuarios_estado`, { type: sequelize.QueryTypes.SELECT })
        const activity = await sequelize.query(`select * from activity`, { type: sequelize.QueryTypes.SELECT })
        const cargo = await sequelize.query(`select * from usuarios_cargoresponsable`, { type: sequelize.QueryTypes.SELECT })
        const gender = await sequelize.query(`select * from usuarios_sexo`, { type: sequelize.QueryTypes.SELECT })
        const profesion = await sequelize.query(`select * from usuarios_profesion`, { type: sequelize.QueryTypes.SELECT })
        const budista = await sequelize.query(`select * from usuarios_nivelbudista`, { type: sequelize.QueryTypes.SELECT })
        const distrito_new = await sequelize.query(`select * from usuarios_distrito`, { type: sequelize.QueryTypes.SELECT })
        const provincia = await sequelize.query(`select * from usuarios_provincia`, { type: sequelize.QueryTypes.SELECT })
        var options = [{ id: 1, nombre: "SI" }, { id: 0, nombre: "NO" }]
        var subscription = [{ id: 1, nombre: "Puente De Paz" }, { id: 2, nombre: "Esperanza" }, { id: 3, nombre: "Vision" }]
        var where = await helper.findRoleDetails(req, res)
        console.log(where,"drop down result")
        var whereClause = ` where 1`
        if (where.area_id) {
            var whereClause = `where area_id = ` + where.area_id
        }
        if (where.cabildo_id) {
            var whereClause = whereClause + ` and cabildo_id= ` + where.cabildo_id
        }
        if (where.distrito_id) {
            var whereClause = whereClause + ` and distrito_sgip_id= ` + where.distrito_id
        }
        if (where.group_id) {
            var whereClause = whereClause + ` and grupo_id= ` + where.group_id
        }

        var area = await sequelize.query(`
        select distinct usuarios_area.id, usuarios_area.nombre from usuarios_usuario right join usuarios_area 
        on usuarios_area.id =  usuarios_usuario.area_id ${whereClause} order by nombre`, { type: sequelize.QueryTypes.SELECT })

        const chapter = await sequelize.query(`select distinct cabildo_id as id , usuarios_cabildo.nombre from usuarios_usuario inner join usuarios_cabildo on usuarios_cabildo.id =  usuarios_usuario.cabildo_id ${whereClause} order by nombre`, { type: sequelize.QueryTypes.SELECT })
        const district = await sequelize.query(`
        select distinct distrito_sgip_id as id , usuarios_distritosgip.nombre from usuarios_usuario inner join usuarios_distritosgip
        on usuarios_distritosgip.id = usuarios_usuario.distrito_sgip_id ${whereClause} order by nombre`, { type: sequelize.QueryTypes.SELECT })

        const group = await sequelize.query(`select distinct grupo_id as id , usuarios_grupo.nombre from usuarios_usuario inner join usuarios_grupo
            on usuarios_grupo.id = usuarios_usuario.grupo_id ${whereClause}`, { type: sequelize.QueryTypes.SELECT })

        return res.status(200).send({
            message: "Data fetched successfuly",
            nation: nation,
            area: area,
            chapter: chapter,
            district: district,
            group: group,
            division: division,
            cargo: cargo,
            level: level,
            horizontal_group: horizontal,
            estado: estado,
            activity: activity,
            gender: gender,
            option: options,
            subscription: subscription,
            profesion: profesion,
            budista: budista,
            distrito_new : distrito_new,
            provincia : provincia
        });
    }
    catch (e) {
        console.log(e);
        return res.status(500).json({ message: 'Server Error' });
    }
}



async function addinvitee(req, res) {
    try {
        console.log(req.body,"add invitee")
        const {  first_name, first_surname,gender,division, mobile, email, address, invited_by, birth_date, birth_month, birth_year, telephone } = req.body //area_id, cabildo_id , distrito_id
        var rs= await sequelize.query(`select id from usuarios_usuario where nombre_completo = "${invited_by}"` , {type : sequelize.QueryTypes.SELECT})
        // console.log(rs)
        // if(rs.length){
        //    var invitado_por=rs[0].id
        // }
        // else{
        //     var invitado_por = invited_by
        // }
        const userdata = {
            nombre: first_name,
            appelido: first_surname,
            email: email,
            movil: mobile,
            direccion: address,
            division: division,
            invitado_por: invited_by,
            genero: gender,
            telefono: telephone
        }
        if(birth_year){
           userdata.fetcha_nacimiento = birth_year + "-" + birth_month + "-" + birth_date
        }
      
         const result = await invitee.create(userdata)
         
            console.log("invitee registred")
        // })
      var por = await sequelize.query(`select invitados_por_primera_vez from usuarios_actividad where id = ${req.body.activity_id}`,{type : sequelize.QueryTypes.SELECT})
      if(por.length) {
        console.log(por[0].invitados_por_primera_vez,"inv")
    var d= Number(por[0].invitados_por_primera_vez)+1}
    else {
        var d = 1
    }    
    var damas = 0
    var cabelleros = 0
    var dep = 0
    var djm = 0
    var djf = 0

    sequelize.query(`update usuarios_actividad set invitados_por_primera_vez = ${d} where id = ${req.body.activity_id}`)
        const result1 = await sequelize.query(`insert into attendance(user_id,role_id,activity_id,is_invitado_por) values(${result.id},2,${req.body.activity_id},1)`)
// console.log(result1)
    const att = await sequelize.query(`select user_id, role_id from attendance where activity_id = ${req.body.activity_id}`,{type: sequelize.QueryTypes.SELECT})
   console.log(att,"attendance")
    for(var i in att){
        if(att[i].role_id==1){
            console.log("if member");
            var user = await sequelize.query(`select division_id from usuarios_usuario where id = ${att[i].user_id}`,{type : sequelize.QueryTypes.SELECT})
        }
        else if(att[i].role_id==2){
            console.log("if invitee");
            var user = await sequelize.query(`select division as division_id from invitados where id = ${att[i].user_id}`,{type : sequelize.QueryTypes.SELECT})
        }
        if(user.length){
        if (user[0].division_id == 1) {         //1 -> Damas
           damas++
        }
        else if (user[0].division_id == 2) {    //2 -> caballereos
           cabelleros++
        }
        else if (user[0].division_id == 3) {    //3 -> DJM
           djm++
        }
        else if (user[0].division_id == 4) {    //4 -> DJF
            djf++
        }
        else if (user[0].division_id == 5) {    //5-> DEP
           dep++
        }
    }
    }
       
        request.post({
            headers: { authorization: req.headers.authorization },
            url: 'http://146.190.171.78:8080/api/dev/admin/getAttendance',
            json: {
             "activity_id" : req.body.activity_id
            },
          }, function (error, response, body) {
            var resp
            if (error) {
              console.log(error,"error message")
            }
            else {
                console.log(body.data,"dataaaaa")
                if(body.data.length){
            //   console.log(body.data,"dataaaa")
               resp = body.data[0]
            
            return res.status(200).send({
                message: "Invitee added",
                data: { id: result.id ,
                summary : resp.data},
                success_message : `Asistencia marcada`,
                division : {
                    Damas : damas,
                    Cabelleros : cabelleros,
                    DJM : djm,
                    DJF : djf,
                    DEP : dep,
                    Total : damas+cabelleros+djm+djf+dep
                }
            });}
              else{
                return res.status(200).send({
                    message: "Invitee added",
                    data: { id: result.id ,
                    summary : 0},
                    // success_message : {damas : damas, cabelleros : cabelleros , djf : djf, djm : djm , dep ""}
                    success_message : `Asistencia marcada`,
                    division : {
                        Damas : damas,
                        Cabelleros : cabelleros,
                        DJM : djm,
                        DJF : djf,
                        DEP : dep,
                        Total : att.length
                    }
                   
                });}  }
        });
    }
    catch (e) {
        console.log(e);
        return res.status(500).json({ message: 'Server Error' });
    }
}
//************************ REPORT AIP'S**********************/



//Api for area wise report for area leader
async function areareport(req, res) {
    try {
        console.log(req.body,"area")
        var resp = []
        const division = req.body.division_id;
        const area = req.body.area_id;
        const cabildo = req.body.cabildo_id;
        const district = req.body.district_id;
        const responsable = req.body.responsable;
        const nivel_responsable = req.body.nivel_responsable_id;
        const responsable_gohonzon = req.body.responsable_gohonzon;
        
        const query = `SELECT  distinct nombre_completo as "Nombre Completo" ,email as Email,usuarios_area.nombre as Area,
        uc.nombre as Cabildo,ud.nombre as Distrito,usuarios_division.nombre as Division,
        responsable as "Responsable", n.nombre as "Nivel Responsable",responsable_gohonzon as "Responsable de Gohonzon",direccion as "Direccion",telefono as "Telefono",celular as "Celular" FROM usuarios_usuario  inner join usuarios_division  ON 
        usuarios_division.id = usuarios_usuario.division_id  INNER JOIN usuarios_area ON usuarios_area.id = usuarios_usuario.area_id
        left join usuarios_nivelresponsable as n on n.id = usuarios_usuario.nivel_responsable_id 
        inner join usuarios_cabildo as uc on uc.id = usuarios_usuario.cabildo_id inner join usuarios_distritosgip as ud on ud.id = usuarios_usuario.distrito_sgip_id
        WHERE estado_id = 1  AND  area_id = :area order by "Nombre completo"`;

        const result = await sequelize.query(query, {
            type: sequelize.QueryTypes.SELECT,
            replacements: {
                division: division || null,
                area: area || null,
                cabildo: cabildo || null,
                district: district || null,
                responsable : responsable || null,
                responsable_gohonzon : responsable_gohonzon || null,
                nivel_responsable : nivel_responsable || null
            }
        });
        var ar = await sequelize.query(`select nombre from usuarios_area where id = ${req.body.area_id}`,{type : sequelize.QueryTypes.SELECT})
        if(!result.length){
            return res.status(200).send({
                message: "No records found",
                title: `Reporte Informativo : Responsable Gohonzon : SI, ${ar[0].Area}, Activo`,
                data: []
            });
        }
        var keys = Object.keys(result[0])
        resp.push(keys)
        for (var i in result) {
            if(result[i].Responsable==1){
                result[i].Responsable="SI"
            }
            else if(result[i].Responsable==0){
                result[i].Responsable="NO"
            }
            if(result[i]['Responsable de Gohonzon']==1){
                result[i]['Responsable de Gohonzon']="SI"
            }
            else if(  result[i]['Responsable de Gohonzon']==0){
                result[i]['Responsable de Gohonzon']="NO"
            }
            resp.push(Object.values(result[i]))
        }
        return res.status(200).send({
            message: "Data fetched successfuly",
            title: `Reporte Informativo : ${result[0].Area}, Activo`,
            data: resp,
            filter :{ 
                "area_id"  : req.body.area_id,
                "cabildo_id" : null,
                "district_id" : null,
                "division_id" :  null,
                "responsable" : null,
                "nivel_responsable_id" : null,
                "responsable_gohonzon" : null,
                "estado_id" : 1,
                "horizontal_group" : null,
                "nivel_budista" : null,
                "grupo" : null},
                total : result.length
        });
    }
    catch (e) {
        console.log(e)
    }
}




//Api for division wise report under the leader heirarchy
async function divisionreport(req, res) {
    try {
        var resp = []
         const division = req.body.division_id;
         const area = req.body.area_id;
         const cabildo = req.body.cabildo_id;
         const district = req.body.district_id;
         const responsable = req.body.responsable;
         const nivel_responsable = req.body.nivel_responsable_id;
         const responsable_gohonzon = req.body.responsable_gohonzon;
         
 
         const whereClause = `WHERE estado_id = 1
     AND (:division IS NULL OR division_id = :division)
     AND (:area IS NULL OR area_id = :area)
     AND (:cabildo IS NULL OR cabildo_id = :cabildo)
     AND (:district IS NULL OR distrito_id = :district) 
     AND (:responsable IS NULL OR responsable = :responsable) 
     AND (:nivel_responsable IS NULL OR nivel_responsable_id = :nivel_responsable) 
     AND (:responsable_gohonzon IS NULL OR responsable_gohonzon = :responsable_gohonzon)  `;
     
 
         const query = `SELECT  distinct nombre_completo as "Nombre Completo" , email as Email,usuarios_area.nombre as Area,
         uc.nombre as Cabildo,ud.nombre as Distrito,usuarios_division.nombre as Division,
         responsable as "Responsable", n.nombre as "Nivel Responsable",responsable_gohonzon as "Responsable de Gohonzon",direccion as "Direccion",telefono as "Telefono",celular as "Celular" FROM usuarios_usuario  inner join usuarios_division  ON 
         usuarios_division.id = usuarios_usuario.division_id  INNER JOIN usuarios_area ON usuarios_area.id = usuarios_usuario.area_id
         left join usuarios_nivelresponsable as n on n.id = usuarios_usuario.nivel_responsable_id 
         inner join usuarios_cabildo as uc on uc.id = usuarios_usuario.cabildo_id inner join usuarios_distritosgip as ud on ud.id = usuarios_usuario.distrito_sgip_id
         ${whereClause} order by nombre_completo`;
 
         const result = await sequelize.query(query, {
             type: sequelize.QueryTypes.SELECT,
             replacements: {
                 division: division || null,
                 area: area || null,
                 cabildo: cabildo || null,
                 district: district || null,
                 responsable : responsable || null,
                 responsable_gohonzon : responsable_gohonzon || null,
                 nivel_responsable : nivel_responsable || null
             }
         });
         if(!result.length){
            var ar = await sequelize.query(`select nombre from usuarios_area where id = ${req.body.area_id}`,{type : sequelize.QueryTypes.SELECT})
            return res.status(200).send({
                message: "No records found",
                title: `Reporte Informativo : Responsable Gohonzon : SI, ${ar[0].Area}, Activo`,
                data: []
            });
        }
        var keys = Object.keys(result[0])
        resp.push(keys)
        for (var i in result) {
            if(result[i].Responsable==1){
                result[i].Responsable="SI"
            }
            else if(result[i].Responsable==0){
                result[i].Responsable="NO"
            }
            if(result[i]['Responsable de Gohonzon']==1){
                result[i]['Responsable de Gohonzon']="SI"
            }
            else if(  result[i]['Responsable de Gohonzon']==0){
                result[i]['Responsable de Gohonzon']="NO"
            }
            resp.push(Object.values(result[i]))
        }
        return res.status(200).send({
            message: "Data fetched successfuly",
            title: `Reporte Informativo : Division, ${result[0].Area}, Activo`,
            data: resp,
            filter :{ 
                "area_id"  : req.body.area_id,
                "cabildo_id" : null,
                "district_id" : null,
                "division_id" :  null,
                "responsable" : null,
                "nivel_responsable_id" : null,
                "responsable_gohonzon" : null,
                "estado_id" : 1,
                "horizontal_group" : null,
                "nivel_budista" : null,
                "grupo" : null},
                total : result.length
        });
    } catch (e) {
        console.log(e);
        return res.status(500).json({ message: 'Server Error' });
    }
}


//APi for report of all responsable under the leader heirarchy
async function leadereport(req, res) {
    try {
        var resp = []
            const division = req.body.division_id
            const area = req.body.area_id;
            const cabildo = req.body.cabildo_id;
            const district = req.body.district_id;
            const responsable = req.body.responsable;
            const nivel_responsable = req.body.nivel_responsable_id;
            const responsable_gohonzon = req.body.responsable_gohonzon;
            
    
            const whereClause = `WHERE estado_id = 1
            AND  usuarios_usuario.responsable = 1
            AND (:division IS NULL OR division_id = :division)
            AND (:area IS NULL OR area_id = :area)
            AND (:cabildo IS NULL OR cabildo_id = :cabildo)
            AND (:district IS NULL OR distrito_id = :district) 
            AND (:responsable IS NULL OR responsable = :responsable) 
            AND (:nivel_responsable IS NULL OR nivel_responsable_id = :nivel_responsable) 
            AND (:responsable_gohonzon IS NULL OR responsable_gohonzon = :responsable_gohonzon)  `;
        
    
            const query = `SELECT  distinct nombre_completo as "Nombre Completo",email as Email,usuarios_area.nombre as Area,
            uc.nombre as Cabildo,ud.nombre as Distrito,usuarios_division.nombre as Division,
            responsable as "Responsable", n.nombre as "Nivel Responsable",responsable_gohonzon as "Responsable de Gohonzon",direccion as "Direccion",telefono as "Telefono",celular as "Celular" FROM usuarios_usuario  inner join usuarios_division  ON 
            usuarios_division.id = usuarios_usuario.division_id  INNER JOIN usuarios_area ON usuarios_area.id = usuarios_usuario.area_id
            left join usuarios_nivelresponsable as n on n.id = usuarios_usuario.nivel_responsable_id 
            inner join usuarios_cabildo as uc on uc.id = usuarios_usuario.cabildo_id inner join usuarios_distritosgip as ud on ud.id = usuarios_usuario.distrito_sgip_id
            ${whereClause} order by nombre_completo`;
    
            const result = await sequelize.query(query, {
                type: sequelize.QueryTypes.SELECT,
                replacements: {
                    division: division || null,
                    area: area || null,
                    cabildo: cabildo || null,
                    district: district || null,
                    responsable : responsable || null,
                    responsable_gohonzon : responsable_gohonzon || null,
                    nivel_responsable : nivel_responsable || null
                }
            });
            if(!result.length){
                var ar = await sequelize.query(`select nombre from usuarios_area where id = ${req.body.area_id}`,{type : sequelize.QueryTypes.SELECT})
                return res.status(200).send({
                    message: "No records found",
                    title: `Reporte Informativo : Responsable Gohonzon : SI, ${ar[0].Area}, Activo`,
                    data: []
                });
            }
        var keys = Object.keys(result[0])
        resp.push(keys)
        for (var i in result) {
            if(result[i].Responsable==1){
                result[i].Responsable="SI"
            }
            else if(result[i].Responsable==0){
                result[i].Responsable="NO"
            }
            if(result[i]['Responsable de Gohonzon']==1){
                result[i]['Responsable de Gohonzon']="SI"
            }
            else if(  result[i]['Responsable de Gohonzon']==0){
                result[i]['Responsable de Gohonzon']="NO"
            }
            resp.push(Object.values(result[i]))
        }
        return res.status(200).send({
            message: "Data fetched successfuly",
            title: `Reporte Informativo : Responsable : SI, ${result[0].Area}, Activo`,
            data: resp,
            filter :{ 
            "area_id"  : req.body.area_id,
            "cabildo_id" : null,
            "district_id" : null,
            "division_id" :  null,
            "responsable" : 1,
            "nivel_responsable_id" : null,
            "responsable_gohonzon" : null,
            "estado_id" : 1,
            "horizontal_group" : null,
            "nivel_budista" : null,
            "grupo" : null},
            total : result.length
        });
    }
    catch (e) {
        console.log(e)
    }
}



//Api for exam grade report report for area leader
async function examreport(req, res) {
    try {
        console.log(req.body,"exam")
        var resp = []
            const division = req.body.division_id;
            const area = req.body.area_id;
            const cabildo = req.body.cabildo_id;
            const district = req.body.district_id;
            const responsable = req.body.responsable;
            const nivel_responsable = req.body.nivel_responsable_id;
            const responsable_gohonzon = req.body.responsable_gohonzon;
            
    
            const whereClause = `WHERE estado_id = 1
            AND nivel_budista_id = ${req.body.exam_grade}
        AND (:division IS NULL OR division_id = :division)
        AND (:area IS NULL OR area_id = :area)
        AND (:cabildo IS NULL OR cabildo_id = :cabildo)
        AND (:district IS NULL OR distrito_id = :district) 
        AND (:responsable IS NULL OR responsable = :responsable) 
        AND (:nivel_responsable IS NULL OR nivel_responsable_id = :nivel_responsable) 
        AND (:responsable_gohonzon IS NULL OR responsable_gohonzon = :responsable_gohonzon)  `;
        
    
            const query = `SELECT distinct nombre_completo as "Nombre Completo",email as Email,usuarios_area.nombre as Area,
            uc.nombre as Cabildo,ud.nombre as Distrito,usuarios_division.nombre as Division,
            responsable as "Responsable", n.nombre as "Nivel Responsable",responsable_gohonzon as "Responsable de Gohonzon",direccion as "Direccion",telefono as "Telefono",celular as "Celular" FROM usuarios_usuario  inner join usuarios_division  ON 
            usuarios_division.id = usuarios_usuario.division_id  INNER JOIN usuarios_area ON usuarios_area.id = usuarios_usuario.area_id
            inner join usuarios_nivelbudista as nb on nb.id = usuarios_usuario.nivel_budista_id 
            left join usuarios_nivelresponsable as n on n.id = usuarios_usuario.nivel_responsable_id 
            inner join usuarios_cabildo as uc on uc.id = usuarios_usuario.cabildo_id inner join usuarios_distritosgip as ud on ud.id = usuarios_usuario.distrito_sgip_id
            ${whereClause} order by nombre_completo`;
    
            const result = await sequelize.query(query, {
                type: sequelize.QueryTypes.SELECT,
                replacements: {
                    division: division || null,
                    area: area || null,
                    cabildo: cabildo || null,
                    district: district || null,
                    responsable : responsable || null,
                    responsable_gohonzon : responsable_gohonzon || null,
                    nivel_responsable : nivel_responsable || null
                }
            });
            if(!result.length){
                var ar = await sequelize.query(`select nombre from usuarios_area where id = ${req.body.area_id}`,{type : sequelize.QueryTypes.SELECT})
                return res.status(200).send({
                    message: "No records found",
                    title: `Reporte Informativo : Examen De Grado `,
                    data: [],
                filter: {
                    "area_id": null,
                    "cabildo_id": null,
                    "district_id": null,
                    "division_id": null,
                    "responsable": null,
                    "nivel_responsable_id": null,
                    "responsable_gohonzon": null,
                    "estado_id" : 1,
                    "horizontal_group" :null,
                    "nivel_budista" :  req.body.exam_grade,
                    "grupo" : null
                },
                total : 0
                });
            }
            var keys = Object.keys(result[0])
        resp.push(keys)
        for (var i in result) {
            if(result[i].Responsable==1){
                result[i].Responsable="SI"
            }
            else if(result[i].Responsable==0){
                result[i].Responsable="NO"
            }
            if(result[i]['Responsable de Gohonzon']==1){
                result[i]['Responsable de Gohonzon']="SI"
            }
            else if(  result[i]['Responsable de Gohonzon']==0){
                result[i]['Responsable de Gohonzon']="NO"
            }
            resp.push(Object.values(result[i]))
        }

        return res.status(200).send({
            message: "Data fetched successfuly",
             title: `Reporte Informativo :  Examen De Grado `,//: ${result[0]["Nivel Budista"]}
            data: resp,
            filter: {
                "area_id": req.body.area_id,
                "cabildo_id": null,
                "district_id": null,
                "division_id": null,
                "responsable": null,
                "nivel_responsable_id": null,
                "responsable_gohonzon": null,
                "estado_id" : 1,
                "horizontal_group" : null,
                "nivel_budista" : req.body.exam_grade,
                "grupo" : null
            },
            total : result.length
        });
    }
    catch (e) {
        console.log(e)
    }
}


async function reportForCabildoArea(req, res) {
    try {
        const { main_id, cabildo_id } = req.body;
        if (!main_id || !cabildo_id) {
            return res.status(400).json({ message: 'Missing Fields' });
        }
        let searchQ = await findleveldetails(main_id);
        if (!searchQ || searchQ == "") {
            return res.status(401).json({ message: 'Not a leader' });
        }
        let q = `select userarea.nombre as area_nombre, cab.nombre as cabildo_nombre , count(cab.nombre) as cabildo_counts from usuarios_usuario as user join usuarios_cabildo as cab on user.cabildo_id = cab.id join usuarios_area as userarea on userarea.id = user.area_id  where ${searchQ} and user.cabildo_id = ${cabildo_id} `
        console.log(q);

        const result = await sequelize.query(q, { type: sequelize.QueryTypes.SELECT })
        console.log(result.length);
        return res.json(result);

    } catch (e) {
        console.log(e);
        return res.status(500).json({ message: 'Server Error' });
    }
}



async function reportForCabildoDivision(req, res) {
    try {
        const { division_id, cabildo_id } = req.body;

        if (!division_id || !cabildo_id) {
            return res.status(400).json({ message: 'Missing Fields' });
        }
        let q = `select userdiv.nombre as area_nombre, cab.nombre as cabildo_nombre , count(cab.nombre) as cabildo_counts from usuarios_usuario as user join usuarios_cabildo as cab on user.cabildo_id = cab.id join usuarios_division as userdiv on userdiv.id = user.division_id  where user.division_id = ${division_id} and user.cabildo_id = ${cabildo_id} `
        console.log(q);

        const result = await sequelize.query(q, { type: sequelize.QueryTypes.SELECT })
        console.log(result.length);
        return res.json(result);
    } catch (e) {
        console.log(e);
        return res.status(500).json({ message: 'Something went wrong..' });
    }
}


async function contactus(req, res) {
    const { nombre, appelido, email, comments } = req.body
    console.log(req.body)
    return res.status(200).send({
        message: "Request submitted!",
        data: []
    })
}



async function reportForcabildoDistrictSGIPbyCabildoId(req, res) {
    try {
        let cabildo_id = req.body.cabildo_id;
        if (!cabildo_id) {
            return res.status(400).json({ message: 'Missing Fields' });
        }
        let q = `select DisSgip.nombre as 'name' , count('name') as members from usuarios_usuario as Main join usuarios_distritosgip as DisSgip where (Main.distrito_sgip_id = DisSgip.id and Main.cabildo_id = ${cabildo_id}) group by name `;
        const result = await sequelize.query(q, { type: sequelize.QueryTypes.SELECT })
        const cabildoName = await sequelize.query(`select nombre from usuarios_cabildo where id = ${cabildo_id}`, { type: sequelize.QueryTypes.SELECT });
        // const distritoSgip = await sequelize.query(``,{ type: sequelize.QueryTypes.SELECT })

        result.push({ "Total": result.reduce((n, val) => n + val.members, 0) })
        result.push({ "heading1": "Distrito SGIP", "heading2": cabildoName[0].nombre });
        return res.json(result);

    } catch (e) {
        console.log(e.name, e.message);
        return res.status(500).json({ message: 'Server Error' });
    }
}


function getAllActiveMembers(req, res) {
    try {
        let q = `select * from wp_nuevas_suscripciones where ESTADO = 'ACTIVO'`;
        con.query(q, (error, result) => {
            if (error) {
                return res.status(500).json({ message: 'Server Error' });
            }
            return res.json(result);
        })
    } catch (e) {
        console.log(e);
        return res.status(500).json({ message: 'Server Error' });
    }
}


async function reportForDivision(req, res) {
    try {

        const { main_id } = req.body;

        const searchQ = await findleveldetails(main_id);


        let q = `select usuarios_division.nombre as div_name , usuarios_estado.nombre as state_name from usuarios_usuario as Main inner join usuarios_division  on Main.division_id = usuarios_division.id inner join usuarios_estado on Main.estado_id = usuarios_estado.id where ${searchQ}`;
        console.log('search query', q);
        //id,divsion_id 
        const result = await sequelize.query(q, { type: sequelize.QueryTypes.SELECT })
        console.log(result.length);
        let divOptions = ["Damas", "Caballeros", "DJM", "DJF", "DEP", "N/A"];
        let stateOptions = ["ACTIVO", "INACTIVO", "FALLECIDO", "TAITEN", "TRASLADO DE PAIS"];
        let reportResult = [];
        for (let div of divOptions) {
            let newObj = {};
            for (let st of stateOptions) {
                let output = result.filter((elem) => elem.div_name == div && elem.state_name == st).length;
                newObj[st] = output;
            }
            newObj["total"] = Object.values(newObj).reduce((n, val) => n + val, 0);
            newObj["Division"] = div;
            reportResult.push(newObj);

        }
        let lastObjectforTotal = {};

        stateOptions.forEach((state) => {
            lastObjectforTotal[state] = result.filter((obj) => obj.state_name == state).length;
        })
        lastObjectforTotal["Division"] = "Total";
        reportResult.push(lastObjectforTotal);
        return res.json(reportResult);
    } catch (e) {
        console.log(e);
        return res.status(500).json({ message: 'Server Error' });
    }
}


async function reportForAreaNState(req, res) {
    try {

        const { main_id } = req.body;
        if (!main_id) {
            return res.status(400).json({ message: 'Missing Fields' });
        }
        const searchQ = await findleveldetails(main_id);

        // usuarios_area.nombre as area_name , usuarios_estado.nombre as state_name , count('state_name') as members_count
        let q = `select  usuarios_area.nombre as area_name , usuarios_estado.nombre as state_name , count('state_name') as members_count from usuarios_usuario as Main inner join usuarios_area on Main.area_id = usuarios_area.id inner join usuarios_estado on Main.estado_id = usuarios_estado.id where ${searchQ} group by state_name`;
        console.log('search query', q);
        //id,divsion_id 
        const result = await sequelize.query(q, { type: sequelize.QueryTypes.SELECT })
        if (!result || result.length <= 0) {
            return res.status(404).json({ message: 'Nothing Found' });
        }
        console.log(result);
        //return res.json(result)
        let stateOptions = ["ACTIVO", "INACTIVO", "FALLECIDO", "TAITEN", "TRASLADO DE PAIS"]; //later we will get dynamically
        let reportResult = result;

        for (let state of stateOptions) {
            let newObj = {};
            let found = result.find((obj) => {
                return obj.state_name == state;
            })
            if (found) {
                continue;
            } else {
                newObj = { area_name: result[0].area_name, state_name: state, members_count: 0 }
                reportResult.push(newObj);
            }

        }
        return res.json(reportResult);
    } catch (e) {
        console.log(e);
        return res.status(500).json({ message: 'Server Error' });
    }
}

async function horizontalreport(req, res) {
    try {
        console.log(req.body, "area")
        var resp = []
        const division = req.body.division_id;
        const area = req.body.area_id;
        const cabildo = req.body.cabildo_id;
        const district = req.body.district_id;
        const responsable = req.body.responsable;
        const nivel_responsable = req.body.nivel_responsable_id;
        const responsable_gohonzon = req.body.responsable_gohonzon;


        const whereClause = `WHERE 1
        AND (:division IS NULL OR division_id = :division)
        AND (:area IS NULL OR area_id = :area)
        AND (:cabildo IS NULL OR cabildo_id = :cabildo)
        AND (:district IS NULL OR distrito_id = :district) 
        AND (:responsable IS NULL OR responsable = :responsable) 
        AND (:nivel_responsable IS NULL OR nivel_responsable_id = :nivel_responsable) 
        AND (:responsable_gohonzon IS NULL OR responsable_gohonzon = :responsable_gohonzon)  `;


        const query = `SELECT  nombre_completo as "Nombre Completo" ,email as Email,usuarios_area.nombre as Area,
        uc.nombre as Cabildo,ud.nombre as Distrito,usuarios_division.nombre as Division,
        responsable as "Responsable", n.nombre as "Nivel Responsable",responsable_gohonzon as "Responsable de Gohonzon",direccion as "Direccion",telefono as "Telefono",celular as "Celular" FROM usuarios_usuario  inner join usuarios_division  ON 
        usuarios_division.id = usuarios_usuario.division_id inner join group_members on group_members.user_id = usuarios_usuario.id
        INNER JOIN usuarios_area ON usuarios_area.id = usuarios_usuario.area_id
        left join usuarios_nivelresponsable as n on n.id = usuarios_usuario.nivel_responsable_id 
        inner join usuarios_cabildo as uc on uc.id = usuarios_usuario.cabildo_id inner join usuarios_distritosgip as ud on ud.id = usuarios_usuario.distrito_sgip_id
        ${whereClause} and group_members.group_id = ${req.body.group_id} order by nombre_completo`;

        const result = await sequelize.query(query, {
            type: sequelize.QueryTypes.SELECT,
            replacements: {
                division: division || null,
                area: area || null,
                cabildo: cabildo || null,
                district: district || null,
                responsable: responsable || null,
                responsable_gohonzon: responsable_gohonzon || null,
                nivel_responsable: nivel_responsable || null
            }
        });
        if(!result.length){
            // var ar = await sequelize.query(`select nombre from usuarios_area where id = ${req.body.area_id}`,{type : sequelize.QueryTypes.SELECT})
            return res.status(200).send({
                message: "No records found",
                title: `Reporte Informativo :Grupo Horizontal`,
                data: [],
                filter: {
                    "area_id": null,
                    "cabildo_id": null,
                    "district_id": null,
                    "division_id": null,
                    "responsable": null,
                    "nivel_responsable_id": null,
                    "responsable_gohonzon": null,
                    "estado_id" : 1,
                    "horizontal_group" : req.body.group_id,
                    "nivel_budista" : null,
                    "grupo" : null
                },
                total : 0
            });
        }
        var keys = Object.keys(result[0])
        resp.push(keys)
        for (var i in result) {
            if (result[i].Responsable == 1) {
                result[i].Responsable = "SI"
            }
            else if (result[i].Responsable == 0) {
                result[i].Responsable = "NO"
            }
            if (result[i]['Responsable de Gohonzon'] == 1) {
                result[i]['Responsable de Gohonzon'] = "SI"
            }
            else if (result[i]['Responsable de Gohonzon'] == 0) {
                result[i]['Responsable de Gohonzon'] = "NO"
            }
            resp.push(Object.values(result[i]))
        }
        return res.status(200).send({
            message: "Data fetched successfuly",
            title: `Reporte Informativo : Grupo Horizontal`,
            data: resp,
            filter: {
                "area_id": null,
                "cabildo_id": null,
                "district_id": null,
                "division_id": null,
                "responsable": null,
                "nivel_responsable_id": null,
                "responsable_gohonzon": null,
                "estado_id" : 1,
                "horizontal_group" : req.body.group_id,
                "nivel_budista" : null,
                "grupo" : null
            },
            total : result.length
        });
    }
    catch (e) {
        console.log(e)
    }
}



async function reportForAreaNDivision(req, res) {
    try {
        const { main_id } = req.body;
        if (!main_id) {
            return res.status(400).json({ message: 'Missing Fields' });
        }
        const searchQ = await findleveldetails(main_id);

        let q = `select usuarios_area.nombre as area_name ,count(usuarios_area.nombre) as members, usuarios_division.nombre as div_name from usuarios_usuario as Main inner join usuarios_area on Main.area_id = usuarios_area.id inner join usuarios_division on Main.division_id = usuarios_division.id where ${searchQ} group by usuarios_division.nombre`;
        //id,divsion_id 
        const result = await sequelize.query(q, { type: sequelize.QueryTypes.SELECT })
        console.log(result.length);
        if (!result || result.length <= 0) {
            return res.status(404).json({ message: 'Nothing Found' });
        }
        console.log(result);

        return res.json(result);
    } catch (e) {
        console.log(e);
        return res.status(500).json({ message: 'Server Error' });
    }
}




async function hierarchy(req, res) {
    const nationcard = {
        "Resp DF": { values: "", division_id: "" },
        "Vice Resp DF": { values: "", division_id: "" },
        "Resp DC": { values: "", division_id: "" },
        "Vice Resp DC": { values: "", division_id: "" },
        "Resp DJF": { values: "", division_id: "" },
        "Vice Resp DJF": { values: "", division_id: "" },
        "Resp DJM": { values: "", division_id: "" },
        "Vice Resp DJM": { values: "", division_id: "" },
        "Resp DEP DJM": { values: "", division_id: "" },
        "Resp DEP DJF": { values: "", division_id: "" }
    }
    var nation = await sequelize.query(`SELECT nacionalidad_id, nombre_completo, d.nombre AS division,division_id, a.nombre AS Nation FROM usuarios_usuario
    INNER JOIN usuarios_cargoresponsable AS d ON d.id = usuarios_usuario.cargo_responsable_id 
    INNER JOIN usuarios_nacionalidad AS a ON a.id = usuarios_usuario.nacionalidad_id WHERE responsable = 1 AND nivel_responsable_id = 1`, { type: sequelize.QueryTypes.SELECT });
   console.log(nation,"nation")
    for (var r in nation) {
        Object.assign(nationcard, { [`${nation[r].division}`]: { values: nation[r].nombre_completo, division_id: nation[r].division_id } })
        // Object.assign(card,{[`${result[r].division}`]:result[r].nombre_completo})

    }
    const area = await sequelize.query(`SELECT DISTINCT area_id AS id, usuarios_area.nombre FROM usuarios_area INNER JOIN usuarios_usuario AS us ON usuarios_area.id = us.area_id ORDER BY nombre`, { type: sequelize.QueryTypes.SELECT });
    for (var i in area) {
        const card = {
            "Resp DF": { values: "", division_id: "" },
            "Vice Resp DF": { values: "", division_id: "" },
            "Resp DC": { values: "", division_id: "" },
            "Vice Resp DC": { values: "", division_id: "" },
            "Resp DJF": { values: "", division_id: "" },
            "Vice Resp DJF": { values: "", division_id: "" },
            "Resp DJM": { values: "", division_id: "" },
            "Vice Resp DJM": { values: "", division_id: "" },
            "Resp DEP DJM": { values: "", division_id: "" },
            "Resp DEP DJF": { values: "", division_id: "" }
        };

        var result = await sequelize.query(`SELECT area_id, CONCAT(nombre_completo, ' , ', celular) as nombre_completo, d.nombre AS division,division_id, a.nombre AS Area FROM usuarios_usuario
         INNER JOIN usuarios_cargoresponsable AS d ON d.id = usuarios_usuario.cargo_responsable_id 
         INNER JOIN usuarios_area AS a ON a.id = usuarios_usuario.area_id WHERE area_id = ${area[i].id} AND responsable = 1 AND nivel_responsable_id = 2`, { type: sequelize.QueryTypes.SELECT });

        for (var r in result) {
            Object.assign(card, { [`${result[r].division}`]: { values: result[r].nombre_completo, division_id: result[r].division_id } })
            // Object.assign(card,{[`${result[r].division}`]:result[r].nombre_completo})

        }

        area[i].leaders = { ...card };

        var cabildo = await sequelize.query(`SELECT DISTINCT cabildo_id AS id , nombre  FROM usuarios_usuario inner join usuarios_cabildo as cab on cab.id =  usuarios_usuario.cabildo_id WHERE  area_id = ${area[i].id} order by nombre`, { type: sequelize.QueryTypes.SELECT });
        area[i].type = "Cabildo";
        area[i].arr = cabildo;

        for (var j in cabildo) {
            const cardCabildo = {
                "Resp DF": { values: "", division_id: "" },
                "Vice Resp DF": { values: "", division_id: "" },
                "Resp DC": { values: "", division_id: "" },
                "Vice Resp DC": { values: "", division_id: "" },
                "Resp DJF": { values: "", division_id: "" },
                "Vice Resp DJF": { values: "", division_id: "" },
                "Resp DJM": { values: "", division_id: "" },
                "Vice Resp DJM": { values: "", division_id: "" },
                "Resp DEP DJM": { values: "", division_id: "" },
                "Resp DEP DJF": { values: "", division_id: "" }
            };

            var result1 = await sequelize.query(`SELECT  CONCAT(nombre_completo, ' , ', celular) as nombre_completo, c.nombre AS cabildo, cabildo_id,division_id, d.nombre AS division FROM usuarios_usuario INNER JOIN usuarios_cabildo AS c ON c.id = usuarios_usuario.cabildo_id 
            INNER JOIN usuarios_cargoresponsable AS d ON d.id = usuarios_usuario.cargo_responsable_id  
            WHERE area_id = ${area[i].id} AND cabildo_id = ${cabildo[j].id} AND responsable = 1 AND nivel_responsable_id = 3`, { type: sequelize.QueryTypes.SELECT });
            // console.log(cabildo,"success")
            for (var r in result1) {
                Object.assign(cardCabildo, { [`${result1[r].division}`]: { values: result1[r].nombre_completo, division_id: result1[r].division_id } })
            }

            cabildo[j].leaders = { ...cardCabildo };
            var district = await sequelize.query(`SELECT DISTINCT distrito_sgip_id AS id , nombre FROM usuarios_usuario inner join usuarios_distritosgip as ds on ds.id = usuarios_usuario.distrito_sgip_id WHERE area_id = ${area[i].id} AND cabildo_id =${cabildo[j].id} order by nombre`, { type: sequelize.QueryTypes.SELECT });
            cabildo[j].type = "Distrito";
            cabildo[j].arr = district;

            for (var k in district) {
                const cardDistrict = {
                    "Resp DF": { values: "", division_id: "" },
                    "Vice Resp DF": { values: "", division_id: "" },
                    "Resp DC": { values: "", division_id: "" },
                    "Vice Resp DC": { values: "", division_id: "" },
                    "Resp DJF": { values: "", division_id: "" },
                    "Vice Resp DJF": { values: "", division_id: "" },
                    "Resp DJM": { values: "", division_id: "" },
                    "Vice Resp DJM": { values: "", division_id: "" },
                    "Resp DEP DJM": { values: "", division_id: "" },
                    "Resp DEP DJF": { values: "", division_id: "" }
                };

                var rs = await sequelize.query(`SELECT CONCAT(nombre_completo, ' , ', celular) as nombre_completo, c.nombre, distrito_sgip_id, division_id,d.nombre AS division FROM usuarios_usuario INNER JOIN usuarios_distritosgip AS c ON c.id = usuarios_usuario.distrito_sgip_id 
                INNER JOIN usuarios_cargoresponsable AS d ON d.id = usuarios_usuario.cargo_responsable_id 
                WHERE area_id = ${area[i].id} AND distrito_sgip_id = ${district[k].id} AND cabildo_id = ${cabildo[j].id} AND responsable = 1 AND nivel_responsable_id = 4`, { type: sequelize.QueryTypes.SELECT });
                // console.log(rs,"error")
                for (var r in rs) {
                    Object.assign(cardDistrict, { [`${rs[r].division}`]: { values: rs[r].nombre_completo, division_id: rs[r].division_id } })
                }
                district[k].leaders = { ...cardDistrict };

                var group = await sequelize.query(`SELECT DISTINCT grupo_id AS id , nombre FROM usuarios_usuario inner join usuarios_grupo as g on g.id = usuarios_usuario.grupo_id WHERE area_id = ${area[i].id} AND cabildo_id =${cabildo[j].id} AND distrito_sgip_id =${district[k].id} order by nombre`, { type: sequelize.QueryTypes.SELECT });
                district[k].type = "Grupo";
                district[k].arr = group;

                for (var s in group) {
                    const cardGroup = {
                        "Resp DF": { values: "", division_id: "" },
                        "Vice Resp DF": { values: "", division_id: "" },
                        "Resp DC": { values: "", division_id: "" },
                        "Vice Resp DC": { values: "", division_id: "" },
                        "Resp DJF": { values: "", division_id: "" },
                        "Vice Resp DJF": { values: "", division_id: "" },
                        "Resp DJM": { values: "", division_id: "" },
                        "Vice Resp DJM": { values: "", division_id: "" },
                        "Resp DEP DJM": { values: "", division_id: "" },
                        "Resp DEP DJF": { values: "", division_id: "" }
                    };

                    var grp = await sequelize.query(`SELECT CONCAT(nombre_completo, ' , ', celular) as nombre_completo, division_id, c.nombre,grupo_id, d.nombre AS division FROM usuarios_usuario INNER JOIN usuarios_grupo AS c ON c.id = usuarios_usuario.grupo_id 
                    INNER JOIN usuarios_cargoresponsable AS d ON d.id = usuarios_usuario.cargo_responsable_id 
                    WHERE area_id = ${area[i].id} AND cabildo_id = ${cabildo[j].id} AND distrito_sgip_id =${district[k].id}  AND grupo_id = ${group[s].id} AND responsable = 1 AND nivel_responsable_id = 5`, { type: sequelize.QueryTypes.SELECT });

                    for (var r in grp) {
                        Object.assign(cardGroup, { [`${grp[r].division}`]: { values: grp[r].nombre_completo, division_id: grp[r].division_id } })
                        // Object.assign(cardGroup,{[`${grp[r].division}`]:grp[r].nombre_completo})
                    }

                    group[s].leaders = { ...cardGroup }; // Make a copy of the cardGroup object
                }
            }
        }
    }

    return res.status(200).send({
        message: "Data fetched successfully",

        data: { nation: nationcard, area: area }
    });
}


async function mytest(req, res) {
    const usersData = {
        "id": 1,
        "name": "John Doe",
        "email": "mailto:johndoe@example.com",
        "phone": "+1-202-555-0123",
        "address": {
            "street": "123 Main St",
            "city": "Anytown",
            "state": "CA",
            "zip": "12345"
        },
        "orders": [
            {
                "id": 1001,
                "items": [
                    {
                        "id": "A001",
                        "name": "Widget A",
                        "quantity": 2,
                        "price": 9.99
                    },
                    {
                        "id": "B002",
                        "name": "Widget B",
                        "quantity": 1,
                        "price": 14.99
                    }
                ],
                "total": 34.97,
                "status": "shipped"
            },
            {
                "id": 1002,
                "items": [
                    {
                        "id": "C003",
                        "name": "Widget C",
                        "quantity": 3,
                        "price": 4.99,
                        "hiddenField": "This field will be hidden"
                    }
                ],
                "total": 14.97,
                "status": "pending"
            }
        ],
        "hiddenField": "This field will be hidden as well"
    }
    return res.json(usersData);
}

async function getUserList(req,res){
    var result = await sequelize.query(`select id, nombre_completo from usuarios_usuario order by nombre_completo`,{type : sequelize.QueryTypes.SELECT})
    var result1 = await sequelize.query(`select id ,CONCAT(nombre, ' ', appelido)as nombre_completo from invitados`,{type:sequelize.QueryTypes.SELECT})
    result=result.concat(result1)
    return res.status(200).send({
        message: "user list",
        data:result
    });
}

async function numericGrpreport(req,res){
    var user = await sequelize.query(`select * from usuarios_grupohorizontal`,{type : sequelize.QueryTypes.SELECT})
    var resp = [[
        'Grupo Horizontal',
        'Total'
    ]]
    for(var i in user){
        var input =[]
        var member = await sequelize.query(`select count(*) as count from group_members where group_id = ${user[i].id}`,{type : sequelize.QueryTypes.SELECT})
        input.push(user[i].nombre)
        input.push(member[0].count||0)
        resp.push(input)
    }
    return res.status(200).send({
        message: "Data fetched",
        data:resp,
        title : "Reporte Numérico Grupo Horizontal"
    });}


    async function getDynamicCabildo(req,res){
        var where = await helper.findRoleDetails(req, res)
        var area_id = req.body.area_id
        var cabildo_id = where.cabildo_id || null
        console.log(where,"drop down result")
        const whereClause = `WHERE 1
        AND (:area IS NULL OR area_id = :area)
        AND (:cabildo IS NULL OR cabildo_id = :cabildo) `;
        if(area_id){
        const chapter = await sequelize.query(`select distinct cabildo_id as id , usuarios_cabildo.nombre from usuarios_usuario inner join usuarios_cabildo on usuarios_cabildo.id =  usuarios_usuario.cabildo_id
          ${whereClause} order by nombre`, { type: sequelize.QueryTypes.SELECT ,replacements : {
            area : area_id,
            cabildo : cabildo_id
          }})
        // const district = await sequelize.query(`
        // select distinct distrito_sgip_id as id , usuarios_distritosgip.nombre from usuarios_usuario inner join usuarios_distritosgip
        // on usuarios_distritosgip.id = usuarios_usuario.distrito_sgip_id where  area_id = ${req.body.area_id } order by nombre`, { type: sequelize.QueryTypes.SELECT })

        return res.status(200).send({
            message: "Data fetched",
            data:{
                cabildo : chapter
            }
        });}
        else{
            return res.status(200).send({
                message: "Data fetched",
                data:{
                    cabildo :[]
                }
            })
        }
    }

        async function getDynamicDistrito(req,res){
            var where = await helper.findRoleDetails(req, res)
        var area_id = req.body.area_id
        var cabildo_id = req.body.cabildo_id || where.cabildo_id 
        var distrito_sgip_id = where.distrito_id || null
        console.log(where,"drop down result")
        const whereClause = `WHERE 1
        AND (:area IS NULL OR area_id = :area)
        AND (:cabildo IS NULL OR cabildo_id = :cabildo)
        AND (:distrito_sgip_id IS NULL OR distrito_sgip_id = :distrito_sgip_id) `;
            // const chapter = await sequelize.query(`select distinct cabildo_id as id , usuarios_cabildo.nombre from usuarios_usuario inner join usuarios_cabildo on usuarios_cabildo.id =  usuarios_usuario.cabildo_id where  area_id = ${req.body.area_id } order by nombre`, { type: sequelize.QueryTypes.SELECT })
           if(area_id && cabildo_id){}
            const district = await sequelize.query(`
            select distinct distrito_sgip_id as id , usuarios_distritosgip.nombre from usuarios_usuario inner join usuarios_distritosgip
            on usuarios_distritosgip.id = usuarios_usuario.distrito_sgip_id ${whereClause} order by nombre`, { type: sequelize.QueryTypes.SELECT ,replacements : {
                area : area_id,
                cabildo : cabildo_id,
                distrito_sgip_id : distrito_sgip_id
            } })
    
            return res.status(200).send({
                message: "Data fetched",
                data:{
                    distrito : district
                },
                title : "Reporte Numérico Grupo Horizontal"
            });}
    


module.exports = {
    getAllActiveMembers,
    leaderLogin,
    changepassword,
    givenAwayMembershipMembers,
    passedAwayMembers,
    membersMovedToAnotherCountry,
    gohonzonreport,
    divisionreport,
    mytest,
    leadereport,
    areareport,
    getdropdowndata,
    examreport,
    addinvitee,
    reportForDivision,
    reportForAreaNState,
    reportForAreaNDivision,
    reportForCabildoArea,
    reportForCabildoDivision,
    reportForcabildoDistrictSGIPbyCabildoId,
    getUserList,
    hierarchy,
    contactus,
    fetchAndInsertReportData,
    horizontalreport,
    numericGrpreport,
    test,
    getDynamicCabildo,
    getDynamicDistrito
}