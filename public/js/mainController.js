var mainController = (function () {
    var self = {};
    self.totalDims = {};

    self.leftPanelWidth = 250;


    var numberTypes = ["float", "double", "decimal", "int"];
    var stringTypes = ["char", "varchar", "text",];
    var operators = {
        string: ["LIKE", "=", "!="],
        number: ["=", "<", "<=", ">", ">=", "!="],
        date: ["=", "<", "<=", ">", ">=", "!="],

    }

    self.execSql=function(sql,callback){
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
                return callback(null,json);
            },
            error: function (err) {
                return callback(err);
            }
        })
    }

    self.bindActions = function () {

        $("#searchTableInput").bind("change", function () {
            if (context.currentCriteria.length >0 &&  context.currentTable != this.value) {// search sur plusieurs tables
                context.currentJoinTable = context.currentTable;
                context.currentTable = this.value;

            } else {
                context.currentTable = this.value;

            }

           var  defaultSearchField=config.tableDefs[context.currentTable].defaultSearchField;
            if(!defaultSearchField)
                defaultSearchField="";
            self.fillSelectOptions("searchColumnInput", context.dataModel[this.value], true, "name", "name");
            $("#searchColumnInput").val(defaultSearchField);
            if(defaultSearchField!="") {
                mainController.setOperators(defaultSearchField);
                $("#searchValueInput").focus();
            }
            $("#searchValueInput").val("");
        })
        $("#searchColumnInput").bind("change", function () {
            mainController.setOperators(this.value);
            $("#searchValueInput").val("");
            $("#searchValueInput").focus();
        })

        $("#searchButton").bind("click", function () {
            listController.addSearchCriteria(true);
        })

        $("#andSearchButton").bind("click", function () {
            listController.addSearchCriteria();
        })
        $("#searchValueInput").keyup(function(event) {
            if (event.keyCode === 13 || event.keyCode === 9) {
                listController.addSearchCriteria(true);
            }
        });


        $("#searchMagasinsButton").bind("click", function () {
            listController.listRecords("magasin");
        })

        $("#showHideLeftPanelButton").bind("click", function () {
            mainController.showHideLeftPanel();
        })

        $("#addLinkedRecordButton").bind("click", function () {
            listController.addLinkedRecord();
        })

        $("#deleteLinkedRecordButton").bind("click", function () {
            listController.deleteLinkedRecord();
        })

        $("#searchLinkedRecordsInput").bind("keydown", function (e) {
            if (e.keyCode == 13 || e.keyCode == 9) {
                var str = $(this).val()
                if (true || str.length > 3)
                    listController.searchLinkedRecords(str);
            }
        })
        $("#searchLinkedRecordsButton").bind("click", function () {
            listController.searchLinkedRecords();
        })


        $(".showAddLinkedRecordButton").bind("click", function () {
            $("#dialog2Div").dialog("open");
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
        $("#toolsSelect").bind("change", function () {
            var str = $(this).val()
            tools.execTool(str);
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

        var tables = Object.keys(context.dataModel);

        self.fillSelectOptions("searchTableInput", tables, true);
        self.fillSelectOptions("newRecordTableSelect", tables, true);
        var stats = Object.keys(statistics.stats);
        self.fillSelectOptions("statsSelect", stats, true);
        tools.init();


    }
    self.getFieldType = function (table, _field) {
        var type = "";
        if (!table || !context.dataModel[table])
            return "string";

        if (!table)
            table = context.currentTable;

        context.dataModel[table].forEach(function (field) {
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
        var type = self.getFieldType(context.currentTable, field);
        var operatorsArray = operators[type];
        self.fillSelectOptions("searchOperatorInput", operatorsArray, false)
    }


    //aa
    self.setDivsSize = function () {
        $("#left").width(self.leftPanelWidth)
        mainController.totalDims.w = $(window).width();
        mainController.totalDims.h = $(window).height();
        var dataTableWidth = mainController.totalDims.w - (self.leftPanelWidth);
        $("#listRecordsDiv").width(mainController.totalDims.w - (self.leftPanelWidth + 20)).height(mainController.totalDims.h - 20);
        //  $("#dataTableDiv").width(dataTableWidth).height(500);
        //  $(".dataTableDiv").width(dataTableWidth).height(mainController.totalDims.h - 50);

    }

    self.enableLinkButton = function () {
        $("#addLinkedRecordButton").removeAttr("disabled");
    }


    self.enableUnlinkButton = function () {
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
                context.dataModel = json;
                return callback(null, json);

            }, error: function (err) {
                return callback(err);
            }


        })

    }

    self.loadTab = function (tabIndex) {
        context.currentTabIndex = tabIndex;
        if (tabIndex > 0) {
            var linkedTable = config.tableDefs[context.currentTable].tabs[tabIndex];
            var dataTableDivName = "linkedRecordsDiv"
            if (tabIndex > 1)
                dataTableDivName += tabIndex;// increment des noms de divs dans


            listController.loadLinkedRecords(linkedTable, dataTableDivName);
        }


    }


    self.setTabs = function () {
        // title of tabs for linked records depending on config
        var tabNames = config.tableDefs[context.currentTable].tabs;

        var tabLis = $('.ui-tabs-anchor').toArray();
        tabLis.forEach(function (li, index) {
            if (index > 0 && tabNames[index]) {
                $(li).text(tabNames[index] + "s liés");
                $("#tabs").tabs("enable", index);
            }


        })
        $("#tabs").tabs("option", "active", 0);
    }

    self.showNewRecordDialog = function () {
        var table = $("#searchTableInput").val();
        if (!table) {
            return mainController.setErrorMessage("selectionnez une table")
        }
        context.currentRecordId = null;
        context.currentTable = table;
        recordController.displayRecordData({});
        $(dialog.dialog("open"))
        $("#tabs").tabs({disabled: [1, 2]});
        self.execCustomization({type: "newRecord"});

    }

    self.execCustomization = function (options) {
        if (!options)
            options = {};
        if (options.type == "newRecord") {

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
    self.confirm = function (message) {
        $("#confirmDialogDiv").html(message);
    }

    self.logon = function () {
        var login = $("#login").val();
        var password = $("#password").val();
        var sql = "select login from users where login='" + login + "' and password='" + password + "'";
        mainController.execSql(sql, function (err, json) {
            if (err)
                mainController.setErrorMessage(err)
                if (json.length == 1) {
                    $("#leftAccordion").css("opacity", 1);
                    $("#loginDialogDiv").dialog("close");
                }
        })

    }


    return self;

})();