var mainController = (function () {
    var self = {};
    self.urlPrefix = "."
    self.totalDims = {};

    self.leftPanelWidth = 250;


    var numberTypes = ["float", "double", "decimal", "int"];
    var stringTypes = ["char", "varchar", "text",];
    var operators = {
        string: ["LIKE", "NOT LIKE", "=", "!="],
        number: ["=", "<", "<=", ">", ">=", "!="],
        date: ["=", "<", "<=", ">", ">=", "!="],

    }

    self.execSql = function (sql, callback) {
        var payload = {
            exec: 1,
            sql: sql
        }

        $.ajax({
            type: "POST",
            url: mainController.urlPrefix + "/mysql",
            data: payload,
            dataType: "json",
            success: function (json) {
                return callback(null, json);
            },
            error: function (err) {
                console.log(err.responseText)
                return callback(err.responseText);
            }
        })
    }

    self.init0 = function () {
        mainController.setDivsSize();
        mainController.bindActions();
        mainController.loadDataModel(function (err, result) {
            if (err)
                return;
            mainController.initTablesSelects();
            mainController.loadLists();
            if (false)
                magasinD3.init("mainDiv");


        });
    }


    self.bindActions = function () {

        $("#searchTableInput").bind("change", function () {
            context.currentTable = $(this).val();
            mainController.onchangeTable(context.currentTable);
            mainController.showSearchDiv("searchDiv-Autres");


        })
        $("#searchColumnInput").bind("change", function () {
            mainController.setOperators(this.value);
            $("#searchValueInput").val("");
            $("#searchValueInput").focus();
        })

        $("#searchButton").bind("click", function () {

            listController.addSearchCriteria(listController.listRecords);
        })

        $("#locateButton").bind("click", function () {
            self.showInMainDiv("graph")
            context.currentCriteria = [];
            listController.addSearchCriteria(Versement.locateBySql);
            context.currentCriteria = [];

        })

        $("#andSearchButton").bind("click", function () {
            listController.addSearchCriteria();
        })
        $("#searchValueInput").keyup(function (event) {
            if (event.keyCode === 13 || event.keyCode === 9) {
                listController.addSearchCriteria(listController.listRecords);
            }
        });


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
            $("#toolsSelect").val("");
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
        var visibleTables = [];
        tables.forEach(function (table) {

            if (config.hiddenTables.indexOf(table) < 0)
                visibleTables.push(table)
        })

        self.fillSelectOptions("searchTableInput", visibleTables, true);

        var stats = Object.keys(statistics.stats);
        self.fillSelectOptions("statsSelect", stats, true);
        tools.init();


    }

    self.loadLists = function () {
        config.lists = {};
        var sql = "select * from listes"
        mainController.execSql(sql, function (err, json) {
            if (err)
                mainController.setErrorMessage(err);
            json.forEach(function (listObj, index) {
                if (!config.lists[listObj.liste])
                    config.lists[listObj.liste] = [];
                config.lists[listObj.liste].push(listObj.valeur)


            })
            mainController.fillSelectOptions("gererLists_ValueSelect", json, false, "valeur", "valeur")
        })

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

    self.isTextField = function (table, _field) {
        if (!table || !context.dataModel[table])
            return false;
        var ok = false
        context.dataModel[table].forEach(function (field) {
            if (field.name == _field && (field.dataType == "text" || field.maxLength > 60)) {
                ok = true;
            }
        })
        return ok;

    }

    self.setOperators = function (field) {
        var type = self.getFieldType(context.currentTable, field);
        var operatorsArray = operators[type];
        try {
            self.fillSelectOptions("searchOperatorInput", operatorsArray, false)
        }
        catch (e) {
            var x = field
        }
    }


    //aa
    self.setDivsSize = function () {
        $("#left").width(self.leftPanelWidth)
        mainController.totalDims.w = $(window).width();
        mainController.totalDims.h = $(window).height();
        var dataTableWidth = mainController.totalDims.w - (self.leftPanelWidth);
        $("#mainDiv").width(mainController.totalDims.w - (self.leftPanelWidth + 20)).height(mainController.totalDims.h - 20);
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
            url: mainController.urlPrefix + "/mysql",
            data: payload,
            dataType: "json",
            success: function (json) {
                context.dataModel = json;
                return callback(null, json);

            }, error: function (err) {
                var host = window.location.hostname;
                console.log(host);
                return callback(err);
            }


        })

    }

    self.loadTab = function (tabIndex) {
        return;
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
        return;
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


    self.onChangeMainAccordionTab = function (tabName) {
        if (tabName == "Accueil") {
            // magasinD3.init("graphDiv")
        //    mainController.showInMainDiv("graph");

        }

        else if (tabName == "Versements") {
            self.onchangeTable("versement");

            mainController.showSearchDiv("searchDiv-Versements");
        }
        /*    else if (tabName == "Sorties") {
                context.currentTable = "sortie_boite"
                mainController.showSearchDiv("searchDiv-Sorties");
            }*/

        else if (tabName == "Autres"  || tabName=="GestionTables") {
            self.onchangeTable("versement");
            mainController.showSearchDiv("searchDiv-Autres");
        }

    }

    self.onchangeTable = function (table) {
        if (context.currentCriteria.length > 0 && context.currentTable != table) {// search sur plusieurs tables
            context.currentJoinTable = context.currentTable;
            context.currentTable = table;

        } else {
            context.currentTable = table;

        }


        var defaultSearchField = config.tableDefs[context.currentTable].defaultSearchField;
        if (!defaultSearchField)
            defaultSearchField = "";
        self.fillSelectOptions("searchColumnInput", context.dataModel[table], true, "name", "name");
        $("#searchColumnInput").val(defaultSearchField);
        if (defaultSearchField != "") {
            mainController.setOperators(defaultSearchField);
            $("#searchValueInput").focus();
        }
        $("#searchValueInput").val("");

        if (config.LoadAllrecordsTables === true) {
            listController.addSearchCriteria(listController.listRecords);
        }
    }


    self.showNewRecordDialog = function () {

        if (!context.currentTable) {
            return mainController.setErrorMessage("selectionnez une table")
        }
        context.currentRecord.id = null;
        recordController.displayRecordData({});
        $(dialog.dialog("open"))
        //  $("#tabs").tabs({disabled: [1, 2]});
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
        return message;

    }


    self.setErrorMessage = function (message) {
        $("#messageDiv").css("color", "red");
        $("#messageDiv").html(message);
        return message;

    }
    self.setRecordMessage = function (message) {
        $("#recordMessageDiv").css("color", "blue");
        $("#recordMessageDiv").html(message);
        return message;

    }
    self.setRecordErrorMessage = function (message) {
        $("#recordMessageDiv").css("color", "red");
        $("#recordMessageDiv").html(message);
        return message;

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
                return mainController.setErrorMessage(err)
            if (json.length == 1) {
                // $("#searchTableInput").removeAttr("disabled")
                $("#leftAccordion").css("opacity", 1);
                $("#loginDialogDiv").dialog("close");
            }
        })

    }
    self.showSearchDiv = function (targetDiv) {


        $("#movableSearchDiv").css("display", "block")
        var searchhDiv = $("#movableSearchDiv").detach();
        searchhDiv.appendTo("#" + targetDiv)
        if (targetDiv = "searchDiv-Versements")
            $("#locateButton").css("visibility", "visible");
        else
            $("#locateButton").css("visibility", "hidden");


    }

    self.showInMainDiv = function (type) {

        var html = $("#mainDiv").html();
        if (html.indexOf("graphDiv") > -1) {
            context.hiddenMainDivContent["graph"] = $("#graphDiv").detach();
        }
        else {
            context.hiddenMainDivContent["list"] = $("#table_mainDiv_wrapper").detach();
        }


        if (type == "graph" && context.hiddenMainDivContent["graph"]) {
            context.hiddenMainDivContent["graph"].appendTo($("#mainDiv"))
            magasinD3.clearHighlights();
            magasinD3.initialZoom();
        }
        if (type == "list" && context.hiddenMainDivContent["list"]) {
            context.hiddenMainDivContent["list"].appendTo($("#mainDiv"))

        }


    }


    return self;

})();