var mainController = (function () {
    var self = {};
    self.totalDims = {};
    self.dataModel = {};
    self.currentTable;
    self.currentLinkedTable;
    self.leftPanelWidth = 250;
    self.dataTables = {};


    var numberTypes = ["float", "double", "decimal", "int"];
    var stringTypes = ["char", "varchar", "text",];
    var operators = {
        string: ["LIKE", "=", "!="],
        number: ["=", "<", "<=", ">", ">=", "!="],
        date: ["=", "<", "<=", ">", ">=", "!="],

    }

    self.tableDefs = {
        magasin: {
            sortFields: ["magasin"],
            relationsSelect: {
                "versement": {
                    sql: "select versement.* from magasin,r_versement_magasin,versement where magasin.id=r_versement_magasin.id_magasin and r_versement_magasin.id_versement=versement.id and magasin.id=",
                    selectfields: ["num", "versement", "theme", "deposant"]
                }
            }


        },
        versement: {
            sortFields: ["numVersement desc"],
            relationsSelect: {
                "magasin": {
                    sql: "select magasin.* from magasin,r_versement_magasin,versement where magasin.id=r_versement_magasin.id_magasin and r_versement_magasin.id_versement=versement.id and versement.id=",
                    selectfields: ["coordonnees"]
                }
            }


        }
    }

    /*  self.relationsSelect = {

          magasin: {
              "versement": {
                  sql: "select versement.* from magasin,r_versement_magasin,versement where magasin.id=r_versement_magasin.id_magasin and r_versement_magasin.id_versement=versement.id and magasin.id="
              }

          },
          versement: {
              "magasin": {
                  sql: "select magasin.* from magasin,r_versement_magasin,versement where magasin.id=r_versement_magasin.id_magasin and r_versement_magasin.id_versement=versement.id and versement.id="
              }

          }


      }*/


    self.bindActions = function () {

        $("#searchTableInput").bind("change", function () {

            self.currentTable = this.value;

            self.fillSelectOptions("searchColumnInput", self.dataModel[self.currentTable], true, "name", "name")
        })

        $("#searchsButton").bind("click", function () {
            mainController.listRecords();
        })

        $("#searchMagasinsButton").bind("click", function () {
            mainController.listRecords("magasin");
        })
        $("#searchColumnInput").bind("change", function () {
            mainController.setOperators(this.value);
        })
        $("#showHideLeftPanelButton").bind("click", function () {
            mainController.showHideLeftPanel();
        })

        $("#addLinkedRecordButton").bind("click", function () {
            recordController.addLinkedRecord();
        })

        $("#deleteLinkedRecordButton").bind("click", function () {
            recordController.deleteLinkedRecord();
        })

        $("#searchLinkedRecordsInput").bind("keydown", function (e) {
            if (e.keyCode == 13 || e.keyCode == 9) {
                var str = $(this).val()
                if (true || str.length > 3)
                    mainController.searchLinkedRecords(str);
            }
        })
        $("#newRecordTableSelect").bind("click", function () {
            mainController.showNewRecordDialog($(this).val());
        })
        /* $("#saveRecordButton").bind("click", function () {
             recordController.saveRecord();
         })*/

        $("#addRecordButton").bind("click", function () {
            mainController.showNewRecordDialog();
        })

        $("#statsSelect").bind("change", function () {
            var str = $(this).val()
            statistics.displayStat(str);
        })


    }

    self.showHideLeftPanel = function () {
        var width = $("#left").width();
        if (width >= self.leftPanelWidth) {
            $("#left").width(0)
            $("#left").css("display", "none")
        }
        else {
            $("#left").width(self.leftPanelWidth)
            $("#left").css("display", "inline")
        }

    }
    self.initTablesSelects = function () {

        var tables = Object.keys(self.dataModel);

        self.fillSelectOptions("searchTableInput", tables, true);
        self.fillSelectOptions("newRecordTableSelect", tables, true);
        var stats = Object.keys(statistics.stats);
        self.fillSelectOptions("statsSelect", stats, true);


    }
    self.getFieldType = function (table, _field) {
        var type = "";
        if(!table || !self.dataModel[table])
            return "string";

        if (!table)
            table = self.currentTable;

        self.dataModel[table].forEach(function (field) {
            if (field.name == _field)
                type = field.dataType;
        })

        if (numberTypes.indexOf(type) > -1)
            return "number";
        if (stringTypes.indexOf(type) > -1)
            return "string";

        return type;


    }
    self.setOperators = function (field) {
        var type = self.getFieldType(null, field);
        var operatorsArray = operators[type];
        self.fillSelectOptions("searchOperatorInput", operatorsArray, true)
    }


    //aa
    self.setDivsSize = function () {
        $("#left").width(self.leftPanelWidth)
        mainController.totalDims.w = $(window).width();
        mainController.totalDims.h = $(window).height();
        var dataTableWidth = mainController.totalDims.w - (self.leftPanelWidth)
        //  $("#dataTableDiv").width(dataTableWidth).height(500);
        $(".dataTableDiv").width(dataTableWidth).height(mainController.totalDims.h - 50);

    }

    self.enableLinkButton=function(){
        $("#addLinkedRecordButton").removeAttr("disabled");
    }


    self.enableUnlinkButton=function(){
        $("#deleteLinkedRecordButton").removeAttr("disabled");
    }





    self.loadDataModel = function (callback) {
        var payload = {
            datamodel: 1,

        }

        $.ajax({
            type: "POST",
            url: "../mysql",
            data: payload,
            dataType: "json",
            success: function (json) {
                self.dataModel = json;
                return callback(null, json);

            }, error: function (err) {
                return callback(err);
            }


        })

    }


    self.listRecords = function () {
        var whereStr = "";
        var table = self.currentTable;
        var relationsSelect = mainController.tableDefs[table].relationsSelect;
        var i = 0;

        for (var key in relationsSelect) {
            if (i++ == 0) {
                self.currentLinkedTable = key;
                var selectfields = relationsSelect[key].selectfields;
                mainController.fillSelectOptions("linkedRecordsFieldSelect", selectfields, true);
            }
        }
        var column = $("#searchColumnInput").val();
        var operator = $("#searchOperatorInput").val();
        var value = $("#searchValueInput").val();
        if (!table || table == "")
            return self.setErrorMessage(" selectionner une table");
        if (column != "") {

            if (operator == "LIKE") {
                value = "'%" + value + "%'"
            }
            else {
                var type = self.getFieldType(table, column);
                if (type == "string")
                    value = "'" + value + "'";
                else if (type == "date") {
                    value = value.replace(/\//g, "-")
                    value = "'" + value + "'";
                } else if (type == "number")
                    value = value;


            }
            whereStr = " WHERE " + table + "." + column + " " + operator + " " + value;


        }

        var sql = "select * from " + table + whereStr;
        var sortClause = "";
        var sortFields = self.tableDefs[table].sortFields;
        sortFields.forEach(function (field, index) {
            if (index == 0)
                sortClause = " order by "
            else
                sortClause += ","
            sortClause += field;
        })
        sql += sortClause;
        console.log(sql);
        var payload = {
            exec: 1,
            sql: sql
        }

        $.ajax({
            type: "POST",
            url: "../mysql",
            data: payload,
            dataType: "json",
            success: function (json) {
                if (!self.dataTables[table])
                    self.dataTables[table] = new dataTable();
                self.dataTables[table].loadJson("listRecordsDiv", json, {onClick: recordController.displayRecordData})
                $("#tabs").tabs("option", "active", 0);
                $("#addLinkedRecordButton").attr("disabled",true);
                $("#deleteLinkedRecordButton").attr("disabled",true);

            }, error: function (err) {
                self.setErrorMessage(err.responseText)
            }


        })
    }

    self.loadLinkedRecords = function () {
        var linkedTable = "";
        var foreignKey = ""

        var relationsSelect = mainController.tableDefs[self.currentTable].relationsSelect;
        var i = 0;
        for (var key in relationsSelect) {

            if (i == 0) {

                var sql = relationsSelect[key].sql + recordController.currentRecordId;
                console.log(sql);
                var payload = {
                    exec: 1,
                    sql: sql
                }

                $.ajax({
                    type: "POST",
                    url: "../mysql",
                    data: payload,
                    dataType: "json",
                    success: function (json) {
                        var width=mainController.totalDims.h * .7;
                        var height=300
                        if (!self.dataTables["linked_"+key])
                            self.dataTables["linked_"+key] = new dataTable();
                        self.dataTables["linked_"+key].loadJson("linkedRecordsDiv", json,  {
                            dom:"lti",
                            width:width,
                            height:height,
                            onClick:mainController.enableUnlinkButton


                        })


                    }, error: function (err) {
                        self.setErrorMessage(err.responseText)
                    }


                })

            }
        }


    }


    self.searchLinkedRecords = function (str) {
        var concatStr = "";
        var i = 0;
        self.dataModel[self.currentLinkedTable].forEach(function (field) {
            if (i++ > 0)
                concatStr += ","
            concatStr += field.name;
        })
        var sql = "";
        var field = $("#linkedRecordsFieldSelect").val();
        if (field == "")
            sql = "select * from " + self.currentLinkedTable + "  WHERE CONCAT(" + concatStr + ") LIKE '%" + str + "%'";
        else
            sql = "select * from " + self.currentLinkedTable + "  WHERE " + field + " LIKE '%" + str + "%'";
        console.log(sql);
        console.log(sql);
        var payload = {
            exec: 1,
            sql: sql
        }


        $.ajax({
            type: "POST",
            url: "../mysql",
            data: payload,
            dataType: "json",
            success: function (json) {
                var width=mainController.totalDims.h * .7;
                var height=300
                if (!self.dataTables["newLink_" + self.currentLinkedTable])
                    self.dataTables["newLink_" + self.currentLinkedTable] = new dataTable();
                self.dataTables["newLink_" + self.currentLinkedTable].loadJson("new_linkedRecordsDiv", json, {
                    dom:"ti",
                    width:width,
                    heightheight:height,
                    onClick:mainController.enableLinkButton
                })

            }, error: function (err) {
                self.setErrorMessage(err.responseText)
            }


        })


    }

    self.showNewRecordDialog = function () {
        var table = $("#searchTableInput").val();
        if (!table) {
            return mainController.setErrorMessage("selectionnez une table")
        }
        recordController.currentRecordId = null;
        mainController.currentTable = table;
        recordController.displayRecordData({});
        $(dialog.dialog("open"))
        $("#tabs").tabs({disabled: [1, 2]});
        self.execCustomization({type:"newRecord"});

    }

    self.execCustomization=function(options){
        if(!options)
            options={};
        if(options.type=="newRecord"){

        }


    }

    self.fillSelectOptions = function (selectId, data, withBlanckOption, textfield, valueField) {
        $("#" + selectId).find('option').remove().end()
        if (withBlanckOption) {
            $("#" + selectId).append($('<option>', {
                text: "",
                value: ""
            }));
        }

        data.forEach(function (item, index) {
            $("#" + selectId).append($('<option>', {
                text: item[textfield] || item,
                value: item[valueField] || item
            }));
        });
    }

    self.setMessage = function (message) {
        $("#messageDiv").css("color", "blue");
        $("#messageDiv").html(message);

    }

    self.setErrorMessage = function (message) {
        $("#messageDiv").css("color", "red");
        $("#messageDiv").html(message);

    }
    self.confirm=function(message){
        $("#confirmDialogDiv").html(message);
    }


    return self;

})();