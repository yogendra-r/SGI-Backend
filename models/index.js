const { Sequelize } = require('sequelize')
const db_config = require('../config/config.json')

const Op = Sequelize.Op;
const operatorsAliases = {
  $eq: Op.eq,
  $ne: Op.ne,
  $gte: Op.gte,
  $gt: Op.gt,
  $lte: Op.lte,
  $lt: Op.lt,
  $not: Op.not,
  $in: Op.in,
  $notIn: Op.notIn,
  $is: Op.is,
  $like: Op.like,
  $notLike: Op.notLike,
  $iLike: Op.iLike,
  $notILike: Op.notILike,
  $regexp: Op.regexp,
  $notRegexp: Op.notRegexp,
  $iRegexp: Op.iRegexp,
  $notIRegexp: Op.notIRegexp,
  $between: Op.between,
  $notBetween: Op.notBetween,
  $overlap: Op.overlap,
  $contains: Op.contains,
  $contained: Op.contained,
  $adjacent: Op.adjacent,
  $strictLeft: Op.strictLeft,
  $strictRight: Op.strictRight,
  $noExtendRight: Op.noExtendRight,
  $noExtendLeft: Op.noExtendLeft,
  $and: Op.and,
  $or: Op.or,
  $any: Op.any,
  $all: Op.all,
  $values: Op.values,
  $col: Op.col
};


const sequelize = new Sequelize(
    db_config.development.database, db_config.development.username, db_config.development.password, {
        'host': db_config.development.host,
        'dialect': 'mysql',
        'timezone': '+05:30',
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000,
          },
      
        // logging: false
        // (str) => console.log("Query ===>>>", str)

    },{operatorsAliases }
)
sequelize.sync().then(() => {
    console.log("DB connection Established")
    
}).catch(err => {
    console.log("Error occure while connecting DB, Error=>>>", err)
})

module.exports = sequelize;