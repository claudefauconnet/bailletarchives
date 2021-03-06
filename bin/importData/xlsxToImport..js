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
        var xx=Object.keys(data)
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

            json.data.forEach(function (row, index0) {

                if (index0 == 1071)
                    var x = 3
                if (index0 > 0)
                    valuesStr += ",";


                valuesStr += "(";

                json.header.forEach(function (column, index2) {
                    var typeObj = tables[table][column];
                    if(!typeObj)
                        return;
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
                            if (column == "numVersement") {
                                //  if (value == "X")
                                value = "" + value;
                                while (value.length < 4) {
                                    value = "0" + value;
                                }

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

                        if (table == "import_versement") {
                            if (column == "numVersement") {
                                //  if (value == "X")
                                value = "" + value;
                                while (value.length < 4) {
                                    value = "0" + value;
                                }

                            }
                            if(column=="dateVersement"){
                                xx= value;
                            }
                        }

                    }

                    if (!value)
                        valuesStr += "null";

                    else if (type == "int" || type == "decimal") {


                        if (typeof value == "string") {
                            if (value.indexOf(".") > -1)
                                value = parseFloat(value);
                            else
                                value = parseInt(value);

                        }
                      else  if (isNaN(value))
                        value= "null";


                        valuesStr += value;

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

var str="";
            rejectedLines.forEach(function(obj,index){
                json.header.forEach(function(column,index2){
                    if (index2 == 0)
                        str +="\\t"
                    if(index==0) {
                        str+=column;
                    }
                    str+=obj[column];
                })
                str+="\\n"
            })

            response.rejectedLines = rejectedLines;
            response.sql = sql;
            /*   console.log(JSON.stringify(rejectedLines))
               console.log(types.toString())*/
            //   console.log(sql);

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



if(false){
    var sourcexlsxFile = 'D:\\Total\\graphNLP\\export_mec_question.xlsx';
    xlsxToImport.extractWorkSheets(sourcexlsxFile, null, function (err, result) {
        var onglets = Object.keys(result);
        async.eachSeries(onglets, function (onglet, callbackEach) {

            var sheet = result[onglet];

            xlsxToImport.worksheetJsonToSouslesensJson(sheet, function (err, result2) {
                console.log(JSON.stringify(result2, null,2))

            })

        })
    })

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
                    "insert into magasin  (coordonnees,commentaires,numVersement,cotesParTablette,metrage,DimTabletteMLineaire,indisponible) select coordonnees,commentaires,numVersement,cotesParTablette,metrage,DimTabletteMLineaire,indisponible from import_magasin;"

//***********************magasin**********************************************************
                //magasins eclatement des coordonnées
                sql += " update magasin set magasin =SUBSTRING_INDEX(magasin.coordonnees,'-',1);\n"
                sql += " update magasin set epi =SUBSTRING_INDEX(magasin.coordonnees,'-',2);\n"
                sql += " update magasin set travee =SUBSTRING_INDEX(magasin.coordonnees,'-',3);\n"
                sql += " update magasin set tablette =SUBSTRING_INDEX(magasin.coordonnees,'-',4);\n"

                //magasin idVersement

                sql+="update magasin m JOIN versement v ON v.numVersement=m.numVersement set m.id_versement=v.id;\n";

//***********************versement_historique**************************************************************************
                sql+="delete from versement_historique;\n";

                // report des id automatique de versement dans import_versement
                sql+="update import_versement m JOIN versement v ON v.numVersement=m.numVersement set m.id=v.id;\n";

                sql+="insert into versement_historique (id_versement,etat,etatDate,etatAuteur,dateModification) SELECT v.id,'référencement' , v.dateVersement,v.receptionnePar,now() FROM import_versement v;\n";



//***********************sortie_boite**************************************************************************
                sql+="delete from sortie_boite;\n";
                sql+="insert into sortie_boite (numVersement,commentaire) select numVersement,pretsSorties from import_magasin where pretsSorties is not null;\n";
                sql+="update sortie_boite m JOIN versement v ON v.numVersement=m.numVersement set m.id_versement=v.id;\n";

//***********************versement**************************************************************************
                sql += "update versement set centreArchive='Baillet';\n";
                sql+="update versement m JOIN import_versement v ON v.numVersement=m.numVersement set m.etatTraitement='référencement',m.etatTraitementAuteur=v.receptionnePar,m.etatTraitementDate=v.dateVersement;\n";
                sql+="update versement set nature =lower(nature);\n";

                // nature Versement
            /*    sql += "update versement set nature='analogique'  where (versement.cotesExtremesBoites!='' or  versement.cotesExtremesBoites is not  null) and (volumeGO=0 and versement.nbreElements=0);\n"
                sql += "update versement set nature='numerique'  where (versement.cotesExtremesBoites='' or  versement.cotesExtremesBoites is   null) and (volumeGO>0 and versement.nbreElements>0);\n"
                sql += "update versement set nature='hybride'  where (versement.cotesExtremesBoites!='' and versement.cotesExtremesBoites is  not null) and (volumeGO>0 and versement.nbreElements>0);\n"
                sql += " update versement set nature=null where (versement.cotesExtremesBoites='' or versement.cotesExtremesBoites is   null) and (volumeGO=0 and versement.nbreElements=0);\n"

*/




//***********************listes**************************************************************************

                sql+="DELETE FROM `listes`;\n" +
                    "/*!40000 ALTER TABLE `listes` DISABLE KEYS */;\n" +
                    "INSERT INTO `listes` (`liste`, `valeur`, `ordreNum`, `id`) VALUES\n" +
                    "\t('versement.etatTraitement', 'référencement', 1, 19),\n" +
                    "\t('versement.etatTraitement', 'création IR/BV', 2, 20),\n" +
                    "\t('versement.etatTraitement', 'retraitement/reconditionnement', 3, 21),\n" +
                    "\t('versement.etatTraitement', 'instrument de recherche normé', 4, 22),\n" +
                    "\t('versement.etatTraitement', 'suppression cote', 5, 23),\n" +
                    "\t('versement.nature', 'analogique', 1, 24),\n" +
                    "\t('versement.nature', 'numerique', 2, 25),\n" +
                    "\t('versement.nature', 'hybride', 3, 26);\n"

                fs.writeFileSync("D:\\ATD_Baillet\\applicationTemporaire\\import_traitementPostImport.sql",sql);

                callback();
            }

        ],

        function (err) {
            console.log("All done")
        }
    )


}


module.exports = xlsxToImport;

/*


DROP TABLE IF EXISTS `import_magasin`;
CREATE TABLE IF NOT EXISTS `import_magasin` (
  `coordonnees` varchar(50) DEFAULT NULL,
  `cotesParTablette` varchar(250) DEFAULT NULL,
  `commentaires` text DEFAULT NULL,
  `numVersement` varchar(50) DEFAULT NULL,
  `metrage` decimal(10,2) DEFAULT NULL,
  `id_versement` int(11) DEFAULT NULL,
  `pretsSorties` varchar(250) DEFAULT NULL,
  `DimTabletteCm` varchar(250) DEFAULT NULL,
  `DimTabletteMLineaire` decimal(10,2) DEFAULT NULL,
  `id` int(11) NOT NULL DEFAULT 0,
  `magasin` varchar(20) DEFAULT NULL,
  `epi` varchar(20) DEFAULT NULL,
  `travee` varchar(20) DEFAULT NULL,
  `tablette` varchar(20) DEFAULT NULL,
  `indisponible` int(11) DEFAULT NULL,
  `etatTraitement` varchar(50) DEFAULT NULL,
  `intitule` varchar(250) DEFAULT NULL
) ;




DROP TABLE IF EXISTS `import_versement`;
CREATE TABLE IF NOT EXISTS `import_versement` (
  `numVersement` varchar(50) DEFAULT NULL,
  `intitule` text DEFAULT NULL,
  `centreArchive` varchar(50) DEFAULT NULL,
  `commentaires` text DEFAULT NULL,
  `auteurVersement` varchar(50) DEFAULT NULL,
  `dateVersement` date DEFAULT NULL,
  `ancienNumVersement` varchar(50) DEFAULT NULL,
  `etatTraitement` varchar(50) DEFAULT NULL,
  `etatTraitementAuteur` varchar(50) DEFAULT NULL,
  `etatTraitementDate` date DEFAULT NULL,
  `nature` varchar(50) DEFAULT NULL,
  `cotesExtremesBoites` varchar(100) DEFAULT NULL,
  `cotesExtremesDossiersNiveauUn` varchar(100) DEFAULT NULL,
  `nbBoites` int(11) DEFAULT NULL,
  `metrage` decimal(10,2) DEFAULT NULL,
  `volumeGO` decimal(10,3) DEFAULT NULL,
  `nbreElements` int(11) DEFAULT NULL,
  `id` int(11) unsigned NOT NULL DEFAULT 0,
  `dateFinRecolement` date DEFAULT NULL,
  `recolePar` varchar(100) DEFAULT NULL,
  `receptionnePar` varchar(50) DEFAULT NULL
)




 */
