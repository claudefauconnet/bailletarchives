const XLSX = require('xlsx');
const async = require("async");
const fs = require('fs');
const mySQLproxy = require('../mySQLproxy.')


var xlsxToImport = {


    extractWorkSheets: function (sourcexlsx, sheetNames, callback) {
        var workbook
        if (typeof(sourcexlsx) == "string")
            workbook = XLSX.readFile(sourcexlsx);
        else
            workbook = XLSX.read(sourcexlsx);

        var sheet_name_list = workbook.SheetNames;

        var sheets = {};

        sheet_name_list.forEach(function (sheetName) {
            if (!sheetNames || sheetNames.indexOf(sheetName) > -1) {

                sheets[sheetName] = workbook.Sheets[sheetName];

            }
        })
        callback(null, sheets)


    },


    listSheets: function (file, callback) {
        var workbook = XLSX.readFile(file);
        var sheet_name_list = workbook.SheetNames;
        var result = {
            sheetNames: sheet_name_list
        };

        callback(null, result);

    },

    listSheetColumns: function (file, sheetName, callback) {

        var workbook = XLSX.readFile(file);
        var sheet = workbook.Sheets[sheetName];

        var columns = []
        for (var key in sheet) {
            if (key.match(/[A-Z]+1$/))
                columns.push(sheet[key].v)

        }


        var result = {
            message: "listCsvFields",
            sheetColNames: columns
        };

        callback(null, result);
    },


    worksheetJsonToSouslesensJson: function (worksheet, callback) {

        var header = [];
        var data = [];
        var ref = worksheet["!ref"];
        var range = (/([A-Z])+([0-9]+):([A-Z]+)([0-9]+)/).exec(ref);

        if (!range || range.length < 2)// feuille vide
            return callback(null, null);
        var lineDebut = range[2];
        var lineFin = range[4];
        var colDebut = range[1]
        var colFin = range[3]
        var alphabet = "A,";
        var dbleLetterColName = colFin.length > 1
        var colNames = [];
        for (var j = 65; j < 120; j++) {
            var colName
            if (j <= 90)
                colName = String.fromCharCode(j);
            else
                colName = "A" + String.fromCharCode(j - 26);


            colNames.push(colName);
            if (colName == colFin)
                break;

        }

        for (var i = lineDebut; i <= lineFin; i++) {
            for (var j = 0; j < colNames.length; j++) {


                var key = colNames[j] + i;

                if (!worksheet[key]) {
                    continue;
                }
                var value = worksheet[key].v;
                if (i == lineDebut)
                    header.push(value);
                else {
                    if (j == 0) {
                        data[i] = {}
                    }

                    if (!data[i]) {
                        continue;
                    }
                    data[i][header[j]] = value;

                }


            }
        }
        var dataArray = [];
        for (var key in data) {
            dataArray.push(data[key]);
        }

        return callback(null, {header: header, data: dataArray})


    },

    jsonToSqlInsert: function (table, json, callback) {
        var response = {}
        var rejectedLines = [];

        mySQLproxy.datamodel(null, function (err, model) {
            var tables = {}
            for (var key in model) {
                var obj = {}
                model[key].forEach(function (field) {
                    obj[field.name] = {name: field.name, dataType: field.dataType, maxLength: field.maxLength}
                })
                tables[key] = obj;


            }


            var fieldsStr = "";
            var valuesStr = "";
            var types = [];

            json.header.forEach(function (column, index) {
                if (index > 0)
                    fieldsStr += ","
                fieldsStr += column;


            })

            json.data.forEach(function (row, index) {

                if (index == 1071)
                    var x = 3
                if (index > 0)
                    valuesStr += ",";
                valuesStr += "(";

                json.header.forEach(function (column, index2) {
                    var typeObj = tables[table][column];
                    var type = typeObj.dataType;

                    if (types.indexOf(type) < 0)
                        types.push(type)


                    if (index2 > 0)
                        valuesStr += ","
                    var value = row[column];
                    if (value) {
                        value = ("" + value).replace(/[\r\n\t]/g, "");


                        if (table == "import_magasin") {

                            if (column == "indisponible") {
                                //  if (value == "X")
                                value = 1;
                            }

                            if (column == "cotesParTablette") {

                                value = ("" + value).replace(/  /g, " ")
                            }

                            if (column == "intitule") {

                                value = null;
                            }
                            if (column == "etatTraitement") {

                                value = null;
                            }
                        }


                    }


                    if (!value)
                        valuesStr += "null";


                    else if (type == "int" || type == "decimal") {
                        /*  if (("" + value).indexOf("\r") > -1)
                              valuesStr += "null";
                          else if (value = " ")
                              valuesStr += "null";
                          else{*/

                        if (typeof value == "string") {
                            if (value.indexOf(".") > -1)
                                value = parseFloat(value);
                            else
                                value = parseInt(value);

                        }
                        if (isNaN(value))
                            xx = 3

                        valuesStr += value

                        //  }


                    }
                    else if (type == "date") {
                        // date mysql  2018-09-21
                        var array = value.split("_");
                        if (array.length != 3) {
                            valuesStr += "null";
                        }
                        else if (array[2].length == 4)
                            valuesStr += "'" + array[2] + "-" + array[1] + "-" + array[0] + "'";
                        else
                            valuesStr += "'" + array[0] + "-" + array[1] + "-" + array[2] + "'";

                    }
                    else if (type == "varchar" || type == "text") {


                        str = xlsxToImport.escapeMySqlChars(value);
                        str = str.replace(/\(/g, "\(");
                        str = str.replace(/\)/g, "\)");
                        if (value.length > typeObj.maxLength) {
                            rejectedLines.push(row)
                            valuesStr += "'****trop long******'";
                        }
                        else
                            valuesStr += "'" + str + "'";
                    }


                })
                valuesStr += ")\n";
            })


            var sql = "DELETE FROM `" + table + "`;\n";

            sql += " INSERT INTO `" + table + "` (" + fieldsStr + ") values \n" + valuesStr + ";"


            response.rejectedLines = rejectedLines;
            response.sql = sql;
            /*   console.log(JSON.stringify(rejectedLines))
               console.log(types.toString())
               console.log(sql);*/

            callback(null, response);

        })


    },
    escapeMySqlChars: function (str) {

        if (typeof str != 'string')
            return str;

        return str.replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, function (char) {
            switch (char) {
                case "\0":
                    return "\\0";
                case "\x08":
                    return "\\b";
                case "\x09":
                    return "\\t";
                case "\x1a":
                    return "\\z";
                case "\n":
                    return "\\n";
                case "\r":
                    return "\\r";
                case "\"":
                case "'":
                case "\\":
                case "%":
                    return "\\" + char; // prepends a backslash to backslash, percent,
                                        // and double/single quotes
            }
        });

    }


}


if (true) {
    var sourcexlsxFile = 'D:\\ATD_Baillet\\applicationTemporaire\\imports\\versementMagasinsTemplate.xlsx';


    async.series([

            function (callback) {// import brut

                xlsxToImport.extractWorkSheets(sourcexlsxFile, null, function (err, result) {
                    var onglets = Object.keys(result);
                    async.eachSeries(onglets, function (onglet, callbackEach) {

                        var sheet = result[onglet];

                        xlsxToImport.worksheetJsonToSouslesensJson(sheet, function (err, result2) {
                            var xx = result2;
                            xlsxToImport.jsonToSqlInsert(onglet, result2, function (err, result3) {
                                fs.writeFileSync("D:\\ATD_Baillet\\applicationTemporaire\\linesRejetees_" + onglet + ".json", JSON.stringify(result3.rejectedLines, null, 2))
                                fs.writeFileSync("D:\\ATD_Baillet\\applicationTemporaire\\import_" + onglet + ".sql", result3.sql);

                                callbackEach(err);

                            })

                        })
                    }, function (err) {
                        callback(err);
                    })

                })
            },


            function (callback) {// sql post Traitement
                var sql = ""

                // copie des tables d'import dans les tables définitives

                sql += "delete from versement;\n" +
                    "insert into versement  (dateVersement,numVersement,ancienNumVersement,nature,cotesExtremesBoites,metrage,nbBoites,volumeGO,nbreElements,intitule,auteurVersement,commentaires) select dateVersement,numVersement,ancienNumVersement,nature,cotesExtremesBoites,metrage,nbBoites,volumeGO,nbreElements,intitule,auteurVersement,commentaires from import_versement;"

                sql += "delete from magasin;\n" +
                    "insert into magasin  (coordonnees,commentaires,numVersement,cotesParTablette,metrage,DimTabletteCm,DimTabletteMLineaire) select coordonnees,commentaires,numVersement,cotesParTablette,metrage,DimTabletteCm,DimTabletteMLineaire from import_magasin;"


                //magasins eclatement des coordonnées
                sql += " update magasin set magasin =SUBSTRING_INDEX(magasin.coordonnees,'-',1);\n"
                sql += " update magasin set epi =SUBSTRING_INDEX(magasin.coordonnees,'-',2);\n"
                sql += " update magasin set travee =SUBSTRING_INDEX(magasin.coordonnees,'-',3);\n"
                sql += " update magasin set tablette =SUBSTRING_INDEX(magasin.coordonnees,'-',4);\n"

                //magasin idVersement



                sql+="update magasin m JOIN versement v ON v.numVersement=m.numVersement set m.id_versement=v.id"


// nature Versement
                sql += "update versement set nature='analogique'  where (versement.cotesExtremesBoites!='' or  versement.cotesExtremesBoites is not  null) and (volumeGO=0 and versement.nbreElements=0)"
                sql += "update versement set nature='numerique'  where (versement.cotesExtremesBoites='' or  versement.cotesExtremesBoites is   null) and (volumeGO>0 and versement.nbreElements>0)"
                sql += "update versement set nature='hybride'  where (versement.cotesExtremesBoites!='' and versement.cotesExtremesBoites is  not null) and (volumeGO>0 and versement.nbreElements>0)"
                sql += " update versement set nature=null where (versement.cotesExtremesBoites='' or versement.cotesExtremesBoites is   null) and (volumeGO=0 and versement.nbreElements=0)"


                callback();
            }

        ],

        function (err) {
            console.log("All done")
        }
    )


}


module.exports = xlsxToImport;
