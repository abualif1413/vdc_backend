var express = require('express');
var cors = require('cors');
var bodyParser = require('body-parser');
var mysql = require('mysql');
var mysql_helper = require('./mysql_helper');
var formidable = require('formidable');
var fs = require('fs');
var https = require('https');
var mime = require('mime-types');

var app = express();
var port = 1413;

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
app.use(cors()); // Enabling Cross Origin to All Address

app.post('/provinsi', function(req, res) {
    var mysqlCon = mysql.createConnection(mysql_helper.config);
    mysqlCon.connect(function(err) {
        var sql = "SELECT * FROM p_provinsi ORDER BY provinsi ASC";
        mysqlCon.query(sql, function (err, result, fields) {
            res.send(result)
            mysqlCon.end(function(err) {})
            res.end();
        });
    })
})

app.post('/kabupaten', function(req, res) {
    var mysqlCon = mysql.createConnection(mysql_helper.config);
    mysqlCon.connect(function(err) {
        var sql = "SELECT * FROM p_kabupaten WHERE id_provinsi=? ORDER BY kabupaten ASC";
        mysqlCon.query(sql, [req.body.id_provinsi], function (err, result, fields) {
            res.send(result)
            mysqlCon.end(function(err) {})
            res.end();
        });
    })
})

app.post('/kecamatan', function(req, res) {
    var mysqlCon = mysql.createConnection(mysql_helper.config);
    mysqlCon.connect(function(err) {
        var sql = "SELECT * FROM p_kecamatan WHERE id_kabupaten=? ORDER BY kecamatan ASC";
        mysqlCon.query(sql, [req.body.id_kabupaten], function (err, result, fields) {
            res.send(result)
            mysqlCon.end(function(err) {})
            res.end();
        });
    })
})

app.post('/kelurahan', function(req, res) {
    var mysqlCon = mysql.createConnection(mysql_helper.config);
    mysqlCon.connect(function(err) {
        var sql = "SELECT * FROM p_kelurahan WHERE id_kecamatan=? ORDER BY kelurahan ASC";
        mysqlCon.query(sql, [req.body.id_kecamatan], function (err, result, fields) {
            res.send(result)
            mysqlCon.end(function(err) {})
            res.end();
        });
    })
})

app.post('/pasien/tambah', function(req, res) {
    var mysqlCon = mysql.createConnection(mysql_helper.config);
    mysqlCon.connect(function(err) {
        var sql = "INSERT INTO t_pasien (\n" +
                    "	nama, tempat_lahir, tanggal_lahir,\n" +
                    "	jenis_kelamin, no_ktp, no_bpjs_kes,\n" +
                    "	alamat, id_provinsi, id_kabupaten,\n" +
                    "	id_kecamatan, id_kelurahan, insert_time,\n" +
                    "	update_time\n" +
                    ") VALUES (\n" +
                    "	?, ?, ?,\n" +
                    "	?, ?, ?,\n" +
                    "	?, ?, ?,\n" +
                    "	?, ?, NOW(),\n" +
                    "	NOW()\n" +
                    ")";
        var sqlParams = [
            req.body.nama, req.body.tempat_lahir, req.body.tanggal_lahir,
            req.body.jenis_kelamin, req.body.no_ktp, req.body.no_bpjs_kes,
            req.body.alamat, req.body.id_provinsi, req.body.id_kabupaten,
            req.body.id_kecamatan, req.body.id_kelurahan
        ];
        mysqlCon.query(sql, sqlParams, function (err, result, fields) {
            res.send({ success: 1, message: "Data pasien telah disimpan", id_pasien: result.insertId })
            mysqlCon.end(function(err) {})
            res.end();
        });
    })
})

app.post('/pasien/edit', function(req, res) {
    var mysqlCon = mysql.createConnection(mysql_helper.config);
    mysqlCon.connect(function(err) {
        var sql = "UPDATE t_pasien SET " +
                    "	nama=?, tempat_lahir=?, tanggal_lahir=?,\n" +
                    "	jenis_kelamin=?, no_ktp=?, no_bpjs_kes=?,\n" +
                    "	alamat=?, id_provinsi=?, id_kabupaten=?,\n" +
                    "	id_kecamatan=?, id_kelurahan=?,\n" +
                    "	update_time=NOW()\n" +
                    "WHERE " +
                        "   id_pasien=?";
        var sqlParams = [
            req.body.nama, req.body.tempat_lahir, req.body.tanggal_lahir,
            req.body.jenis_kelamin, req.body.no_ktp, req.body.no_bpjs_kes,
            req.body.alamat, req.body.id_provinsi, req.body.id_kabupaten,
            req.body.id_kecamatan, req.body.id_kelurahan,
            req.body.id_pasien
        ];
        mysqlCon.query(sql, sqlParams, function (err, result, fields) {
            res.send({ success: 1, message: "Data pasien telah diedit", id_pasien: result.insertId })
            mysqlCon.end(function(err) {})
            res.end();
        });
    })
})

app.post('/pasienuser/tambah', function(req, res) {
    var mysqlCon = mysql.createConnection(mysql_helper.config);
    mysqlCon.connect(function(err) {
        mysqlCon.query("DELETE FROM t_user WHERE id_pasien = ?", [req.body.id_pasien], function(err_d, result_d, fields_d) {
            var sql = "INSERT INTO t_user (id_pasien, email, password) VALUES(?, ?, MD5(?))";
            var sqlParams = [req.body.id_pasien, req.body.email, req.body.password];
            mysqlCon.query(sql, sqlParams, function (err, result, fields) {
                res.send({ success: 1, message: "Data user pasien telah disimpan", id_user: result.insertId })
                mysqlCon.end(function(err) {})
                res.end();
            });
        })
    })
})

app.post('/pasien/find', function(req, res) {
    var mysqlCon = mysql.createConnection(mysql_helper.config);
    mysqlCon.connect(function(err) {
        var sql = "SELECT	\n" +
                    "	pasien.*, COALESCE(usr.email, '') AS email\n" +
                    "FROM\n" +
                    "	t_pasien pasien\n" +
                    "	LEFT JOIN t_user usr ON pasien.id_pasien = usr.id_pasien\n" +
                    "WHERE\n" +
                    "	pasien.id_pasien = ?";
        mysqlCon.query(sql, [req.body.id_pasien], function (err, result, fields) {
            res.send(result[0])
            mysqlCon.end(function(err) {})
            res.end();
        });
    })
})

app.post('/upload/ktp', function(req, res) {
    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
        var oldPath = files.fileKTP.path
        var newPath = "images/ktp/" + fields.id_pasien_baru + ".png"
        var readStream = fs.createReadStream(oldPath);
        var writeStream = fs.createWriteStream(newPath);
        readStream.pipe(writeStream);
        readStream.on('end',function(){
            fs.unlinkSync(oldPath);
            res.write("File uploaded Alhamdulillah");
            res.end();
        });
    });
})

app.post('/upload/bpjskes', function(req, res) {
    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
        var oldPath = files.fileBPJSKES.path
        var newPath = "images/bpjskes/" + fields.id_pasien_baru + ".png"
        var readStream = fs.createReadStream(oldPath);
        var writeStream = fs.createWriteStream(newPath);
        readStream.pipe(writeStream);
        readStream.on('end',function(){
            fs.unlinkSync(oldPath);
            res.write("File uploaded Alhamdulillah");
            res.end();
        });
    });
})

app.get('/getimage/ktp/:id_pasien', function(req, res) {
    var id_pasien = req.params.id_pasien
    var ct = mime.lookup("images/ktp/" + id_pasien + ".png")
    var path = ""

    fs.access("images/ktp/" + id_pasien + ".png", fs.F_OK, (err) => {
        if (err) {
            path = "images/blank.png"
        } else {
            path = "images/ktp/" + id_pasien + ".png"
        }
        
        //file exists
        var stream = fs.createReadStream(path);
        var image_data = [];

        stream.on("data", function(data) {
            image_data.push(data)
        });
        
        stream.on("end", function() {
            var buf = Buffer.concat(image_data);
            res.setHeader('content-type', ct)
            res.send(buf)
            res.end()
        })
    })
})

app.get('/getimage/bpjskes/:id_pasien', function(req, res) {
    var id_pasien = req.params.id_pasien
    var ct = mime.lookup("images/bpjskes/" + id_pasien + ".png")
    var path = ""

    fs.access("images/bpjskes/" + id_pasien + ".png", fs.F_OK, (err) => {
        if (err) {
            path = "images/blank.png"
        } else {
            path = "images/bpjskes/" + id_pasien + ".png"
        }
        var stream = fs.createReadStream(path);
        var image_data = [];
    
        stream.on("data", function(data) {
            image_data.push(data)
        });
        
        stream.on("end", function() {
            var buf = Buffer.concat(image_data);
            res.setHeader('content-type', ct)
            res.send(buf)
            res.end()
        })
    })

})

app.get('/getimage/rujukan/:id_konsultasi', function(req, res) {
    var id_konsultasi = req.params.id_konsultasi
    var ct = mime.lookup("images/rujukan/" + id_konsultasi + ".png")
    var path = ""

    fs.access("images/rujukan/" + id_konsultasi + ".png", fs.F_OK, (err) => {
        if (err) {
            path = "images/blank.png"
        } else {
            path = "images/rujukan/" + id_konsultasi + ".png"
        }
        var stream = fs.createReadStream(path);
        var image_data = [];
    
        stream.on("data", function(data) {
            image_data.push(data)
        });
        
        stream.on("end", function() {
            var buf = Buffer.concat(image_data);
            res.setHeader('content-type', ct)
            res.send(buf)
            res.end()
        })
    })

})

app.post('/login/attempt', function(req, res) {
    var mysqlCon = mysql.createConnection(mysql_helper.config);
    mysqlCon.connect(function(err) {
        var sql = "SELECT * FROM t_user WHERE email = ? AND password = MD5(?)";
        mysqlCon.query(sql, [req.body.email, req.body.password], function (err, result, fields) {
            if(result.length == 0) {
                res.send({ success: false })
            } else {
                res.send({ success: true, userData: result[0] })
            }
            mysqlCon.end(function(err) {})
            res.end();
        });
    })
})

app.post('/spesialis', function(req, res) {
    var mysqlCon = mysql.createConnection(mysql_helper.config);
    mysqlCon.connect(function(err) {
        var sql = "SELECT * FROM t_spesialis ORDER BY spesialis ASC";
        mysqlCon.query(sql, function (err, result, fields) {
            res.send(result)
            mysqlCon.end(function(err) {})
            res.end();
        });
    })
})

app.post('/dokter', function(req, res) {
    var mysqlCon = mysql.createConnection(mysql_helper.config);
    mysqlCon.connect(function(err) {
        var sql = "SELECT\n" +
                    "	dok.*, spe.spesialis\n" +
                    "FROM\n" +
                    "	t_dokter dok\n" +
                    "	LEFT JOIN t_spesialis spe ON dok.id_spesialis = spe.id_spesialis\n" +
                    "WHERE\n" +
                    "	dok.id_spesialis = ? ORDER BY dok.nama_dokter ASC";
        mysqlCon.query(sql, [req.body.id_spesialis], function (err, result, fields) {
            res.send(result)
            mysqlCon.end(function(err) {})
            res.end();
        });
    })
})

app.post('/dokter/find', function(req, res) {
    var mysqlCon = mysql.createConnection(mysql_helper.config);
    mysqlCon.connect(function(err) {
        var sql = "SELECT\n" +
                    "	dok.*, spe.spesialis\n" +
                    "FROM\n" +
                    "	t_dokter dok\n" +
                    "	LEFT JOIN t_spesialis spe ON dok.id_spesialis = spe.id_spesialis\n" +
                    "WHERE\n" +
                    "	dok.id_dokter=?";
        mysqlCon.query(sql, [req.body.id_dokter], function (err, result, fields) {
            res.send(result[0])
            mysqlCon.end(function(err) {})
            res.end();
        });
    })
})

app.post('/konsultasi/baru', function(req, res) {
    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
        // Simpan dulu data konsultasi barunya
        var mysqlCon = mysql.createConnection(mysql_helper.config);
        var query = "INSERT INTO t_konsultasi(\n" +
                    "	id_pasien, id_dokter, metode_pembayaran, waktu_registrasi, status\n" +
                    ") VALUES (\n" +
                    "	?, ?, ?, NOW(), 'verifikasi admission'\n" +
                    ")";
        var params = [fields.id_pasien, fields.id_dokter, fields.metode_pembayaran]
        mysqlCon.connect(function(err) {
            mysqlCon.query(query, params, function(err_d, result_d, fields_d) {
                var id_konsultasi = result_d.insertId
                

                // Baru proses upload gambar nya jika dia BPSJ
                if(fields.metode_pembayaran === "bpjs") {
                    var oldPath = files.fileRujukan.path
                    var newPath = "images/rujukan/" + id_konsultasi + ".png"
                    var readStream = fs.createReadStream(oldPath);
                    var writeStream = fs.createWriteStream(newPath);
                    readStream.pipe(writeStream);
                    readStream.on('end',function(){
                        fs.unlinkSync(oldPath);
                        res.write("File uploaded Alhamdulillah");
                        res.end();
                    });
                } else {
                    res.write({ success: 1, message: "Pendaftaran tunai selesai" });
                    res.end();
                }
            })
        })
    });
})

app.post('/konsultasi/baru_tunai', function(req, res) {
    var mysqlCon = mysql.createConnection(mysql_helper.config);
    mysqlCon.connect(function(err) {
        var sql = "INSERT INTO t_konsultasi(\n" +
                    "	id_pasien, id_dokter, metode_pembayaran, waktu_registrasi, status\n" +
                    ") VALUES (\n" +
                    "	?, ?, ?, NOW(), 'verifikasi admission'\n" +
                    ")";
        var params = [req.body.id_pasien, req.body.id_dokter, req.body.metode_pembayaran]
        mysqlCon.query(sql, params, function (err, result, fields) {
            res.send({ success: 1, message: "Data konsultasi tunai telah disimpan" })
            mysqlCon.end(function(err) {})
            res.end();
        });
    })
})

app.post('/konsultasi/last_find', function(req, res) {
    var mysqlCon = mysql.createConnection(mysql_helper.config);
    mysqlCon.connect(function(err) {
        var sql = "SELECT * FROM t_konsultasi WHERE id_pasien = ? ORDER BY id_konsultasi DESC LIMIT 0, 1"
        mysqlCon.query(sql, [req.body.id_pasien], function (err, result, fields) {
            res.send(result[0])
            mysqlCon.end(function(err) {})
            res.end();
        });
    })
})

app.post('/konsultasi/by_status', function(req, res) {
    var mysqlCon = mysql.createConnection(mysql_helper.config);
    mysqlCon.connect(function(err) {
        var sql = "SELECT\n" +
                    "	kon.*,\n" +
                    "	LPAD(kon.id_konsultasi,5,'0') AS noreg, pas.nama AS nama_pasien, dok.nama_dokter,\n" +
                    "   TIMEDIFF(now(), kon.waktu_registrasi) AS lama_antri\n" +
                    "FROM\n" +
                    "	t_konsultasi kon\n" +
                    "	LEFT JOIN t_pasien pas ON kon.id_pasien = pas.id_pasien\n" +
                    "	LEFT JOIN t_dokter dok ON kon.id_dokter = dok.id_dokter\n" +
                    "WHERE\n" +
                    "	status = ?\n" +
                    "ORDER BY\n" +
                    "	kon.id_konsultasi ASC"
        mysqlCon.query(sql, [req.body.status], function (err, result, fields) {
            res.send(result)
            mysqlCon.end(function(err) {})
            res.end();
        });
    })
})

app.post('/konsultasi/find', function(req, res) {
    var mysqlCon = mysql.createConnection(mysql_helper.config);
    mysqlCon.connect(function(err) {
        var sql = "SELECT\n" +
                    "	kon.*,\n" +
                    "	LPAD(kon.id_konsultasi,5,'0') AS noreg, pas.nama AS nama_pasien, dok.nama_dokter,\n" +
                    "   TIMEDIFF(now(), kon.waktu_registrasi) AS lama_antri,\n" +
                    "   COALESCE(ressel.tgl_tersedia, '-') AS tgl_tersedia_obat, COALESCE(ressel.catatan, '-') AS catatan_obat,\n" +
                    "   COALESCE(DATE_FORMAT(ressel.tgl_tersedia, '%w'), '-') AS dow_obat\n" +
                    "FROM\n" +
                    "	t_konsultasi kon\n" +
                    "	LEFT JOIN t_pasien pas ON kon.id_pasien = pas.id_pasien\n" +
                    "	LEFT JOIN t_dokter dok ON kon.id_dokter = dok.id_dokter\n" +
                    "   LEFT JOIN t_resep_selesai ressel ON kon.id_konsultasi = ressel.id_konsultasi\n" +
                    "WHERE\n" +
                    "	kon.id_konsultasi = ?\n" +
                    "ORDER BY\n" +
                    "	kon.id_konsultasi ASC"
        mysqlCon.query(sql, [req.body.id_konsultasi], function (err, result, fields) {
            res.send(result[0])
            mysqlCon.end(function(err) {})
            res.end();
        });
    })
})

app.post('/konsultasi/set_status', function(req, res) {
    var mysqlCon = mysql.createConnection(mysql_helper.config);
    mysqlCon.connect(function(err) {
        var sql = "UPDATE t_konsultasi SET status=? WHERE id_konsultasi=?"
        mysqlCon.query(sql, [req.body.status, req.body.id_konsultasi], function (err, result, fields) {
            // Jika dia merubah status menjadi di approve admission, maka simpan data siapa admission yang mengaprove
            if(req.body.status === mysql_helper.getKonsultasiStatus.admission_approved) {
                var clear_verifikator = "DELETE FROM t_konsultasi_verifikasi WHERE id_konsultasi = ?"
                mysqlCon.query(clear_verifikator, [req.body.id_konsultasi], function(err_cv, result_cv, fields_cv) {
                    var push_verifikator = "INSERT INTO t_konsultasi_verifikasi(id_konsultasi, id_user_admission, waktu_verifikasi) VALUES(?, ?, NOW())"
                    mysqlCon.query(push_verifikator, [req.body.id_konsultasi, req.body.id_user_admission], function(err_pv, result_pv, fields_pv) {
                        res.send({ success: 1, message: "Status konsultasi telah diubah menjadi " + req.body.status })
                        mysqlCon.end(function(err) {})
                        res.end();
                    })
                })
            } else {
                res.send({ success: 1, message: "Status konsultasi telah diubah menjadi " + req.body.status })
                mysqlCon.end(function(err) {})
                res.end();
            }
        });
    })
})

app.post('/konsultasi/add_resep', function(req, res) {
    var mysqlCon = mysql.createConnection(mysql_helper.config);
    var query = "INSERT INTO t_resep(id_konsultasi, nama_obat, qty, satuan, cara_pakai) VALUES(?, ?, ?, ?, ?)"
    var params = [req.body.id_konsultasi, req.body.nama_obat, req.body.qty, req.body.satuan, req.body.cara_pakai]
    mysqlCon.connect(function(err) {
        mysqlCon.query(query, params, function(err_d, result_d, fields_d) {
            res.send({ success: 1, message: "Berhasil menambah resep" })
            mysqlCon.end(function(err) {})
            res.end();
        })
    })
})

app.post('/konsultasi/remove_resep', function(req, res) {
    var mysqlCon = mysql.createConnection(mysql_helper.config);
    var query = "DELETE FROM t_resep WHERE id_resep=?"
    var params = [req.body.id_resep]
    mysqlCon.connect(function(err) {
        mysqlCon.query(query, params, function(err_d, result_d, fields_d) {
            res.send({ success: 1, message: "Berhasil menghapus resep" })
            mysqlCon.end(function(err) {})
            res.end();
        })
    })
})

app.post('/konsultasi/get_resep', function(req, res) {
    var mysqlCon = mysql.createConnection(mysql_helper.config);
    var query = "SELECT * FROM t_resep WHERE id_konsultasi=? ORDER BY id_resep ASC"
    var params = [req.body.id_konsultasi]
    mysqlCon.connect(function(err) {
        mysqlCon.query(query, params, function(err_d, result_d, fields_d) {
            res.send(result_d)
            mysqlCon.end(function(err) {})
            res.end();
        })
    })
})

app.post('/admission/find', function(req, res) {
    var mysqlCon = mysql.createConnection(mysql_helper.config);
    mysqlCon.connect(function(err) {
        var sql = "SELECT * FROM t_user_admission WHERE id_user_admission = ?"
        mysqlCon.query(sql, [req.body.id_user_admission], function (err, result, fields) {
            res.send(result[0])
            mysqlCon.end(function(err) {})
            res.end();
        });
    })
})

app.post('/admission/selesai_siapkan_obat', function(req, res) {
    var id_konsultasi = req.body.id_konsultasi;
    var tgl_tersedia = req.body.tgl_tersedia;
    var jam_tersedia = req.body.jam_tersedia;
    var catatan = req.body.catatan;
    var tgl_jam_tersedia = tgl_tersedia + "T" + jam_tersedia;

    var mysqlCon = mysql.createConnection(mysql_helper.config);
    var query = "INSERT INTO t_resep_selesai(id_konsultasi, tgl_tersedia, catatan) VALUES(?, ?, ?)"
    var params = [id_konsultasi, tgl_jam_tersedia, catatan]
    mysqlCon.connect(function(err) {
        mysqlCon.query(query, params, function(err_d, result_d, fields_d) {
            res.send({success: 1, message: "Resep telah disiapkan"})
            mysqlCon.end(function(err) {})
            res.end();
        })
    })
})

app.post('/konsultasi/antrian_dokter', function(req, res) {
    var mysqlCon = mysql.createConnection(mysql_helper.config);
    mysqlCon.connect(function(err) {
        var sql = "SELECT\n" +
                    "	kon.id_konsultasi, kon.id_dokter, kon.id_pasien, kon.status, pas.nama AS nama_pasien\n" +
                    "FROM\n" +
                    "	t_konsultasi kon\n" +
                    "	LEFT JOIN t_pasien pas ON kon.id_pasien = pas.id_pasien\n" +
                    "WHERE\n" +
                    "	kon.status IN ('admission approved', 'start consultation', 'giving medicine')\n" +
                    "	AND kon.id_dokter = ?\n" +
                    "ORDER BY\n" +
                    "	kon.id_konsultasi ASC";
        mysqlCon.query(sql, [req.body.id_dokter], function (err, result, fields) {
            res.send(result)
            mysqlCon.end(function(err) {})
            res.end();
        });
    })
})

app.post('/konsultasi/riwayat_pasien', function(req, res) {
    var mysqlCon = mysql.createConnection(mysql_helper.config);
    mysqlCon.connect(function(err) {
        var sql = "SELECT\n" +
                    "	kon.*, pas.nama AS nama_pasien, dok.nama_dokter\n" +
                    "FROM\n" +
                    "	t_konsultasi kon\n" +
                    "	LEFT JOIN t_pasien pas ON kon.id_pasien = pas.id_pasien\n" +
                    "	LEFT JOIN t_dokter dok ON kon.id_dokter = dok.id_dokter\n" +
                    "WHERE\n" +
                    "	kon.id_pasien = ?\n AND status='consultation finished'" +
                    "ORDER BY\n" +
                    "	kon.id_konsultasi ASC"
        mysqlCon.query(sql, [req.body.id_pasien], function (err, result, fields) {
            res.send(result)
            mysqlCon.end(function(err) {})
            res.end();
        });
    })
})

app.post('/konsultasi/riwayat_dokter', function(req, res) {
    var mysqlCon = mysql.createConnection(mysql_helper.config);
    mysqlCon.connect(function(err) {
        var sql = "SELECT\n" +
                    "	kon.*, pas.nama AS nama_pasien, dok.nama_dokter\n" +
                    "FROM\n" +
                    "	t_konsultasi kon\n" +
                    "	LEFT JOIN t_pasien pas ON kon.id_pasien = pas.id_pasien\n" +
                    "	LEFT JOIN t_dokter dok ON kon.id_dokter = dok.id_dokter\n" +
                    "WHERE\n" +
                    "	kon.id_dokter = ? AND status='consultation finished'\n" +
                    "ORDER BY\n" +
                    "	kon.id_konsultasi ASC"
        mysqlCon.query(sql, [req.body.id_dokter], function (err, result, fields) {
            res.send(result)
            mysqlCon.end(function(err) {})
            res.end();
        });
    })
})

app.post('/konsultasi/resep_gantung', function(req, res) {
    var mysqlCon = mysql.createConnection(mysql_helper.config);
    mysqlCon.connect(function(err) {
        var sql = "SELECT\n" +
                    "	kon.*, pas.nama AS nama_pasien, dok.nama_dokter\n" +
                    "FROM\n" +
                    "	t_konsultasi kon\n" +
                    "	LEFT JOIN t_pasien pas ON kon.id_pasien = pas.id_pasien\n" +
                    "	LEFT JOIN t_dokter dok ON kon.id_dokter = dok.id_dokter\n" +
                    "   LEFT JOIN t_resep_selesai res ON kon.id_konsultasi = res.id_konsultasi\n" +
                    "WHERE\n" +
                    "	res.id_konsultasi IS NULL AND kon.status='consultation finished'\n" +
                    "ORDER BY\n" +
                    "	kon.id_konsultasi ASC"
        mysqlCon.query(sql, [], function (err, result, fields) {
            res.send(result)
            mysqlCon.end(function(err) {})
            res.end();
        });
    })
})

app.post('/upload_medvid', function(req, res) {
    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
        var oldPath = files.video.path
        var newPath = "medvid/" + fields.nama_file
        var readStream = fs.createReadStream(oldPath);
        var writeStream = fs.createWriteStream(newPath);
        readStream.pipe(writeStream);
        readStream.on('end',function(){
            fs.unlinkSync(oldPath);
            res.send({success: 1, message: "Berhasil upload medvid, Alhamdulillah"});
            res.end();
        });
    });
})

app.get('/getmedvid/:siapa/:id_konsultasi', function(req, res) {
    var id_konsultasi = req.params.id_konsultasi
    var siapa = req.params.siapa
    var folder_medvid = "medvid"
    var url_medvid = folder_medvid + "/medvid_" + id_konsultasi + "_" + siapa + ".mp4"
    var path = ""

    fs.access(url_medvid, fs.F_OK, (err) => {
        if (err) {
            path = "images/blank.png"
        } else {
            path = url_medvid
        }
        var ct = mime.lookup(path)
        var stream = fs.createReadStream(path);
        var image_data = [];
    
        stream.on("data", function(data) {
            image_data.push(data)
        });
        
        stream.on("end", function() {
            var buf = Buffer.concat(image_data);
            res.setHeader('content-type', ct)
            res.send(buf)
            res.end()
        })
    })

})

/**
 * Create HTTP server.
 */
var server = https.createServer({
    key: fs.readFileSync('cert.key'),
    cert: fs.readFileSync('cert.crt')
  }, app)

server.listen(port);
server.on('listening', function(listen) {
    console.log("Server berjalan. jangan tutup terminal ini")
});
/* ****************************** */