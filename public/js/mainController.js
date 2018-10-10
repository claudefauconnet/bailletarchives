var mainController = (function () {
    var self = {};
    self.totalDims = {};
    self.dataModel = {};
    self.currentTable;

    var numberTypes=["float","double","decimal","int"];
    var stringTypes=["char","varchar","text",];
    var operators = {
        string: ["LIKE", "=", "!="],
        number: ["=", "<", "<=", ">", ">=", "!="],
        date: ["=", "<", "<=", ">", ">=", "!="],

    }

    self.bindActions = function () {

        $("#searchTableInput").bind("change", function () {

            self.currentTable = this.value;

            self.fillSelectOptions("searchColumnInput", self.dataModel[self.currentTable],true, "name", "name")
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


    }


    self.initTablesSelects = function () {

        var tables = Object.keys(self.dataModel);

        self.fillSelectOptions("searchTableInput", tables,true);


    }
    self.getFieldType = function (table, _field) {
        var type = "";
        if (!table)
            table = self.currentTable;
        self.dataModel[table].forEach(function (field) {
            if (field.name == _field)
                type = field.dataType;
        })

        if(numberTypes.indexOf(type)>-1)
            return "number";
        if(stringTypes.indexOf(type)>-1)
            return "string";

        return type;


    }
    self.setOperators = function (field) {
        var type = self.getFieldType(null, field);
        var operatorsArray = operators[type];
        self.fillSelectOptions("searchOperatorInput", operatorsArray,true)
    }



    //aa
    self.setDivsSize = function () {

        mainController.totalDims.w = $(window).width();
        mainController.totalDims.h = $(window).height();
        var dataTableWidth = mainController.totalDims.w - $("#left").width() - 20
      //  $("#dataTableDiv").width(dataTableWidth).height(500);
        $("#dataTableDiv").width(dataTableWidth).height(mainController.totalDims.h-20);

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
            find: 1,
            sql: sql
        }

        $.ajax({
            type: "POST",
            url: "../mysql",
            data: payload,
            dataType: "json",
            success: function (json) {
                dataTable.loadJson("dataTableDiv", json)
                var xx = json
            }, error: function (err) {
                self.setErrorMessage(err.responseText)
            }


        })
    }


    self.fillSelectOptions = function (selectId, data, withBlanckOption, textfield, valueField,) {
        $("#" + selectId).find('option').remove().end()
        if (withBlanckOption) {
            $("#" + selectId).append($('<option>', {
                text:  "",
                value:  ""
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