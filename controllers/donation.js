const con = require('../config/config.json').development;
const helper = require('../middlewares/helper')
const leader = require("../models/auth_leader")
const sequelize = require('../models')
var random = require('random-string-alphanumeric-generator');
const { Op } = require("sequelize");
const config = require('../config/otherConfig.json')
const nodemailer = require('nodemailer')

const PDFDocument = require('pdfkit');
const fs = require('fs');
const XLSX = require('xlsx');
const md5 = require('md5');
const invitados = require('../models/invitees');


async function adminLogin(req, res) {
  try {
    const { email, password } = req.body
    const result = await sequelize.query(`select * from auth_admin where email = "${email}"`, { type: sequelize.QueryTypes.SELECT })
    if (result) {
      console.log(result[0].password, md5(password))
      if (result[0].password == md5(password)) {
        const tokendata = {
          email: result[0].email,
          id: result[0].id,
          first_name: result[0].firstName
        }
        const token = helper.createToken(tokendata)

        var date = new Date()
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const seconds = date.getSeconds().toString().padStart(2, '0');

        // Create a formatted time string
        const currentTime = `${hours}:${minutes}:${seconds}`;
        await sequelize.query(`update auth_admin set last_login = "${date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + currentTime}" where email = "${email}"`)

        return res.status(200).send({
          message: "login successful",
          data: result[0],
          token: token
        })
      }
      else {
        return res.status(400).send({
          message: "incorrect password"
        })
      }
    }
    else {
      return res.status(400).send({
        message: "Email does not exists"
      })
    }
  } catch (e) {
    console.log(e)
    return res.status(500).json({ message: 'Server Error' });
  }
}

async function adminsignup(req, res) {
  try {
    const { first_name, last_name, email, password } = req.body

    var user = await sequelize.query(`select * from auth_admin where email = "${email}"`, { type: sequelize.QueryTypes.SELECT })
    if (user.length) {
      return res.status(400).send({
        message: "email already registered",
        data: []
      })
    } else {
      var result = await sequelize.query(`insert into auth_admin(firstName,lastName,email,password) values("${first_name}","${last_name}","${email}","${md5(password)}")`)
      return res.status(200).send({
        message: "Admin added successfuly",
        data: result[0]
      })
    }
  }
  catch (e) {
    console.log(e)
    return res.status(500).json({ message: 'Server Error' });
  }
}

async function dropdown(req, res) {
  try {
    var dtype = await sequelize.query(`select * from donation_type`, { type: sequelize.QueryTypes.SELECT })
    var dmethod = await sequelize.query(`select * from donation_method`, { type: sequelize.QueryTypes.SELECT })
    var area = await sequelize.query(`select * from usuarios_area order by nombre`, { type: sequelize.QueryTypes.SELECT })
    var cabildo = await sequelize.query(`select * from usuarios_cabildo order by nombre`, { type: sequelize.QueryTypes.SELECT })
    var distrito = await sequelize.query(`select * from usuarios_distritosgip`, { type: sequelize.QueryTypes.SELECT })
    var grupo = await sequelize.query(`select * from usuarios_grupo`, { type: sequelize.QueryTypes.SELECT })
    return res.status(200).send({
      message: "Data fetched",
      donation_type: dtype,
      donation_method: dmethod,
      area: area,
      cabildo: cabildo,
      distrito: distrito,
      grupo: grupo
    })
  }
  catch (e) {
    console.log(e)
    return res.status(500).json({ message: 'Server Error' });
  }
}

async function adddonation(req, res) {
  try{
  console.log(req.body, "add donation")
  const { donation_method, donation_type, amount, donation_date, user_id } = req.body
  var result = await sequelize.query(`select max(confirmation_no) as max from donation_info`, { type: sequelize.QueryTypes.SELECT })
  if (result[0].max != null) {
    var con = "CON" + (Number(result[0].max.slice(3, 10)) + 1)
  }
  else {
    var con = "CON1000001"
  }
  console.log('req.doc: ', req.doc);

  generateAndSendPdf({ conf_no: con ,reciept : req.doc})
  var donationmonth = donation_date.split("-")[1]
  sequelize.query(`insert into donation_info(donation_type,donation_method ,amount,donation_date,user_id,confirmation_no,donation_month,reciept)
     values ("${donation_type}","${donation_method}","${amount}","${donation_date}","${user_id}","${con}",${donationmonth},"receipt/${con}.pdf")`)
  return res.status(200).send({
    message: "GRACIAS SU CONTRIBUCIÓN HA SIDO REGISTRADA SATISFACTORIAMENTE",
    data: con
  })}
  catch(error){
    console.log(error)
    return res.status(500).send({
      message: "Internal server error",
      data: []
    })}
}

async function getuserbycedula(req, res) {
  var result = await sequelize.query(`select nombre_completo ,usuario_id as cedula , usuarios_usuario.id,email, area.nombre as area, cabildo.nombre as cabildo, distrito.nombre as distrito from usuarios_usuario
    inner join usuarios_area as area on area.id = usuarios_usuario.area_id inner join usuarios_cabildo as cabildo on cabildo.id = usuarios_usuario.cabildo_id 
    inner join usuarios_distritosgip as distrito on distrito.id = usuarios_usuario.distrito_sgip_id left join usuarios_grupo as grupo on grupo.id = usuarios_usuario.grupo_id
    where usuario_id = "${req.body.cedula}"`, { type: sequelize.QueryTypes.SELECT })
   if(!result.length){
    var result = await sequelize.query(`select nombre_completo ,usuario_id as cedula , usuarios_usuario.id,email, area.nombre as area, cabildo.nombre as cabildo, distrito.nombre as distrito from donation_users as usuarios_usuario
      inner join usuarios_area as area on area.id = usuarios_usuario.area inner join usuarios_cabildo as cabildo on cabildo.id = usuarios_usuario.cabildo
      inner join usuarios_distritosgip as distrito on distrito.id = usuarios_usuario.distrito 
      where usuario_id = "${req.body.cedula}" limit 1`, { type: sequelize.QueryTypes.SELECT })
   }
  if (result.length) {
    result[0].id = result[0].cedula
    console.log(result, "cedula data")
    return res.status(200).send({
      message: "data fetched",
      is_registered: true,
      cedula : req.body.cedula,
      data: result
    })
  }
  else {
    console.log("false")
    return res.status(200).send({
      message: "user not found",
      is_registered: false,
      cedula : req.body.cedula,
      data: []
    })
  }
}

function drawTable(doc, table) {
  var { rows, yStart, xStart, rowHeight, padding, maxWidth, fontSize } = table;

  doc.fontSize(fontSize);

  const columnCount = 2; // Set the number of columns to 2
  const columnWidths = Array(columnCount).fill(0); // Initialize columnWidths


  // Calculate the maximum width of each column
  for (let i = 0; i < rows.length; i++) {
    const currentRow = rows[i];
    for (let j = 0; j < columnCount; j++) {
      const cellWidth = doc.widthOfString(currentRow[j]) + 2 * padding * 2;
      if (cellWidth > columnWidths[j]) {
        columnWidths[j] = cellWidth;
      }
    }
  }

  const tableWidth = columnWidths.reduce((acc, width) => acc + width, 0);

  if (tableWidth > maxWidth) {
    throw new Error('Table width exceeds maximum width');
  }

  for (let i = 0; i < rows.length; i++) {

    const currentRow = rows[i];
    const currentY = yStart + i * rowHeight;

    //  table cells #11142D
    for (let j = 0; j < columnCount; j++) {
      // Check if it's the first column
      if (j === 0) {
        doc.font('Helvetica');
        doc.rect(xStart, currentY, columnWidths[j], rowHeight).fillAndStroke('#f9f9ff', '#e8ebee');
        var fill = '#13172f'
        doc.fillColor('##989898');
      } else {
        doc.font('Helvetica');
        doc.rect(xStart, currentY, columnWidths[j], rowHeight).fillAndStroke('white', '#e8ebee');
        var fill = 'grey';
      }

      doc.fillColor(fill)
      doc.text(currentRow[j], xStart + padding, currentY + padding);
      xStart += columnWidths[j];
    }

    //  next row
    xStart = table.xStart;
  }
}

function drawHtmlTable(table) {
  var { rows } = table;
  const   rowHeight = 25,
  padding = 15,
  margin = 15,
  maxWidth = 1000,
  fontSize = 12 

  const columnCount = 2; 
  const columnWidths = Array(columnCount).fill(0); 

  // maximum width of each column
  for (let i = 0; i < rows.length; i++) {
    const currentRow = rows[i];
    for (let j = 0; j < columnCount; j++) {
      const cellWidth = currentRow[j].length * 10 + 2 * padding * 2; 
      if (cellWidth > columnWidths[j]) {
        columnWidths[j] = cellWidth;
      }
    }
  }

  const tableWidth = columnWidths.reduce((acc, width) => acc + width, 0);

  if (tableWidth > maxWidth) {
    throw new Error('Table width exceeds maximum width');
  }

  let htmlTable = `
    <table style="border-collapse: collapse; width: ${tableWidth + 2 * margin}px; margin: ${margin}px;">
      <thead>
        <tr>
        
        </tr>
      </thead>
      <tbody>
  `;

  for (let i = 0; i < rows.length; i++) {
    const currentRow = rows[i];
    htmlTable += `<tr style="height: ${rowHeight}px;">`;
    for (let j = 0; j < columnCount; j++) {
      htmlTable += `<td style="border: 1px solid #dddddd; text-align: left; padding: ${padding}px; background-color: ${j === 0 ? '#f9f9ff' : 'white'}; color: ${j === 0 ? '#989898' : 'grey'};">${currentRow[j]}</td>`;
    }
    htmlTable += `</tr>`;
  }

  htmlTable += `
      </tbody>
    </table>
  `;

  return htmlTable;
}



// function drawHtmlTable(table) {
//   var { rows, yStart, xStart, rowHeight, padding, maxWidth, fontSize } = table;

//   const columnCount = 2; 
//   const columnWidths = Array(columnCount).fill(0); 

//   // Calculate the maximum width of each column
//   for (let i = 0; i < rows.length; i++) {
//     const currentRow = rows[i];
//     for (let j = 0; j < columnCount; j++) {
//       const cellWidth = currentRow[j].length * 10 + 2 * padding * 2; 
//       if (cellWidth > columnWidths[j]) {
//         columnWidths[j] = cellWidth;
//       }
//     }
//   }

//   const tableWidth = columnWidths.reduce((acc, width) => acc + width, 0);

//   if (tableWidth > maxWidth) {
//     throw new Error('Table width exceeds maximum width');
//   }

//   // Construct the HTML table with applied CSS styles
//   let htmlTable = `
//     <table style="border-collapse: collapse; width: 100%;">
//       <thead>
//         <tr>
//           <th style="border: 1px solid #dddddd; text-align: left; padding: ${padding}px; background-color: #f9f9ff; color: #989898;">Column 1</th>
//           <th style="border: 1px solid #dddddd; text-align: left; padding: ${padding}px; background-color: #e8ebee; color: grey;">Column 2</th>
//         </tr>
//       </thead>
//       <tbody>
//   `;

//   for (let i = 0; i < rows.length; i++) {
//     const currentRow = rows[i];
//     htmlTable += `<tr>`;
//     for (let j = 0; j < columnCount; j++) {
//       htmlTable += `<td style="border: 1px solid #dddddd; text-align: left; padding: ${padding}px; background-color: ${j === 0 ? '#f9f9ff' : 'white'}; color: ${j === 0 ? '#989898' : 'grey'};">${currentRow[j]}</td>`;
//     }
//     htmlTable += `</tr>`;
//   }

//   htmlTable += `
//       </tbody>
//     </table>
//   `;

//   return htmlTable;
// }

// Usage example:
const table = {
  rows: [
    ['Data 1', 'Data 2'],
    ['Data 3', 'Data 4']
  ],
  yStart: 100,
  xStart: 100,
  rowHeight: 35,
  padding: 20,
  maxWidth: 500,
  fontSize: 12,
};

// const htmlTable = drawTable(table);
// console.log(htmlTable);



async function generateAndSendPdf(pdfdata) {
  console.log('pdfdata: ', pdfdata);
  // console.log(pdfdata.reciept)
  var message = await sequelize.query(`select * from messages`,{type : sequelize.QueryTypes.SELECT})
  var random = Math.floor(Math.random() * message.length);
  var randommessage  = await sequelize.query(`select message from messages where id = ${random}`,{type : sequelize.QueryTypes.SELECT})
  console.log('randommessage: ', randommessage);
  var pdf = await sequelize.query(`select usuario_id,usuarios_area.nombre as area,usuarios_usuario.email, usuarios_cabildo.nombre as cabildo,usuarios_distritosgip.nombre as distrito,
   nombre_completo,confirmation_no,IFNULL(usuarios_grupo.nombre," ")as grupo, donation_type.nombre as donation_type, donation_date,donation_method.nombre as donation_method,months.nombre as donation_month ,donation_info.amount, usuarios_division.nombre as division from donation_info   inner join usuarios_usuario on usuarios_usuario.usuario_id = donation_info.user_id inner join usuarios_area on usuarios_area.id = usuarios_usuario.area_id
  inner join usuarios_cabildo on usuarios_cabildo.id = usuarios_usuario.cabildo_id inner join usuarios_distritosgip on usuarios_distritosgip.id = usuarios_usuario.distrito_sgip_id
  inner join usuarios_division on usuarios_division.id = usuarios_usuario.division_id  inner join months on donation_info.donation_month = months.id
  inner join donation_method on donation_method.id = donation_info.donation_method  inner join donation_type on donation_type.id = donation_info.donation_type 
  left join usuarios_grupo on usuarios_grupo.id = usuarios_usuario.grupo_id
  where confirmation_no = "${pdfdata.conf_no}"`,{type : sequelize.QueryTypes.SELECT})
  if(!pdf.length){
    var pdf = await sequelize.query(`select usuario_id,usuarios_area.nombre as area, usuarios_cabildo.nombre as cabildo,usuarios_distritosgip.nombre as distrito,
   nombre_completo,confirmation_no,IFNULL(usuarios_grupo.nombre," ")as grupo, donation_type.nombre as donation_type, donation_date,donation_method.nombre as donation_method,months.nombre as donation_month ,donation_info.amount from donation_info   inner join donation_users on donation_users.usuario_id = donation_info.user_id inner join usuarios_area on usuarios_area.id = donation_users.area
  inner join usuarios_cabildo on usuarios_cabildo.id = donation_users.cabildo inner join usuarios_distritosgip on usuarios_distritosgip.id = donation_users.distrito
   inner join months on donation_info.donation_month = months.id
  inner join donation_method on donation_method.id = donation_info.donation_method  inner join donation_type on donation_type.id = donation_info.donation_type 
  left join usuarios_grupo on usuarios_grupo.id = donation_users.grupo
  where confirmation_no = "${pdfdata.conf_no}"`,{type : sequelize.QueryTypes.SELECT})
  }
  const doc = new PDFDocument();
  const pdfStream = fs.createWriteStream(`pdf/${pdfdata.conf_no}.pdf`);
  doc.pipe(pdfStream);
console.log(pdf[0])
  const table = {
    //   headers: ['Column 1', 'Column 2'],
    rows: [
      ['No. de confirmación', `${pdfdata.conf_no}`],
      ['Cédula', `${pdf[0].usuario_id}`],
      ['Nombre y apellido', `${pdf[0].nombre_completo}`],
      ['Área', `${pdf[0].area}`],
      ['Cabildo', `${pdf[0].cabildo}`],
      ['Distrito', `${pdf[0].distrito}`],
      ['Fecha de registro', `${pdf[0].donation_date}`],
      ['Método', `${pdf[0].donation_method}`],
      ['Tipo', `${pdf[0].donation_type}`],
      ['Año',`${pdf[0].donation_date.split("-")[0]}`],
      ['Mes', `${pdf[0].donation_month}`],
      ['Monto', `$${pdf[0].amount}`]
    ],

    yStart: 100,
    xStart: 100,
    rowHeight: 35,
    padding: 20,
    margin: 20,
    maxWidth: 2000,
    fontSize: 12,
  };

  try {
    drawTable(doc, table);
    doc.end();
    pdfStream.on('finish', () => {
      console.log('Table PDF created successfully.');
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: "sgipanama1@gmail.com",
          pass: "zgmpuzsjzwvuuqlh",
        },
      });
      // console.log('pdfBase64: ', pdfBase64);
      const htmltable = drawHtmlTable(table)
      // console.log('htmltable: ', htmltable);
      // Define email options
      const mailOptions = {
        from: 'sgipanama1@gmail.com',
        // to: `muskan.shu@cisinlabs.com, sgip.enfoque@gmail.com ,${pdf[0].email}`,
        to: ` sgip.enfoque@gmail.com ,${pdf[0].email}`,
        subject: 'CONFIRMACIÓN DE SU CONTRIBUCIÓN',
        html: `<html><p>Estimado (a) ${pdf[0].nombre_completo} <p> 
        <p>Se ha registrado satisfactoriamente su contribución con los 
        siguientes datos adjuntos:<p>
        <p>Muchas gracias por ser miembro activo del Depto. de Contribuciones de la SGIP. </p> 
        <p><i>${randommessage[0].message}</i><p>
        <p> Las contribuciones  serán administradas y empleadas para promover el kosen-rufu
        impulsado por la Soka Gakkai Internacional de Panamá. </p>
        ${htmltable} <br>
        <p> Donation Receipt : https://basededatos.sgipanama.com:8080/receipt/${pdfdata.reciept}</p>
        </html>`,
        attachments: [
          {
            filename: `${pdfdata.conf_no}.pdf`,
            path: `pdf/${pdfdata.conf_no}.pdf`,
          },
        ]

      }

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error('Error sending email:', error);
        } else {
          console.log('Email sent:', info.response);
        }

      });
    });
  } catch (error) {
    console.error('Error:', error.message);
  }
}



async function addnewuser(req, res) {
  console.log(req.body)
  const {cedula_id, nombre_completo,area, cabildo, distrito, grupo, email} = req.body
  var userExists = await sequelize.query(`select * from usuarios_usuario where usuario_id = "${cedula_id}"`, { type: sequelize.QueryTypes.SELECT })
  console.log('userExists: ', userExists);
  if(!userExists[0]){
    userExists = await sequelize.query(`select * from donation_users where usuario_id = "${cedula_id}"`, { type: sequelize.QueryTypes.SELECT })
  }
  if(userExists[0]){
    return res.status(400).send({
      message: "User already exists",
      data:[]
    })
  }
  var ar = await sequelize.query(`select nombre from usuarios_area where id = ${area}`, { type: sequelize.QueryTypes.SELECT })
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: config.SMTP.user,
      pass: config.SMTP.password
    },
    tls: { rejectUnauthorized: false }
  });
  var mailOptions = {
    from: 'SGI-Panama  <sgipanama1@gmail.com>',
    // to:  `muskan.shu@cisinlabs.com ,maires.carlos@gmail.com,motwani.j@gmail.com , basededatosgip@gmail.com , ${req.email }`,//`${req.token.email} , ${req.email}`,
    to:  ` sgip.enfoque@gmail.com`,//muskan.shu@cisinlabs.com ,
    subject: `User Donation Details`,
    html: `
    <br>New donation is regireted with the below details:.<br>
    <br>
     FULL NAME : ${nombre_completo} <br>
     CEDULA : ${cedula_id} <br>
     AREA : ${ar[0].nombre} <br>
     EMAIL: ${email} <br>
    <br>
   </html>`
  };
  transporter.sendMail(mailOptions, (erro, info) => {
    if (erro) {
      console.log(erro)
      return false
    }
    return true
})
  sequelize.query(`insert into donation_users (usuario_id,nombre_completo, area, cabildo, distrito,  email) values("${cedula_id}","${nombre_completo}",${area},${cabildo},${distrito},"${email}")`)
  return res.status(200).send({
    message: "user added successfuly",
    data: { user_id: cedula_id }
  })
}


async function getdashboardcards(req, res) {
  var date = new Date()
  var year = date.getFullYear()
  // var month = "02"//date.getMonth() + 1
  // var fulldate = `${year}-${month}%`
  // console.log("fulldate",fulldate)
  let monthInt =  date.getMonth() +1 ;
  let monthStr = monthInt.toLocaleString();
  var month = monthStr.length === 1 ? "0"+ monthStr  : monthStr;
  var fulldate = `${year}-${month}%`
  console.log(fulldate,"full date dekhlo bhiyooo")
  var month = monthStr.length === 1 ? "0"+monthStr  : monthStr;
  var fulldate = `${year}-${month}%`
  console.log(fulldate,"full date dekhlo bhiyooo")
  var totalreg = await sequelize.query(`select count(*) as count from donation_info where donation_date like "${fulldate}"`, { type: sequelize.QueryTypes.SELECT })
  var totalmember = await sequelize.query(`select distinct user_id from donation_info where donation_date like "${fulldate}"`, { type: sequelize.QueryTypes.SELECT })
  var totalactive = await sequelize.query(`select count(*) as count  from usuarios_usuario where estado_id = 1`, { type: sequelize.QueryTypes.SELECT })
  var activepercent = (totalmember.length / totalactive[0].count) * 100
  var monthdonation = await sequelize.query(`select sum(amount) as count from donation_info where donation_date like "${fulldate}"`, { type: sequelize.QueryTypes.SELECT })
  console.log('monthdonation: ', monthdonation);
  var yearlydonation = await sequelize.query(`select sum(amount) as count from donation_info where donation_date like "${year}%"`, { type: sequelize.QueryTypes.SELECT })
const amount = (monthdonation[0].count!=null)?monthdonation[0].count : 0
  return res.status(200).send({
    message: "cards",
    data: {
      "Total registros mes corriente": totalreg[0].count,
      "Total registros mes corriente miembros sin duplicar": totalmember.length,
      "Total miembros actiivos (base de datos)": totalactive[0].count,
      "% miembros activos que contribuyen":activepercent.toFixed(2)+`%`,
      "Total contribución mes corriente": `$`+amount,
      "Total contribución acumulada en el año a la fecha": `$`+(yearlydonation[0].count).toFixed(2)
    }
  })

}


async function donationpie(req, res) {
  var date = new Date()
  var year = date.getFullYear()
  var userData = await sequelize.query(`select area.nombre as area ,IFNULL(sum(amount),0) as amount from usuarios_area as area 
  left join usuarios_usuario  on area.id = usuarios_usuario.area_id
  inner join donation_info on usuarios_usuario.usuario_id = donation_info.user_id
  where donation_date like "${year}%" group by area order by area`, { type: sequelize.QueryTypes.SELECT })
  return res.status(200).send({
    message: "data fetched",
    data: userData
  })

}


// done not needed
async function donorsbymonth(req, res) {
  var date = new Date()
  var year = date.getFullYear()
  var user = []
  var resp = {
    month: "",
    amount: ""
  }
  var months = await sequelize.query(`select * from months`, { type: sequelize.QueryTypes.SELECT })
  console.log(months, "months")
  for (var i in months) {
    var resp = {
      month: "",
      count: ""
    }
    console.log(months[i].nombre)
    resp.month = months[i].nombre
    resp.count = 0
    var data = await sequelize.query(`select distinct donation_month,count(distinct user_id) as count from donation_info where donation_date like "${year}%" group by donation_month`, { type: sequelize.QueryTypes.SELECT })
    // console.log(data[0])
    for (var j in data) {
      if (Number(months[i].id) == Number(data[j].donation_month)) {
        resp.count = data[j].count
      }
    }
    user.push(resp)

  }
  return res.status(200).send({
    message: "data fetched",
    data: user
  })

}

// done not needed
async function totaldonationbymonth(req, res) {
  var date = new Date()
  var year = date.getFullYear()
  var user = []
  var resp = {
    month: "",
    amount: ""
  }
  var months = await sequelize.query(`select * from months`, { type: sequelize.QueryTypes.SELECT })
  console.log(months, "months")
  for (var i in months) {
    var resp = {
      month: "",
      amount: ""
    }
    console.log(months[i].nombre)
    resp.month = months[i].nombre
    resp.amount = 0
    var data = await sequelize.query(`select donation_month,sum(amount) as amount from donation_info where donation_date like "${year}%" group by donation_month`, { type: sequelize.QueryTypes.SELECT })
    // console.log(data[0])
    for (var j in data) {
      if (months[i].id == data[j].donation_month) {
        resp.amount = data[j].amount
      }
    }
    user.push(resp)

  }
  return res.status(200).send({
    message: "data fetched",
    data: user
  })

}

// done not needed
async function totalregistrationbymonth(req, res) {
  var date = new Date()
  var year = date.getFullYear()
  var user = []
  var resp = {
    month: "",
    amount: ""
  }
  var months = await sequelize.query(`select * from months`, { type: sequelize.QueryTypes.SELECT })
  console.log(months, "months")
  for (var i in months) {
    var resp = {
      month: "",
      count: ""
    }
    console.log(months[i].nombre)
    resp.month = months[i].nombre
    resp.count = 0
    var data = await sequelize.query(`select donation_month,count(*) as count from donation_info where donation_date like "${year}%" group by donation_month`, { type: sequelize.QueryTypes.SELECT })
    // console.log(data[0])
    for (var j in data) {
      if (months[i].id == data[j].donation_month) {
        resp.count = data[j].count
      }
    }
    user.push(resp)

  }
  return res.status(200).send({
    message: "data fetched",
    data: user
  })

}

//done
async function reporttotaldonationytd(req, res) {
  var date = new Date()
  var year = date.getFullYear()
  var users = [["Area", "Total $$"]]
  var resp = []
  var area = await sequelize.query(`select * from usuarios_area order by nombre`, { type: sequelize.QueryTypes.SELECT })

  for (var i in area) {
    var resp = []

    // console.log(months[i].nombre) 
    resp.push(area[i].nombre)
    resp.push(0)
    var user = await sequelize.query(`SELECT SUM(amount) as amount,usuarios_area.id as area, usuarios_area.nombre as nombre   FROM usuarios_area left join usuarios_usuario on usuarios_usuario.area_id = usuarios_area.id inner join donation_info on donation_info.user_id = usuarios_usuario.usuario_id where donation_date like "${year}%"  GROUP BY area order by nombre`, { type: sequelize.QueryTypes.SELECT })
    var newuser = await sequelize.query(`SELECT SUM(amount) as amount,usuarios_area.id as area, usuarios_area.nombre as nombre   FROM usuarios_area left join donation_users as usuarios_usuario on usuarios_usuario.area = usuarios_area.id inner join donation_info on donation_info.user_id = usuarios_usuario.usuario_id where donation_date like "${year}%"  GROUP BY area order by nombre`, { type: sequelize.QueryTypes.SELECT })
    user = user.concat(newuser)
    // console.log(user)
    for (var j in user) {
      if (area[i].id == user[j].area) {
        resp[1] = ((user[j].amount).toFixed(2))
      }
    }
    users.push(resp)
  }

  return res.status(200).send({
    message: "data fetched",
    data: users,
    title: "Contribución YTD por Área"
  })

}

//done not needed
async function reporttotaldonationbymonth(req, res) {
  var date = new Date()
  var year = date.getFullYear()
  var users = [["Month", "Total $$"]]
  var resp = []
  var months = await sequelize.query(`select * from months`, { type: sequelize.QueryTypes.SELECT })
  // console.log(months,"months")
  for (var i in months) {
    var resp = []
    // console.log(months[i].nombre) 
    resp.push(months[i].nombre)
    resp.push(0)
    var user = await sequelize.query(`SELECT SUM(amount) as amount, donation_month  FROM donation_info  where donation_date like "${year}%"  GROUP BY donation_month`, { type: sequelize.QueryTypes.SELECT })
    console.log(user)
    for (var j in user) {
      if (months[i].id == user[j].donation_month) {
        console.log(months[i].id, user[j].donation_month, user[j].amount)
        resp[1] = (user[j].amount).toFixed(2)

      }
    }
    users.push(resp)
  }

  return res.status(200).send({
    message: "data fetched",
    data: users,
    title: "Contribución total por mes"
  })

}

async function monthlyreportbyarea(req, res) {
  var date = new Date()
  var year = date.getFullYear()
  var months = await sequelize.query(`select * from months`, { type: sequelize.QueryTypes.SELECT })
  var area = await sequelize.query(`select * from usuarios_area`, { type: sequelize.QueryTypes.SELECT })
  for (var i in area) {
    var user = await sequelize.query(`SELECT SUM(amount) as amount, donation_month  FROM donation_info inner join usuarios_usuario on donation_info.user_id = usuarios_usuario.usuario_id 
   where donation_date like "${year}% and area_id = ${area[i].id}"  GROUP BY donation_month`, { type: sequelize.QueryTypes.SELECT })
  }
  console.log(user)

}

//done not needed
async function reporttotalregistrationbymonth(req, res) {
  var date = new Date()
  var year = date.getFullYear()
  var user = [["MES", "REGISTROS"]]
  var resp = []
  var months = await sequelize.query(`select * from months`, { type: sequelize.QueryTypes.SELECT })
  console.log(months, "months")
  for (var i in months) {
    resp = []
    console.log(months[i].nombre)
    resp.push(months[i].nombre)
    resp.push(0)
    var data = await sequelize.query(`select donation_month,count(*) as count from donation_info where donation_date like "${year}%" group by donation_month`, { type: sequelize.QueryTypes.SELECT })
    
    // console.log(data[0])
    for (var j in data) {
      if (months[i].id == data[j].donation_month) {
        resp[1] = data[j].count
      }
    }
    user.push(resp)

  }
  return res.status(200).send({
    message: "data fetched",
    data: user,
    title: "Total registros por mes"
  })

}

//done not needed
// async function reporttotalmembersbymonth(req, res) {
//   var date = new Date()
//   var year = date.getFullYear()
//   var user = [["MES", "MIEMBROS"]]
//   var resp = []
//   var months = await sequelize.query(`select * from months`, { type: sequelize.QueryTypes.SELECT })
//   console.log(months, "months")
//   for (var i in months) {
//     resp = []
//     console.log(months[i].nombre)
//     resp.push(months[i].nombre)
//     resp.push(0)
//     var data = await sequelize.query(`select donation_month,count(*) as count from donation_info where donation_date like "${year}%" group by  donation_month`, { type: sequelize.QueryTypes.SELECT })
   
//     console.log(data[0])
//     for (var j in data) {
//       if (months[i].id == data[j].donation_month) {
//         resp[1] = data[j].count
//       }
//     }
//     user.push(resp)

//   }
//   console.log('user: ', user);
//   return res.status(200).send({
//     message: "data fetched",
//     data: user,
//     title: "Total miembros por mes"
//   })

// }
async function reporttotalmembersbymonth(req, res) {
  var date = new Date();
  var year = date.getFullYear();
  var user = [["MES", "MIEMBROS"]];
  var resp = [];
  var months = await sequelize.query(`select * from months`, { type: sequelize.QueryTypes.SELECT });
  console.log(months, "months");

  for (var i in months) {
    resp = [];
    console.log(months[i].nombre);
    resp.push(months[i].nombre);
    resp.push(0);

    var data = await sequelize.query(`
      select donation_month, count(distinct user_id) as count 
      from donation_info 
      where donation_date like "${year}%" 
      group by donation_month`, 
      { type: sequelize.QueryTypes.SELECT }
    );

    console.log(data);

    for (var j in data) {
      if (months[i].id == data[j].donation_month) {
        resp[1] = data[j].count;
      }
    }

    user.push(resp);
  }

  console.log('user: ', user);
  return res.status(200).send({
    message: "data fetched",
    data: user,
    title: "Total miembros por mes"
  });
}


//done not needed

async function persnalizedreport(req, res) {
  var date = new Date()
  user_id = req.body.cedula
  if (!user_id) {
    console.log("cedula required")
    return res.status(400).send({

      message: "cedula_id is required",
      data: []
    })
  }
  var year = req.body.request_year || date.getFullYear()
  var user = [["FECHA", "CONFIRMACIÓN", "MONTO $$"]]
  var resp = []

  var userdata = await sequelize.query(`select nombre_completo,usuario_id,donation_date,amount,confirmation_no from usuarios_usuario inner join donation_info on donation_info.user_id = usuarios_usuario.usuario_id where usuarios_usuario.usuario_id = "${user_id}" and donation_date like "${year}%"`, { type: sequelize.QueryTypes.SELECT })
  if(!userdata.length){
  var userdata = await sequelize.query(`select nombre_completo,usuario_id,donation_date,amount,confirmation_no from donation_users as usuarios_usuario inner join donation_info on donation_info.user_id = usuarios_usuario.usuario_id where usuarios_usuario.usuario_id = "${user_id}" and donation_date like "${year}%"`, { type: sequelize.QueryTypes.SELECT })
  }
  console.log('userdata: ', userdata);
  if (userdata.length) {
    var sum = 0
    for (var i in userdata) {
      resp = []
      resp.push(userdata[i].donation_date)
      resp.push(userdata[i].confirmation_no)
      resp.push((userdata[i].amount).toFixed(2))
      sum =( sum + userdata[i].amount)
      user.push(resp)
    }
    user.push(["Total", " ", `$`+sum.toFixed(2)])
    return res.status(200).send({
      message: "data fetched",
      data: user,
      title: "Reporte personalizado",
      headings: {
        Nombre: userdata[0].nombre_completo,
        Cedula: userdata[0].usuario_id,
        Año : req.body.request_year
      }
    })
  }
  else {
  // var userdata = await sequelize.query(`select nombre_completo,usuario_id,donation_date,amount,confirmation_no from usuarios_usuario inner join donation_info on donation_info.user_id = usuarios_usuario.usuario_id where usuarios_usuario.usuario_id = ${user_id} and donation_date like "${year}%"`, { type: sequelize.QueryTypes.SELECT })
    return res.status(200).send({
      message: "No record found",
      data: [["FECHA", "CONFIRMACIÓN", "MONTO $$"],["Total", " ", `$0`]],
      title: "Reporte personalizado",
      headings: {
        Nombre: userdata[0]?userdata[0].nombre_completo : "",
        Cedula: user_id,
        Año : req.body.request_year
      }
    })
  }
}
//done not needed
async function reportdonationbymethod(req, res) {
  var date = new Date()
  var year = date.getFullYear()
  var user = [["MÉTODO", "SELECCIONADO", "TOTAL $$"]]
  var resp = []
  var userdata = await sequelize.query(`select nombre ,donation_method,count(*) as count, sum(amount) as total from donation_info right join donation_method on donation_method.id = donation_info.donation_method where donation_date like "${year}%" group by donation_method`, { type: sequelize.QueryTypes.SELECT })
  console.log(userdata)
  for (var i in userdata) {
    resp = []
    resp.push(userdata[i].nombre)
    resp.push(userdata[i].count)
    resp.push(userdata[i].total.toFixed(2))
    user.push(resp)
  }
  return res.status(200).send({
    message: "data fetched",
    data: user,
    title: "Total  por método de contribución"
  })
}


//done not needed
async function reportdonationbytype(req, res) {
  var year = req.body.year || date.getFullYear()
  var date = new Date()
  var user = [["TIPO", "SELECCIONADO", "TOTAL $$"]]
  var resp = []
  var userdata = await sequelize.query(`select nombre ,donation_type,count(*) as count, sum(amount) as total from donation_info right join donation_type on donation_type.id = donation_info.donation_type where donation_date like "${year}%" group by donation_type`, { type: sequelize.QueryTypes.SELECT })
  
  console.log(userdata)
  for (var i in userdata) {
    resp = []
    resp.push(userdata[i].nombre)
    resp.push(userdata[i].count)
    resp.push(userdata[i].total.toFixed(2))
    user.push(resp)
  }
  return res.status(200).send({
    message: "data fetched",
    data: user,
    title: "Total  por tipo de contribución"
  })
}

//done
async function searchreportbyyear(req, res) {
  var date = new Date()
  var year = req.body.year || date.getFullYear()
  
  var users = [["Fecha", "Nombre Completo", "Cédula", "Monto $$"]]
  var resp = []

  var user = await sequelize.query(`SELECT amount,donation_date,nombre_completo,usuario_id FROM usuarios_usuario inner join donation_info on donation_info.user_id = usuarios_usuario.usuario_id where donation_date like "${year}%"`, { type: sequelize.QueryTypes.SELECT })
  // console.log('user: ', user);
  var newuser = await sequelize.query(`SELECT amount,donation_date,nombre_completo,usuario_id FROM donation_users inner join donation_info on donation_info.user_id = donation_users.usuario_id where donation_date like "${year}%"`, { type: sequelize.QueryTypes.SELECT })
  // console.log('newuser: ', newuser);
 user = user.concat(newuser)
  // console.log(user)
  for (var i in user) {
    resp = []
    resp.push(user[i].donation_date)
    resp.push(user[i].nombre_completo)
    resp.push(user[i].usuario_id)
    resp.push((user[i].amount).toFixed(2))
    users.push(resp)
  }

  return res.status(200).send({
    message: "data fetched",
    data: users,
    title: "GENERAL CONTRIBUCIONES"
  })


}

//done
async function searchmemberreportbyyear(req, res) {
  var date = new Date()
  var year = req.body.year || date.getFullYear()
  var users = [["Fecha", "Nombre Completo", "Cédula", "AREA", "CABILDO", "DISTRITO"]]
  var resp = []

  var user = await sequelize.query(`SELECT distinct area.nombre as area, cab.nombre as cabildo,donation_date, dis.nombre as distrito ,nombre_completo,usuario_id FROM usuarios_usuario 
  inner join donation_info on donation_info.user_id = usuarios_usuario.usuario_id inner join usuarios_area as area on area.id = usuarios_usuario.area_id
  inner join usuarios_cabildo as cab on cab.id = usuarios_usuario.cabildo_id inner join usuarios_distritosgip as dis on dis.id = usuarios_usuario.distrito_sgip_id 
  where donation_date like "${year}%"`, { type: sequelize.QueryTypes.SELECT })
  console.log('user: ', user);
  var newuser = await sequelize.query(`SELECT distinct area.nombre as area, cab.nombre as cabildo,donation_date, dis.nombre as distrito ,nombre_completo,usuario_id FROM donation_users as usuarios_usuario  
  inner join donation_info on donation_info.user_id = usuarios_usuario.usuario_id inner join usuarios_area as area on area.id = usuarios_usuario.area
  inner join usuarios_cabildo as cab on cab.id = usuarios_usuario.cabildo inner join usuarios_distritosgip as dis on dis.id = usuarios_usuario.distrito 
  where donation_date like "${year}%"`, { type: sequelize.QueryTypes.SELECT })
  console.log('newuser: ', newuser);
  user = user.concat(newuser)
  for (var i in user) {
    resp = []
    resp.push(user[i].donation_date)
    resp.push(user[i].nombre_completo)
    resp.push(user[i].usuario_id)
    resp.push(user[i].area)
    resp.push(user[i].cabildo)
    resp.push(user[i].distrito)
    users.push(resp)
  }

  return res.status(200).send({
    message: "data fetched",
    data: users,
    title: "GENERAL MIEMBROS"
  })


}
//done
async function reportpermonthbyarea(req, res) {
  var date = new Date()
  var year = req.body.year || date.getFullYear()
  var users = [["AREA", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]]
  var resp = []
  const area = await sequelize.query(`select * from usuarios_area order by nombre`, { type: sequelize.QueryTypes.SELECT })
  const month = await sequelize.query(`select * from months order by id`, { type: sequelize.QueryTypes.SELECT })

  for (var i in area) {
    resp = []
    resp.push(area[i].nombre)
    for (var j in month) {
      var data = await sequelize.query(`select sum(amount) as amount from donation_info inner join usuarios_usuario on usuarios_usuario.usuario_id = donation_info.user_id where donation_month = ${month[j].id} and area_id = ${area[i].id} and donation_date like "${year}%" group by donation_month`, { type: sequelize.QueryTypes.SELECT })
      var newdata = await sequelize.query(`select sum(amount) as amount from donation_info inner join donation_users as usuarios_usuario on usuarios_usuario.usuario_id = donation_info.user_id where donation_month = ${month[j].id} and usuarios_usuario.area = ${area[i].id} and donation_date like "${year}%" group by donation_month`, { type: sequelize.QueryTypes.SELECT })
      
      console.log('data: ', data);
      const newmemberamount = data.length?(data[0].amount):0
      const newinviteeamount = newdata.length?(newdata[0].amount):0
      resp.push(newmemberamount+newinviteeamount)

      // resp.push((data[0]) ? (data[0].amount + newdata[0]?newdata[0].amount : 0) : 0)
    }
    users.push(resp)
  }
  return res.status(200).send({
    message: "data fetched",
    data: users,
    title: "Contribución mensual por Área"
  })

}


//done
async function reportmemberpermonthbyarea(req, res) {
  var date = new Date()
  var year = req.body.year || date.getFullYear()
  var users = [["AREA", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre","Total"]]
  var resp = []
  const area = await sequelize.query(`select * from usuarios_area order by nombre`, { type: sequelize.QueryTypes.SELECT })
  const month = await sequelize.query(`select * from months order by id`, { type: sequelize.QueryTypes.SELECT })

  for (var i in area) {
    console.log('i: ', i);
    console.log('area.length: ', area.length);
    resp = []
    
    // if(i==(area.length-1)){
    //   resp.push("Total")
    // }else{
      resp.push(area[i].nombre)
    // }
    for (var j in month) {
      var data = await sequelize.query(`select count(distinct user_id) as count from donation_info inner join usuarios_usuario on usuarios_usuario.usuario_id = donation_info.user_id where donation_month = ${month[j].id} and area_id = ${area[i].id} and donation_date like "${year}%" group by donation_month`, { type: sequelize.QueryTypes.SELECT })
      var newdata = await sequelize.query(`select count(distinct user_id) as count from donation_info inner join donation_users as usuarios_usuario on usuarios_usuario.usuario_id = donation_info.user_id where donation_month = ${month[j].id} and usuarios_usuario.area = ${area[i].id} and donation_date like "${year}%" group by donation_month`, { type: sequelize.QueryTypes.SELECT })
      // resp.push((data[0]) ? (data[0].amount + (newdata[0]?newdata[0].amount : 0)) : 0)
     if(data[0]){ data[0].count = data[0]?(data[0].count + (newdata[0]?newdata[0].count:0)):0
      resp.push((data[0]) ? (data[0].count) : 0)}
      else{
        resp.push(0)
      }
    }
    
    // const data 
    var newresp = resp
    newresp =newresp.slice(2,newresp.length)
    console.log('newresp: ', newresp);

    resp.push(newresp.reduce((a, b) => a + b, 0))

    console.log('newresp: ', newresp);
   
    users.push(resp)
  }
var arr = users 
const totalsRow = Array(arr[0].length).fill(0);
totalsRow[0] = 'Total';

for (let i = 1; i < arr.length; i++) {
  const rowSum = arr[i].slice(1, -1).reduce((acc, val) => acc + val, 0);
  arr[i][arr[i].length - 1] = rowSum;

  for (let j = 1; j < arr[i].length - 1; j++) {
    totalsRow[j] += arr[i][j];
  }
}

totalsRow[totalsRow.length - 1] = totalsRow.slice(1, -1).reduce((acc, val) => acc + val, 0);
arr.push(totalsRow);
 
  users = arr
  // console.log('users: ', sums);
  return res.status(200).send({
    message: "data fetched",
    data: users,
    title: "Total miembros  por área  del dpto. de contribuciones"
  })

}

//done
async function reportpercentpermonthbyarea(req, res) {
  var date = new Date()
  var year = req.body.year || date.getFullYear()
  var users = [["AREA", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]]
  var resp = []
  const area = await sequelize.query(`select * from usuarios_area order by nombre`, { type: sequelize.QueryTypes.SELECT })
  const month = await sequelize.query(`select * from months order by id`, { type: sequelize.QueryTypes.SELECT })
  for (var i in area) {
    resp = []
    resp.push(area[i].nombre)

    for (var j in month) {
      var user = await sequelize.query(`select count(id)  as count from usuarios_usuario where area_id = ${area[i].id}`, { type: sequelize.QueryTypes.SELECT })
      // console.log('user: ', user[0].count);
     
      var data = await sequelize.query(`select count(distinct user_id) as count from donation_info inner join usuarios_usuario on usuarios_usuario.usuario_id = donation_info.user_id where donation_month = ${month[j].id} and area_id = ${area[i].id} and donation_date like "${year}%" group by donation_month`, { type: sequelize.QueryTypes.SELECT })
      var newdata = await sequelize.query(`select count(distinct user_id) as count from donation_info inner join donation_users as usuarios_usuario on usuarios_usuario.usuario_id = donation_info.user_id where donation_month = ${month[j].id} and area = ${area[i].id} and donation_date like "${year}%" group by donation_month`, { type: sequelize.QueryTypes.SELECT })
     
      membercount =data.length?data[0].count:0
      inviteecount = newdata.length?newdata[0].count:0
      totalcount= membercount + inviteecount
      // console.log('data[0].count: ', data[0].count);
    
      // resp.push((data[0]) ? ((data[0].count / user[0].count?user[0].count : 1) * 100).toFixed(2) : "0")
      // resp.push((newdata[0]) ? ((newdata[0].count / newuser[0].count?user[0].count : 1) * 100).toFixed(2) : "0")
      resp.push((data[0]) ? ((totalcount / user[0].count) * 100).toFixed(2) : 0)
      //
    }
    users.push(resp)
  }
  return res.status(200).send({
    message: "data fetched",
    data: users,
    title: " % miembros  por área  del dpto. de contribuciones vs miembros activos del área"
  })

}


async function clearDonationRecords(req, res) {
  try{
    const {donation_id} = req.body
    var user = await sequelize.query(`delete from donation_info where id = ${donation_id}`)
    return res.status(200).send({
      message: "Registros eliminados exitosamente",
      data: [],
    })
  }
  catch(error){
    console.log(error);
        return res.status(500).json({ message: 'Server Error' });
  }
}


async function getdonationList(req, res) {
  var date = new Date()
  const {search} = req.body
  var year = req.body.year || date.getFullYear()
  var users = [["donation_id","Fecha", "Nombre Completo", "Cédula", "Monto $$"]]
  var resp = []
if(!search || search=="" || search == null){
  var user = await sequelize.query(`SELECT donation_info.id,amount,donation_date,nombre_completo,usuario_id FROM usuarios_usuario inner join donation_info on donation_info.user_id = usuarios_usuario.usuario_id order by id desc`, { type: sequelize.QueryTypes.SELECT })
  // console.log('user: ', user);
  var newuser = await sequelize.query(`SELECT donation_info.id,amount,donation_date,nombre_completo,usuario_id FROM donation_users inner join donation_info on donation_info.user_id = donation_users.usuario_id order by id desc`, { type: sequelize.QueryTypes.SELECT })
  console.log('newuser: ', newuser);
  // console.log('newuser: ', newuser);
}
else{
  var user = await sequelize.query(`SELECT donation_info.id,amount,donation_date,nombre_completo,usuario_id FROM usuarios_usuario inner join donation_info on donation_info.user_id = usuarios_usuario.usuario_id where nombre_completo like "%${search}%" || usuario_id like "%${search}%" order by id desc`, { type: sequelize.QueryTypes.SELECT })
  // console.log('user: ', user);
  var newuser = await sequelize.query(`SELECT donation_info.id,amount,donation_date,nombre_completo,usuario_id FROM donation_users inner join donation_info on donation_info.user_id = donation_users.usuario_id where nombre_completo like "%${search}%" || usuario_id like "%${search}%" order by id desc`, { type: sequelize.QueryTypes.SELECT })
  // console.log('newuser: ', newuser);
}
 user = user.concat(newuser)
  // console.log(user)
  for (var i in user) {
    // console.log('user: ', user);
    resp = []
    resp.push(user[i].id)
    resp.push(user[i].donation_date)
    resp.push(user[i].nombre_completo)
    resp.push(user[i].usuario_id)
    resp.push((user[i].amount).toFixed(2))
    users.push(resp)
  }

  return res.status(200).send({
    message: "data fetched",
    data: users,
    title: "GENERAL CONTRIBUCIONES"
  })


}

async function getAdminList(req,res){
  try{
  var users = [["Admin Id","First Name", "Last Name", "Email", "Last Login"]]
    var user = await sequelize.query(`select * from auth_admin`, { type: sequelize.QueryTypes.SELECT })
    var resp = []
   
    for (var i in user) {
      // console.log('user: ', user);
      resp = []
      resp.push(user[i].id)
      resp.push(user[i].firstName)
      resp.push(user[i].lastName)
      resp.push(user[i].email)
      resp.push(user[i].last_login)
      users.push(resp)
    }
    console.log('user: ', user);
    return res.status(200).send({
      message: "Data fetched",
      data: users,
    })
  }
  catch(error){
    console.log(error);
        return res.status(500).json({ message: 'Server Error' });
  }
}

async function deleteAdmin(req,res){
  try{
    const {admin_id} = req.body
    var user = await sequelize.query(`delete from auth_admin where id = ${admin_id}`)
    console.log('user: ', user);
    
    return res.status(200).send({ 
      message: "Admin deleted",
      data: [],
    })
  }
  catch(error){
    console.log(error);
        return res.status(500).json({ message: 'Server Error' });
  }
}

async function nameCorrection(req, res) {
  try {
    const userid = await sequelize.query("select max(id) as id  from usuarios_usuario", { type: sequelize.QueryTypes.SELECT })
    console.log(userid[0].id)
    for (var i = 0; i <= userid[0].id; i++) {
      const userinfo = await sequelize.query(`select *  from usuarios_usuario where id = ${i}`, { type: sequelize.QueryTypes.SELECT })
      const nombre_completo = userinfo[0]?.primer_nombre + " " + userinfo[0]?.segundo_nombre + " " + userinfo[0]?.primer_apellido + " " + userinfo[0]?.segundo_apellido
      console.log('nombre_completo: ', nombre_completo);

      const updatename = await sequelize.query(`update usuarios_usuario set nombre_completo = "${nombre_completo}" where id = ${i}`)

    }
    return res.status(200).json({ message: 'names updated' });

  }

  catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'Server Error' });
  }
}


module.exports = {
  getAdminList,
  deleteAdmin,
  getdonationList,
  adminLogin,
  adminsignup,
  dropdown,
  adddonation,
  getuserbycedula,
  addnewuser,
  getdashboardcards,
  donationpie,
  donorsbymonth,
  totaldonationbymonth,
  totalregistrationbymonth,
  reporttotaldonationbymonth,
  reporttotaldonationytd,
  reporttotalregistrationbymonth,
  reporttotalmembersbymonth,
  persnalizedreport,
  reportdonationbymethod,
  reportdonationbytype,
  searchreportbyyear,
  searchmemberreportbyyear,
  reportpermonthbyarea, 
  reportmemberpermonthbyarea,
  reportpercentpermonthbyarea,
  clearDonationRecords,
  nameCorrection
}


