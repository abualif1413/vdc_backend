var host = "localhost";
var username = "root";
var password = "";
var database = "vdc";

exports.config = {
        host: host,
        user: username,
        password: "",
        database: database,
        timezone : "+00:00"
    }

exports.getKonsultasiStatus = {
        verifikasi_admission: "verifikasi admission",
        admission_approved: "admission approved",
        admission_rejected: "admission rejected",
        start_consultation: "start consultation",
        giving_medicine: "giving medicine",
        consultation_finished: "consultation finished"
    }


// exports.config = {
//     host: host,
//     user: username,
//     password: "",
//     database: database
// }