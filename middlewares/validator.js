var { Validator } = require('node-input-validator')
const leader = require("../models/auth_leader")



module.exports = {
    login: function (req, res, next) {

        let validator = new Validator(req.body, {
            email: 'email|required',
            password: 'required|string|minLength:5'

        });
        validator.check().then(function (matched) {
            if (!matched) {
                res.status(400).send(
                    {
                        "message": "Invalid details provided.",
                        "data": validator.errors
                    }
                )
            }
            else { next() }
        });
    },

    
   signup: function (req, res, next) {
        let validator = new Validator(req.body, {
            user_id : 'required',
            level_id : 'required'
        })
        validator.check().then(function (matched) {
            if (!matched) {
                res.status(400).send({
                    "message": "Invalid details provided.",
                    "data": validator.errors
                })
            }
            else { next() }
        });
    },

    
    divisionReport: function (req, res, next) {
        let validator = new Validator(req.body, {
            division_id: 'required',
            area_id: 'required'
        })
        validator.check().then(function (matched) {
            if (!matched) {
                res.status(400).send({
                    "message": "Invalid details provided.",
                    "data": validator.errors
                })
            }
            else { next() }
        });
    },


    changePassword: function (req, res, next) {
        let validator = new Validator(req.body, {
            old_password: 'required|string|minLength:5',
            new_password: 'required|string|minLength:5'
        })
        validator.check().then(function (matched) {
            if (!matched) {
                res.status(400).send({
                    "message": "Invalid details provided.",
                    "data": validator.errors
                })
            }
            else { next() }
        });
    },
}

