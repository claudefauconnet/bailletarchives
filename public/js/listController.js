var listController = (function () {
    var self = {};
    self.table;


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
    self.addSearchCriteria = function (callback) {

        //if simpleSearch previous query execute  dont keep this query
        if (callback && context.currentCriteria.length == 1 && context.currentCriteria[0].execute) {
            self.removeSearchCriteria(-1);
            // context.currentTable=null;
            context.currentLinkedTable = null;


        }


        mainController.setMessage("");
        var whereStr = "";
        var table = context.currentTable;
        if (!table || table == "")
            return mainController.setErrorMessage("selectionnez une table");


        context.currentJoinTable = null;

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
            else if (operator == "NOT LIKE") {
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
        if (operator == "EMPTY") {
            whereStr=  column+" is null or "+column+" =''"
        }
        else  if (operator == "NOT EMPTY") {
            whereStr=  column+" is not null and "+column+" !=''"
        }

        if (whereStr != "") {
            var criteriaAllreadyExist = false;
            context.currentCriteria.forEach(function (criteria, indice) {
                if (criteria.sqlWhere == whereStr)
                    criteriaAllreadyExist = true;
            })

            if (!criteriaAllreadyExist) {
                context.currentCriteria.push({text: whereText, sqlWhere: whereStr, execute: callback});
                var indice = context.currentCriteria.length - 1;
                var str = "<div  class='searchCriteria' id='searchCriteria_" + indice + "'>" + whereText;
                str += " <img src='images/clear.png' width='15px' style='float: right' onclick='listController.removeSearchCriteria(" + indice + ")'>"
                str += "</div>"
                $("#searchCriteriaDiv").append(str);

            }
        }

        if (callback) {
            var whereStrAll = "";
            context.currentCriteria.forEach(function (criteria, indice) {
                if (indice > 0)
                    whereStrAll += " AND ";
                whereStrAll += criteria.sqlWhere;
            })


            var sql = "";
            if (joinObj) {
                sql = " select distinct " + context.currentJoinTable + ".* from  " + joinObj.tables + " WHERE " + joinObj.where + " and " + whereStrAll;
                if (joinObj.orderBy && joinObj.orderBy != "")
                    sql += " order by " + joinObj.orderBy;
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
            callback(sql)

        }


    }

    self.removeSearchCriteria = function (indice) {
        if (indice > -1) {
            context.currentCriteria.splice(indice, 1);
            $("#searchCriteria_" + indice).remove();
            $("#searchColumnInput").val("");
            $("#searchOperatorInput").val("");
            $("#searchValueInput").val("");
        } else {
            context.currentCriteria = [];
            $(".searchCriteria ").remove();
        }

    }

    self.listRecords = function (sql) {
        $("#popupD3Div").css("visibility", "hidden")
        mainController.showInMainDiv("list")
        context.currentListQueries[context.currentTable] = sql;
        var table = context.currentTable;
        mainController.execSql(sql, function (err, json) {
            if (json.length == 0) {
                self.removeSearchCriteria(context.currentCriteria.length - 1);
                return mainController.setMessage("Pas de resultat")
            }
            if (json.length == 1) {
                context.currentRecord = json[0]
                recordController.displayRecordData(context.currentRecord)
                return mainController.setMessage("")
            }
            if (err)
                mainController.setErrorMessage(err)

            if (!context.dataTables[table])
                context.dataTables[table] = new dataTable();
            context.dataTables[table].loadJson(table, "listWrapperDiv", json, {onClick: recordController.displayRecordData})
            //   $("#tabs").tabs("option", "active", 0);
            $("#addLinkedRecordButton").attr("disabled", true);
            $("#deleteLinkedRecordButton").attr("disabled", true);

        })
    }

    self.loadLinkedDivs = function () {


        var relations = config.tableDefs[context.currentTable].tabs;
        $("#recordLinkedDivs").html("")
        var index = 0;
        async.eachSeries(relations, function (relation, callbackEach) {
            var dataTableDivName = "linkedRecordsDiv_" + relation;//Math.round(Math.random() * 10000);


            $.when($('#' + dataTableDivName).remove()).then(function () {
                $("#recordLinkedDivs").append("<div class='recordLinkedDiv'  id='" + dataTableDivName + "'></div><br>");
                listController.loadLinkedRecords(relation, dataTableDivName, function (err, result) {
                    return callbackEach();
                });
            });
        });


    }

    self.loadLinkedRecords = function (linkedTable, dataTableDivName, callback) {
        var foreignKey = "";
        var relations = {};
        var onListLoadedFn = null;
        var onRowClickedFn = null;
        var editableColumns = null;
        var definedColumns = null;
        var order = null;

        context.currentLinkedTable = linkedTable;

        if (config.tableDefs[context.currentTable]) {
            if (config.tableDefs[context.currentTable].relations)
                relations = config.tableDefs[context.currentTable].relations;
            onListLoadedFn = relations[linkedTable].onListLoadedFn;
            onRowClickedFn = relations[linkedTable].onRowClickedFn;
            editableColumns = relations[linkedTable].editableColumns;
            definedColumns = relations[linkedTable].columns;
            order = relations[linkedTable].order;
        }
        else {
            context.currentLinkedTable = {};
        }


        //   var selectfields = relations[linkedTable].selectfields;
        //    mainController.fillSelectOptions("linkedRecordsFieldSelect", selectfields, true);

        var joinObj = relations[linkedTable].joinObj;
        var sql = " select " + linkedTable + ".* from  " + joinObj.tables + " where " + joinObj.where + " and " + context.currentTable + ".id=" + context.currentRecord.id;
        if (joinObj.orderBy && joinObj.orderBy != "")
            sql += " order by " + joinObj.orderBy;
        mainController.execSql(sql, function (err, json) {
            if (err)
                mainController.setErrorMessage(err)

            if (onListLoadedFn) {
                onListLoadedFn(json);
            }

            if (json.length == 0) {
                $("#" + dataTableDivName).css("border-style", "none")
                $("#" + dataTableDivName).html(linkedTable + " 0 ");
                $("#" + dataTableDivName).height(20).css("padding", "10px");
                if (callback)
                    return callback(null, json);
            }

            var width = mainController.totalDims.w - $("#recordDetailsDiv").width() - 150
            var height = Math.min((json.length * 20) + 100, 300);


            $("#recordLinkedDivs").removeAttr("overflow")
            $("#" + dataTableDivName).width(width).height(height).css("padding", "20px");
            if (!context.dataTables["linked_" + linkedTable])
                context.dataTables["linked_" + linkedTable] = new dataTable();

            var columns = context.dataTables["linked_" + linkedTable].getColumns(json, linkedTable, null);

            var nonVisibleColumns = [];
            if (definedColumns) {
                columns.forEach(function (column, index) {
                    if (definedColumns.indexOf(column.data) < 0)
                        nonVisibleColumns.push(index);
                })
            }


            var htmlStr = "<div class='title'>" + linkedTable + "</div>"
            htmlStr += "<table  id='table_" + dataTableDivName + "'  class='dataTables_wrapper  display nowrap' ></table>"
            $('#' + dataTableDivName).css("font-size", "10px");
            $("#" + dataTableDivName).html(htmlStr);
            //    console.log(dataTableDivName);


            self.table = $("#table_" + dataTableDivName).DataTable({
                data: json,
                columns: columns,
                fixedHeader: true,
                pageLength: 500,
                order: order,
                //   "autoWidth": false,
                "dom": "",

                //  fixedColumns: true,

                select: true,
                columnDefs: [

                    {"visible": false, targets: nonVisibleColumns},

                    {'width': 200, 'targets': columns.textColumns},
                    {//dates
                        "render": function (data, type, row, meta) {
                            var str = "";
                            if (data != null && data != "" && data.indexOf("0000") < 0) {

                                var date = new Date(data);
                                str = util.dateToStringFR(date);
                            }
                            return str;
                        },
                        "targets": columns.dateColumns
                    },
                    {//number
                        "render": function (data, type, row, meta) {
                            var str = "";
                            if (data != null && config.locale == "FR") {
                                str = ("" + data).replace(".", ",")
                            }
                            return str;

                        },
                        "targets": columns.numberColumns
                    }

                ],

                drawCallback: function (settings, json) {
                    callback(json)
                }


            });


            $("#table_" + dataTableDivName).on('click', 'td', function (event) {
                this.selectedRow = listController.table.row(this);
                var dataTable = $("#table_" + dataTableDivName).DataTable();

                var rowIndex = dataTable.cell(this).index().row;
                var colIndex = dataTable.cell(this).index().column;
                var line = dataTable.row(rowIndex).data();

                if (editableColumns) {
                    var tableName = dataTableDivName.replace("linkedRecordsDiv_", "")
                    listController.editCellContent(tableName, editableColumns, dataTable, line, rowIndex, colIndex);
                }
                if (onRowClickedFn)

                    onRowClickedFn(dataTable, line, rowIndex, colIndex)

            })

        })
        //    $("#table_" + dataTableDivName).DataTable().columns.adjust().draw();
    }

    self.editCellContent = function (linkedTable, editableColumns, datatable, line, rowIndex, colIndex) {
        var colName = context.dataTables["linked_" + linkedTable].columns[colIndex].title;
        if (editableColumns[colName]) {


            var data = prompt(colName, line[colName]);

            if (data != null && data != line[colName] && confirm("modifier " + colName + " : " + colName)) {

                    line[colName] =  data.trim()


                data=recordController.escapeMySqlChars(data);
                var sql = "update  " + linkedTable + " set " + colName + "='" + data + "' where id=" + line.id;
                mainController.execSql(sql, function (err, result) {
                    if (err)
                        return console.log(err);
                    if (editableColumns[colName].callback) {
                        editableColumns[colName].callback(line,datatable,rowIndex,colIndex)
                    }


                    mainController.setRecordMessage(colName + "  sauvegarde");
                    datatable.cell(rowIndex, colIndex).data(data).draw();

                })
            }

        }

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
        if (context.currentLinkedTable == "magasin")
            sql += " and (cotesParTablette is null || cotesParTablette='') and (numVersement is null || numVersement='') "
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
})
()
