var express = require('express');
var router = express.Router();
const admin = require('../controllers/donation');
const middleware = require('../middlewares/utility')
const validator = require('../middlewares/validator')


router.post('/adminlogin',admin.adminLogin)
router.post('/adminsignup',middleware.verifyToken,admin.adminsignup)
router.get('/dropdownlist',admin.dropdown)
router.post('/deleteDonationRecords',admin.clearDonationRecords)
router.post('/adddonation',middleware.uploadrec.single('doc'),admin.adddonation)
router.post('/getuserbycedula',admin.getuserbycedula)
router.post('/addnewuser',admin.addnewuser)
router.get('/getdashboardcards',admin.getdashboardcards)
router.get('/getdonationpie',admin.donationpie)
router.get('/gettotalregistrations',admin.totalregistrationbymonth)
router.get('/gettotaldonationbymonth',admin.totaldonationbymonth)
router.get('/totalDonorsByMonth',admin.donorsbymonth)
router.get('/reporttotaldonationbymonth',admin.reporttotaldonationbymonth) //5
router.get('/reporttotaldonationytd',admin.reporttotaldonationytd) //4
router.get('/reporttotalregistrationbymonth',admin.reporttotalregistrationbymonth) //6
router.get('/reporttotalmembersbymonth',admin.reporttotalmembersbymonth) //7
router.post('/persnalizedreport',admin.persnalizedreport) //8
router.post('/reportdonationbymethod',admin.reportdonationbymethod) //11
router.post('/reportdonationbytype',admin.reportdonationbytype) //12
router.post('/searchreportbyyear',admin.searchreportbyyear) //1
router.post('/searchmemberreportbyyear',admin.searchmemberreportbyyear) //2
router.get('/reportpermonthbyarea',admin.reportpermonthbyarea) //3
router.get('/reportmemberpermonthbyarea',admin.reportmemberpermonthbyarea) //9
router.get('/reportpercentpermonthbyarea',admin.reportpercentpermonthbyarea) //10
router.post('/getDonationList',admin.getdonationList)

router.get('/getAdminList',admin.getAdminList)
router.post('/deletAdmin',admin.deleteAdmin)




module.exports=router 






