const fs = require("fs");
if(!fs.existsSync("images/records.xls")){
    var writeStream = fs.createWriteStream("images/records.xls");
    var header="Sl No"+"\t"+" Email"+"\t"+"First Name"+"\t"+"Last Name"+"\t"+"Password"+"\t"+"Details"+"\n";
    writeStream.write(header);
} else {
    var row = "0"+"\t"+`${req.email}`+"\t"+` ${req.body.primer_nombre}`+`${req.body.primer_apellido}`+`${req.heading}`+"\n";
    writeStream.write(row);
}

const req = {
    email : 'y@r.com',
    body : {primer_nombre : 'yogendra' , primer_apellido : 'raj'},
    heading: 'Hi hello...'
}


// writeStream.write(row2);

writeStream.close();