# SGI_Backend

 var card = {
        Damas : "Vacant",
        Caballeros : "Vacant",
        DJF : "Vacant",
        DJM :"Vacant",
        DEP :"Vacant"
    }
    const area  = await sequelize.query(`select distinct area_id as id ,usuarios_area.nombre from usuarios_area inner join usuarios_usuario as us on usuarios_area.id = us.area_id where nacionalidad_id = ${req.body.nation_id} order by nombre`,{type : sequelize.QueryTypes.SELECT})
    for(var i in area){
    var result = await sequelize.query(`select area_id,nombre_completo,d.nombre as division,a.nombre as Area from usuarios_usuario inner join usuarios_division as d on d.id = usuarios_usuario.division_id inner join usuarios_area as a on a.id = usuarios_usuario.area_id where area_id = ${area[i].id} and responsable = 1 and nivel_responsable_id = 2`, { type: sequelize.QueryTypes.SELECT });
    console.log(result,"resultttt")
    for(var r in result){
    if(result[r].division=="Caballeros"){
        card.Caballeros = result[r].nombre_completo
    }
    else if(result[r].division=="DJF"){
        card.DJF = result[r].nombre_completo
    }
    else if(result[r].division=="DJM"){
        card.DJM = result[r].nombre_completo
    }
    else if(result[r].division=="Damas"){
        card.Damas = result[r].nombre_completo
    }
    else if(result[r].division=="DEP"){
        card.DEP = result[r].nombre_completo
    }
    }
    area[i].leaders = card
    var cabildo = await sequelize.query(`select distinct cabildo_id as id from usuarios_usuario where  area_id = ${area[i].id} `, { type: sequelize.QueryTypes.SELECT });
    area[i].type = "Cabildo" 
    area[i].arr = cabildo
   
    for (var j in cabildo) {
        var result1 = await sequelize.query(`select nombre_completo,c.nombre as cabildo ,cabildo_id,d.nombre as Division from usuarios_usuario inner join usuarios_cabildo as c on c.id = usuarios_usuario.cabildo_id inner join usuarios_division as d on d.id = usuarios_usuario.division_id where area_id = ${area[i].id} and cabildo_id = ${cabildo[j].id} and responsable = 1 and nivel_responsable_id = 3`, { type: sequelize.QueryTypes.SELECT });
        for(var r in result1){
            if(result1[r].division=="Caballeros"){
                card.Caballeros = result1[r].nombre_completo
            }
            else if(result1[r].division=="DJF"){
                card.DJF = result1[r].nombre_completo
            }
            else if(result1[r].division=="DJM"){
                card.DJM = result1[r].nombre_completo
            }
            else if(result1[r].division=="Damas"){
                card.Damas = result1[r].nombre_completo
            }
            else if(result1[r].division=="DEP"){
                card.DEP = result1[r].nombre_completo
            }
            }
           
        cabildo[j].leaders = card        
    var district = await sequelize.query(`select distinct distrito_sgip_id as id from usuarios_usuario where area_id = ${area[i].id} and cabildo_id =${cabildo[j].id} `, { type: sequelize.QueryTypes.SELECT })
    cabildo[j].type = "Distrito"   
    cabildo[j].arr = district
      
       for(var k in district){
        var rs = await sequelize.query(`select nombre_completo,c.nombre ,distrito_sgip_id,d.nombre as Division from usuarios_usuario inner join usuarios_distritosgip as c on c.id = usuarios_usuario.distrito_sgip_id inner join usuarios_division as d on d.id = usuarios_usuario.division_id where area_id = ${area[i].id}  and distrito_sgip_id = ${district[k].id} and cabildo_id = ${cabildo[j].id} and responsable = 1 and nivel_responsable_id = 4`, { type: sequelize.QueryTypes.SELECT })
        for(var r in rs){
            if(rs[r].division=="Caballeros"){
                card.Caballeros = rs[r].nombre_completo
            }
            else if(rs[r].division=="DJF"){
                card.DJF = rs[r].nombre_completo
            }
            else if(rs[r].division=="DJM"){
                card.DJM = rs[r].nombre_completo
            }
            else if(rs[r].division=="Damas"){
                card.Damas = rs[r].nombre_completo
            }
            else if(rs[r].division=="DEP"){
                card.DEP = rs[r].nombre_completo
            }
            }
        district[k].leaders =card
        var group = await sequelize.query(`select distinct grupo_id as id from usuarios_usuario where area_id = ${area[i].id} and cabildo_id =${cabildo[j].id} and  distrito_sgip_id =${district[k].id} `, { type: sequelize.QueryTypes.SELECT })
        district[k].type = "Grupo"
        district[k].arr = group   
        
        for(var s in group){
            var grp = await sequelize.query(`select nombre_completo,c.nombre ,grupo_id,d.nombre as Division from usuarios_usuario inner join usuarios_grupo as c on c.id = usuarios_usuario.grupo_id inner join usuarios_division as d on d.id = usuarios_usuario.division_id where area_id = ${area[i].id} and cabildo_id = ${cabildo[j].id} and distrito_sgip_id =${district[k].id}  and grupo_id = ${group[s].id} and responsable = 1 and nivel_responsable_id = 5`, { type: sequelize.QueryTypes.SELECT })
            group[s].leaders = grp               
        }
       }
    }
}