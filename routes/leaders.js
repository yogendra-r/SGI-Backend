var express = require('express');
var router = express.Router();
const leaders = require('../controllers/leaders');
const middleware = require('../middlewares/utility')
const validator = require('../middlewares/validator')



router.post('/leaderLogin',validator.login,leaders.leaderLogin)

router.post('/changePassword',middleware.verifyToken,leaders.changepassword)

router.get('/givenAwayMembershipMembers',middleware.verifyToken,leaders.givenAwayMembershipMembers)

router.post('/passedAwayMembers',middleware.verifyToken,leaders.passedAwayMembers)

router.get('/membersMovedToAnotherCountry',middleware.verifyToken,leaders.membersMovedToAnotherCountry)

router.post('/gohonzonreport',middleware.verifyToken,leaders.gohonzonreport)

router.post('/divisionreport',middleware.verifyToken,leaders.divisionreport)

router.post('/leaderreport',middleware.verifyToken,leaders.leadereport)

router.post('/areareport',middleware.verifyToken,leaders.areareport)

router.post('/examreport',middleware.verifyToken,leaders.examreport)

router.post('/addInvitee',middleware.verifyToken,leaders.addinvitee)

router.get('/dropdowndata',middleware.verifyToken, leaders.getdropdowndata)

router.get('/getallactivemembers' , leaders.getAllActiveMembers)

//1st report 1table

router.get('/divisionreport' ,middleware.verifyToken, leaders.reportForDivision);

//2nd report 2tables

router.get('/areanstatereport' ,middleware.verifyToken, leaders.reportForAreaNState);

router.get('/areandivisionreport' ,middleware.verifyToken, leaders.reportForAreaNDivision);

//3rd report cabildo 3apis for 3 tables

router.get('/cabildoarea' ,middleware.verifyToken, leaders.reportForCabildoArea)

router.get('/cabildodivision' ,middleware.verifyToken, leaders.reportForCabildoDivision);

router.get('/cabildoDistrictSGIPbyId' ,middleware.verifyToken, leaders.reportForcabildoDistrictSGIPbyCabildoId)

router.get('/test',leaders.mytest)

router.get('/mytest',leaders.fetchAndInsertReportData)

router.post('/hierarchy',leaders.hierarchy)

router.post('/contactus',leaders.contactus)

router.get('/getUserList',leaders.getUserList)

// router.post('/getdropdowndata1',middleware.verifyToken,leaders.getdropdowndata1)

module.exports = router;

// router.get('/getusers',admin.getUsers);

// router.get('/getallactivemembers' ,middleware.verifyToken, leaders.getAllActiveMembers)