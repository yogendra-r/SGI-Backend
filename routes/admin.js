var express = require('express');
var router = express.Router();
const admin = require('../controllers/admin');
const middleware = require('../middlewares/utility')
const leaders = require('../controllers/leaders')
const validator = require('../middlewares/validator')
const sequelize = require('../models')

router.post('/addNewMember',admin.addNewMember)

router.post('/editDetails',middleware.verifyToken,admin.leaderSignup)

router.post('/getallusers', middleware.verifyToken, admin.getAllUsers);

router.get('/getInviteeList',middleware.verifyToken,admin.getInviteeList)

router.get('/getInviteeDetails',middleware.verifyToken,admin.getInviteeDetails)

router.post('/getUserDetails',admin.getUserDetails)

router.post('/gohonzonreport',middleware.verifyToken,leaders.gohonzonreport)

router.post('/divisionreport',middleware.verifyToken,validator.divisionReport, leaders.divisionreport)

router.post('/leaderreport',middleware.verifyToken,leaders.leadereport)

router.post('/areareport',middleware.verifyToken,leaders.areareport)

router.post('/horizontalgrpreport' , leaders.horizontalreport)
// router.post('/horizontalgrpreport' , middleware.verifyToken,leaders.horizontalreport)

router.post('/blockLeader', middleware.verifyToken, admin.blockleader)
  
//dashboard api single

router.post('/membercards' , middleware.verifyToken, admin.getDashBoardCardStats);

router.get('/memberstable' , middleware.verifyToken, admin.getDashboardMembersByArea);

router.get('/gohonzonownerstable' , middleware.verifyToken, admin.getDashboardGohonZonOwnersByArea)

router.post('/divisionpiechart' ,middleware.verifyToken,  admin.getDashboardDivisionDistributionByArea)

router.get('/leaderDashboardAreaTable' , middleware.verifyToken, admin.getDashboardLeaderAreaTable)

router.get('/leaderDashboardDivisionPie' , middleware.verifyToken, admin.getDashboardLeaderDivisionPie)

router.get('/leaderDashboardNivelPie' , middleware.verifyToken, admin.getDashboardLeaderNivelPie)

//1st report 1table
router.post('/numericdivisionreport' , admin.reportForDivision);

//2nd report 2tables
router.post('/areanstatereport' , admin.reportForAreaNState);

router.post('/areandivisionreport' , admin.reportForAreaNDivision);

//3rd report cabildo 3apis for 3 tables
router.get('/cabildoarea' , middleware.verifyToken, admin.reportForCabildoArea)

router.get('/getleadersbylevelid' , admin.getLeadersById)

router.get('/getuserbyareaid',admin.getUserByAreaId);

router.get('/getuserbystateid' , admin.getUsersByStateId);

router.get('/getuserbysexid' , admin.getUserBySexId);

router.get('/getuserbybuddhistlevelid' , admin.getUserByBuddhistLevelId);

router.get('/getCabildoDivision' , middleware.verifyToken, admin.reportForCabildoDivision);

router.get('/cabildoDistrictSGIPbyId' , middleware.verifyToken, admin.reportForcabildoDistrictSGIPbyCabildoId)

//mark attendance 
router.post('/addActivity' , middleware.verifyToken, admin.addAcivity)

router.post('/getAttendanceMemberList',middleware.verifyToken,admin.getAttendanceMemberList)

router.post('/getAttendanceInviteeList',middleware.verifyToken,admin.getAttendanceInviteeList)

router.post('/getAttendanceLeaderList',middleware.verifyToken,admin.getAttendanceLeaderList)

router.post('/markAttendance', middleware.verifyToken,admin.markAttendance)

router.post('/getAttendance',middleware.verifyToken,admin.getAttendance)

router.post('/getAttendanceDivisionPie',middleware.verifyToken,admin.getAttendanceByDivision)

router.post('/getAttendanceGraph',middleware.verifyToken,admin.getAttendanceByMonth)

router.post('/getMemberAttendanceByLevel',middleware.verifyToken,admin.getMemberAttendanceByLevel)

router.post('/getAttendanceByLevel',middleware.verifyToken,admin.getAttendanceByLevel)

router.post('/getAttendanceList',middleware.verifyToken,admin.getAttendanceList)

//horizontal group
router.get('/horizontalGroupList',admin.horizontalGroupList)

router.post('/addHorizontalGroup',admin.addHorizontalGroup)

router.post('/addMemberToGroup' , admin.addMembertoHrGroup)

router.post('/HrgroupMemberList',admin.horizontalGroupMemberList)

router.post('/addAreaandSplit',admin.addAreaandSplit)

router.post('/addCabildoandSplit',admin.addCabildoandSplit)

router.post('/addDistrictandSplit',admin.addDistrictandSplit)

router.get('/getAreaData', admin.getAreaData)

router.post('/getChapterData',admin.getChapters)

router.post('/getDistrictData',admin.getDistricts)

router.post('/getGroupData',admin.getGroups)

router.post('/groupMemberList',admin.getGroupMemberList)

router.post('/addGroupandSplit', admin.addGroupandSplit)

router.post('/changepassword',middleware.verifyToken,admin.changepassword)

router.post('/hierarchydropdown',admin.hierarchydropdown)

router.post('/filterreport',middleware.verifyToken,admin.filterreport)

router.post('/subscriptiondata',admin.subscriptiondata)

router.post('/subscriptionGraph',middleware.verifyToken,admin.subscriptionGraph)

router.post('/getDynamicDistrictList',admin.getDynamicDistrictList)

router.post('/')

router.post('/forgotpassword',admin.forgotpassword)

router.post('/uploadreport',middleware.uploadDoc.single('doc'),admin.subscriptiondata)

router.post('/notAttendedList',admin.notAttendedList)

router.get('/generalreport',admin.generalreport)

router.post('/clearsubscription',admin.clearSubscription)

router.post('/deleteuser',admin.deleteUser)

router.post('/assigncreds',middleware.verifyToken,admin.assignCreds)

router.post('/assigncredsforarea',middleware.verifyToken,admin.assignCredsForArea)

module.exports = router;

// router.get('/getusersbydivision',admin.getUsersByDivision)
