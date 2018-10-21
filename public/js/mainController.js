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
    self.relations = {

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


    }


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
            mainController.addLinkedRecord();
        })

        $("#deleteLinkedRecordButton").bind("click", function () {
            mainController.deleteLinkedRecord();
        })

        $("#searchLinkedRecordsInput").bind("keydown", function (e) {
            if (e.keyCode == 13) {
                var str = $(this).val()
                if (true || str.length > 3)
                    mainController.searchLinkedRecords(str);
            }
        })
        $("#newRecordTableSelect").bind("click", function () {
            mainController.showNewRecordDialog($(this).val());
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


    }
    self.getFieldType = function (table, _field) {
        var type = "";
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
        var dataTableWidth = mainController.totalDims.w - $("#left").width() - 20
        //  $("#dataTableDiv").width(dataTableWidth).height(500);
        $("#listRecordsDiv").width(dataTableWidth).height(mainController.totalDims.h - 20);

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
        var relations = mainController.relations[table];
        var i = 0;
        for (var key in relations) {
            if (i++ == 0)
                self.currentLinkedTable = key;
        }
        var column = $("#searchColumnInput").val();
        var operator = $("#searchOperatorInput").val();
        var value = $("#searchValueInput").val();
        if (!table || table == "")
            return self.setErrorMessage(" selectionner une table");
        if (column != "") {

            if (operator == "LIKE")
                value = "'%" + value + "%'"
            whereStr = " WHERE " + table + "." + column + " " + operator + " " + value


        }

        var sql = "select * from " + table + whereStr;
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
                var xx = json
            }, error: function (err) {
                self.setErrorMessage(err.responseText)
            }


        })
    }

    self.showLinkedRecords = function () {
        var linkedTable = "";
        var foreignKey = ""

        var relations = self.relations[self.currentTable];
        var i = 0;
        for (var key in relations) {

            if (i == 0) {
                var sql = relations[key].sql + recordController.currentRecordId;
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
                        if (!self.dataTables[relations[key].table])
                            self.dataTables[relations[key].table] = new dataTable();
                        self.dataTables[relations[key].table].loadJson("linkedRecordsDiv", json, {onClick: recordController.displayRecordData})


                    }, error: function (err) {
                        self.setErrorMessage(err.responseText)
                    }


                })

            }
        }


    }

    self.addLinkedRecord = function () {


    }
    self.deleteLinkedRecord = function () {


    }

    self.searchLinkedRecords = function (str) {
        var concatStr = "";
        var i = 0;
        self.dataModel[self.currentLinkedTable].forEach(function (field) {
            if (i++ > 0)
                concatStr += ","
            concatStr += field.name;
        })


        var sql = "select * from " + self.currentLinkedTable + "  WHERE CONCAT(" + concatStr + ") LIKE '%" + str + "%'";
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

                if (!self.dataTables["new_" + self.currentLinkedTable])
                    self.dataTables["new_" + self.currentLinkedTable] = new dataTable();
                self.dataTables["new_" + self.currentLinkedTable].loadJson("new_linkedRecordsDiv", json, {})

            }, error: function (err) {
                self.setErrorMessage(err.responseText)
            }


        })


    }

    self.showNewRecordDialog = function (table) {
        recordController.currentRecordId = null;
        mainController.currentTable = table;
        recordController.displayRecordData({});
        $(dialog.dialog("open"))
        $("#tabs").tabs({disabled: [1, 2]});

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


    return self;

})();