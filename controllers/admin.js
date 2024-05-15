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
    console.log(req.body, "cards")
    try {
        //cards.. var where = await helper.findlevelId(req, res)
        var where = await helper.findRoleDetails(req, res)
        console.log(where)
        const area = req.body.area_id || where.area_id;
        const cabildo = req.body.cabildo_id || where.cabildo_id;
        const district = req.body.distrito_id || where.distrito_id;

        const whereCl = `WHERE 1=1
    AND (:area IS NULL OR area_id = :area)
    AND (:cabildo IS NULL OR cabildo_id = :cabildo)
    AND (:district IS NULL OR distrito_sgip_id = :district)  `;


        let q = `select count(*) as registered_members_count from usuarios_usuario ${whereCl}`;
        let result = await sequelize.query(q, {
            type: sequelize.QueryTypes.SELECT, replacements: {
                area: area || null,
                cabildo: cabildo || null,
                district: district || null
            }
        })
        result = result[0];
        response.push(result)
        q = `select count(*) as active_members from usuarios_usuario ${whereCl} and estado_id = 1 `;
        result = await sequelize.query(q, {
            type: sequelize.QueryTypes.SELECT, replacements: {
                area: area || null,
                cabildo: cabildo || null,
                district: district || null
            }
        })
        result = result[0];
        response.push(result)
        q = `select count(*) as leaders_count from usuarios_usuario ${whereCl} and responsable = 1`;
        result = await sequelize.query(q, {
            type: sequelize.QueryTypes.SELECT, replacements: {
                area: area || null,
                cabildo: cabildo || null,
                district: district || null
            }
        })
        result = result[0];
        response.push(result)
        q = `select count(*) as gohonzon_owners from usuarios_usuario ${whereCl} and responsable_gohonzon = 1`;
        result = await sequelize.query(q, {
            type: sequelize.QueryTypes.SELECT, replacements: {
                area: area || null,
                cabildo: cabildo || null,
                district: district || null
            }
        })
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
    try {
        var where = await helper.findRoleDetails(req, res)
        console.log(where, "where from leader table")
        if (where.level == "ADMIN") {
            console.log("one")
            var q = `select Area.nombre as 'area_name' , count( Area.nombre ) as members_counts  from usuarios_usuario as Main inner join usuarios_area as Area where (Main.area_id = Area.id ) group by area_name order by area_name`;
            var headings = ["S.No", "Área", "Total Miembros por área"]
        }
        else if (where.level == "Nacional") {
            console.log("one")
            var q = `select Area.nombre as 'area_name' , count( Area.nombre ) as members_counts  from usuarios_usuario as Main inner join usuarios_area as Area where (Main.area_id = Area.id ) group by area_name order by area_name`;
            var headings = ["S.No", "Área", "Total Miembros por área"]
        }
        else if (where.level == "Área") {
            console.log("two")
            var q = `select cabildo.nombre as 'area_name' , count( cabildo.nombre ) as members_counts  from usuarios_usuario as Main inner join usuarios_cabildo as cabildo where (Main.cabildo_id = cabildo.id and  area_id = ${where.area_id}) group by area_name order by area_name`;
            var headings = ["S.No", "Cabildo", "Total Miembros por Cabildo"]
        }
        else if (where.level == "Cabildo") {
            console.log("three")
            var q = `select distrito.nombre as 'area_name' , count( distrito.nombre ) as members_counts  from usuarios_usuario as Main inner join usuarios_distritosgip as distrito where (Main.distrito_sgip_id = distrito.id  and area_id = ${where.area_id} and cabildo_id = ${where.cabildo_id}) group by area_name order by area_name`;
            var headings = ["S.No", "Distrito SGIP", "Total Miembros por Distrito"]
        }
        else if (where.level == "Distrito") {
            var q = `select grupo.nombre as 'area_name' , count( grupo.nombre ) as gohonzon_counts  from usuarios_usuario as Main inner join usuarios_grupo as grupo where (Main.grupo_id = grupo.id  and area_id = ${where.area_id} and cabildo_id = ${where.cabildo_id} and distrito_id =  ${where.distrito_id}) group by area_name order by area_name`;
            var headings = ["S.No", "Grupo", "Total Responsable por Grupo"]
        }
        // let q = `select Area.nombre as 'area_name' , count( Area.nombre ) as members_counts  from usuarios_usuario as Main inner join usuarios_area as Area where (Main.area_id = Area.id) group by area_name order by area_name`;
        const result = await sequelize.query(q, { type: sequelize.QueryTypes.SELECT })
        // return res.status(200).send(result);
        return res.status(200).send({
            data: result,
            headings: headings
        });
    } catch (e) {
        console.log(e.name, e.message);
        return res.status(500).json({ message: 'Server Error' });
    }
}


async function getDashboardGohonZonOwnersByArea(req, res) {
    try {
        var where = await helper.findRoleDetails(req, res)
        console.log(where, "where from leader table")
        if (where.level == "ADMIN") {
            console.log("one")
            var q = `select Area.nombre as 'area_name' , count( Area.nombre ) as gohonzon_counts  from usuarios_usuario as Main inner join usuarios_area as Area where (Main.area_id = Area.id and responsable_gohonzon = 1) group by area_name order by area_name`;
            var headings = ["S.No", "Área", "Total Gohonzon Propietarios por área"]
        }
        else if (where.level == "Nacional") {
            console.log("one")
            var q = `select Area.nombre as 'area_name' , count( Area.nombre ) as gohonzon_counts  from usuarios_usuario as Main inner join usuarios_area as Area where (Main.area_id = Area.id and responsable_gohonzon = 1) group by area_name order by area_name`;
            var headings = ["S.No", "Área", "Total Gohonzon Propietarios por área"]
        }
        else if (where.level == "Área") {
            console.log("two")
            var q = `select cabildo.nombre as 'area_name' , count( cabildo.nombre ) as gohonzon_counts  from usuarios_usuario as Main inner join usuarios_cabildo as cabildo where (Main.cabildo_id = cabildo.id and responsable_gohonzon = 1 and area_id = ${where.area_id}) group by area_name order by area_name`;
            var headings = ["S.No", "Cabildo", "Total Gohonzon Propietarios por Cabildo"]
        }
        else if (where.level == "Cabildo") {
            console.log("three")
            var q = `select distrito.nombre as 'area_name' , count( distrito.nombre ) as gohonzon_counts  from usuarios_usuario as Main inner join usuarios_distritosgip as distrito where (Main.distrito_sgip_id = distrito.id and responsable_gohonzon = 1 and area_id = ${where.area_id} and cabildo_id = ${where.cabildo_id}) group by area_name order by area_name`;
            var headings = ["S.No", "Distrito SGIP", "Total Gohonzon Propietarios por Distrito"]
        }
        else if (where.level == "Distrito") {
            var q = `select grupo.nombre as 'area_name' , count( grupo.nombre ) as gohonzon_counts  from usuarios_usuario as Main inner join usuarios_grupo as grupo where (Main.grupo_id = grupo.id and responsable_gohonzon = 1 and area_id = ${where.area_id} and cabildo_id = ${where.cabildo_id} and distrito_id =  ${where.distrito_id}) group by area_name order by area_name`;
            var headings = ["S.No", "Grupo", "Total Responsable por Grupo"]
        }

        // let q = `select Area.nombre as 'area_name' , count( Area.nombre ) as gohonzon_counts  from usuarios_usuario as Main inner join usuarios_area as Area where (Main.area_id = Area.id and responsable_gohonzon = 1) group by area_name order by area_name`;
        const result = await sequelize.query(q, { type: sequelize.QueryTypes.SELECT })
        // return res.status(200).send(result);
        return res.status(200).send({
            data: result,
            headings: headings
        });
    } catch (e) {
        console.log(e.name, e.message);
        return res.status(500).json({ message: 'Server Error' });
    }
}


async function getDashboardDivisionDistributionByArea(req, res) {
    try {
        var where = await helper.findRoleDetails(req, res)
        const area = req.body.area_id || where.area_id;
        const cabildo = req.body.cabildo_id || where.cabildo_id;
        const district = req.body.distrito_id || where.distrito_id;

        const whereCl = `
    AND (:area IS NULL OR area_id = :area)
    AND (:cabildo IS NULL OR cabildo_id = :cabildo)
    AND (:district IS NULL OR distrito_sgip_id = :district)  `;


        let q = `select D.nombre as div_name , count( D.nombre) as counts from usuarios_usuario as M inner join usuarios_division as D where (M.division_id = D.id)  ${whereCl} group by div_name `;
        const result = await sequelize.query(q, {
            type: sequelize.QueryTypes.SELECT, replacements: {
                area: area || null,
                cabildo: cabildo || null,
                district: district || null
            }
        })
        return res.json(result);
    } catch (e) {
        console.log(e);
        return res.status(500).json({ message: 'Server Error' });
    }
}


async function getDashboardLeaderDivisionPie(req, res) {
    try {
        var where = await helper.findRoleDetails(req, res)
        const area = req.body.area_id || where.area_id;
        const cabildo = req.body.cabildo_id || where.cabildo_id;
        const district = req.body.distrito_id || where.distrito_id;

        const whereCl = `
    AND (:area IS NULL OR area_id = :area)
    AND (:cabildo IS NULL OR cabildo_id = :cabildo)
    AND (:district IS NULL OR distrito_sgip_id = :district)  `;
        let q = `select D.nombre as div_name , count( D.nombre) as counts from usuarios_usuario as M inner join usuarios_division as D where (M.division_id = D.id and M.responsable = 1) ${whereCl} group by div_name`;
        const result = await sequelize.query(q, {
            type: sequelize.QueryTypes.SELECT, replacements: {
                area: area || null,
                cabildo: cabildo || null,
                district: district || null
            }
        })
        return res.json(result);
    } catch (e) {
        console.log(e);
        return res.status(500).json({ message: 'Server Error' });
    }
}


async function getDashboardLeaderNivelPie(req, res) {
    try {
        var where = await helper.findRoleDetails(req, res)
        const area = req.body.area_id || where.area_id;
        const cabildo = req.body.cabildo_id || where.cabildo_id;
        const district = req.body.distrito_id || where.distrito_id;

        const whereCl = `
    AND (:area IS NULL OR area_id = :area)
    AND (:cabildo IS NULL OR cabildo_id = :cabildo)
    AND (:district IS NULL OR distrito_sgip_id = :district)  `;
        let q = `select Nivel.nombre as nivel_name , count('nivel_name') as counts  from usuarios_usuario as Main inner join usuarios_nivelresponsable as Nivel where (Main.nivel_responsable_id = Nivel.id and Main.responsable = 1) ${whereCl} group by nivel_name order by nivel_name`;
        const result = await sequelize.query(q, {
            type: sequelize.QueryTypes.SELECT, replacements: {
                area: area || null,
                cabildo: cabildo || null,
                district: district || null
            }
        })
        return res.json(result);
    } catch (e) {
        console.log(e.name, e.message);
        return res.status(500).json({ message: 'Server Error' });
    }
}



//************************* MARK ATTENDANCE APIS **************/

async function addAcivity(req, res) {
    console.log(req.body, "add act ")
    try {
        var act = await sequelize.query(`select nombre from activity where id = ${req.body.nombre}`, { type: sequelize.QueryTypes.SELECT })
        var result = await helper.findRoleDetails(req, res)
        const nombre = act[0].nombre
        const date = convertUtcToIst(req.body.fetcha_de_actividad).substring(0, 10);
        console.log(date)
        const area_id = req.body.area || result.area_id
        const cabildo_id = req.body.cabildo || result.cabildo_id
        const distrito_id = req.body.distrito || result.distrito_id
        var whereClause = `
AND (:area_id IS NULL OR area_id = :area_id)
AND (:cabildo_id IS NULL OR cabildo_id = :cabildo_id)
AND (:distrito_id IS NULL OR distrito_id = :distrito_id) `
        var exists = await sequelize.query(`select *  from usuarios_actividad where nombre = "${nombre}" and fetcha_de_actividad = "${date}" ${whereClause}`, {
            type: sequelize.QueryTypes.SELECT, replacements: {
                area_id: area_id || null,
                cabildo_id: cabildo_id || null,
                distrito_id: distrito_id || null,
            }
        })
        if (exists.length) {
            console.log(exists, "exists")
            return res.status(200).send({
                message: "activity added successfully",
                data: { id: exists[0].id, area_id: area_id, cabildo_id: cabildo_id, distrito_id: distrito_id, fetcha_de_actividad: date, nombre: nombre }
            })
        }
        else {
            var data = await sequelize.query(`insert into usuarios_actividad (nombre,fetcha_de_actividad, area_id, cabildo_id ,distrito_id,activity_id ) values("${nombre}","${date}",${area_id},${cabildo_id || null},${distrito_id || null},${req.body.nombre})`)

            // console.log(data)
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
    console.log(req.body, "get att list")
    if (!req.body.fetcha_de_actividad) {
        console.log("error date")
        return res.status(400).send({
            message: "Fetcha de actividad is required",
            data: []
        })
    }
    else {
        var whereCl = `
        AND (:cabildo IS NULL OR cabildo_id = :cabildo)
        AND (:district IS NULL OR distrito_id = :district) `
        console.log(req.body, "member list")
        const cabildo = req.body.cabildo_id
        const district = req.body.distrito_id
        const att = await sequelize.query(`select user_id, nombre as activity from usuarios_actividad inner join attendance on usuarios_actividad.id = attendance.activity_id  where fetcha_de_actividad= "${req.body.fetcha_de_actividad}" and attendance.activity_id = ${req.body.activity_id} and role_id = 1`, { type: sequelize.QueryTypes.SELECT })
        const act = await sequelize.query(`select nombre  from  usuarios_actividad where id= "${req.body.id}" and  area_id = ${req.body.area_id} ${whereCl} `, {
            type: sequelize.QueryTypes.SELECT, replacements: {
                cabildo: cabildo || null,
                district: district || null,
            }
        })
        //   console.log(act,"activity name")

          if(act[0]) { if ((act[0]?.nombre).includes("DJM")) {
            var division_id = 3
        }
        else if ((act[0]?.nombre).includes("DJF")) {
            var division_id = 4
        }
        else if ((act[0]?.nombre).includes("DAMAS")) {
            var division_id = 1
        }
        else if ((act[0]?.nombre).includes("Caballeros")) {
            var division_id = 2
        }
        else if ((act[0]?.nombre).includes("DEP")) {
            var division_id = 5
        }
}
        var whereClause = `
        AND (:division_id IS NULL OR division_id = :division_id)
        AND (:cabildo IS NULL OR cabildo_id = :cabildo)
        AND (:district IS NULL OR distrito_sgip_id = :district) `
        const result = await sequelize.query(`select usuarios_usuario.id,usuario_id as Cedula_id, sgi_id , nombre_completo, telefono, division.nombre as division from usuarios_usuario inner join usuarios_division as division on division.id = usuarios_usuario.division_id where 
    area_id = ${req.body.area_id} ${whereClause} order by nombre_completo`, {
            type: sequelize.QueryTypes.SELECT, replacements: {
                cabildo: cabildo || null,
                district: district || null,
                division_id: division_id || null
            }
        })

        for (var i in result) {
            result[i].present = false
            for (var j in att) {
                if (result[i].id == att[j].user_id) {
                    result[i].present = true
                }
            }
        }

        return res.status(200).send({
            message: "data fetched successfully",
            data: result
        })
    }
}

async function getAttendanceLeaderList(req, res) {
    console.log(req.body, "get att list")
    if (!req.body.fetcha_de_actividad) {
        console.log("error date")
        return res.status(400).send({
            message: "Fetcha de actividad is required",
            data: []
        })
    }
    else {
        var whereCl = `
        AND (:cabildo IS NULL OR cabildo_id = :cabildo)
        AND (:district IS NULL OR distrito_id = :district) `
        console.log(req.body, "member list")
        const cabildo = req.body.cabildo_id
        const district = req.body.distrito_id
        const att = await sequelize.query(`select user_id, nombre as activity from usuarios_actividad inner join attendance on usuarios_actividad.id = attendance.activity_id  where fetcha_de_actividad= "${req.body.fetcha_de_actividad}" and attendance.activity_id = ${req.body.activity_id} and role_id = 3`, { type: sequelize.QueryTypes.SELECT })
        const act = await sequelize.query(`select nombre  from  usuarios_actividad where id= "${req.body.id}" and  area_id = ${req.body.area_id} ${whereCl} `, {
            type: sequelize.QueryTypes.SELECT, replacements: {
                cabildo: cabildo || null,
                district: district || null,
            }
        })
        //   console.log(act[0].nombre,"activity name")

        if(act[0]){if ((act[0]?.nombre).includes("DJM")) {
            var division_id = 3
        }
        else if ((act[0]?.nombre).includes("DJF")) {
            var division_id = 4
        }
        else if ((act[0]?.nombre).includes("DAMAS")) {
            var division_id = 1
        }
        else if ((act[0]?.nombre).includes("Caballeros")) {
            var division_id = 2
        }
        else if ((act[0]?.nombre).includes("DEP")) {
            var division_id = 5
        }}

        var whereClause = `
        AND (:division_id IS NULL OR division_id = :division_id)
        AND (:cabildo IS NULL OR cabildo_id = :cabildo)
        AND (:district IS NULL OR distrito_sgip_id = :district) `
        const result = await sequelize.query(`select usuarios_usuario.id,area_id,cabildo_id,distrito_sgip_id,usuario_id as Cedula_id,nivel.nombre as nivel_responsable, sgi_id , nombre_completo, telefono, division.nombre as division from usuarios_usuario inner join usuarios_nivelresponsable as nivel  on nivel.id = usuarios_usuario.nivel_responsable_id inner join usuarios_division as division on division.id = usuarios_usuario.division_id where 
    area_id = ${req.body.area_id} and responsable = 1 ${whereClause} order by nombre_completo`, {
            type: sequelize.QueryTypes.SELECT, replacements: {
                cabildo: cabildo || null,
                district: district || null,
                division_id: division_id || null
            }
        })
      

        for (var i in result) {
            var ar = await sequelize.query(`select nombre from usuarios_area where id = ${result[i].area_id}`, { type: sequelize.QueryTypes.SELECT })
            var cb = await sequelize.query(`select nombre from usuarios_cabildo where id = ${result[i].cabildo_id}`, { type: sequelize.QueryTypes.SELECT })
            var ds = await sequelize.query(`select nombre from usuarios_distritosgip where id = ${result[i].distrito_sgip_id}`, { type: sequelize.QueryTypes.SELECT })
            var heading = ""
            var ans = result[i]
            console.log('ans.nivel_responsable: ', ans.nivel_responsable);
            if (ans.nivel_responsable == "Admin") {
                heading = "Admin"
            }
            if (ans.nivel_responsable == "Nacional") {
                heading = "Nacional"
            }
            if (ans.nivel_responsable == "Área") {
    
                heading = ar[0].nombre
            }
            if (ans.nivel_responsable == "Cabildo") {
                heading = ar[0].nombre + " " + cb[0].nombre
            }
            if (ans.nivel_responsable == "Distrito") {
                heading = ar[0].nombre + " " + cb[0].nombre + " " + ds[0].nombre
            }
            result[i].nivel_name = heading
            result[i].present = false
            for (var j in att) {
                if (result[i].id == att[j].user_id) {
                    result[i].present = true
                }
            }
        }

        return res.status(200).send({
            message: "data fetched successfully",
            data: result
        })
    }
}


async function getAttendanceInviteeList(req, res) {
    console.log(req.body, "invitee list req")
    if (!req.body.fetcha_de_actividad) {
        console.log("error date invitee")
        return res.status(400).send({
            message: "Fetcha de actividad is required",
            data: []
        })
    }
    const att = await sequelize.query(`select user_id from usuarios_actividad inner join attendance on usuarios_actividad.id = attendance.activity_id where fetcha_de_actividad= "${req.body.fetcha_de_actividad}" and attendance.activity_id = ${req.body.activity_id} and role_id = 2`, { type: sequelize.QueryTypes.SELECT })
    const area = req.body.area_id
    const cabildo = req.body.cabildo_id
    const district = req.body.distrito_id
    //     const whereClause =
    // `WHERE 1=1
    // AND (:area IS NULL OR invitados.area_id = :area)
    // AND (:cabildo IS NULL OR invitados.cabildo_id = :cabildo)
    // AND (:district IS NULL OR invitados.distrito_sgip_id = :district) `
    const act = await sequelize.query(`select nombre  from  usuarios_actividad where id= "${req.body.id}"`, {
        type: sequelize.QueryTypes.SELECT, replacements: {
            area: area || null,
            cabildo: cabildo || null,
            district: district || null,
        }
    })
    // console.log(act[0].nombre, "activity name")

    if(act[0]){ if ((act[0].nombre).includes("DJM")) {
        var division_id = 3
    }
    else if ((act[0].nombre).includes("DJF")) {
        var division_id = 4
    }
    else if ((act[0].nombre).includes("DAMAS")) {
        var division_id = 1
    }
    else if ((act[0].nombre).includes("Caballeros")) {
        var division_id = 2
    }
    else if ((act[0].nombre).includes("DEP")) {
        var division_id = 5
    }}

    // inner join usuarios_usuario as ip on invitados.invitado_por=ip.id 
    var whereClause = `where 1
AND (:division_id IS NULL OR division = :division_id)`
    const result = await sequelize.query(`select invitados.id, invitados.nombre, invitados.appelido,invitados.invitado_por as invited_by ,invitados.telefono,invitados.movil, division.nombre as division from invitados inner join usuarios_division as division on division.id = invitados.division ${whereClause} order by invitados.nombre`,
        { type: sequelize.QueryTypes.SELECT, replacements: { division_id: division_id || null } })
    //  replacements : { area: area || null,
    //     cabildo: cabildo || null,
    //     district: district || null,} })
    for (var i in result) {
        result[i].present = false
        for (var j in att) {
            if (result[i].id == att[j].user_id) {
                result[i].present = true
            }
        }
    }
    console.log(result, "att result");
    return res.status(200).send({
        message: "data fetched successfully",
        data: result
    })
}


function convertUtcToIst(utcDate) {
    const utcDatetime = new Date(utcDate)
    const istOffsetMinutes = 330;
    const istDatetime = new Date(utcDatetime.getTime() + istOffsetMinutes * 60000);
    const istDate = istDatetime.toISOString();
    return istDate;
}

async function getAttendance(req, res) {
    (async () => {
        try {
            // console.log(req.body,"att list")

            if (req.body.fetcha_de_actividad) {
                var date = convertUtcToIst(req.body.fetcha_de_actividad).substring(0, 10);
            }
            var where = await helper.findRoleDetails(req, res)
            const area = req.body.area_id || where.area_id;
            const cabildo = req.body.cabildo_id || where.cabildo_id;
            const district = req.body.distrito_id || where.distrito_id;
            const activity_id = req.body.activity_id
            const meeting_id = req.body.new_activity_id

            const whereClause = `WHERE 1=1
        AND (:activity_id IS NULL OR attendance.activity_id = :activity_id)
        AND (:meeting_id IS NULL OR usuarios_actividad.activity_id = :meeting_id)
        AND (:date IS NULL OR fetcha_de_actividad = :date)
        AND (:area IS NULL OR area_id = :area)
        AND (:cabildo IS NULL OR cabildo_id = :cabildo)
        AND (:district IS NULL OR distrito_id = :district)  `;

            const query = `select attendance.activity_id,area.nombre as area,fetcha_de_actividad,usuarios_actividad.nombre as activity, 
     count(attendance.activity_id) as total from attendance inner join usuarios_actividad on usuarios_actividad.id = attendance.activity_id 
    inner join usuarios_area as area on area.id = usuarios_actividad.area_id 
    ${whereClause} group by attendance.activity_id `;
            //   ${whereClause} and ${whereCl} group by activity_id `;

            const result = await sequelize.query(query, {
                type: sequelize.QueryTypes.SELECT,
                replacements: {
                    date: date || null,
                    area: area || null,
                    cabildo: cabildo || null,
                    district: district || null,
                    activity_id: activity_id || null,
                    meeting_id: meeting_id || null
                }
            });

            for (var i in result) {
                member = 0,
                    invitee = 0,
                    invitado_por = 0
                const resp = await sequelize.query(`select role_id,count(role_id) as count from attendance where activity_id = ${result[i].activity_id} group by role_id`, { type: sequelize.QueryTypes.SELECT })
                console.log(result[i].activity_id, resp, "resp")
                for (var j in resp) {
                    if (resp[j].role_id == 1) {
                        //    var user = await sequelize.query(`select div.nombre from usuaros_usuario inner join usuarious_division as div where usuarios_usuario.id = ${resp[j].user_id}`)
                        //    console.log(user,"user division") 
                        member = resp[j].count
                    }
                    else if (resp[j].role_id == 2) {
                        console.log(result[i].activity_id, resp[j].count, "else")
                        invitee = resp[j].count
                    }
                    var s = await sequelize.query(`select invitados_por_primera_vez from usuarios_actividad where id =  ${result[i].activity_id}  `, { type: sequelize.QueryTypes.SELECT })
                }
                var damas = 0
                var cabelleros = 0
                var dep = 0
                var djm = 0
                var djf = 0
                //     const user = await sequelize.query(`select user_id,role_id as count from attendance where activity_id = ${result[i].activity_id}`, { type: sequelize.QueryTypes.SELECT })
                //     for(var i in user){
                //         if(user[i].role_id == 1){
                //             var member = await sequelize.query(`select div.nombre from usuario_diviasion as div inner join usuarios_usuario where usuarios_usuario.id = ${user[i].user_id} `)
                //         for(var i in member){

                //         }
                // }
                //         else if(user[i].role_id == 2){

                //         }
                //     }
                result[i].member = member
                result[i].invitado_por = s[0].invitados_por_primera_vez
                result[i].invitee = invitee - result[i].invitado_por
            }
            // console.log(result)
            return res.status(200).send({
                message: "data",
                data: result
            })
        } catch (error) {
            console.log(error)
            console.error('Error:', error.message);
        }
    })();

}

async function getAttendanceByDivision(req, res) {
    try {
        var where = await helper.findRoleDetails(req, res)
        const area = req.body.area_id || where.area_id;
        const cabildo = req.body.cabildo_id || where.cabildo_id;
        const district = req.body.distrito_id || where.distrito_id;
        const meeting_id = req.body.new_activity_id || null

        const whereClause = `WHERE 1=1
        AND (:area IS NULL OR area_id = :area)
        AND (:cabildo IS NULL OR cabildo_id = :cabildo)
        AND (:district IS NULL OR distrito_id = :district) 
        AND (:meeting_id IS NULL OR activity_id = :meeting_id)`;


        const query1 = `select * from usuarios_actividad ${whereClause}`

        const data = await sequelize.query(query1, {
            type: sequelize.QueryTypes.SELECT,
            replacements: {
                area: area || null,
                cabildo: cabildo || null,
                district: district || null,
                meeting_id: meeting_id || null
            }
        })

        // console.log('data: ', data);
        const month = [[], [], [], [], [], [], [], [], [], [], [], []]
        const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
        for (var i in data) {

            for (var j in months) {
                if (months[j] == data[i].fetcha_de_actividad.substring(5, 7)) {
                    month[j].push(data[i].id)
                }
            }
        }

        var objbymontn = []
        console.log(month, "month by division");
        for (var i in month) {
            var monthwisedata = { [`${i}`]: { Damas: 0, Cabelleros: 0, DJM: 0, DJF: 0, DEP: 0 } }
            // if(month[i].length){

            var damas = 0
            var cabelleros = 0
            var dep = 0
            var djm = 0
            var djf = 0

            for (var j in month[i]) {

                const divisionresultuser = await sequelize.query(`select division_id as division from usuarios_usuario where id in ((select user_id from attendance where activity_id = ${month[i][j]} and role_id = 1))`, { type: sequelize.QueryTypes.SELECT })
                //  const divisionresultuser = await sequelize.query(`select division_id as division from usuarios_usuario where id in ((select user_id from attendance where activity_id in (${month[i]}) and role_id = 1))`,{type : sequelize.QueryTypes.SELECT})
                console.log('divisionresultuser: ', divisionresultuser);
                const divisionresultinvitee = await sequelize.query(`select division  from invitados where id in ((select user_id from attendance where activity_id = ${month[i][j]} and role_id = 2))`, { type: sequelize.QueryTypes.SELECT })
                console.log('divisionresultinvitee: ', divisionresultinvitee);
                const divisionresult = divisionresultuser.concat(divisionresultinvitee)
                console.log('divisionresult: ', divisionresult);

                for (var j in divisionresult) {
                    if (divisionresult[j].division == 1) {         //1 -> Damas
                        damas++
                    }
                    else if (divisionresult[j].division == 2) {    //2 -> caballereos
                        cabelleros++
                    }
                    else if (divisionresult[j].division == 3) {    //3 -> DJM
                        djm++
                    }
                    else if (divisionresult[j].division == 4) {    //4 -> DJF
                        djf++
                    }
                    else if (divisionresult[j].division == 5) {    //5-> DEP
                        dep++
                    }

                }
            }
            monthwisedata[i].Damas = damas
            monthwisedata[i].Cabelleros = cabelleros
            monthwisedata[i].DJM = djm
            monthwisedata[i].DJF = djf
            monthwisedata[i].DEP = dep

            objbymontn.push(monthwisedata)

            // }
        } console.log('objbymontn: ', objbymontn);


        var label = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", 'Octubure', "Noviembre", "Diciembre"]
        const values = [{ "label": "Damas", data: [] }, { "label": "Cabelleros", data: [] }, { "label": "DJM", data: [] }, { "label": "DJF", data: [] }, { "label": "DEP", data: [] }]
        for (var i in objbymontn) {
            values[0].data.push(objbymontn[i][i].Damas)
            values[1].data.push(objbymontn[i][i].Cabelleros)
            values[2].data.push(objbymontn[i][i].DJM)
            values[3].data.push(objbymontn[i][i].DJF)
            values[4].data.push(objbymontn[i][i].DEP)

        }



        console.log(label, values, "att result")
        return res.status(200).send({
            message: "data fetched",
            label,
            values,
        }
        )
    } catch (error) {
        console.log(error)
        console.error('Error:', error.message);
    }


}

async function getAttendanceByMonth(req, res) {
    try {
        console.log(req.body)
        var where = await helper.findRoleDetails(req, res)
        const area = req.body.area_id || where.area_id;
        const cabildo = req.body.cabildo_id || where.cabildo_id;
        const district = req.body.distrito_id || where.distrito_id;
        const meeting_id = req.body.new_activity_id || null

        const whereClause = `WHERE 1=1
    AND (:area IS NULL OR area_id = :area)
    AND (:cabildo IS NULL OR cabildo_id = :cabildo)
    AND (:district IS NULL OR distrito_id = :district) 
    AND (:meeting_id IS NULL OR activity_id = :meeting_id)`;


        const query1 = `select * from usuarios_actividad ${whereClause}`

        const data = await sequelize.query(query1, {
            type: sequelize.QueryTypes.SELECT,
            replacements: {
                area: area || null,
                cabildo: cabildo || null,
                district: district || null,
                meeting_id: meeting_id || null
            }
        })
        const month = [[], [], [], [], [], [], [], [], [], [], [], []]
        const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
        for (var i in data) {

            for (var j in months) {
                if (months[j] == data[i].fetcha_de_actividad.substring(5, 7)) {
                    month[j].push(data[i].id)
                }
            }
        }


        var objbymontn = []
        console.log(month, "month by month");
        for (var i in month) {
            var monthwisedata = { [`${i}`]: { member: 0, invitee: 0, invitado_por: 0 } }
            if (month[i].length) {
                const member = await sequelize.query(`select count(*) as count from attendance where activity_id in (${month[i]}) and role_id = 1`, { type: sequelize.QueryTypes.SELECT })
                monthwisedata[i].member = member[0].count
                console.log('member: ', member, i);
                const invitee = await sequelize.query(`select count(*) as count from attendance where activity_id in (${month[i]}) and role_id = 2 and is_invitado_por = 0`, { type: sequelize.QueryTypes.SELECT })
                monthwisedata[i].invitee = invitee[0].count
                console.log('invitee: ', invitee, i);
                const invitado_por = await sequelize.query(`select count(*) as count from attendance where activity_id in (${month[i]}) and role_id = 2 and is_invitado_por = 1`, { type: sequelize.QueryTypes.SELECT })
                monthwisedata[i].invitado_por = invitado_por[0].count
                console.log('invitad_por: ', invitado_por, i);
            }
            objbymontn.push(monthwisedata)

        }


        var label = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", 'Octubure', "Noviembre", "Diciembre"]
        const values = [{ "label": "Miembros", data: [] }, { "label": "Invitados", data: [] }, { "label": "Invitado por primera vez", data: [] }]
        for (var i in objbymontn) {
            values[0].data.push(objbymontn[i][i].member)
            values[1].data.push(objbymontn[i][i].invitee)
            values[2].data.push(objbymontn[i][i].invitado_por)

        }



        console.log(label, values)
        return res.send({
            message: "data fetched",
            // data : objbymontn,
            label,
            values,
            // total: values.reduce((a, b) => a + b, 0)
        });
    } catch (error) {
        console.log(error)
        console.error('Error:', error.message);
    }
}


async function markAttendance(req, res) {
    try {
        console.log(req.body)
        if (req.body.present == true) {
            const result = await sequelize.query(`insert into attendance(user_id,role_id,activity_id) values(${req.body.user_id},${req.body.role_id},${req.body.activity_id})`)
            return res.status(200).send({
                message: "Asistencia marcada",
                data: []
            })
        }
        else if (req.body.present == false) {
            const result = await sequelize.query(`delete from attendance where user_id =${req.body.user_id} and role_id = ${req.body.role_id} and activity_id =${req.body.activity_id}`)
            return res.status(200).send({
                message: "Asistencia sin marcar",
                data: []
            })
        }
    }
    catch (e) {
        console.log(e)
        return res.status(500).json({ message: 'Server Error' });
    }
}


async function notAttendedList(req, res) {
    console.log(req.body)
    if (!req.body.activity_id) {
        console.log("error date")
        return res.status(400).send({
            message: "activity id is required",
            data: []
        })
    }
    else {
        const act = await sequelize.query(`select *  from  usuarios_actividad where id= "${req.body.activity_id}"`, { type: sequelize.QueryTypes.SELECT })
        //  } ,replacements :{ 
        //     cabildo: cabildo || null,
        //     district: district || null,} })
        //   console.log(act[0].nombre,"activity name")

        if ((act[0].nombre).includes("DJM")) {
            var division_id = 3
        }
        else if ((act[0].nombre).includes("DJF")) {
            var division_id = 4
        }
        else if ((act[0].nombre).includes("DAMAS")) {
            var division_id = 1
        }
        else if ((act[0].nombre).includes("Caballeros")) {
            var division_id = 2
        }
        else if ((act[0].nombre).includes("DEP")) {
            var division_id = 5
        }
        var level = await sequelize.query(`select usuarios_area.nombre as area,fetcha_de_actividad, usuarios_cabildo.nombre as cabildo, usuarios_distritosgip.nombre as distrito  from usuarios_actividad 
         
         inner join usuarios_area on usuarios_area.id = usuarios_actividad.area_id left join usuarios_cabildo on usuarios_cabildo.id = usuarios_actividad.cabildo_id
         left join usuarios_distritosgip on usuarios_distritosgip.id = usuarios_actividad.distrito_id
         where usuarios_actividad.id = ${req.body.activity_id}`, { type: sequelize.QueryTypes.SELECT })
        console.log('level: ', level);
        // console.log(`${level[0].fetcha_de_actividad}, ${level[0].area} ${level[0].cabildo?cabildo:""} ${level[0].distrito?distrito:""}`)

        // var act = await sequelize.query(`select * from usuarios_actividad where id = ${req.body.activity_id}`,{type : sequelize.QueryTypes.SELECT})
        const cabildo = req.body.cabildo_id || act[0].cabildo_id
        const district = req.body.distrito_id || act[0].distrito_id
        const whereClause = `and 1
     AND (:division_id IS NULL OR division_id = :division_id)
     AND (:cabildo IS NULL OR cabildo_id = :cabildo)
     AND (:district IS NULL OR distrito_sgip_id = :district)  `;


        const att = await sequelize.query(`select user_id from usuarios_actividad inner join attendance on usuarios_actividad.id = attendance.activity_id where attendance.activity_id= "${req.body.activity_id}" and role_id = 1`, { type: sequelize.QueryTypes.SELECT })
        const result1 = await sequelize.query(`select usuarios_usuario.id,usuario_id as Cedula_id, sgi_id , nombre_completo, telefono, division.nombre as division from usuarios_usuario inner join usuarios_division as division on division.id = usuarios_usuario.division_id where 
     area_id = ${act[0].area_id}  ${whereClause} order by nombre_completo`, {
            type: sequelize.QueryTypes.SELECT, replacements: {
                cabildo: cabildo || null,
                district: district || null,
                division_id: division_id || null
            }
        })

        for (var i in result1) {
            // result[i].present = false
            for (var j in att) {
                if (result1[i].id == att[j].user_id) {
                    result1.splice(i, 1)
                }
            }
        }

        // console.log(result1,"result1")
        return res.status(200).send({
            message: "data fetched successfully",
            data: result1,
            heading: `${level[0].fetcha_de_actividad}, ${level[0].area} ${level[0].cabildo ? level[0].cabildo : ""} ${level[0].distrito ? level[0].distrito : ""}`,
            total: result1.length
        })
    }
}


async function getAttendanceList(req, res) {
    console.log(req.body)
    if (!req.body.activity_id) {
        console.log("error date")
        return res.status(400).send({
            message: "activity id is required",
            data: []
        })
    }
    else {
        // console.log(req.body)
        var level = await sequelize.query(`select usuarios_area.nombre as area,fetcha_de_actividad, usuarios_cabildo.nombre as cabildo, usuarios_distritosgip.nombre as distrito  from usuarios_actividad 
         inner join usuarios_area on usuarios_area.id = usuarios_actividad.area_id left join usuarios_cabildo on usuarios_cabildo.id = usuarios_actividad.cabildo_id
         left join usuarios_distritosgip on usuarios_distritosgip.id = usuarios_actividad.distrito_id
         where usuarios_actividad.id = ${req.body.activity_id}`, { type: sequelize.QueryTypes.SELECT })
        console.log('level: ', level);
        //  console.log(`${level[0].fetcha_de_actividad}, ${level[0].area} ${level[0].cabildo?cabildo:""} ${level[0].distrito?distrito:""}`)

        var result1 = await sequelize.query(`select usuarios_usuario.id,usuario_id as Cedula_id, sgi_id,nombre_completo, telefono, division.nombre as division from usuarios_usuario inner join usuarios_division as division on division.id = usuarios_usuario.division_id inner join attendance as att on att.user_id = usuarios_usuario.id
         where att.activity_id = ${req.body.activity_id} and att.role_id = 1 order by nombre_completo`, { type: sequelize.QueryTypes.SELECT })
        for (var i in result1) {
            result1[i].user_type = "Miembro"

        }
        const result = await sequelize.query(`select invitados.id,invitados.nombre, invitados.appelido, invitados.telefono, division.nombre as division from invitados inner join usuarios_division as division on division.id = invitados.division inner join attendance as att on att.user_id = invitados.id
     where att.activity_id = ${req.body.activity_id} and att.role_id = 2 order by invitados.nombre`, { type: sequelize.QueryTypes.SELECT })
        console.log(result, "result")
        result1 = result1.concat(result)
        for (var i in result) {
            result[i].user_type = "Invitado"
            result[i].Cedula_id = "-"
            result[i].sgi_id = "-"
            result[i].nombre_completo = result[i].nombre + " " + result[i].appelido
        }

        //  console.log(result1,"result1")
        return res.status(200).send({
            message: "data fetched successfully",
            data: result1,
            heading: `${level[0].fetcha_de_actividad}, ${level[0].area} ${level[0].cabildo ? level[0].cabildo : ""} ${level[0].distrito ? level[0].distrito : ""}`,
            total: result1.length
        })
    }
}




//************************* USER MANAGEMENT APIS *********************/


//API to add anew member
async function addNewMember(req, res) {
    console.log(req.body, "add")
    const { primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, division_id, area_id, cabildo_id, distrito_sgip_id, sexo_id, grupo_id, responsable,
        fecha_nacimiento, invitee_id, invitee_fecha_nacimento, fechadeingreso, provincia, distrito_new_id, shakubuku, responsable_gohonzon, nivel_responsable, nacionalidad_id, nivel_budista_id, telefono, celular, direccion, email, cargo_responsable_id, Cedula_id, profesion_id, estado_id
    } = req.body
    // fecha_nacimiento: '1970-01-01T00:00:00.000Z'
    const findemail = await sequelize.query(`select * from usuarios_usuario where email = "${email}" or usuario_id = '${Cedula_id}'`, { type: sequelize.QueryTypes.SELECT })
    if (findemail.length) {
        return res.status(400).send({
            message: "User already registered",
            data: []
        })
    }

    const rows = await sequelize.query(`SELECT id FROM usuarios_grupo WHERE nombre = "${grupo_id}"`, { type: sequelize.QueryTypes.SELECT });
    console.log('rows: ', rows);
    var grupo
    if (rows.length) {
        grupo = rows[0].id;
    } else {
        const inserted = await sequelize.query(`INSERT INTO usuarios_grupo (nombre) VALUES ('${grupo_id}')`);
        console.log('inserted: ', inserted);
        grupo = inserted[0];
    }
    var date = new Date()
    var fecha = (fecha_nacimiento.toString()).slice(0, 10)
    let sgi_id = await sequelize.query(`SELECT max(sgi_id) as max  FROM usuarios_usuario`, { type: sequelize.QueryTypes.SELECT });
    sgi_id = sgi_id[0].max
    var currentId = parseInt(sgi_id.substring(4));
    var newId = currentId + 10
    var newSgi_id = "SGIP" + newId;
    let dateFechaNaci = new Date(fecha_nacimiento);
    dateFechaNaci.setHours(dateFechaNaci.getHours() + 5);
    dateFechaNaci.setMinutes(dateFechaNaci.getMinutes() + 30);
    dateFechaNaci = dateFechaNaci.toISOString();

    let dateFechaIngreso = new Date(fechadeingreso);
    dateFechaIngreso.setHours(dateFechaIngreso.getHours() + 29);
    dateFechaIngreso.setMinutes(dateFechaIngreso.getMinutes() + 30);
    dateFechaIngreso = dateFechaIngreso.toISOString();
    
    var data = {
        primer_nombre: primer_nombre,
        primer_apellido: primer_apellido,
        // fecha_nacimiento : fecha_nacimiento,
        segundo_nombre: segundo_nombre,
        sgi_id : newSgi_id,
        segundo_apellido: segundo_apellido,
        nombre_completo: primer_nombre + " " + segundo_nombre + " " + primer_apellido + " " + segundo_apellido,
        sexo_id: sexo_id,
        responsable: responsable || 0,
        nivel_responsable_id: nivel_responsable || null,
        cargo_responsable_id: cargo_responsable_id || null,
        fecha_nacimiento: (dateFechaNaci.toString()).slice(0, 10),
        usuario_id: Cedula_id,
        direccion: direccion,
        email: email,
        celular: celular,
        telefono: telefono,
        // fecha_ingreso : date.getFullYear()+"-"+(date.getMonth()+1) +"-"+ date.getDate(),
        fecha_ingreso: (dateFechaIngreso.toString()).slice(0, 10),//fechadeingreso ? (fechadeingreso.toString()).slice(0, 10) : (date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate()),
        profesion_id: profesion_id ? profesion_id : 0,
        estado_id: estado_id,
        area_id: area_id,
        cabildo_id: cabildo_id,
        distrito_sgip_id: distrito_sgip_id,
        grupo_id: grupo,
        division_id: division_id,
        nivel_budista_id: nivel_budista_id,
        responsable_gohonzon: responsable_gohonzon,
        nacionalidad_id: nacionalidad_id,
        provincia: provincia,
        distrito: distrito_new_id,
        shakubuku: shakubuku
    }


    if (req.body.invitee_id) {
        sequelize.query(`delete from invitados where id = ${req.body.invitee_id}`)
    }
    const query = `
      INSERT INTO usuarios_usuario
        (primer_nombre,sexo_id,  responsable, nivel_responsable_id, cargo_responsable_id, usuario_id,nombre_completo,fecha_nacimiento,fecha_ingreso,
        primer_apellido, segundo_nombre, segundo_apellido, direccion, email, celular, telefono, profesion_id,
        estado_id, area_id, cabildo_id, distrito_sgip_id, grupo_id, division_id, nivel_budista_id, responsable_gohonzon,nacionalidad_id,   provincia_id , distrito_id , shakubuku ,sgi_id  )
        VALUES
        (:primer_nombre,:sexo_id,  :responsable, :nivel_responsable_id, :cargo_responsable_id, :usuario_id,:nombre_completo,:fecha_nacimiento,:fecha_ingreso,
        :primer_apellido, :segundo_nombre, :segundo_apellido, :direccion, :email, :celular, :telefono, :profesion_id,
        :estado_id, :area_id, :cabildo_id, :distrito_sgip_id, :grupo_id, :division_id, :nivel_budista_id, :responsable_gohonzon, :nacionalidad_id , :provincia , :distrito , :shakubuku , :sgi_id )`;
    var result = await sequelize.query(query, {
        replacements: {
            ...data
        }
    })
    for (var i in req.body.horizontal_groups) {
        sequelize.query(`insert into group_members(group_id,user_id) values(${req.body.horizontal_groups[i]},${result[0]})`)
    }
    if (req.body.responsable && req.body.nivel_responsable) {
        const password = random.getRandomPassword(10)
        console.log(password)
        req.email = email
        req.password = password
        const encrPassword = md5(password)

        const signupdata = {
            firstName: primer_nombre,
            lastName: primer_apellido,
            email: email,
            password: encrPassword,
        }

        const id = await leader.create(signupdata, (err, data) => {
            if (err) {
                return res.status(500).json({ message: 'Server Error' });
            }

        })
        flag = await helper.sendLoginInfo(req, res)
        console.log(flag)
    }


    return res.status(200).send({
        message: "Member Added",
        data: result[0],
        success_message: `Miembro agregado exitosamente`
    })
}

// API to get the list of all members ,members only and leader only
async function getAllUsers(req, res) {
    try {
        console.log(req.body, "userlist")
        const user_type = req.body.user_type
        if (!user_type) {
            var str = `1`
        }
        else if (user_type == 1) {
            var str = `1`
        }
        else if (user_type == 3) {
            var str = `responsable = false`
        }
        else if (user_type == 2) {
            var str = `responsable = true`
        }//inner join usuarios_usuario on i.invitado_por= usuarios_usuario.id
        else if (user_type == 4) {
            const area = req.body.area_id
            const cabildo = req.body.cabildo_id
            const district = req.body.distrito_id
            const whereClause =
                `WHERE 1
        AND (:area IS NULL OR i.area_id = :area)
        AND (:cabildo IS NULL OR i.cabildo_id = :cabildo)
        AND (:district IS NULL OR i.distrito_sgip_id = :district) `
            var inv = await sequelize.query(`select i.id, i.nombre,i.appelido,i.movil,i.appelido,i.fetcha_nacimiento,s.nombre as genero,i.direccion,us.nombre as division from invitados as i 
            inner join usuarios_division as us on us.id = i.division 
            inner join usuarios_sexo as s on s.id = i.genero ${whereClause} order by i.nombre`, {
                type: sequelize.QueryTypes.SELECT, replacements: {
                    area: area || null,
                    cabildo: cabildo || null,
                    district: district || null
                }
            })
            for (var i in inv) {
                inv[i].Cedula_id = ""
                inv[i].nombre_completo = inv[i].nombre + " " + inv[i].appelido
            }
            console.log(inv[0], "resp")
            return res.status(200).send({
                message: "data fetched",
                data: inv
            })
        }
        var where = await helper.findRoleDetails(req, res)
        const area = req.body.area_id || where.area_id;
        const cabildo = req.body.cabildo_id || where.cabildo_id;
        const district = req.body.district_id || where.distrito_id;
        const division = req.body.division_id
        const horizontal_group = req.body.horizontal_group
        const grupo = req.body.grupo
        const responsable = req.body.responsable;
        const nivel_responsable = req.body.nivel_responsable_id;
        const responsable_gohonzon = req.body.responsable_gohonzon;
        // const nivel_budista = req.body.selected_nivel_budista_id
        const nivel_budista = req.body.nivel_budista
        const estado = req.body.estado_id

        const whereClause =
            `WHERE 1=1
        AND (:area IS NULL OR area_id = :area)
        AND (:cabildo IS NULL OR cabildo_id = :cabildo)
        AND (:district IS NULL OR distrito_sgip_id = :district)  
        AND (:division IS NULL OR division_id = :division)
        AND (:responsable IS NULL OR responsable = :responsable) 
        AND (:nivel_responsable IS NULL OR nivel_responsable_id = :nivel_responsable) 
        AND (:responsable_gohonzon IS NULL OR responsable_gohonzon = :responsable_gohonzon)  
        AND (:nivel_budista IS NULL OR nivel_budista_id = :nivel_budista)
        AND (:estado IS NULL OR estado_id = :estado)`



        if (horizontal_group) {
            console.log("if") //  //
            var q = `select a.id ,a.usuario_id as Cedula_id ,a.sgi_id,a.email,a.responsable, a.nombre_completo, area.nombre as area,cargo_responsable_id, c.nombre as cabildo, d.nombre as distrito,g.nombre as grupo ,s.nombre as status from usuarios_usuario as a 
            inner join usuarios_area as area on area.id= a.area_id inner join usuarios_cabildo as c on c.id= a.cabildo_id 
            inner join group_members on group_members.user_id = a.id
            inner join usuarios_distritosgip 
            as d on d.id= a.distrito_sgip_id left join usuarios_grupo as g on g.id = a.grupo_id
            inner join usuarios_estado as s on s.id = a.estado_id ${whereClause} and ${str} and group_members.group_id = ${horizontal_group} order by nombre_completo`;
        }
        else {
            var q = `select a.id ,a.usuario_id as Cedula_id ,a.sgi_id,a.email,a.responsable, a.nombre_completo, area.nombre as area,cargo_responsable_id, c.nombre as cabildo, d.nombre as distrito,g.nombre as grupo ,s.nombre as status from usuarios_usuario as a 
        inner join usuarios_area as area on area.id= a.area_id inner join usuarios_cabildo as c on c.id= a.cabildo_id 
        inner join usuarios_distritosgip as d on d.id= a.distrito_sgip_id left join usuarios_grupo as g on g.id = a.grupo_id
        inner join usuarios_estado as s on s.id = a.estado_id ${whereClause} and ${str} order by a.nombre_completo`;
        }
        const result = await sequelize.query(q, {
            type: sequelize.QueryTypes.SELECT, replacements: {
                area: area || null,
                cabildo: cabildo || null,
                district: district || null,
                division: division || null,
                responsable: responsable || null,
                responsable_gohonzon: responsable_gohonzon || null,
                nivel_responsable: nivel_responsable || null,
                nivel_budista: nivel_budista || null,
                estado: estado || null,
                grupo: grupo || null
            }
        })

        for (var i in result) {
            if (result[i].responsable == 1) {
                var qw = await sequelize.query(`select is_blocked from auth_leader where email = "${result[i].email}"`, { type: sequelize.QueryTypes.SELECT })
                if (qw.length) {
                    result[i].is_blocked = qw[0].is_blocked
                }
            }
            else {
                result[i].is_blocked = 0
            }
        }
        // console.log(result,"user list")
        return res.status(200).send({
            message: "data fetched",
            data: result
        })
    } catch (e) {
        console.log(e)
        return res.status(500).json({ message: 'Server Error' });
    }
}


async function getInviteeList(req, res) {
    try {
        var result = await sequelize.query(`select i.id, i.nombre,i.appelido,i.movil,i.appelido,i.fetcha_nacimiento,i.genero,i.direccion,usuarios_usuario.nombre_completo,us.nombre as division from invitados as i inner join usuarios_division as us on us.id = i.division inner join usuarios_usuario on i.invitado_por= usuarios_usuario.id order by i.nombre`)
        return res.status(200).send({
            message: "data fetched",
            data: result
        })
    }
    catch (e) {
        console.log(e)
        return res.status(500).json({ message: 'something went wrong!' });
    }
}


async function getInviteeDetails(req, res) {
    try {
        var result = await sequelize.query(`select i.id, i.nombre,i.appelido,i.movil,i.appelido,i.fetcha_nacimiento,i.genero,i.direccion,usuarios_usuario.nombre_completo,us.nombre as division from invitados as i inner join usuarios_division as us on us.id = i.division inner join usuarios_usuario on i.invitado_por= usuarios_usuario.id where i.id = ${req.body.user_id}`)
        return res.status(200).send({
            message: "data fetched",
            data: result
        })
    }
    catch (e) {
        console.log(e)
        return res.status(500).json({ message: 'something went wrong!' });
    }
}


//inner join usuarios_usuario on i.invitado_por= usuarios_usuario.id
async function getUserDetails(req, res) {
    try {
        console.log(req.body, "req get details")
        if (req.body.profile_type == "member") {
            let query = `select user.id, user.sgi_id ,user.nacionalidad_id ,primer_nombre , user.segundo_nombre, user.primer_apellido, user.segundo_apellido,  user.usuario_id as "Cedula_id",user.sexo_id,
        user.fecha_nacimiento,user.cargo_responsable_id, user.direccion , user.email, user.celular , user.telefono, user.profesion_id,ue.nombre as estado,user.estado_id,user.responsable, user.nivel_responsable_id as "nivel_responsable" ,user.area_id  ,user.cabildo_id ,
        user.distrito_sgip_id , grp.nombre as grupo_id , user.division_id , user.responsable_gohonzon,user.nivel_budista_id,user.shakubuku, user.provincia_id as provincia,user.distrito_id as distrito_new_id,user.fecha_ingreso as fechadeingreso
        from usuarios_usuario as user left join usuarios_grupo as grp on grp.id = user.grupo_id
        inner join usuarios_estado as ue on ue.id = user.estado_id  
        inner join usuarios_nivelbudista as nb on nb.id = user.nivel_budista_id 
        inner join usuarios_sexo as us on us.id = user.sexo_id 
        where user.id = ${req.body.id}`
            var result = await sequelize.query(query, { type: sequelize.QueryTypes.SELECT })
            
            result[0].fechadeingreso = new Date(result[0].fechadeingreso)//(.toString()).slice(0, 10)
            let mins = result[0].fechadeingreso.getTimezoneOffset();
            
            result[0].fechadeingreso.setMinutes(result[0].fechadeingreso.getMinutes() -(mins+300));

            console.log('result.fechadeingreso: ', result[0].fechadeingreso);
            console.log(result)
            var hrgrp = []
            var hor = await sequelize.query(`select distinct 
        ug.id from group_members inner join usuarios_grupohorizontal as ug on ug.id = group_members.group_id  where user_id = ${req.body.id} `, { type: sequelize.QueryTypes.SELECT })
            if (hor.length) {
                for (var i in hor) {
                    hrgrp.push(hor[i].id)
                }
                result[0].horizontal_groups = hrgrp
            }
            else {
                result[0].horizontal_groups = []
            }
            const subscription = []

            var subs = await sequelize.query(`select * from SUBSCRIPTION where user_id = ${req.body.id}`, { type: sequelize.QueryTypes.SELECT })
            for (var i in subs) {
                if (subs[i].DESCRIPTION == "Puente de Paz (Revista Mensual)") {
                    subscription.push({ id: 1, nombre: `Puente de Paz   (${subs[i].QTY})` })
                }
                else if (subs[i].DESCRIPTION == "Esperanza del Futuro (Revista Bimensual)") {
                    subscription.push({ id: 2, nombre: `Esperanza del Futuro   (${subs[i].QTY})` })
                }
                else if (subs[i].DESCRIPTION == "Visión XXI (Revista Cuatrimestral)") {
                    subscription.push({ id: 3, nombre: `Visión XXI   (${subs[i].QTY})` })
                }
            }
            console.log('subscription: ', subscription);
            result[0].subscription = subscription
        }
        else if (req.body.profile_type == "invitee") {
            var result = await sequelize.query(`select i.id,i.email, i.nombre as primer_nombre,i.appelido as primer_apellido,i.movil as celular,i.telefono,
        i.fetcha_nacimiento as fecha_nacimiento,i.genero as sexo_id,i.direccion as direccion,i.division as division_id from invitados as i inner join usuarios_division as us on us.id = i.division 
         where i.id = ${req.body.id}`, { type: sequelize.QueryTypes.SELECT })
        }
        console.log(result, "result")
        return res.status(200).send({
            message: "data fetched successfully",
            data: [result[0]]
        })
    }
    catch (e) {
        console.log(e)
        return res.status(500).json({ message: 'Server Error' });
    }
}

async function leaderSignup(req, res) {
    console.log(req.body, "signup")
    try {

        if (req.body.profile_type == "invitee") {
            var result = await sequelize.query(`select * from invitados where id = ${req.body.user_id}`, { type: sequelize.QueryTypes.SELECT })
            result = result[0]
            // console.log(result)
            const { primer_nombre, primer_apellido, direccion, email, celular, telefono, division_id, sexo_id } = req.body
            var data = {
                nombre: primer_nombre || result.nombre,
                appelido: primer_apellido || result.appelido,
                direccion: direccion || result.direccion,
                email: email || result.email,
                movil: celular || result.movil,
                telefono: telefono || result.telefono,
                division: division_id || result.division,
                genero: sexo_id || result.genero
            }
            const resl = await sequelize.query(`update invitados set nombre= :nombre,appelido = :appelido, direccion = :direccion, email = :email, 
            movil = :movil,telefono = :telefono, division = :division,genero = :genero
            where id = ${req.body.user_id}`, {
                replacements: {
                    ...data
                }
            })

        }
        else if (req.body.profile_type == "member") {
            var result = await sequelize.query(`select * from usuarios_usuario where id = ${req.body.user_id}`, { type: sequelize.QueryTypes.SELECT })
            result = result[0]
            var adm = await sequelize.query(`select responsable,nivel_responsable_id,nombre_completo from usuarios_usuario where id = ${req.token.id}`, { type: sequelize.QueryTypes.SELECT })

            // console.log(req.token,"edit profile token")
            var test = await sequelize.query(`select responsable from usuarios_usuario where id = ${req.body.user_id}`, { type: sequelize.QueryTypes.SELECT })

            var flag = false;
            if (req.body.responsable && req.body.nivel_responsable && adm[0].responsable == 1 && adm[0].nivel_responsable_id == 1 || req.token.id != result.id) {
                const userexists = await sequelize.query(`select * from usuarios_usuario where id = ${req.body.user_id}`, { type: sequelize.QueryTypes.SELECT })
                if (userexists.length) {
                    const { email, primer_nombre, primer_apellido, division_id, area_id, cabildo_id, distrito_sgip_id } = userexists[0]
                    const password = random.getRandomPassword(10)
                    // console.log(password)
                    var ar = await sequelize.query(`select nombre from usuarios_area where id = ${area_id}`, { type: sequelize.QueryTypes.SELECT })
                    var cb = await sequelize.query(`select nombre from usuarios_cabildo where id = ${cabildo_id}`, { type: sequelize.QueryTypes.SELECT })
                    var ds = await sequelize.query(`select nombre from usuarios_distritosgip where id = ${distrito_sgip_id}`, { type: sequelize.QueryTypes.SELECT })
                    var heading = ""
                    var ans = await helper.findRoleDetails(req, res)
                    if (ans.level == "Área") {

                        heading = ar[0].nombre
                    }
                    if (ans.level == "Cabildo") {
                        heading = ar[0].nombre + " " + cb[0].nombre
                    }
                    if (ans.level == "Distrito") {
                        heading = ar[0].nombre + " " + cb[0].nombre + " " + ds[0].nombre
                    }
                    req.heading = heading
                    req.email = email
                    req.password = password
                    const encrPassword = md5(password)

                    const signupdata = {
                        firstName: primer_nombre,
                        lastName: primer_apellido,
                        email: email,
                        password: encrPassword,

                    }

                    const data = await sequelize.query(`update usuarios_usuario set responsable = ${req.body.responsable},nivel_responsable_id = ${req.body.nivel_responsable} where id = ${req.body.user_id}`)
                    // console.log(data, "data")
                    if (test[0].responsable == 0) {
                        // const id = await leader.create(signupdata, (err, data) => {
                        //     if (err) {
                        //         return res.status(500).json({ message: 'Server Error' });
                        //     }

                        // })
                        // flag = await helper.sendLoginInfo(req, res)
                        console.log(`req`, req.password, req.heading)
                        console.log(flag)
                    }
                }
                else {
                    return res.status(400).send({
                        message: "email does not exists"
                    })
                }
            }


            const { primer_nombre, primer_apellido, segundo_nombre, segundo_apellido, direccion, email, celular, telefono, profesion_id,fecha_nacimiento,fechadeingreso,Cedula_id,nacionalidad_id,
                estado_id, area_id, cargo_responsable_id,sexo_id, cabildo_id, distrito_sgip_id, grupo_id, division_id, responsable_gohonzon, nivel_budista_id, nivel_responsable, provincia, distrito_new_id, shakubuku } = req.body
            if (grupo_id) {
                const rows = await sequelize.query(`SELECT id FROM usuarios_grupo WHERE nombre = "${grupo_id}"`, { type: sequelize.QueryTypes.SELECT });
                var grupo
                if (rows.length) {
                    grupo = rows[0].id;
                } else {
                    const [inserted] = await sequelize.query(`INSERT INTO usuarios_grupo (nombre) VALUES ('${grupo_id}')`);
                    grupo = inserted.insertId;
                }
            }
            var date = new Date()


            // fecha de ingreso and nacimento date fix..

            let dateFechaNaci = new Date(fecha_nacimiento);
            // dateFechaNaci.setHours(dateFechaNaci.getHours() );
            // dateFechaNaci.setMinutes(dateFechaNaci.getMinutes());
            dateFechaNaci = dateFechaNaci.toISOString();

            let dateFechaIngreso = new Date(fechadeingreso);
            // dateFechaIngreso.setHours(dateFechaIngreso.getHours());
            // dateFechaIngreso.setMinutes(dateFechaIngreso.getMinutes());
            // dateFechaIngreso = dateFechaIngreso.toISOString();

            if (adm[0].responsable == 1) {
                // const utcDate = fecha_nacimiento
                // var estDateString = utcDate.toLocaleString('en-US', {timeZone: 'America/New_York'})
                console.log("edit if")
                var data = {
                    primer_nombre: primer_nombre || result.primer_nombre,
                    edicion: date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds(),
                    primer_apellido: primer_apellido || result.primer_apellido,
                    segundo_nombre: segundo_nombre,
                    segundo_apellido: segundo_apellido,
                    fecha_ingreso: (dateFechaIngreso)|| result.fecha_ingreso,
                    nombre_completo: primer_nombre + " " + segundo_nombre + " " + primer_apellido + " " + segundo_apellido,
                    direccion: direccion || result.direccion,
                    email: email || result.email,
                    celular: celular || result.celular,
                    telefono: telefono,
                    usuario_id : Cedula_id || result.usuario_id,
                    profesion_id: profesion_id,              
                    fecha_nacimiento : (dateFechaNaci.toString()).slice(0, 10) || result.fecha_nacimiento,
                    estado_id: estado_id || result.estado_id,
                    area_id: area_id || result.area_id,
                    cabildo_id: cabildo_id || result.cabildo_id,
                    distrito_sgip_id: distrito_sgip_id || result.distrito_sgip_id,
                    grupo_id: grupo || result.grupo_id,
                    division_id: division_id || result.division_id,
                    nivel_budista_id: nivel_budista_id || result.nivel_budista_id,
                    responsable_gohonzon: responsable_gohonzon || result.responsable_gohonzon,
                    nivel_responsable_id: nivel_responsable || result.nivel_responsable_id,
                    cargo_responsable_id: cargo_responsable_id || null,
                    distrito_id: distrito_new_id || result.distrito_id,
                    provincia_id: provincia || result.provincia_id,
                    shakubuku: shakubuku || result.shakubuku,
                    edited_by: adm[0].nombre_completo,
                    sexo_id : sexo_id,
                    nacionalidad_id : nacionalidad_id || result.nacionalidad_id
                }
                // console.log('fecha_ingreso: ', fecha_ingreso);

            }
            else {
                console.log("edit else")
                var data = {
                    primer_nombre: primer_nombre || result.primer_nombre,
                    edicion: date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds(),
                    primer_apellido: primer_apellido || result.primer_apellido,
                    segundo_nombre: segundo_nombre,
                    segundo_apellido: segundo_apellido,
                    nombre_completo: primer_nombre + " " + segundo_nombre + " " + primer_apellido + " " + segundo_apellido,
                    direccion: direccion || result.direccion,
                    email: email || result.email,
                    celular: celular || result.celular,
                    telefono: telefono,
                    profesion_id: profesion_id,
                    fecha_ingreso: (dateFechaIngreso)  || result.fecha_ingreso,
                    fecha_nacimiento : (dateFechaNaci.toString()).slice(0, 10) || result.fecha_nacimiento,
                    estado_id: estado_id || result.estado_id,
                    area_id: area_id || result.area_id,
                    cabildo_id: cabildo_id || result.cabildo_id,
                    distrito_sgip_id: distrito_sgip_id || result.distrito_sgip_id,
                    grupo_id: grupo || result.grupo_id,
                    sexo_id :  sexo_id,
                    usuario_id : Cedula_id || result.usuario_id,
                    division_id: division_id || result.division_id,
                    nivel_budista_id: nivel_budista_id || result.nivel_budista_id,
                    responsable_gohonzon: responsable_gohonzon || result.responsable_gohonzon,
                    nivel_responsable_id: nivel_responsable || result.nivel_responsable_id,
                    cargo_responsable_id: cargo_responsable_id || null,
                    distrito_id: distrito_new_id || result.distrito_id,
                    provincia_id: provincia || result.provincia_id,
                    shakubuku: shakubuku || result.shakubuku,
                    edited_by: adm[0].nombre_completo,
                    nacionalidad_id : nacionalidad_id || result.nacionalidad_id
                }
            }
            await sequelize.query(`delete from group_members where user_id = ${req.body.user_id}`)

            for (var i in req.body.horizontal_groups) {
                const result = await sequelize.query(`insert into group_members(group_id,user_id) values(${req.body.horizontal_groups[i]},${req.body.user_id})`)
                // console.log(result)
            }
            const resl = await sequelize.query(`update usuarios_usuario set primer_nombre= :primer_nombre,primer_apellido= :primer_apellido, segundo_nombre = :segundo_nombre,sexo_id = :sexo_id,
            shakubuku = :shakubuku,nivel_responsable_id =:nivel_responsable_id,nacionalidad_id = :nacionalidad_id,usuario_id = :usuario_id,provincia_id = :provincia_id,distrito_id = :distrito_id,
        segundo_apellido = :segundo_apellido,nombre_completo = :nombre_completo, direccion = :direccion, email = :email, celular = :celular,telefono = :telefono, profesion_id = :profesion_id,
        estado_id = :estado_id, area_id =:area_id, cabildo_id = :cabildo_id ,  distrito_sgip_id = :distrito_sgip_id, grupo_id = :grupo_id,fecha_nacimiento = :fecha_nacimiento,fecha_ingreso = :fecha_ingreso,
        division_id = :division_id,nivel_budista_id = :nivel_budista_id, responsable_gohonzon= :responsable_gohonzon,cargo_responsable_id = :cargo_responsable_id, edicion = :edicion,edited_by  = :edited_by
        where id = ${req.body.user_id}`, {
                replacements: {
                    ...data
                }
            })

        }
        return res.status(200).send({
            message: "Detalles de usuario actualizados",
            data: [],
        })
    }
    catch (e) {
        console.log(e)
        return res.status(500).json({ message: 'Server Error' });
    }
}

//API to block/unblock a leader
async function blockleader(req, res) {
    try {
        console.log(req.body)
        if (req.body.block == 0) {
            var key = "Unblocked"
        }
        else if (req.body.block == 1) {
            var key = "Blocked"
        }
        var resl = await sequelize.query(`select * from usuarios_usuario where id = ${req.body.user_id}`, { type: sequelize.QueryTypes.SELECT })
        const result = await leader.update({ is_blocked: req.body.block }, { where: { email: resl[0].email } })
        return res.status(200).send({
            message: `Leader ${key} successfully`,
            data: []
        })
    }
    catch (e) {
        console.log(e.name, e.message);
        return res.status(500).json({ message: 'Server Error' });
    }
}



//Change password for leaders
async function changepassword(req, res) {
    console.log(req.body, "change passwod")
    const result = await leader.findOne({
        where: { id: req.body.user_id }
    })
    // if (result.password == md5(req.body.old_password)) {
    leader.update(
        { password: md5(req.body.new_password) },
        { where: { id: req.body.user_id } }
    )
    return res.status(200).send({
        message: "Password updated successfuly",
        status: true
    })
    // }
    // else {
    //     return res.status(400).send({
    //         message: "Old password is incorrect",
    //         status: false
    //     })
    // }
}



//********************* HORIZONTAL GROUP APIS **********************/

async function horizontalGroupList(req, res) {
    var result = await sequelize.query(`select * from usuarios_grupohorizontal`, { type: sequelize.QueryTypes.SELECT })
    for (var i in result) {
        var rs = await sequelize.query(`select count(*) as count from group_members where group_id = ${result[i].id}`, { type: sequelize.QueryTypes.SELECT })
        result[i].member_count = rs[0].count
    }
    return res.status(200).send({
        message: "data fetched",
        data: result
    })
}

async function addHorizontalGroup(req, res) {
    var result = await sequelize.query(`insert into usuarios_grupohorizontal(nombre) values("${req.body.group_name}")`)
    return res.status(200).send({
        message: "group added",
        data: { id: result[0] }
    })
}

async function assignCreds(req, res) {
    try {
        const { user_id, email, primer_nombre, primer_apellido, responsable, nivel_responsable, area_id, cabildo_id, distrito_sgip_id } = req.body
        const password = random.getRandomPassword(10)
        if (!email || email == " " || email == "0@gmail.com") {
            return res.status(400).json({ message: 'Correo electrónico invalido. Favor corregir.' });
        }
        if (responsable == 0) {
            return res.status(400).json({ message: 'Campo de responsable inválido. Favor verificar' });
        }
        console.log(password)
        req.email = email
        req.password = password
        const encrPassword = md5(password)
        var ar = await sequelize.query(`select nombre from usuarios_area where id = ${area_id}`, { type: sequelize.QueryTypes.SELECT })
        var cb = await sequelize.query(`select nombre from usuarios_cabildo where id = ${cabildo_id}`, { type: sequelize.QueryTypes.SELECT })
        var ds = await sequelize.query(`select nombre from usuarios_distritosgip where id = ${distrito_sgip_id}`, { type: sequelize.QueryTypes.SELECT })
        var heading = ""
        var ans = await helper.findRoleDetails(req, res)
        if (ans.level == "Área") {

            heading = ar[0].nombre
        }
        if (ans.level == "Cabildo") {
            heading = ar[0].nombre + " " + cb[0].nombre
        }
        if (ans.level == "Distrito") {
            heading = ar[0].nombre + " " + cb[0].nombre + " " + ds[0].nombre
        }
        req.heading = heading
        const signupdata = {
            firstName: primer_nombre,
            lastName: primer_apellido,
            email: email,
            password: encrPassword,
        }
        const leaderexists = await leader.findOne({ where: { email } })
        if (leaderexists) {
            await leader.update({ password: encrPassword }, { where: { email } })
        }
        else {
            const id = await leader.create(signupdata, (err, data) => {
                if (err) {
                    console.log('err: ', err);
                    return res.status(500).json({ message: 'Server Error' });
                }

            })
        }
        const data = await sequelize.query(`update usuarios_usuario set responsable = ${responsable},nivel_responsable_id = ${nivel_responsable} where usuario_id = '${user_id}'`)

        flag = await helper.sendLoginInfo(req, res)
        return res.status(200).send({
            message: "Credentials sent to user",
            data: []
        })
    }
    catch (error) {
        console.log('error: ', error);

        return res.status(500).send({
            message: 'internal serever error',
            data: []
        });
    }
}

async function addMembertoHrGroup(req, res) {
    console.log(req.body, "hr grp")
    for (var i in req.body.user_id) {
        var data = await sequelize.query(`delete from group_members where group_id = ${req.body.group_id}`)
    }
    for (var i in req.body.user_id) {
        var result = await sequelize.query(`insert into group_members(user_id,group_id) values(${req.body.user_id[i]},${req.body.group_id})`)
    }

    return res.status(200).send({
        message: "Miembros agregados exitosamente al grupo!!!",
        data: []
    })
}


async function horizontalGroupMemberList(req, res) {
    const area = req.body.area_id;
    const cabildo = req.body.cabildo_id;
    const district = req.body.district_id;

    const whereClause = `WHERE 1=1
    AND (:area IS NULL OR area_id = :area)
    AND (:cabildo IS NULL OR cabildo_id = :cabildo)
    AND (:district IS NULL OR distrito_sgip_id = :district)  `;
    const att = await sequelize.query(`select user_id from group_members inner join usuarios_grupohorizontal on usuarios_grupohorizontal.id = group_members.group_id where group_id= ${req.body.group_id}`, { type: sequelize.QueryTypes.SELECT })
    var query = `select usuarios_usuario.id,usuario_id as Cedula_id, sgi_id , nombre_completo, telefono, division.nombre as division from usuarios_usuario inner join usuarios_division as division on division.id = usuarios_usuario.division_id ${whereClause} `
    const result = await sequelize.query(query, {
        type: sequelize.QueryTypes.SELECT,
        replacements: {
            area: area || null,
            cabildo: cabildo || null,
            district: district || null
        }
    });
    //console.log(result)   
    console.log(att)
    for (var i in result) {
        result[i].present = false
        for (var j in att) {
            if (result[i].id == att[j].user_id) {
                result[i].present = true
            }
        }
    }
    return res.status(200).send({
        message: "data fetched successfully",
        data: result
    })
}



// ****************************************************************************************************************
// on the basis of divisions 
//1 -> Damas
//2 -> caballereos
//3 -> DJM
//4 -> DJF
//5 -> DEP
//6 -> N/A 
async function getUsersByDivision(req, res) {
    try {
        let division_id = req.body.division_id;
        let q = `select * from usuarios_usuario where division_id = ${division_id}`;
        const result = await sequelize.query(q)
        return res.json(result);
    } catch (e) {
        console.log(e.name, e.message);
        return res.status(500).json({ message: 'Server Error' });
    }
}


//for knowing users who have gohonzon in their home
function getUsersWhoHaveGohonzon(req, res) {
    try {
        let division_id = req.body.division_id;
        let q = `select * from usuarios_usuario where division_id = ${division_id}`;
        con.query(q, (error, result) => {
            if (error) {
                return res.status(500).json({ message: 'Server Error', e: error });
            }
            return res.json(result);
        })
    } catch (e) {
        console.log(e.name, e.message);
        return res.status(500).json({ message: 'Server Error' });
    }
}



//leaders dashboard

async function getDashboardLeaderAreaTable(req, res) {
    try {
        var where = await helper.findRoleDetails(req, res)
        console.log(where, "where from leader table")
        if (where.level == "ADMIN") {
            console.log("one")
            var q = `select Area.nombre as 'area_name' , count( Area.nombre ) as members_counts  from usuarios_usuario as Main inner join usuarios_area as Area where (Main.area_id = Area.id and Main.responsable = 1) group by area_name order by area_name`;
            var headings = ["S.No", "Área", "Total Responsable por área"]
        }
        else if (where.level == "Nacional") {
            console.log("one")
            var q = `select Area.nombre as 'area_name' , count( Area.nombre ) as members_counts  from usuarios_usuario as Main inner join usuarios_area as Area where (Main.area_id = Area.id and Main.responsable = 1) group by area_name order by area_name`;
            var headings = ["S.No", "Área", "Total Responsable por área"]
        }
        else if (where.level == "Área") {
            console.log("two")
            var q = `select cabildo.nombre as 'area_name' , count( cabildo.nombre ) as members_counts  from usuarios_usuario as Main inner join usuarios_cabildo as cabildo where (Main.cabildo_id = cabildo.id and Main.responsable = 1 and area_id = ${where.area_id}) group by area_name order by area_name`;
            var headings = ["S.No", "Cabildo", "Total Responsable por cabildo"]
        }
        else if (where.level == "Cabildo") {
            console.log("three level")
            var q = `select distrito.nombre as 'area_name' , count( distrito.nombre ) as members_counts  from usuarios_usuario as Main inner join usuarios_distritosgip as distrito where (Main.distrito_sgip_id = distrito.id and Main.responsable = 1 and area_id = ${where.area_id} and cabildo_id = ${where.cabildo_id}) group by area_name order by area_name`;
            var headings = ["S.No", "Distrito SGIP", "Total Responsable por Distrito"]
        }
        else if (where.level == "Distrito") {
            var q = `select grupo.nombre as 'area_name' , count( grupo.nombre ) as members_counts  from usuarios_usuario as Main inner join usuarios_grupo as grupo where (Main.grupo_id = grupo.id and Main.responsable = 1 and area_id = ${where.area_id} and cabildo_id = ${where.cabildo_id} and distrito_id =  ${where.distrito_id}) group by area_name order by area_name`;
            var headings = ["S.No", "Grupo", "Total Responsable por Grupo"]
        }
        // else if(where.level = "Responsable de Grupo" ){

        // }
        const result = await sequelize.query(q, { type: sequelize.QueryTypes.SELECT })
        return res.status(200).send({
            data: result,
            headings: headings
        });
        // return res.status(200).send(result);
    } catch (e) {
        console.log(e.name, e.message);
        return res.status(500).json({ message: 'Server Error' });
    }
}




async function reportForDivision(req, res) {
    try {
        // let q = `select usuarios_division.nombre as div_name , usuarios_estado.nombre as state_name from usuarios_usuario as Main inner join usuarios_division  on Main.division_id = usuarios_division.id inner join usuarios_estado on Main.estado_id = usuarios_estado.id`;
        //id,divsion_id 
        const division = req.body.division_id;
        // const area = req.body.area_id;
        const cabildo = req.body.cabildo_id;
        const district = req.body.district_id;
        const responsable = req.body.responsable;
        const nivel_responsable = req.body.nivel_responsable_id;
        const responsable_gohonzon = req.body.responsable_gohonzon;


        const whereClause = `WHERE estado_id = 1
    AND (:division IS NULL OR division_id = :division)
    AND (:area IS NULL OR area_id = :area)
    AND (:cabildo IS NULL OR cabildo_id = :cabildo)
    AND (:district IS NULL OR distrito_sgip_id = :district) 
    AND (:responsable IS NULL OR responsable = :responsable) 
    AND (:nivel_responsable IS NULL OR nivel_responsable_id = :nivel_responsable) 
    AND (:responsable_gohonzon IS NULL OR responsable_gohonzon = :responsable_gohonzon)  `;
        let q = `  SELECT
            usuarios_division.nombre AS div_name,
            usuarios_estado.nombre AS state_name,
            COUNT(*) AS count
        FROM
            usuarios_usuario AS Main
            INNER JOIN usuarios_division ON Main.division_id = usuarios_division.id
            INNER JOIN usuarios_estado ON Main.estado_id = usuarios_estado.id
            WHERE area_id = ${req.body.area_id}
        GROUP BY
            usuarios_division.nombre,
            usuarios_estado.nombre order by usuarios_division.nombre;
           `
        const result = await sequelize.query(q, {
            type: sequelize.QueryTypes.SELECT
            // , replacements: {
            //     division: division || null,
            //     area: area || null,
            //     cabildo: cabildo || null,
            //     district: district || null,
            //     responsable : responsable || null,
            //     responsable_gohonzon : responsable_gohonzon || null,
            //     nivel_responsable : nivel_responsable || null
            // }
        })
        console.log(result);
        //console.log(result, "result..");
        // let divOptions = ["Caballeros","Damas"  , "DJM" , "DJF" , "DEP" , "N/A"];
        // let stateOptions = ["ACTIVO" ,  "FALLECIDO" ,"INACTIVO" , "TAITEN" , "TRASLADO DE PAIS"];
        let reportResult = transformDataToReport(result);
        // for(let div of divOptions){
        //     let newObj = {};
        //     for(let st of stateOptions){
        //         let output = result.filter((elem)=> elem.div_name == div && elem.state_name == st).length;    
        //         newObj[st] = output;
        //     }
        //     newObj["total"] = Object.values(newObj).reduce((n, val) => n + val, 0);
        //     newObj["Division"] = div;
        //     reportResult.push(newObj);
        //     let lastObjectforTotal = {};

        //     stateOptions.forEach((state)=>{
        //          lastObjectforTotal[state] =  result.filter((obj) => obj.state_name == state).length;
        //     })

        //     lastObjectforTotal["Division"] = "Total";
        //     reportResult.push(lastObjectforTotal);
        // }
        // dataToReport(reportResult);
        let query = `select * from usuarios_area where id = ${req.body.area_id}`;
        const area = await sequelize.query(query, { type: sequelize.QueryTypes.SELECT })
        return res.status(200).send({
            message: "Data fetched successfuly",
            title: `Reorte Numerico Division : ${area[0].nombre}`,
            data: reportResult
        });
    } catch (e) {
        console.log(e);
        return res.status(500).json({ message: 'Server Error' });
    }
}



function transformDataToReport(data) {
    // Extract unique state names
    const stateNames = Array.from(new Set(data.map(item => item.state_name)));
    console.log(stateNames, "stateNames");
    // Create the table header
    const tableHeader = ['  Division  ', ...stateNames, '  Total  '];

    /// Create the table rows
    const tableRows = data.reduce((rows, item) => {
        const { div_name, state_name, count } = item;
        const rowIndex = rows.findIndex(row => row[0] === div_name);

        if (rowIndex === -1) {
            const newRow = [div_name, ...Array(stateNames.length).fill(0)];
            newRow[stateNames.indexOf(state_name) + 1] = count;
            rows.push(newRow);
        } else {
            rows[rowIndex][stateNames.indexOf(state_name) + 1] += count;
        }

        return rows;
    }, []);

    // Add total counts column
    tableRows.forEach(row => {
        const totalCount = row.slice(1).reduce((sum, count) => sum + count, 0);
        row.push(totalCount);
    });

    // Add totals for state names row
    let finalTotal = 0
    const stateTotals = stateNames.map(state => {
        const stateCount = tableRows.reduce((sum, row) => sum + row[stateNames.indexOf(state) + 1], 0);
        // console.log("statecounts",stateCount);
        finalTotal += stateCount
        return stateCount;
    });

    const stateTotalsRow = ['Total', ...stateTotals, finalTotal];
    tableRows.push(stateTotalsRow);

    // Print the table
    //   console.log(tableHeader.join('\t') + '\tTotal');
    //   tableRows.forEach(row => console.log(row.join('\t')));
    tableRows.unshift(tableHeader);
    //   let result = tableRows;
    //   //console.log(result);
    return tableRows;
}



async function reportForAreaNState(req, res) {
    try {
        let area_id = req.body.area_id;
        if (!area_id) {
            return res.status(400).json({ message: "area_id is missing." })
        }

        // let q = `select usuarios_area.nombre as area_name , usuarios_estado.nombre as state_name from usuarios_usuario as Main inner join usuarios_area on Main.area_id = usuarios_area.id inner join usuarios_estado on Main.area_id = usuarios_estado.id`;
        let q = `  SELECT
        usuarios_area.nombre AS area_name,
        usuarios_estado.nombre AS state_name,
        COUNT(*) AS count
    FROM
        usuarios_usuario AS Main
        INNER JOIN usuarios_area ON Main.area_id = usuarios_area.id
        INNER JOIN usuarios_estado ON Main.estado_id = usuarios_estado.id
        where usuarios_area.id = "${area_id}"
    GROUP BY
        usuarios_area.nombre,
        usuarios_estado.nombre order by usuarios_area.nombre;`

        //id,divsion_id 
        //join --> (area , main) (state,main)
        const result = await sequelize.query(q, { type: sequelize.QueryTypes.SELECT })
        console.log(result.length);
        //console.log(result, "resukt");
        let stateOptions = ["ACTIVO", "INACTIVO", "FALLECIDO", "TAITEN", "TRASLADO DE PAIS"]; //later we will get dynamically


        if (!result || result.length == 0) {
            return res.status(404).json({ message: "No records found" });
        }

        //initialsing with 0 members

        let reportResult = [['Area', result[0].area_name]];
        let sum = 0;
        for (let st of stateOptions) {
            let innerArr;
            let foundEntry = result.find((ent) => ent.state_name == st)
            if (foundEntry) {
                innerArr = [st, foundEntry.count]
            } else {
                innerArr = [st, 0];
            }
            sum += innerArr[1];
            reportResult.push(innerArr);
        }
        reportResult.push(['Total', sum]);
        console.log(reportResult);
        let response = { message: "success", title: `Reporte Numerico: Area (Estado)`, data: reportResult }

        // console.log(response,"area and state")
        return res.json(response);
    } catch (e) {
        console.log(e);
        return res.status(500).json({ message: 'Server Error' });
    }
}



async function test(req, res) {
    return res.status(500).json({ logo: "images/PHOTO-2023-05-15-20-14-41.jpg" });
}


async function reportForCabildoArea(req, res) {
    try {
        const { area_id, cabildo_id } = req.body;

        if (!area_id || !cabildo_id) {
            return res.status(400).json({ message: 'Missing Fields' });
        }
        let q = `select * from usuarios_usuario where area_id = ${area_id} and cabildo_id = ${cabildo_id}`;
        let q2 = `select nombre from usuarios_cabildo where id = ${cabildo_id}`;
        let q3 = `select nombre from usuarios_area where id = ${area_id}`
        const result = await sequelize.query(q, { type: sequelize.QueryTypes.SELECT })
        const result2 = await sequelize.query(q2, { type: sequelize.QueryTypes.SELECT })
        const result3 = await sequelize.query(q3, { type: sequelize.QueryTypes.SELECT })
        let resp = { "1": result.length, "2": result2.length, "3": result3.length };
        return res.json([{ area_name: "Area", cabildo_name: result2[0].nombre }, { area_name: result3[0].nombre, members: result.length }]);
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
        let q = `select * from usuarios_usuario where division_id = ${division_id} and cabildo_id = ${cabildo_id}`;
        let q2 = `select nombre from usuarios_cabildo where id = ${cabildo_id}`;
        let q3 = `select nombre from usuarios_division where id = ${division_id}`
        const result = await sequelize.query(q, { type: sequelize.QueryTypes.SELECT })
        const result2 = await sequelize.query(q2, { type: sequelize.QueryTypes.SELECT })
        const result3 = await sequelize.query(q3, { type: sequelize.QueryTypes.SELECT })
        let resp = { "1": result.length, "2": result2.length, "3": result3.length };
        //console.log(result, result2, result3);
        return res.json([{ "Division": "Division", cabildo_name: result2[0].nombre }, { division_name: result3[0].nombre, members: result.length }]);
    } catch (e) {
        console.log(e);
        return res.status(500).json({ message: 'Something went wrong..' });
    }
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



async function reportForAreaNDivision(req, res) {
    try {
        let area_id = req.body.area_id;
        if (!area_id) {
            return res.status(400).json({ message: "area_id is missing." })
        }
        // let q = `select usuarios_area.nombre as area_name , usuarios_division.nombre as div_name from usuarios_usuario as Main inner join usuarios_area on Main.area_id = usuarios_area.id inner join usuarios_division on Main.division_id = usuarios_division.id`;
        q = `  SELECT
        usuarios_area.nombre AS area_name,
        usuarios_division.nombre AS div_name,
        COUNT(*) AS count
    FROM
        usuarios_usuario AS Main
        INNER JOIN usuarios_area ON Main.area_id = usuarios_area.id
        INNER JOIN usuarios_division ON Main.division_id = usuarios_division.id
        where usuarios_area.id = "${area_id}"
    GROUP BY
        usuarios_area.nombre,
        usuarios_division.nombre order by usuarios_area.nombre`

        //id,divsion_id 
        const result = await sequelize.query(q, { type: sequelize.QueryTypes.SELECT })
        console.log(result, result);

        let divOptions = ["Damas", "Caballeros", "DJM", "DJF", "DEP", "N/A"];//later we will get dynamically
        //let areaOptions = ["Área 01","Área 02","Área 03","Área 04","Área 05","Área 06","Área 07","Área 08","Área 09","Área 10","Área 11" , "N/A"]; //later we will get dynamically    

        if (!result || result.length == 0) {
            return res.status(404).json({ message: "No records found" });
        }


        let reportResult = [['Area', result[0].area_name]];
        let sum = 0;
        for (let st of divOptions) {
            let innerArr;
            let foundEntry = result.find((ent) => ent.div_name == st)
            if (foundEntry) {
                innerArr = [st, foundEntry.count]
            } else {
                innerArr = [st, 0];
            }
            sum += innerArr[1];
            reportResult.push(innerArr);
        }
        reportResult.push(['Total', sum]);
        console.log(reportResult);

        let response = { message: "success", title: `Reporte Numerico: Area (Division)`, data: reportResult }
        console.log(response, "area and division")
        return res.json(response);


    } catch (e) {
        console.log(e);
        return res.status(500).json({ message: 'Server Error' });
    }
}

async function getLeadersById(req, res) {
    // 1-> national
    // 2 -> area
    // 3 -> cabildo (chapter)
    // 4 -> district
    // 5 -> group
    try {
        let responsable_level_id = req.body.responsable_level_id;
        console.log("responsable_level_id", responsable_level_id);

        if (!responsable_level_id) {
            return res.status(400).json({ message: "responsable_level_id is missing." })
        }
        let q = `select * from usuarios_usuario where nivel_responsable_id = ${responsable_level_id}`;
        const result = await sequelize.query(q, { type: sequelize.QueryTypes.SELECT })
        return res.json(result);
    } catch (e) {
        console.log(e.name, e.message);
        return res.status(500).json({ message: 'Server Error' });
    }
}

async function getUserByBuddhistLevelId(req, res) {
    //1 first , 2-> second , 4-> third
    try {
        let buddhist_level_id = req.body.buddhist_level_id;
        console.log("area id", buddhist_level_id);
        if (!buddhist_level_id) {
            return res.status(400).json({ message: "buddhist_level_id is missing." })
        }
        let q = `select * from usuarios_usuario where nivel_budista_id = ${buddhist_level_id}`;
        const result = await sequelize.query(q, { type: sequelize.QueryTypes.SELECT })
        return res.json(result);
    } catch (e) {
        console.log(e.name, e.message);
        return res.status(500).json({ message: 'Server Error' });
    }
}



async function getUsersByStateId(req, res) {
    try {
        let state_id = req.body.state_id;
        if (!state_id) {
            return res.status(400).json({ message: "state_id is missing." })
        }
        let q = `select * from usuarios_usuario where estado_id = ${state_id}`;
        const result = await sequelize.query(q, { type: sequelize.QueryTypes.SELECT })
        return res.json(result);
    } catch (e) {
        console.log(e.name, e.message);
        return res.status(500).json({ message: 'Server Error' });
    }
}



async function getUserByAreaId(req, res) {
    try {
        let area_id = req.body.area_id;
        console.log("area id", area_id);
        if (!area_id) {
            return res.status(400).json({ message: "area_id is missing." })
        }
        let q = `select * from usuarios_usuario where area_id = ${area_id}`;
        const result = await sequelize.query(q, { type: sequelize.QueryTypes.SELECT })
        return res.json(result);
    } catch (e) {
        console.log(e.name, e.message);
        return res.status(500).json({ message: 'Server Error' });
    }
}


async function getUserBySexId(req, res) {
    //2 -> F , 3 -> M 
    try {
        let sex_id = req.body.sex_id;
        console.log("sex_id ", sex_id);
        if (!sex_id) {
            return res.status(400).json({ message: "sex_id is missing." })
        }
        let q = `select * from usuarios_usuario where sexo_id = ${sex_id}`;
        const result = await sequelize.query(q, { type: sequelize.QueryTypes.SELECT })
        return res.json(result);
    } catch (e) {
        console.log(e.name, e.message);
        return res.status(500).json({ message: 'Server Error' });
    }
}


function transformDataToReport(data) {
    // Extract unique state names
    const stateNames = Array.from(new Set(data.map(item => item.state_name)));
    console.log(stateNames, "stateNames");
    // Create the table header
    const tableHeader = ['  Division  ', ...stateNames, '  Total  '];

    /// Create the table rows
    const tableRows = data.reduce((rows, item) => {
        const { div_name, state_name, count } = item;
        const rowIndex = rows.findIndex(row => row[0] === div_name);

        if (rowIndex === -1) {
            const newRow = [div_name, ...Array(stateNames.length).fill(0)];
            newRow[stateNames.indexOf(state_name) + 1] = count;
            rows.push(newRow);
        } else {
            rows[rowIndex][stateNames.indexOf(state_name) + 1] += count;
        }
        return rows;
    }, []);

    // Add total counts column
    tableRows.forEach(row => {
        const totalCount = row.slice(1).reduce((sum, count) => sum + count, 0);
        row.push(totalCount);
    });

    // Add totals for state names row
    let finalTotal = 0
    const stateTotals = stateNames.map(state => {
        const stateCount = tableRows.reduce((sum, row) => sum + row[stateNames.indexOf(state) + 1], 0);
        // console.log("statecounts",stateCount);
        finalTotal += stateCount
        return stateCount;
    });

    const stateTotalsRow = ['Total', ...stateTotals, finalTotal];
    tableRows.push(stateTotalsRow);

    // Print the table
    //   console.log(tableHeader.join('\t') + '\tTotal');
    //   tableRows.forEach(row => console.log(row.join('\t')));
    tableRows.unshift(tableHeader);
    //   let result = tableRows;
    //   //console.log(result);
    return tableRows;

}



//******************************* EXPANSION *************************/

async function getAreaData(req, res) {
    var area = await sequelize.query(`select * from usuarios_area order by nombre`, { type: sequelize.QueryTypes.SELECT })
    for (var i in area) {
        var cabildo = await sequelize.query(`select cabildo_id  from usuarios_usuario where area_id = ${area[i].id} group by cabildo_id`, { type: sequelize.QueryTypes.SELECT })
        area[i].cabildo_count = cabildo.length
        console.log(area[i].id, cabildo)
    }
    return res.status(200).send({
        message: "Area data",
        data: area
    })

}

// async function getAreaData(req, res) {
//     var area = await sequelize.query(`select * from usuarios_area`, { type: sequelize.QueryTypes.SELECT })
//     for (var i in area) {
//         var cabildo = await sequelize.query(`select cabildo_id  from usuarios_usuario where area_id = ${area[i].id} group by cabildo_id`, { type: sequelize.QueryTypes.SELECT })
//         area[i].cabildo_count = cabildo.length
//         console.log(area[i].id, cabildo)
//     }
//     return res.status(200).send({
//         message: "Area data",
//         data: area
//     })

// }

async function addAreaandSplit(req, res) {
    try {
        console.log(req.body, "req")
        var cabildo_id = req.body.cabildo_id
        var old_area = req.body.old_area_id
        var edit_area = req.body.edit_area_id
        if (edit_area) {
            await sequelize.query(`rios_area set nombre = "${req.body.new_area_name}" where id = ${edit_area}`)
            for (var i in cabildo_id) {
                var result = await sequelize.query(`select distinct cabildo_id from usuarios_usuario where area_id = ${edit_area}`, { type: sequelize.QueryTypes.SELECT })
                console.log(result.length)
                var data = await sequelize.query(`select id, nombre from usuarios_cabildo where nombre = "Cabildo ${(result.length) + 1}"`, { type: sequelize.QueryTypes.SELECT })
                // console.log(data[0].id, data[0].nombre)
                sequelize.query(`update usuarios_usuario set area_id = ${edit_area} , cabildo_id = ${data[0].id} where area_id = ${old_area} and cabildo_id = ${cabildo_id[i]} `)

            } return res.status(200).send({
                message: `Area edited successfuly!!`,
                data: []
            })
        }
        else {
            var result = await sequelize.query(`insert into usuarios_area(nombre) values ("${req.body.new_area_name}")`)
            var new_area = result[0]
            for (var i in cabildo_id) {
                var data = await sequelize.query(`select id, nombre from usuarios_cabildo where nombre = "Cabildo ${Number(i) + 1}"`, { type: sequelize.QueryTypes.SELECT })
                // console.log(data[0].id, data[0].nombre, "cabildo_id")
                console.log(cabildo_id[i], "cabildo")
                console.log(new_area, "new area")
                sequelize.query(`update usuarios_usuario set area_id = ${new_area} , cabildo_id = ${data[0].id} where area_id = ${old_area} and cabildo_id = ${cabildo_id[i]}`)
                // var result = await sequelize.query(`update usuarios_usuario set area_id = ${new_area} , cabildo_id = ${data[0].id} where area_id = ${old_area} and cabildo_id = ${cabildo[i]}`)
            }
            return res.status(200).send({
                message: `Cabildo moved successfuly to new area!!`,
                data: []
            })
        }
    }
    catch (e) {
        console.log(e);
        if (e.name == "SequelizeUniqueConstraintError") {
            return res.status(400).json({ message: "area already exists" });
        }
        return res.status(500).json({ message: 'something went wrong!' });
    }
}



async function addCabildoandSplit(req, res) {
    try {
        console.log(req.body)
        var new_cabildo_name = req.body.new_cabildo_name
        var distrito_id = req.body.distrito_id
        var area_id = req.body.area_id
        var old_cabildo = req.body.old_cabildo_id
        var edit_cabildo = req.body.edit_cabildo_id
        if (edit_cabildo) {
            await sequelize.query(`update usuarios_cabildo set nombre = "${req.body.new_cabildo_name}" where id = ${edit_cabildo}`)
            for (var i in distrito_id) {
                var result = await sequelize.query(`select distinct distrito_sgip_id from usuarios_usuario where area_id =${area_id} and cabildo_id = ${edit_cabildo}`, { type: sequelize.QueryTypes.SELECT })
                console.log(result.length)
                var data = await sequelize.query(`select id, nombre from usuarios_distritosgip where nombre = "Distrito ${(result.length) + 1}"`, { type: sequelize.QueryTypes.SELECT })
                // console.log(data[0].id, data[0].nombre)
                sequelize.query(`update usuarios_usuario set distrito_sgip_id = ${data[0].id} where area_id = ${area_id} and cabildo_id = ${old_cabildo} and distrito_sgip_id = ${distrito_id[i]}`)

            }
            return res.status(200).send({
                message: `Cabildo edited successfuly!!`,
                data: []
            })
        }
        else {
            var result = await sequelize.query(`insert into usuarios_cabildo(nombre) values ("${new_cabildo_name}")`)
            var new_cabildo = result[0]
            for (var i in distrito_id) {
                var data = await sequelize.query(`select id, nombre from usuarios_distritosgip where nombre = "Distrito ${Number(i) + 1}"`, { type: sequelize.QueryTypes.SELECT })
                // console.log(data[0].id, data[0].nombre, "distrito_id")
                console.log(distrito_id[i], "district")
                console.log(new_cabildo, "new area")
                sequelize.query(`update usuarios_usuario set cabildo_id = ${new_cabildo} , distrito_sgip_id = ${data[0].id} where area_id = ${area_id} and cabildo_id = ${old_cabildo} and distrito_sgip_id = ${distrito_id[i]}`)
                // var result = await sequelize.query(`update usuarios_usuario set area_id = ${new_area} , cabildo_id = ${data[0].id} where area_id = ${old_area} and cabildo_id = ${cabildo[i]}`)
            }
            return res.status(200).send({
                message: `District moved successfuly to new cabildo!!`,
                data: []
            })
        }
    }
    catch (e) {
        console.log(e.name, e.message);
        if (e.name == "SequelizeUniqueConstraintError") {
            return res.status(400).json({ message: "cabildo already exists" });
        }
        return res.status(500).json({ message: 'something went wrong!' });
    }
}




async function addDistrictandSplit(req, res) {
    try {
        console.log(req.body, "add dist")
        var area_id = req.body.area_id
        var cabildo_id = req.body.cabildo_id
        var old_district = req.body.old_distrito_id
        var new_district_name = req.body.new_distrito_name
        var group_id = req.body.grupo_id
        var edit_district_id = req.body.edit_district_id
        if (edit_district_id) {
            console.log("inside if")
            await sequelize.query(`update usuarios_distritosgip set nombre = "${req.body.new_district_name}" where id = ${edit_district_id}`)
            for (var i in group_id) {
                var result = await sequelize.query(`select distinct grupo_id from usuarios_usuario where area_id =${area_id} and cabildo_id = ${cabildo_id} and distrito_sgip_id = ${edit_district_id}`, { type: sequelize.QueryTypes.SELECT })
                console.log(result.length)
                var data = await sequelize.query(`select id, nombre from usuarios_grupo where nombre = "Distrito ${(result.length) + 1}"`, { type: sequelize.QueryTypes.SELECT })
                // console.log(data[0].id, data[0].nombre)
                sequelize.query(`update usuarios_usuario set grupo_id = ${group_id[i]} where area_id = ${area_id} and cabildo_id = ${old_cabildo} and distrito_sgip_id = ${group_id[i]}`)

            }
            return res.status(200).send({
                message: `Cabildo edited successfuly!!`,
                data: []
            })
        }
        else {
            console.log("inside else")
            var result = await sequelize.query(`insert into usuarios_distritosgip(nombre) values ("${new_district_name}")`)
            var new_distrito = result[0]

            for (var i in group_id) {
                console.log(group_id[i], "group id")
                console.log(new_distrito, "new dis")
                sequelize.query(`update usuarios_usuario set distrito_sgip_id = ${new_distrito} where area_id = ${area_id} and cabildo_id = ${cabildo_id} and distrito_sgip_id = ${old_district} and grupo_id = ${group_id[i]}`)
                // var result = await sequelize.query(`update usuarios_usuario set area_id = ${new_area} , cabildo_id = ${data[0].id} where area_id = ${old_area} and cabildo_id = ${cabildo[i]}`)
            }
            return res.status(200).send({
                message: `Group moved successfuly to new district!!`,
                data: []
            })
        }
    }
    catch (e) {
        console.log(e)
        console.log(e.name, e.message);
        if (e.name == "SequelizeUniqueConstraintError") {
            return res.status(400).json({ message: "District already exists" });
        }
        return res.status(500).json({ message: 'something went wrong!' });
    }
}


async function getChapters(req, res) {
    // console.log(req.body)
    var area_id = req.body.area_id || 1
    var areaa = await sequelize.query(`select nombre from usuarios_area where id = ${area_id}`, { type: sequelize.QueryTypes.SELECT })
    try {
        const cabildo = await sequelize.query(`select  distinct cabildo_id, usuarios_cabildo.nombre as cabildo  from usuarios_usuario inner join usuarios_cabildo on usuarios_cabildo.id = usuarios_usuario.cabildo_id where area_id = ${area_id} order by cabildo`, { type: sequelize.QueryTypes.SELECT })
        //console.log(cabildo)
        for (var i in cabildo) {
            var distrito = await sequelize.query(`select distrito_sgip_id  from usuarios_usuario where cabildo_id = ${cabildo[i].cabildo_id} group by distrito_sgip_id`, { type: sequelize.QueryTypes.SELECT })
            cabildo[i].distrito_count = distrito.length
            console.log(cabildo[i].id, distrito)
        }
        return res.status(200).send({
            message: "data fetched",
            data: cabildo,
            location: { area: areaa[0].nombre }
        })
    }
    catch (e) {
        console.log(e)
        return res.send({ error: e })
    }
}


async function getDistricts(req, res) {
    var area_id = req.body.area_id || 1
    var cabildo_id = req.body.cabildo_id || 1
    var areaa = await sequelize.query(`select nombre from usuarios_area where id = ${area_id}`, { type: sequelize.QueryTypes.SELECT })
    var cab = await sequelize.query(`select nombre from usuarios_cabildo where id = ${cabildo_id}`, { type: sequelize.QueryTypes.SELECT })
    const district = await sequelize.query(`select distinct distrito_sgip_id,cab.nombre as district from usuarios_usuario inner join usuarios_distritosgip as cab on cab.id = usuarios_usuario.distrito_sgip_id where area_id = ${area_id} and cabildo_id = ${cabildo_id} order by district`, { type: sequelize.QueryTypes.SELECT })

    //   console.log(district)
    for (var i in district) {
        var group = await sequelize.query(`select grupo_id  from usuarios_usuario where distrito_sgip_id = ${district[i].distrito_sgip_id} group by grupo_id`, { type: sequelize.QueryTypes.SELECT })
        district[i].grupo_count = group.length
        console.log(district[i].id, group)
    }
    return res.status(200).send({
        message: "data fetched",
        data: district,
        location: {
            area: areaa[0].nombre,
            cabido: cab[0].nombre
        }
    })
}


async function getGroups(req, res) {
    console.log(req.body, "test group")
    var area_id = req.body.area_id
    var cabildo_id = req.body.cabildo_id
    var district_id = req.body.district_id || req.body.old_distrito_id
    var areaa = await sequelize.query(`select nombre from usuarios_area where id = ${area_id}`, { type: sequelize.QueryTypes.SELECT })
    var cab = await sequelize.query(`select nombre from usuarios_cabildo where id = ${cabildo_id}`, { type: sequelize.QueryTypes.SELECT })
    var dist = await sequelize.query(`select nombre from usuarios_distritosgip where id = ${district_id}`, { type: sequelize.QueryTypes.SELECT })
    const group = await sequelize.query(`select distinct cab.id,cab.nombre as grupo from usuarios_usuario inner join usuarios_grupo as cab on cab.id = usuarios_usuario.grupo_id where area_id = ${area_id} and cabildo_id = ${cabildo_id} and distrito_sgip_id = ${district_id}`, { type: sequelize.QueryTypes.SELECT })
    for (var i in group) {
        var member = await sequelize.query(`select id from usuarios_usuario where grupo_id = ${group[i].id} and area_id = ${area_id} and cabildo_id = ${cabildo_id} and distrito_sgip_id = ${district_id} `, { type: sequelize.QueryTypes.SELECT })
        group[i].member_count = member.length
        // console.log(group[i].id, group)
    }
    return res.status(200).send({
        message: "data fetched",
        data: group,
        location: {
            area: areaa[0].nombre,
            cabido: cab[0].nombre,
            distrito: dist[0].nombre
        }
    })
}



async function addGroupandSplit(req, res) {
    // console.log(req.body,"req add")
    try {
        const grupo = req.body.new_group_name
        const member_id = req.body.member_id
        const edit_group_id = req.body.edit_group_id

        if (!edit_group_id) {
            var result = await sequelize.query(`insert into usuarios_grupo(nombre) values ("${grupo}")`)
            var new_group_id = result[0]
            for (var i in member_id) {
                sequelize.query(`update usuarios_usuario set grupo_id = ${new_group_id} where id = ${member_id[i]}`)
            }
        }
        else {
            for (var i in member_id) {
                sequelize.query(`update usuarios_usuario set grupo_id = ${edit_group_id} where id = ${member_id[i]}`)
                sequelize.query(`update usuarios_grupo set nombre = "${grupo}" where id = ${edit_group_id} `)
            }
        }
        // var data = await sequelize.query(`update usuarios_usuario set grupo_id = ${new_group} where id = ${result[i].member_id}`)

        return res.status(200).send({
            message: "members added successfully",
            data: []
        })
    }
    catch (e) {
        if (e.name == "SequelizeUniqueConstraintError") {
            return res.status(400).json({ message: "Group already exists" });
        }
    }
}



async function getGroupMemberList(req, res) {
    console.log(req.body, "member list")
    const area = req.body.area_id;
    const cabildo = req.body.cabildo_id;
    const district = req.body.district_id;
    const group_id = req.body.group_id
    var areaa = await sequelize.query(`select nombre from usuarios_area where id = ${area}`, { type: sequelize.QueryTypes.SELECT })
    var cab = await sequelize.query(`select nombre from usuarios_cabildo where id = ${cabildo}`, { type: sequelize.QueryTypes.SELECT })
    var dist = await sequelize.query(`select nombre from usuarios_distritosgip where id = ${district}`, { type: sequelize.QueryTypes.SELECT })
    var grp = await sequelize.query(`select nombre from usuarios_grupo where id = ${group_id}`, { type: sequelize.QueryTypes.SELECT })
    const whereClause = `WHERE 1=1
    AND (:area IS NULL OR area_id = :area)
    AND (:cabildo IS NULL OR cabildo_id = :cabildo)
    AND (:district IS NULL OR distrito_sgip_id = :district)  `;
    const att = await sequelize.query(`select id from usuarios_usuario ${whereClause} AND grupo_id = ${req.body.group_id}`, {
        type: sequelize.QueryTypes.SELECT, replacements: {
            area: area || null,
            cabildo: cabildo || null,
            district: district || null
        }
    })
    var query = `select usuarios_usuario.id,usuario_id as Cedula_id, sgi_id , nombre_completo, telefono, division.nombre as division from usuarios_usuario inner join usuarios_division as division on division.id = usuarios_usuario.division_id ${whereClause} `
    const result = await sequelize.query(query, {
        type: sequelize.QueryTypes.SELECT,
        replacements: {
            area: area || null,
            cabildo: cabildo || null,
            district: district || null
        }
    });
    console.log(att, "result")
    for (var i in result) {
        result[i].present = false
        for (var j in att) {
            if (result[i].id == att[j].id) {
                result[i].present = true
            }
        }
    }
    console.log(result)
    return res.status(200).send({
        message: "data fetched successfully",
        data: result,
        location: {
            area: areaa[0].nombre,
            cabido: cab[0].nombre,
            distrito: dist[0].nombre,
            grupo: grp[0].nombre
        }

    })
}



async function hierarchydropdown(req, res) {
    var cab = {}
    const area_id = req.body.area_id
    var result = await sequelize.query(`select nombre_completo,d.nombre,a.nombre as Area from usuarios_usuario inner join usuarios_division as d on d.id = usuarios_usuario.division_id inner join usuarios_area as a on a.id = usuarios_usuario.area_id where area_id = 5 and responsable = 1 and nivel_responsable_id = 2`, { type: sequelize.QueryTypes.SELECT });
    var cabildo = await sequelize.query(`select distinct cabildo_id from usuarios_usuario where  area_id = ${area_id}`, { type: sequelize.QueryTypes.SELECT });

    for (var i in cabildo) {
        var distr = {};
        var result1 = await sequelize.query(`select nombre_completo,c.nombre,cabildo_id,d.nombre as Division from usuarios_usuario inner join usuarios_cabildo as c on c.id = usuarios_usuario.cabildo_id inner join usuarios_division as d on d.id = usuarios_usuario.division_id where area_id = ${area_id} and cabildo_id = ${cabildo[i].cabildo_id} and responsable = 1 and nivel_responsable_id = 3`, { type: sequelize.QueryTypes.SELECT });
        if (result1[0]) {
            var district = await sequelize.query(`select distinct distrito_sgip_id from usuarios_usuario where area_id = ${area_id} and cabildo_id =${result1[0].cabildo_id} `, { type: sequelize.QueryTypes.SELECT })

            for (var j in district) {
                var grup = []
                var rs = await sequelize.query(`select nombre_completo,c.nombre ,distrito_sgip_id,d.nombre as Division from usuarios_usuario inner join usuarios_distritosgip as c on c.id = usuarios_usuario.distrito_sgip_id inner join usuarios_division as d on d.id = usuarios_usuario.division_id where area_id = ${area_id}  and distrito_sgip_id = ${district[j].distrito_sgip_id} and cabildo_id = ${cabildo[i].cabildo_id} and responsable = 1 and nivel_responsable_id = 4`, { type: sequelize.QueryTypes.SELECT })
                if (rs[0]) {
                    var group = await sequelize.query(`select distinct grupo_id from usuarios_usuario where area_id = ${area_id} and cabildo_id =${cabildo[i].cabildo_id} and  distrito_sgip_id =${district[j].distrito_sgip_id} `, { type: sequelize.QueryTypes.SELECT })
                    console.log(group)
                    for (var k in group) {
                        var grp = await sequelize.query(`select nombre_completo,c.nombre ,grupo_id,d.nombre as Division from usuarios_usuario inner join usuarios_grupo as c on c.id = usuarios_usuario.grupo_id inner join usuarios_division as d on d.id = usuarios_usuario.division_id where area_id = ${area_id} and cabildo_id = ${cabildo[i].cabildo_id} and distrito_sgip_id =${district[j].distrito_sgip_id}  and grupo_id = ${group[k].grupo_id} and responsable = 1 and nivel_responsable_id = 5`, { type: sequelize.QueryTypes.SELECT })
                        console.log(grp, "grp")
                        if (grp.length) {
                            console.log(grp[0].nombre, "grpooo")
                            grup.push(grp[0].nombre)
                            // Object.assign(grup ,[`${grp[0].nombre}`] );  
                        }
                    }
                    Object.assign(distr, { [`${rs[0].nombre}`]: [{ group: grup }] })
                }
            }
            Object.assign(cab, { [`${result1[0].nombre}`]: { distrito: [distr] } });
        }
    }
    return res.status(200).send({
        message: "Data fetched successfully",
        data: {
            [`${result[0].Area}`]: [{

                cabildo: [cab],
            }]
        }
    });
}



//Api for area wise report for area leader
async function filterreport(req, res) {
    var body = req.body
    try {
        const headings = [];
        var resp = []
        const division = req.body.division_id;
        var where = await helper.findRoleDetails(req, res)
        const area = req.body.area_id || where.area_id;
        const cabildo = req.body.cabildo_id || where.cabildo_id;
        const district = req.body.district_id || where.distrito_id;
        // const group_id = req.body.selected_group_id
        const group_id = req.body.horizontal_group
        const grupo = req.body.grupo
        const responsable = req.body.responsable;
        const nivel_responsable = req.body.nivel_responsable_id;
        const responsable_gohonzon = req.body.responsable_gohonzon;
        // const nivel_budista = req.body.selected_nivel_budista_id
        const nivel_budista = req.body.nivel_budista
        const estado = req.body.estado_id

        const whereClause = `WHERE 1 AND (:area IS NULL OR area_id = :area)
        AND (:cabildo IS NULL OR cabildo_id = :cabildo)
        AND (:grupo IS NULL OR grupo_id = :grupo)
        AND (:district IS NULL OR distrito_sgip_id = :district) 
        AND (:division IS NULL OR division_id = :division)
         AND (:responsable IS NULL OR responsable = :responsable) 
          AND (:nivel_responsable IS NULL OR nivel_responsable_id = :nivel_responsable) 
     AND (:responsable_gohonzon IS NULL OR responsable_gohonzon = :responsable_gohonzon)  
    AND (:nivel_budista IS NULL OR nivel_budista_id = :nivel_budista)
    AND (:estado IS NULL OR estado_id = :estado)
    `;
        if (responsable == 1) {
            headings.push('Responsable:SI')
        }
        if (nivel_responsable) {
            var user = await sequelize.query(`select nombre from usuarios_nivelresponsable where id = ${nivel_responsable}`, { type: sequelize.QueryTypes.SELECT })
            headings.push((`Nivel Responsable:${user[0].nombre}`).toString())
        }
        if (responsable_gohonzon == 1) {
            headings.push(('Responsable Gohonzon:SI').toString())
        }
        if (nivel_budista) {
            var user = await sequelize.query(`select nombre from usuarios_nivelbudista where id = ${nivel_budista}`, { type: sequelize.QueryTypes.SELECT })
            headings.push((`Nivel Budista:${user[0].nombre}`).toString())
        }
        if (division) {
            var div = await sequelize.query(`select nombre from usuarios_division where id = ${division}`, { type: sequelize.QueryTypes.SELECT })
            headings.push(div[0].nombre)
        }
        if (area) {
            var Area = await sequelize.query(`select nombre from usuarios_area where id = ${area}`, { type: sequelize.QueryTypes.SELECT })
            headings.push(Area[0].nombre)
        }
        if (cabildo) {
            var Cabildo = await sequelize.query(`select nombre from usuarios_cabildo where id = ${cabildo}`, { type: sequelize.QueryTypes.SELECT })
            headings.push(Cabildo[0].nombre)
        }
        if (district) {
            var Distrito = await sequelize.query(`select nombre from usuarios_distritosgip where id = ${district}`, { type: sequelize.QueryTypes.SELECT })
            headings.push(Distrito[0].nombre)
        }
        if (grupo) {
            var Grupo = await sequelize.query(`select nombre from usuarios_grupo where id = ${grupo}`, { type: sequelize.QueryTypes.SELECT })
            headings.push(Grupo[0].nombre)
        }
        if (group_id) {
            var hrgrupo = await sequelize.query(`select nombre from usuarios_grupohorizontal where id = ${group_id}`, { type: sequelize.QueryTypes.SELECT })
            headings.push(hrgrupo[0].nombre)
        }
        if (estado) {
            var user = await sequelize.query(`select nombre from usuarios_estado where id = ${estado}`, { type: sequelize.QueryTypes.SELECT })
            headings.push(user[0].nombre)
        }

        // else if(group_id){
        //     var title = `Reporte Informativo : Grupo Horizontal`
        // }

        if (group_id) {
            console.log("if")
            var query = `SELECT distinct nombre_completo as "Nombre Completo" ,sgi_id as "SGI ID", email as Email,usuarios_area.nombre as Area, uc.nombre as Cabildo,ud.nombre as Distrito,usuarios_division.nombre as Division,
            responsable as "Responsable", n.nombre as "Nivel Responsable",responsable_gohonzon as "Responsable de Gohonzon",direccion as "Direccion",telefono as "Telefono",celular as "Celular" FROM usuarios_usuario  inner join usuarios_division  ON 
            usuarios_division.id = usuarios_usuario.division_id  INNER JOIN usuarios_area ON usuarios_area.id = usuarios_usuario.area_id
            left join usuarios_nivelresponsable as n on n.id = nivel_responsable_id 
            inner join group_members on group_members.user_id = usuarios_usuario.id
            inner join usuarios_cabildo as uc on uc.id = usuarios_usuario.cabildo_id inner join usuarios_distritosgip as ud on ud.id = usuarios_usuario.distrito_sgip_id
            ${whereClause} and group_members.group_id = ${group_id} order by nombre_completo`
        }
        else {
            var query = `SELECT distinct nombre_completo as "Nombre Completo" ,sgi_id as "SGI ID", email as Email,usuarios_area.nombre as Area, uc.nombre as Cabildo,ud.nombre as Distrito,usuarios_division.nombre as Division,
            responsable as "Responsable", n.nombre as "Nivel Responsable",responsable_gohonzon as "Responsable de Gohonzon",direccion as "Direccion",telefono as "Telefono",celular as "Celular" FROM usuarios_usuario  inner join usuarios_division  ON 
            usuarios_division.id = usuarios_usuario.division_id  INNER JOIN usuarios_area ON usuarios_area.id = usuarios_usuario.area_id
            left join usuarios_nivelresponsable as n on n.id = nivel_responsable_id
            inner join usuarios_cabildo as uc on uc.id = usuarios_usuario.cabildo_id inner join usuarios_distritosgip as ud on ud.id = usuarios_usuario.distrito_sgip_id
            ${whereClause} order by nombre_completo`;
        }

        const result = await sequelize.query(query, {
            type: sequelize.QueryTypes.SELECT,
            replacements: {
                division: division || null,
                area: area || null,
                cabildo: cabildo || null,
                district: district || null,
                responsable: responsable || null,
                responsable_gohonzon: responsable_gohonzon || null,
                nivel_responsable: nivel_responsable || null,
                nivel_budista: nivel_budista || null,
                estado: estado || null,
                grupo: grupo || null
            }
        });
        if (result.length) {
            var keys = Object.keys(result[0])
            resp.push(keys)
        }
        else {
            resp = []
        }

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
            title: `Reporte Informativo : ${headings.join(',')}`,
            data: resp,
            total: result.length
        });
    }
    catch (e) {
        console.log(e)
    }
}
async function forgotpassword(req, res) {
    const username = req.body.username
    var result = await sequelize.query(`select id from usuarios_usuario where email = "${username}"`, { type: sequelize.QueryTypes.SELECT })
    var userid = result[0].id
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

    var mailOptions = {
        from: 'SGI-Panama  <sgipanama1@gmail.com>',
        to: "muskan.shu@cisinlabs.com , basededatosgip@gmail.com , maires.carlos@gmail.com ,motwani.j@gmail.com ,",//`${req.token.email} , ${req.email}`,
        subject: 'Forgot Password Request',
        html: `<html>User with username : <b> "${username}"</b> has requested a password reset. Please handle the request.<br> http://basededatos.sgipanama.com/#/dashboard/edit-profile-member/${userid}</html>`
    };
    transporter.sendMail(mailOptions, (erro, info) => {
        if (erro) {
            console.log(erro)
            return false
        }
        return true
    })
    return res.status(200).send({
        message: 'Solicitud de restablecimiento de contraseña enviada al administrador.',
        data: []
    })
}


async function subscriptiondata(req, res) {
    try {
        console.log(req.doc)
        const filePath = `reports/${req.doc}`;
        const tableName = 'SUBSCRIPTION';

        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
        if (sheetData.length === 0) {
            throw new Error('Excel file is empty.');
        }
        const columns = Object.keys(sheetData[0]);
        const columnNames = "DATE,CEDULA,NAME,QTY,Variant_SKU,DESCRIPTION,user_id"
        for (var i in sheetData) {
            const newcedula = sheetData[i]["CÉDULA"].replace(/-/g, '');
            var userdata = await sequelize.query(`select * from usuarios_usuario where usuario_id = "${sheetData[i]["CÉDULA"]}" or usuario_id = "${newcedula}"`)
            if (userdata[0].length) {
                // console.log(sheetData[i]["CÉDULA"],userdata[0],"valid data",userdata[0].length)
                const query = `INSERT INTO ${tableName} (${columnNames}) VALUES (
                "${sheetData[i]["DATE"]}","${sheetData[i]["CÉDULA"]}", "${sheetData[i]["NAME"]}", "${sheetData[i]["QTY"]}","${sheetData[i]["Variant SKU"]}","${sheetData[i]["DESCRIPTION"]}",${userdata[0][0].id})`;
                sequelize.query(query);
            }
            else {
                console.log(sheetData[i]["CÉDULA"], "invalid data", userdata[0].length)
            }

        }
        console.log('Data inserted successfully.');
        return res.status(200).send({
            message: "Report uploaded succesfuly"
        })
    } catch (error) {
        console.log(error, "error")
        if (error.name == "SequelizeUniqueConstraintError") {
            console.log("duplicate")
        }
    }

}

async function deleteUser(req, res) {
    try {
        const { user_id, role } = req.body
        console.log('req.body: ', req.body);
        if (role == "member") {
            const user = await sequelize.query(`delete from usuarios_usuario where id = ${user_id}`)
        }
        else if (role == "invitee") {
            const invitee = await sequelize.query(`delete from invitados where id = ${user_id}`)
        }

        return res.status(200).send({
            message: 'record deleted',
            data: []
        });
    }
    catch (error) {
        console.log('error: ', error);

        return res.status(500).send({
            message: 'internal serever error',
            data: []
        });
    }

}


// async function getSubscriptionData(description) {

//     const user = await sequelize.query(`select * from usuarios_usuario where`,{type: sequelize.QueryTypes.SELECT})
//     const result = await sequelize.query(
//         `SELECT COUNT(*) as count, AREA FROM SUBSCRIPTION WHERE DESCRIPCION LIKE ? GROUP BY AREA ORDER BY AREA`,
//         { 
//             type: sequelize.QueryTypes.SELECT,
//             replacements: [description]
//         }
//     );

//     const label = ["A1", "A2", "A3", "A4", "A5", "A6", "A7", "A8", "A9", "A10", "A11"];
//     const values = Array.from({ length: label.length }, () => 0);

//     for (const entry of result) {
//         const index = label.findIndex(l => l === ("A" + entry.AREA));
//         if (index !== -1) {
//             values[index] = entry.count;
//         }
//     }

//     return {
//         label,
//         values,
//         total: values.reduce((a, b) => a + b, 0)
//     };
// }


async function getSubscriptionData(description, req, res) {
    console.log(req.body, "subs")
    const result = await sequelize.query(`SELECT CEDULA as usuario_id FROM SUBSCRIPTION WHERE DESCRIPTION LIKE ?`,
        {
            type: sequelize.QueryTypes.SELECT,
            replacements: [description]
        }
    );
    console.log(result, "result")

    var where = await helper.findRoleDetails(req, res)
    console.log(where)
    const area = req.body.area_id || where.area_id;
    const cabildo = req.body.cabildo_id || where.cabildo_id;
    const district = req.body.distrito_id || where.distrito_id;

    const whereCl = `
  AND (:area IS NULL OR area_id = :area)
  AND (:cabildo IS NULL OR cabildo_id = :cabildo)
  AND (:district IS NULL OR distrito_sgip_id = :district)  `;

    var qry = `select sum(sub.QTY)as count,area.id,area.nombre as AREA from usuarios_usuario 
inner join usuarios_area as area on area_id = area.id  inner join SUBSCRIPTION as sub on usuarios_usuario.usuario_id = sub.CEDULA  where usuario_id  
in (SELECT CEDULA as usuario_id FROM SUBSCRIPTION WHERE DESCRIPTION LIKE "${description}") and sub.DESCRIPTION like  "${description}" ${whereCl} group by area_id `
    // const newcedula = result[i]["CEDULA"].replace(/-/g, '');
    const user = await sequelize.query(qry, {
        type: sequelize.QueryTypes.SELECT, replacements: {
            area: area || null,
            cabildo: cabildo || null,
            district: district || null
        }
    })

    console.log(user, "subs user", description)
    var label = []
    var values = []
    const ar = await sequelize.query(`select nombre from usuarios_area`, { type: sequelize.QueryTypes.SELECT })
    for (var i in ar) {
        values.push(0)
        label.push(ar[i].nombre)
        for (var j in user) {
            if (user[j].AREA == ar[i].nombre) {
                console.log("ifff", user[j].AREA, user[j].count)

                values[i] = (user[j].count)
            }

        }
    }
    console.log(values, "values")
    // //  label = ["A1", "A2", "A3", "A4", "A5", "A6", "A7", "A8", "A9", "A10", "A11"];
    // const values = Array.from({ length: label.length }, () => 0);
    // for (const entry of user) {
    //     const index = label.findIndex(l => l === (entry.nombre));
    //     if (index !== -1) {
    //         values[index] = entry.count;
    //     }
    // }

    return {
        label,
        values,
        total: values.reduce((a, b) => a + b, 0)
    };
}


async function subscriptionGraph(req, res) {
    console.log(req.body, "subs");

    const graph1 = await getSubscriptionData("Puente%", req, res);
    const graph2 = await getSubscriptionData("Visión%", req, res);
    const graph3 = await getSubscriptionData("Esperanza%", req, res);

    const total_subscription = graph1.total + graph2.total + graph3.total;

    return res.status(200).send({
        message: 'graph data',
        total_subscription,
        graph1,
        graph2,
        graph3
    });
}


async function clearSubscription(req, res) {
    try {
        const subs = await sequelize.query('delete from SUBSCRIPTION')

        return res.status(200).send({
            message: 'records deleted',
            data: []
        });
    }
    catch (error) {

        return res.status(500).send({
            message: 'internal serever error',
            data: []
        });
    }

}


async function generalreport(req, res) {
    var resp = [["Área", "Cabildos", "Distritos", "Grupos"]]
    var area = await sequelize.query(`select * from usuarios_area`, { type: sequelize.QueryTypes.SELECT })
    var totalcab = 0
    var totaldis = 0
    var totalgrp = 0
    for (var i in area) {
        var arr = []
        arr.push(area[i].nombre)
        var cabildo = await sequelize.query(`select cabildo_id, count(cabildo_id) as count from usuarios_usuario where area_id = ${area[i].id} group by cabildo_id`, { type: sequelize.QueryTypes.SELECT })
        console.log(cabildo)
        if (cabildo[0]?.cabildo_id) {
            arr.push(cabildo.length)
        }
        else (
            arr.push(0)
        )
        totalcab = totalcab + cabildo.length
        var distrito = await sequelize.query(`select distrito_sgip_id, count(distrito_sgip_id) as count from usuarios_usuario where area_id = ${area[i].id} group by distrito_sgip_id`, { type: sequelize.QueryTypes.SELECT })
        if (distrito[0]?.distrito_sgip_id) {
            arr.push(distrito.length)
        }
        else (
            arr.push(0)
        )
        totaldis = totaldis + distrito.length
        var grupo = await sequelize.query(`select grupo_id,count(grupo_id) as count from usuarios_usuario where area_id = ${area[i].id} group by grupo_id`, { type: sequelize.QueryTypes.SELECT })
        console.log('grupo: ', grupo);
        if (grupo[1]?.grupo_id) {
            arr.push(grupo.length - 1)
            totalgrp = totalgrp + (grupo.length - 1)
        }
        else (
            arr.push(0)
        )


        // var cab = await sequelize.query(`select sum(count(cabildo_id)) as count from usuarios_usuario where area_id = ${area[i].id} group by cabildo_id`,{type : sequelize.QueryTypes.SELECT})
        // arr.push(cab[0].count)
        resp.push(arr)
    }
    console.log("Total", totalcab, totaldis, totalgrp)
    resp.push(["Total", totalcab, totaldis, totalgrp])

    return res.send({
        message: "Data fetched successfuly",
        title: `Reporte Numérico Estructura Áreas`,
        data: resp
    })
}

async function assignCredsForArea(req, res) {
    try {
        const { area_id, page } = req.body
        var limit = req.body.limit || 10
        var offset = (page - 1) * limit;
        const areadata = await sequelize.query(`select * from usuarios_usuario where area_id = ${area_id} and responsable = 1 limit ${limit}  offset ${offset}`, { type: sequelize.QueryTypes.SELECT })
        // console.log('areadata: ', areadata);
        // if(!re)

        for (var i in areadata) {

            // }

            const { user_id, email, primer_nombre, primer_apellido, responsable, nivel_responsable_id, cabildo_id, distrito_sgip_id, sexo_id } = areadata[i]
            console.log('nivel_responsable: ', nivel_responsable_id);
            if (nivel_responsable_id) {
                const password = random.getRandomPassword(10)
                console.log(password)
                req.email = email
                req.password = password
                req.body.primer_nombre = primer_nombre,
                    req.body.primer_apellido = primer_apellido,
                    req.body.sexo_id = sexo_id
                const encrPassword = md5(password)
                var ar = await sequelize.query(`select nombre from usuarios_area where id = ${area_id}`, { type: sequelize.QueryTypes.SELECT })
                var cb = await sequelize.query(`select nombre from usuarios_cabildo where id = ${cabildo_id}`, { type: sequelize.QueryTypes.SELECT })
                var ds = await sequelize.query(`select nombre from usuarios_distritosgip where id = ${distrito_sgip_id}`, { type: sequelize.QueryTypes.SELECT })
                var heading = ""
                //    var ans = await helper.findRoleDetails(req, res)
                var leaderdata = await sequelize.query(`select usuarios_nivelresponsable.nombre,nacionalidad_id,nivel_responsable_id,area_id,cabildo_id,grupo_id,distrito_sgip_id from usuarios_usuario inner join usuarios_nivelresponsable on usuarios_nivelresponsable.id=usuarios_usuario.nivel_responsable_id where usuarios_usuario.id = ${areadata[i].id}`, { type: sequelize.QueryTypes.SELECT })
                console.log('leaderdata: ', leaderdata);

                // console.log(leaderdata)
                var data = {
                    "level": "",
                    "area_id": "",
                    "cabildo_id": "",
                    "distrito_id": "",
                    "group_id": ""
                }
                if (leaderdata.length) {
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
                var ans = data
                if (ans.level == "Área") {

                    heading = ar[0].nombre
                }
                if (ans.level == "Cabildo") {
                    heading = ar[0].nombre + " " + cb[0].nombre
                }
                if (ans.level == "Distrito") {
                    heading = ar[0].nombre + " " + cb[0].nombre + " " + ds[0].nombre
                }
                req.heading = heading
                const signupdata = {
                    firstName: primer_nombre,
                    lastName: primer_apellido,
                    email: email,
                    password: encrPassword,
                }

                const id = await leader.create(signupdata, (err, data) => {
                    if (err) {
                        return res.status(500).json({ message: 'Server Error' });
                    }

                })
                const data1 = await sequelize.query(`update usuarios_usuario set responsable = ${responsable},nivel_responsable_id = ${nivel_responsable_id} where usuario_id = '${user_id}'`)

                flag = await helper.sendLoginInfo(req, res)
            }
        }
        return res.status(200).send({
            message: "Credentials sent to user",
            data: []
        })
    }
    catch (error) {
        console.log('error: ', error);

        return res.status(500).send({
            message: 'internal serever error',
            data: []
        });
    }
}

async function getAttendanceByLevel(req, res) {
    try {
        var where = await helper.findRoleDetails(req,res)
        const area = req.body.area_id||where.area_id;
        const cabildo = req.body.cabildo_id||where.cabildo_id;
        const district = req.body.distrito_id || null
        const meeting_id = req.body.new_activity_id || null
       
        const whereClause = `WHERE 1=1
    AND (:area IS NULL OR area_id = :area)
    AND (:cabildo IS NULL OR cabildo_id = :cabildo)
    AND (:district IS NULL OR distrito_id = :district) 
    AND (:meeting_id IS NULL OR activity_id = :meeting_id)`;

const query1 = `select * from usuarios_actividad ${whereClause}`

const data = await sequelize.query(query1,{
    type: sequelize.QueryTypes.SELECT,
    replacements :{
        area: area || null,
        cabildo: cabildo || null,
        district: district || null,
        meeting_id : meeting_id || null
    }
})

// console.log('data: ', data);
var label = []
const values =[{"label" : "Damas" , data : []},{"label" : "Cabelleros" , data : []},{"label" : "DJM" , data : []},{"label" : "DJF" , data : []},{"label" : "DEP" , data : []}]
// const values = [{ "label": "Miembros", data: [] }, { "label": "Invitados", data: [] }, { "label": "Invitado por primera vez", data: [] }]
const ar = await sequelize.query(`select id,nombre from usuarios_area order by nombre`,{type : sequelize.QueryTypes.SELECT})
for(var arr in ar){
label.push(ar[arr].nombre)


    
    var damas = 0
    var cabelleros = 0
    var dep = 0
    var djm = 0
    var djf = 0
  
    

for(var i in data){

const divisionresultuser = await sequelize.query(`select division_id as division from usuarios_usuario where area_id = ${ar[arr].id} and id in ((select user_id from attendance where activity_id = ${data[i].id} and role_id = 1))`,{type : sequelize.QueryTypes.SELECT})
// const divisionresultinvitee = await sequelize.query(`select division  from invitados where id in ((select user_id from attendance where activity_id = ${data[i].id} and role_id = 2))`,{type : sequelize.QueryTypes.SELECT})
const divisionresult = divisionresultuser//.concat(divisionresultinvitee)


// var values =[]
// const ar = await sequelize.query(`select id,nombre from usuarios_area`,{type : sequelize.QueryTypes.SELECT})
// for(var j in ar){
//    values.push(0)
//  label.push(ar[i].nombre)                
// //  for(var j in user){
//    if(data[j].area_id==ar[j].id){
//        console.log("ifff",user[j].AREA,user[j].count)
       
//      values[i]=(data[i].count)
//    }

// }
for(var j in divisionresult){
if (divisionresult[j].division == 1) {         //1 -> Damas
    damas++
 }
 else if (divisionresult[j].division == 2) {    //2 -> caballereos
    cabelleros++
 }
 else if (divisionresult[j].division == 3) {    //3 -> DJM
    djm++
 }
 else if (divisionresult[j].division == 4) {    //4 -> DJF
     djf++
 }
 else if (divisionresult[j].division == 5) {    //5-> DEP
    dep++
 }

}
}
values[0].data.push(damas)
values[1].data.push(cabelleros)
values[2].data.push(djm)
values[3].data.push(djf)
values[4].data.push(dep)


}   
  



        console.log(label, values, "att result")
        return res.status(200).send({
            message: "data fetched",
            label,
            values,
        }
        )
    } catch (error) {
        console.log(error)
        console.error('Error:', error.message);
    }


}

async function getMemberAttendanceByLevel(req, res) {
    try {
        var where = await helper.findRoleDetails(req,res)
        const area = req.body.area_id||where.area_id;
        const cabildo = req.body.cabildo_id||where.cabildo_id;
        const district = req.body.distrito_id || null
        const meeting_id = req.body.new_activity_id || null
       
        const whereClause = `WHERE 1=1
    AND (:area IS NULL OR area_id = :area)
    AND (:cabildo IS NULL OR cabildo_id = :cabildo)
    AND (:district IS NULL OR distrito_id = :district) 
    AND (:meeting_id IS NULL OR activity_id = :meeting_id)`;


const query1 = `select * from usuarios_actividad ${whereClause}`

const data = await sequelize.query(query1,{
    type: sequelize.QueryTypes.SELECT,
    replacements :{
        area: area || null,
        cabildo: cabildo || null,
        district: district || null,
        meeting_id : meeting_id || null
    }
})
const ar = await sequelize.query(`select id,nombre from usuarios_area order by nombre`,{type : sequelize.QueryTypes.SELECT})
const areaa = [[], [], [], [], [], [], [], [], [], [], [], []]
for (var i in data) {

    for (var j in ar) {
        if (ar[j].id == data[i].area_id) {
            areaa[j].push(data[i].id)
        }
    }
}
var label = []
const values =[{"label" : "Member" , data : []},{"label" : "Invitee" , data : []},{"label" : "Invitado por" , data : []}]


for(var arr in ar){
label.push(ar[arr].nombre)
values[0].data.push(0)
values[1].data.push(0)
values[2].data.push(0)
// for(var i in areaa){
    // console.log('data: ', data);
    var monthwisedata = { [`${ar[arr].nombre}`]: { member: 0, invitee: 0, invitado_por: 0 } }
    // console.log('areaa[i]: ', areaa[i]);

    if(areaa[i]?.length){
const member = await sequelize.query(`select count(*) as count from attendance where activity_id in (${areaa[arr]}) and role_id = 1`,{type : sequelize.QueryTypes.SELECT})
console.log('member: ', member);
monthwisedata[ar[arr].nombre].member = member[0].count
values[0].data.push(member[0].count)
const invitee = await sequelize.query(`select count(*) as count  from attendance where activity_id in (${areaa[arr]}) and  role_id = 2 and is_invitado_por = 0`,{type : sequelize.QueryTypes.SELECT})
console.log('invitee: ', invitee);
monthwisedata[ar[arr].nombre].invitee = invitee[0].count
values[1].data.push(invitee[0].count)
const newinvitee  = await sequelize.query(`select count(*) as count  from attendance where activity_id in (${areaa[arr]}) and  role_id = 2 and is_invitado_por = 1`,{type : sequelize.QueryTypes.SELECT})
console.log('newinvitee: ', newinvitee);
monthwisedata[ar[arr].nombre].invitado_por = newinvitee[0].count
values[2].data.push(invitee[0].newinvitee)
    }
// }

}   

        console.log(label, values, "att result")
        return res.status(200).send({
            message: "data fetched",
            label,
            values,
        }
        )
    } catch (error) {
        console.log(error)
        console.error('Error:', error.message);
    }


}


async function getDynamicDistrictList(req,res){
    const {provincia_id} = req.body
if(provincia_id){
    const distlist = await sequelize.query(`select * from usuarios_distrito where provincia_id = ${provincia_id} order by nombre`, { type: sequelize.QueryTypes.SELECT })

    return res.status(200).send({
        message: "Data fetched",
        data:{
            district : distlist
        }
    });}
    else{
        return res.status(200).send({
            message: "Data fetched",
            data:{
                district :[]
            }
        })
    }
}


module.exports = {
    getAttendanceByDivision,
    getAttendanceByMonth,
    hierarchydropdown,
    getAllUsers,
    getUsersByDivision,
    getUsersWhoHaveGohonzon,
    leaderSignup,
    blockleader,
    getDashboardMembersByArea,
    getDashboardGohonZonOwnersByArea,
    getDashboardDivisionDistributionByArea,
    getDashboardLeaderAreaTable,
    getDashboardLeaderDivisionPie,
    getDashboardLeaderNivelPie,
    reportForCabildoArea,
    reportForCabildoDivision,
    reportForcabildoDistrictSGIPbyCabildoId,
    getDashBoardCardStats,
    reportForDivision,
    getLeadersById,
    reportForAreaNState,
    reportForAreaNDivision,
    getUserByBuddhistLevelId,
    getUserBySexId,
    getUserByAreaId,
    getUsersByStateId,
    getUserDetails,
    getAreaData,
    addAcivity,
    getAttendanceMemberList,
    getAttendanceInviteeList,
    horizontalGroupMemberList,
    markAttendance,
    getAttendance,
    getChapters,
    getDistricts,
    getInviteeList,
    getInviteeDetails,
    changepassword,
    getAttendanceList,
    horizontalGroupList,
    addHorizontalGroup,
    addMembertoHrGroup,
    addCabildoandSplit,
    addDistrictandSplit,
    test,
    addAreaandSplit,
    getGroupMemberList,
    getGroups,
    addGroupandSplit,
    filterreport,
    addNewMember,
    forgotpassword,
    subscriptiondata,
    subscriptionGraph,
    notAttendedList,
    generalreport,
    clearSubscription,
    deleteUser,
    assignCreds,
    assignCredsForArea,
    getAttendanceByLevel,
    getMemberAttendanceByLevel,
    getAttendanceLeaderList,
    getDynamicDistrictList
}


