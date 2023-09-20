'use strict';
const DB=require('./index')
const {Sequelize, DataTypes}=require('sequelize')
const invitados = DB.define('invitados', {    
  nombre : DataTypes.STRING,
  appelido : DataTypes.STRING,
  movil: DataTypes.STRING,
  telefono: DataTypes.STRING,
  fetcha_nacimiento: DataTypes.DATEONLY,
  genero : DataTypes.STRING,
  email: DataTypes.STRING,
  direccion: DataTypes.STRING,
  invitado_por : DataTypes.INTEGER,
  division: DataTypes.INTEGER}
,{
  freezeTableName: true,
})
 

invitados.sync()
module.exports= invitados
