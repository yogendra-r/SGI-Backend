const con = require('../config/config.json').development;
const helper = require('../middlewares/helper')
const leader = require("../models/auth_leader")
const sequelize = require('../models')
var random = require('random-string-alphanumeric-generator');
const { Op } = require("sequelize");
const config = require('../config/otherConfig.json')
const nodemailer = require('nodemailer')
const XLSX = require('xlsx');
const md5 = require('md5');
// const { SELECT } = require('sequelize/types/query-types');
// const { response } = require('../app');







//*************************DASHBOARD APIS **************/

async function getDashBoardCardStats(req, res) {
    let response = [];
    console.log(req.body,"cards")
    try {
        //cards.. var where = await helper.findlevelId(req, res)
        var where = await helper.findRoleDetails(req, res)
      console.log(where)
        const area = req.body.area_id||where.area_id;
        const cabildo = req.body.cabildo_id||where.cabildo_id;
        const district = req.body.distrito_id||where.distrito_id;

    const whereCl = `WHERE 1=1
    AND (:area IS NULL OR area_id = :area)
    AND (:cabildo IS NULL OR cabildo_id = :cabildo)
    AND (:district IS NULL OR distrito_sgip_id = :district)  `;
        
        
        let q = `select count(*) as registered_members_count from usuarios_usuario ${whereCl}`;
        let result = await sequelize.query(q, { type: sequelize.QueryTypes.SELECT,replacements: {
            area: area || null,
            cabildo: cabildo || null,
            district: district || null
        } })
        result = result[0];
        response.push(result)
        q = `select count(*) as active_members from usuarios_usuario ${whereCl} and estado_id = 1 `;
        result = await sequelize.query(q, { type: sequelize.QueryTypes.SELECT,replacements: {
            area: area || null,
            cabildo: cabildo || null,
            district: district || null
        } })
        result = result[0];
        response.push(result)
        q = `select count(*) as leaders_count from usuarios_usuario ${whereCl} and responsable = 1`;
        result = await sequelize.query(q, { type: sequelize.QueryTypes.SELECT,replacements: {
            area: area || null,
            cabildo: cabildo || null,
            district: district || null
        } })
        result = result[0];
        response.push(result)
        q = `select count(*) as gohonzon_owners from usuarios_usuario ${whereCl} and responsable_gohonzon = 1`;
        result = await sequelize.query(q, { type: sequelize.QueryTypes.SELECT ,replacements: {
            area: area || null,
            cabildo: cabildo || null,
            district: district || null
        }})
        result = result[0];
        response.push(result)
        // q = `select count(*) as gohonzon_owners from usuarios_usuario where area_id = 1` ;
        // result = await sequelize.query(q,{ type: sequelize.QueryTypes.SELECT })
        // result = result[0];
        // response.push(result)
        return res.json(response)

    } catch (e) {
        console.log(e.name, e.message);
        return res.status(500).json({ message: 'something went wrong!' });
    }
}


async function getDashboardMembersByArea(req, res) {
    try { var where = await helper.findRoleDetails(req,res)
        console.log(where,"where from leader table")
        if(where.level=="Nacional"){
            console.log("one")
            var q = `select Area.nombre as 'area_name' , count( Area.nombre ) as members_counts  from usuarios_usuario as Main inner join usuarios_area as Area where (Main.area_id = Area.id ) group by area_name order by area_name`;
            var headings = ["S.No","Área","Total Miembros por área"]
        }
        else if(where.level == "Área" ){
            console.log("two")
            var q = `select cabildo.nombre as 'area_name' , count( cabildo.nombre ) as members_counts  from usuarios_usuario as Main inner join usuarios_cabildo as cabildo where (Main.cabildo_id = cabildo.id and  area_id = ${where.area_id}) group by area_name order by area_name`;
            var headings = ["S.No","Cabildo","Total Miembros por cabildo"]
        }
        else if(where.level = "Cabildo" ){
            console.log("three")
            var q = `select distrito.nombre as 'area_name' , count( distrito.nombre ) as members_counts  from usuarios_usuario as Main inner join usuarios_distritosgip as distrito where (Main.distrito_sgip_id = distrito.id  and area_id = ${where.area_id} and cabildo_id = ${where.cabildo_id}) group by area_name order by area_name`;
            var headings = ["S.No","Distrito SGIP","Total Miembros por Distrito"]
        }
        // let q = `select Area.nombre as 'area_name' , count( Area.nombre ) as members_counts  from usuarios_usuario as Main inner join usuarios_area as Area where (Main.area_id = Area.id) group by area_name order by area_name`;
        const result = await sequelize.query(q, { type: sequelize.QueryTypes.SELECT })
        // return res.status(200).send(result);
        return res.status(200).send({data:result,
            headings:headings});
    } catch (e) {
        console.log(e.name, e.message);
        return res.status(500).json({ message: 'Server Error' });
    }
}


async function getDashboardGohonZonOwnersByArea(req, res) {
    try {
        var where = await helper.findRoleDetails(req,res)
        console.log(where,"where from leader table")
        if(where.level=="Nacional"){
            console.log("one")
            var q = `select Area.nombre as 'area_name' , count( Area.nombre ) as gohonzon_counts  from usuarios_usuario as Main inner join usuarios_area as Area where (Main.area_id = Area.id and responsable_gohonzon = 1) group by area_name order by area_name`;
            var headings = ["S.No","Área","Total Gohonzon Propietarios por área"]
        }
        else if(where.level == "Área" ){
            console.log("two")
            var q = `select cabildo.nombre as 'area_name' , count( cabildo.nombre ) as gohonzon_counts  from usuarios_usuario as Main inner join usuarios_cabildo as cabildo where (Main.cabildo_id = cabildo.id and responsable_gohonzon = 1 and area_id = ${where.area_id}) group by area_name order by area_name`;
            var headings = ["S.No","Cabildo","Total Gohonzon Propietarios por cabildo"]
        }
        else if(where.level = "Cabildo" ){
            console.log("three")
            var q = `select distrito.nombre as 'area_name' , count( distrito.nombre ) as gohonzon_counts  from usuarios_usuario as Main inner join usuarios_distritosgip as distrito where (Main.distrito_sgip_id = distrito.id and responsable_gohonzon = 1 and area_id = ${where.area_id} and cabildo_id = ${where.cabildo_id}) group by area_name order by area_name`;
            var headings = ["S.No","Distrito SGIP","Total Gohonzon Propietarios por Distrito"]
        }

        // let q = `select Area.nombre as 'area_name' , count( Area.nombre ) as gohonzon_counts  from usuarios_usuario as Main inner join usuarios_area as Area where (Main.area_id = Area.id and responsable_gohonzon = 1) group by area_name order by area_name`;
        const result = await sequelize.query(q, { type: sequelize.QueryTypes.SELECT })
        // return res.status(200).send(result);
        return res.status(200).send({data:result,
            headings:headings});
    } catch (e) {
        console.log(e.name, e.message);
        return res.status(500).json({ message: 'Server Error' });
    }
}


async function getDashboardDivisionDistributionByArea(req, res) {
    try {
        var where = await helper.findRoleDetails(req,res)
        const area = req.body.area_id||where.area_id;
        const cabildo = req.body.cabildo_id||where.cabildo_id;
        const district = req.body.distrito_id||where.distrito_id;

    const whereCl = `
    AND (:area IS NULL OR area_id = :area)
    AND (:cabildo IS NULL OR cabildo_id = :cabildo)
    AND (:district IS NULL OR distrito_sgip_id = :district)  `;
        
       
        let q = `select D.nombre as div_name , count( D.nombre) as counts from usuarios_usuario as M inner join usuarios_division as D where (M.division_id = D.id)  ${whereCl} group by div_name `;
        const result = await sequelize.query(q, { type: sequelize.QueryTypes.SELECT  ,replacements: {
            area: area || null,
            cabildo: cabildo || null,
            district: district || null
        } })
        return res.json(result);
    } catch (e) {
        console.log(e);
        return res.status(500).json({ message: 'Server Error' });
    }
}


async function getDashboardLeaderDivisionPie(req, res) {
    try {
        var where = await helper.findRoleDetails(req,res)
        const area = req.body.area_id||where.area_id;
        const cabildo = req.body.cabildo_id||where.cabildo_id;
        const district = req.body.distrito_id||where.distrito_id;

    const whereCl = `
    AND (:area IS NULL OR area_id = :area)
    AND (:cabildo IS NULL OR cabildo_id = :cabildo)
    AND (:district IS NULL OR distrito_sgip_id = :district)  `;
        let q = `select D.nombre as div_name , count( D.nombre) as counts from usuarios_usuario as M inner join usuarios_division as D where (M.division_id = D.id and M.responsable = 1) ${whereCl} group by div_name`;
        const result = await sequelize.query(q, { type: sequelize.QueryTypes.SELECT,replacements: {
            area: area || null,
            cabildo: cabildo || null,
            district: district || null
        } })
        return res.json(result);
    } catch (e) {
        console.log(e);
        return res.status(500).json({ message: 'Server Error' });
    }
}


async function getDashboardLeaderNivelPie(req, res) {
    try { var where = await helper.findRoleDetails(req,res)
        const area = req.body.area_id||where.area_id;
        const cabildo = req.body.cabildo_id||where.cabildo_id;
        const district = req.body.distrito_id||where.distrito_id;

    const whereCl = `
    AND (:area IS NULL OR area_id = :area)
    AND (:cabildo IS NULL OR cabildo_id = :cabildo)
    AND (:district IS NULL OR distrito_sgip_id = :district)  `;
        let q = `select Nivel.nombre as nivel_name , count('nivel_name') as counts  from usuarios_usuario as Main inner join usuarios_nivelresponsable as Nivel where (Main.area_id = Nivel.id and Main.responsable = 1) ${whereCl} group by nivel_name order by nivel_name`;
        const result = await sequelize.query(q, { type: sequelize.QueryTypes.SELECT ,replacements: {
            area: area || null,
            cabildo: cabildo || null,
            district: district || null
        }})
        return res.json(result);
    } catch (e) {
        console.log(e.name, e.message);
        return res.status(500).json({ message: 'Server Error' });
    }
}




//************************* MARK ATTENDANCE APIS **************/

async function addAcivity(req, res) {
    console.log(req.body,"add act ")
    try {
        var act = await sequelize.query(`select nombre from activity where id = ${req.body.nombre}`, { type: sequelize.QueryTypes.SELECT })
        var result = await helper.findRoleDetails(req, res)
        const nombre = act[0].nombre
        const date =convertUtcToIst(req.body.fetcha_de_actividad).substring(0, 10);
        console.log(date)
        const area_id = req.body.area|| result.area_id
        const cabildo_id = req.body.cabildo || result.cabildo_id
        const distrito_id = req.body.distrito || result.distrito_id
        var whereClause = `
AND (:area_id IS NULL OR area_id = :area_id)
AND (:cabildo_id IS NULL OR cabildo_id = :cabildo_id)
AND (:distrito_id IS NULL OR distrito_id = :distrito_id) `
        var exists = await sequelize.query(`select *  from usuarios_actividad where nombre = "${nombre}" and fetcha_de_actividad = "${date}" ${whereClause}`, { type: sequelize.QueryTypes.SELECT,replacements : { area_id: area_id || null,
            cabildo_id: cabildo_id || null,
            distrito_id: distrito_id || null,} })
        if (exists.length) {
            console.log(exists,"exists")
            return res.status(200).send({
                message: "activity added successfully",
                data: { id: exists[0].id, area_id: area_id, cabildo_id: cabildo_id, distrito_id: distrito_id, fetcha_de_actividad: date, nombre: nombre }
            })
        }
        else {
            var data = await sequelize.query(`insert into usuarios_actividad (nombre,fetcha_de_actividad, area_id, cabildo_id ,distrito_id ) values("${nombre}","${date}",${area_id},${cabildo_id||null},${distrito_id||null})`)

            console.log(data)
            return res.status(200).send({
                message: "activity added successfully",
                data: { id: data[0], area_id: area_id, cabildo_id: cabildo_id, distrito_id: distrito_id, fetcha_de_actividad: date, nombre: nombre }
            })
        }
    }
    catch (e) {
        console.log("error", e);
        return res.status(500).json({ message: 'Server Error' });
    }
}



async function getAttendanceMemberList(req, res) {
    if (!req.body.fetcha_de_actividad) {
        console.log("error date")
        return res.status(400).send({
            message: "Fetcha de actividad is required",
            data: []
        })
    }
    else {
        console.log(req.body,"member kist")
        const cabildo = req.body.cabildo_id
        const district = req.body.distrito_id
        var whereClause = `
AND (:cabildo IS NULL OR cabildo_id = :cabildo)
AND (:district IS NULL OR distrito_sgip_id = :district) `
        const att = await sequelize.query(`select user_id from usuarios_actividad inner join attendance on usuarios_actividad.id = attendance.activity_id where fetcha_de_actividad= "${req.body.fetcha_de_actividad}" and role_id = 1`, { type: sequelize.QueryTypes.SELECT })
        const result = await sequelize.query(`select usuarios_usuario.id,usuario_id as Cedula_id, sgi_id , nombre_completo, telefono, division.nombre as division from usuarios_usuario inner join usuarios_division as division on division.id = usuarios_usuario.division_id where 
    area_id = ${req.body.area_id} ${whereClause} `, { type: sequelize.QueryTypes.SELECT,replacements :{ 
        cabildo: cabildo || null,
        district: district || null,}  })
    
    for (var i in result