'use strict';
const DB=require('./index')
const {Sequelize, DataTypes}=require('sequelize')

const usuarios_grupohorizontal = DB.define('usuarios_grupohorizontal', {    
  nombre: DataTypes.STRING
}
,{
  freezeTableName: true,
})
 

usuarios_grupohorizontal.sync()
module.exports= usuarios_grupohorizontal
