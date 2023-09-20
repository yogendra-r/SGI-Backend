'use strict';
const DB=require('./index')
const {Sequelize, DataTypes}=require('sequelize')
  const auth_leader = DB.define('auth_leader', {    
    firstName: DataTypes.STRING,
    lastName: DataTypes.STRING,
    email: DataTypes.STRING,
    password: DataTypes.STRING,
    is_blocked : {
      type : DataTypes.BOOLEAN,
      defaultValue : false},
    last_login: DataTypes.DATE}
  ,{
    freezeTableName: true,
})


auth_leader.sync()
module.exports= auth_leader


//create table activity (id int auto_increment primary key,nombre varchar(200))
//