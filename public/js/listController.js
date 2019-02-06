var listController = (function () {
    var self = {};


    // replace variables identified by $xx% by their current value in the context and eval it
    self.parseSql = function (sql) {
        sql = sql.replace(/$/g, '"+');
        sql = sql.replace(/%/g, '+"');
        try {
            return eval(sql);
        }
        catch (e) {
            return console.log(e);
        }
    }
    self.addSearchCriteria = function (execute) {

        //if simpleSearch previous query execute  dont keep this query
        if (execute && context.currentCriteria.length == 1 && context.currentCriteria[0].execute) {
            self.removeSearchCriteria(-1);
            // context.currentTable=null;
            context.currentLinkedTable = null;


        }


        mainController.setMessage("");
        var whereStr = "";
        var table = context.currentTable;
        if (!table || table == "")
            mainController.setErrorMessage("selectionnez une table");

        // gestion des requetes sur plusieurs tables
        var joinTable = context.currentJoinTable;// see mainController lines 21 to 25
        var joinObj = null;
        if (joinTable && joinTable != table) {
            var relations = config.tableDefs[context.currentJoinTable].relations;

            if (relations[context.currentTable]) {
                joinObj = relations[context.currentTable].joinObj;
            }
            else {
                return mainController.setErrorMessage("jointure impossible entre les tables " + table + " et " + joinTable)
            }
        }
        // fin gestion des requetes sur plusieurs tables


        var column = $("#searchColumnInput").val();
        var operator = $("#searchOperatorInput").val();
        var value = $("#searchValueInput").val();
        var whereText = table + " : " + column + " " + operator + " " + value
        if (column != "" && value != "") {

            if (operator == "LIKE") {
                value = "'%" + value + "%'"
            }
            if (operator == "NOT LIKE") {
                value = "'%" + value + "%'"
            }
            else {
                var type = mainController.getFieldType(table, column);
                if (type == "string")
                    value = "'" + value + "'";
                else if (type == "date") {
                    var parts = value.split("/");
                    if (parts.length == 1) {
                        if (operator == ">")
                            value = "" + (parseInt(value) + 1) + "/01/01";
                        else
                            value = value + "/01/01";
                    }
                    else if (parts.length == 2)
                        value = value + "/01";
                    else if (parts.length > 3 || parts.length < 1)
                        return mainController.setErrorMessage("format de date invalide :format attendu AAAA/MM/JJ")

                    value = value.replace(/\//g, "-")
                    value = "'" + value + "'";
                } else if (type == "number")
                    value = value;


            }
            whereStr = table + "." + column + " " + operator + " " + value;


        }
        if (whereStr != "") {
            var criteriaAllreadyExist = false;
            context.currentCriteria.forEach(function (criteria, indice) {
                if (criteria.sqlWhere == whereStr)
                    criteriaAllreadyExist = true;
            })

            if (!criteriaAllreadyExist) {
                context.currentCriteria.push({text: whereText, sqlWhere: whereStr, execute: execute});
                var indice = context.currentCriteria.length - 1;
                var str = "<div  class='searchCriteria' id='searchCriteria_" + indice + "'>" + whereText;
                str += " <img src='images/clear.png' width='15px' style='float: right' onclick='listController.removeSearchCriteria(" + indice + ")'>"
                str += "</div>"
                $("#searchCriteriaDiv").append(str);

            }
        }

        if (execute) {
            var whereStrAll = "";
            context.currentCriteria.forEach(function (criteria, indice) {
                if (indice > 0)
                    whereStrAll += " AND ";
                whereStrAll += criteria.sqlWhere;
            })


            var sql = "";
            if (joinObj) {
                sql = " select distinct " + context.currentJoinTable + ".* from  " + joinObj.tables + " WHERE " + joinObj.where + " and " + whereStrAll;
                // on remet la table initiale comme currentTable
                context.currentTable = context.currentJoinTable;
                $("#searchTableInput").val(context.currentTable);


            } else {
                if (whereStrAll.length > 0)
                    whereStrAll = " WHERE " + whereStrAll;
                sql = "select * from " + table + whereStrAll
            }
            var sortClause = "";
            var sortFields = config.tableDefs[table].sortFields;
            if (sortFields) {
                sortFields.forEach(function (field, index) {
                    if (index == 0)
                        sortClause = " order by "
                    else
                        sortClause += ","
                    sortClause += field;
                })
            }

            sql += sortClause;
            console.log(sql);
            self.listRecords(sql);
        }


    }

    self.removeSearchCriteria = function (indice) {
        if (indice > -1) {
            context.currentCriteria.splice(indice, 1);
            $("#searchCriteria_" + indice).remove();
        } else {
            context.currentCriteria = [];
            $(".searchCriteria ").remove();
        }
        $("#searchColumnInput").val("");
        $("#searchOperatorInput").val("");
        $("#searchValueInput").val("");
    }

    self.listRecords = function (sql) {
        context.currentListQueries[ context.currentTable]=sql;
        var table = context.currentTable;
        mainController.execSql(sql, function (err, json) {
            if (json.length == 0) {
                self.removeSearchCriteria(context.currentCriteria.length - 1);
                return mainController.setMessage("Pas de resultat")
            }
            if (json.length == 1) {
                recordController.displayRecordData(json[0])
                return mainController.setMessage("")
            }
            if (err)
                mainController.setErrorMessage(err)

            if (!context.dataTables[table])
                context.dataTables[table] = new dataTable();
            context.dataTables[table].loadJson(table, "listRecordsDiv", json, {onClick: recordController.displayRecordData})
            $("#tabs").tabs("option", "active", 0);
            $("#addLinkedRecordButton").attr("disabled", true);
            $("#deleteLinkedRecordButton").attr("disabled", true);

        })
    }

    self.loadLinkedRecords = function (linkedTable, dataTableDivName, callback) {
        var foreignKey = ""
        var relations = config.tableDefs[context.currentTable].relations;
        context.currentLinkedTable = linkedTable;
        var selectfields = relations[linkedTable].selectfields;
        mainController.fillSelectOptions("linkedRecordsFieldSelect", selectfields, true);

        var joinObj = relations[linkedTable].joinObj;
        var sql = " select " + linkedTable + ".* from  " + joinObj.tables + " where " + joinObj.where + " and " + context.currentTable + ".id=" + context.currentRecordId;
        mainController.execSql(sql, function (err, json) {
            if (err)
                mainController.setErrorMessage(err)
            if (callback) {
                if (err)
                    return callback(err)
                return callback(err, json);

            }

            var width = mainController.totalDims.w * 0.9;
            var height = mainController.totalDims.h - 300;
            if (!context.dataTables["linked_" + linkedTable])
                context.dataTables["linked_" + linkedTable] = new dataTable();
            context.dataTables["linked_" + linkedTable].loadJson(linkedTable, dataTableDivName, json, {
                dom: "lti",
                width: width,
                height: height,
               // onClick: mainController.enableUnlinkButton
                onClick:recordController.displayDataReadOnly
            })
        })


    }


    self.searchLinkedRecords = function (str) {
        if (!str)
            str = $("#searchLinkedRecordsInput").val();


        var concatStr = "";
        var i = 0;
        context.dataModel[context.currentLinkedTable].forEach(function (field) {
            if (i++ > 0)
                concatStr += ","
            concatStr += field.name;
        })
        var sql = "";
        var field = $("#linkedRecordsFieldSelect").val();

        if (field == "")
            sql = "select * from " + context.currentLinkedTable + "  WHERE CONCAT(" + concatStr + ") LIKE '%" + str + "%'";
        else
            sql = "select * from " + context.currentLinkedTable + "  WHERE " + field + " LIKE '%" + str + "%'";
        if( context.currentLinkedTable=="magasin")
            sql+=" and (cotesParTablette is null || cotesParTablette='') and (numVersement is null || numVersement='') "
        mainController.execSql(sql, function (err, json) {
            if (err)
                mainController.setErrorMessage(err)

            var width = mainController.totalDims.h * .7;
            var height = 300
            if (!context.dataTables["newLink_" + context.currentLinkedTable])
                context.dataTables["newLink_" + context.currentLinkedTable] = new dataTable();
            context.dataTables["newLink_" + context.currentLinkedTable].loadJson(context.currentLinkedTable, "new_linkedRecordsDiv", json, {
                dom: "tip",
                width: width,
                heightheight: height,
                onClick: mainController.enableLinkButton
            })

        })


    }
    self.addLinkedRecord = function () {
        var table = context.dataTables["newLink_" + context.currentLinkedTable].table;
        var idx = table.rows('.selected', 0).indexes();
        for (var i = 0; i < idx.length; i++) {
            var data = table.rows(idx[i]).data()[0];

            var sql = config.tableDefs[context.currentTable].relations[context.currentLinkedTable].createRelSql;
            var array = null;
            //substitution of variable names to their current value
            while ((array = /<%([^%>]*)%>/g.exec(sql)) != null) {
                var str = array[1];
                var value = eval(str);
                sql = sql.replace(array[0], value);
            }

            mainController.execSql(sql, function (err, json) {
                if (err)
                    mainController.setErrorMessage(err)

                mainController.setMessage("lien enregistré");
                mainController.loadTab(context.currentTabIndex);
                $("#dialog2Div").dialog("close");


            })
        }

    }
    self.deleteLinkedRecord = function () {
        var linksTable = context.dataTables["linked_" + context.currentLinkedTable].table;
        var idx = linksTable.rows('.selected', 0).indexes();
        for (var i = 0; i < idx.length; i++) {
            var data = linksTable.rows(idx[i]).data()[0]

            var sql = config.tableDefs[context.currentTable].relations[context.currentLinkedTable].deleteRelSql;
            var array = null;
            //substitution of variable names to their current value
            while ((array = /<%([^%>]*)%>/g.exec(sql)) != null) {
                var str = array[1];
                var value = eval(str);
                sql = sql.replace(array[0], value);
            }
            mainController.execSql(sql, function (err, json) {
                if (err)
                    mainController.setErrorMessage(err)

                mainController.setMessage("lien supprimé");
                mainController.loadTab(context.currentTabIndex);
            })

        }

    }


    return self;
})()