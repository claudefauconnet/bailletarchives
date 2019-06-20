const XLSX = require('xlsx');
const async = require("async");
const fs = require('fs');



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

        if(!range || range.length<2)// feuille vide
            return callback(null,null);
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




}


if (true) {
    var sourcexlsxFile = 'D:\\ATD_Baillet\\applicationTemporaire\\imports\\versementMagasinsTemplate.xlsx';




    xlsxToImport.extractWorkSheets(sourcexlsxFile,null,function(err, result){

        for(var key in result){
            var sheet= result[key];

            xlsxToImport.worksheetJsonToSouslesensJson(sheet, function(err,result2){
                var xx=result2
            })
        }



    })


}


module.exports = xlsxToNeo;
