'use strict';
const DB=require('./index')
const {Sequelize, DataTypes}=require('sequelize')

const invitados = DB.define('invitados', {    
  nombre : DataTypes.STRING,
  appelido : DataTypes.STRING,
  movil: DataTypes.STRING,
  telefono: DataTypes.STRING,
  fetcha_nacimiento: {type :DataTypes.DATEONLY,
  allowNull : true},
  genero : DataTypes.STRING,
  email: DataTypes.STRING,
  direccion: DataTypes.STRING,
  invitado_por : DataTypes.INTEGER,
  division: DataTypes.INTEGER,
  area_id : DataTypes.INTEGER,
  cabildo_id : DataTypes.INTEGER,
  distrito_sgip_id : DataTypes.INTEGER}
,{
  freezeTableName: true,
})
 
 
invitados.sync()
module.exports= invitados
