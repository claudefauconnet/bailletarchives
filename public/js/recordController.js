var recordController = (function () {
    self = {};
    self.currentRecordChanges = {}
    self.canSave = 0;


    var setModifyMode = function () {

    }

    self.displayDataReadOnly = function (obj) {
        self.displayRecordData(obj, "readOnly")
    }


    self.closeRecordDialog = function () {
        $("#dialogD3").dialog("close")
        if (Object.keys(self.currentRecordChanges).length > 0) {
            $("#dialog-confirm").html("Des données ont été modifiées");

            $("#dialog-confirm").dialog("option", "buttons", [
                {
                    text: "Quitter sans enregistrer",
                    click: function () {
                        self.currentRecordChanges = {};
                        $("#dialog-confirm").dialog("close");
                        $("#dialogDiv").dialog("close");

                    }
                }, {
                    text: "Enregister avant de fermer",
                    click: function () {
                        $("#dialog-confirm").dialog("close");

                        recordController.saveRecord(function (err) {
                            if (err) {
                                return;
                            }
                            $("#dialogDiv").dialog("close");
                        })

                    },

                }
            ])
            $("#dialog-confirm").dialog("open");

        } else {
            $("#dialogDiv").dialog("close");
        }
    }

    self.displayRecordData = function (obj, mode) {

        context.currentRecord = obj;
        var table = context.currentTable;
        self.canSave = 0;


        var targetObj = {};
        var tableConfig = config.tableDefs[table];
        context.dataModel[table].forEach(function (field) {
            targetObj[field.name] = {
                type: mainController.getFieldType(table, field.name)
            }

            if (tableConfig.fieldLabels && tableConfig.fieldLabels[config.locale])
                targetObj[field.name].label = tableConfig.fieldLabels[config.locale][field.name]

            if (targetObj.type == "number")
                targetObj[field.name].cols = config.default.textArea.rows;//10;
            if ((field.maxLength && field.maxLength > 100) || field.dataType == "text") {
                targetObj[field.name].cols = config.default.textArea.cols;
                targetObj[field.name].rows = config.default.textArea.rows
            } else if (field.maxLength && field.maxLength <= 50)
                targetObj[field.name].cols = config.default.textArea.rows;// field.maxLength;

            if (mode == "readOnly")
                targetObj[field.name].type = "readOnly"
            if (field.name == "id") {
                targetObj[field.name].type = "readOnly"
            }
            var constaints = null;
            if (config.tableDefs[context.currentTable] && config.tableDefs[context.currentTable].fieldConstraints != null && config.tableDefs[context.currentTable].fieldConstraints[field.name]) {
                if (config.tableDefs[context.currentTable].fieldConstraints[field.name].readOnly)
                    targetObj[field.name].type = "readOnly"
                if (config.tableDefs[context.currentTable].fieldConstraints[field.name].hidden)
                    targetObj[field.name].type = "hidden"
            }
        })
        recordController.setAttributesValue(table, targetObj, obj);


        $("#dialogDiv").dialog({title: table});

        //$("#dialogDiv").load("./htmlSnippets/versement.html", function () {

        $("#dialogDiv").html("<div id=\"recordDiv\">\n" +
            "    <div id=\"recordDetailsDiv\" class=\"recordDetailsDiv\"></div>\n" +
            "    <div id=\"recordLinkedDivs\"></div>\n" +
            "</div>");

        {// record tools buttons
            var recordToolsHtml = "";
            var recordTools = config.tableDefs[context.currentTable].recordTools;

            if (recordTools) {
                recordTools.forEach(function (recordTool,index) {
                    var id = recordTool.id;
                    if (!id)
                        id = "" + Math.random();
                    recordToolsHtml += "&nbsp;&nbsp;<Button id='" + id + "' onclick='" + recordTool.toolFn + "()'>" + recordTool.title + "</Button>"
                    if(index==1)
                        recordToolsHtml +="<br>"
                })
            }
        }


        recordController.drawAttributes(targetObj, "recordDetailsDiv");
        if (mode != "readOnly") {
            var toolsHtml=""



            toolsHtml+=("<button id='saveRecordButton'  onclick='recordController.saveRecord()'" +
                ">Enregister</button>&nbsp;&nbsp;" +
                "<button id='closeDialogButton'  onclick='recordController.closeRecordDialog()'>Fermer</button>" +
                "<span id='recordMessageSpan'></span>")


            if (obj && obj.id && (!config.tableDefs[context.currentTable].tableConstraints || config.tableDefs[context.currentTable].tableConstraints.cannotDelete !== true)) {
                if( authentication.currentUser.groupes && authentication.currentUser.groupes.indexOf("admin")>-1)
                    toolsHtml+=("<button id='deleteRecordButton'  onclick='recordController.deleteRecord()'>Supprimer</button>")
            }

            if (recordToolsHtml != "")
                toolsHtml+=recordToolsHtml;

            $("#recordDetailsDiv").prepend(toolsHtml);
            $("#recordDetailsDiv").prepend("<div id='recordMessageDiv' class='message'></div>")
        }
        $("#recordDetailsDiv").prepend("<span class='title'>" + table + "</span>&nbsp;&nbsp;");


        if (obj && obj.id)
            listController.loadLinkedDivs()

        $(".objAttrInput").width(config.default.fieldInputWith)
        $(".objAttrInput.TA").width(config.default.fieldInputWith + 10)
        $("#saveRecordButton").attr("disabled", true);
        $("#dialogDiv").dialog("open");


        var afterDisplayFn = config.tableDefs[context.currentTable].onAfterDisplay
        if (afterDisplayFn)
            afterDisplayFn(obj);


        //   mainController.setTabs();


    }


    self.escapeMySqlChars = function (str) {

        if (typeof str != 'string')
            return str;

        str = str.replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, function (char) {
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

        str = str.replace(/[«»<=>]/g, function (char) {
            return "\\" + char;
        })

        return str;

    }


    self.saveRecord = function (callback) {
        $("#dialogD3").dialog("close")
        var isNewRecord = !context.currentRecord.id;
        async.series([


                function (callbackSeries) {// check constraints

                    self.checkConstraints(isNewRecord, function (err, errors) {
                        if (err)
                            return callbackSeries(err);

                        if (errors.length > 0) {
                            var message = "";
                            errors.forEach(function (err) {
                                message += err + "<br>"
                            })
                            mainController.setRecordErrorMessage(message);
                            return callbackSeries("stop");
                        } else {
                            $("#recordMessageDiv").html("")
                            return callbackSeries();
                        }

                    })
                },

                function (callbackSeries) {//on before save event
                    var fn = config.tableDefs[context.currentTable].onBeforeSave
                    if (fn) {
                        var options = {
                            currentRecord: context.currentRecord,
                            changes: self.currentRecordChanges

                        }

                        fn(options, function (err, result) {
                            if (err) {
                                return callbackSeries(err);
                            }
                            return callbackSeries();
                        })

                    } else {
                        return callbackSeries();
                    }
                },





                function (callbackSeries) { //save record
                    if (Object.keys(self.currentRecordChanges).length == 0)
                        return callbackSeries("stop");
                    if (isNewRecord) {// new Record

                        self.execSqlCreateRecord(context.currentTable, self.currentRecordChanges, function (err, newId) {
                            if (err) {
                                return callbackSeries(err);
                            }
                            context.currentRecord=self.currentRecordChanges
                            context.currentRecord.id=newId;
                            $("#attr_id").html(newId);
                            return callbackSeries();


                        })
                    } else { //existing record

                        self.execSqlUpdateRecord(context.currentTable, self.currentRecordChanges, function (err, newId) {
                            if (err) {
                                return callbackSeries(err);
                            }
                            //update list datatable
                            if (context.dataTables[context.currentTable])
                                context.dataTables[context.currentTable].updateSelectedRow(self.currentRecordChanges)


                            return callbackSeries();


                        })


                    }
                },


                function (callbackSeries) { //on aftersaveEvent


                    var fn = config.tableDefs[context.currentTable].onAfterSave
                    if (fn) {
                        var options = {
                            currentRecord: context.currentRecord,
                            changes: self.currentRecordChanges

                        }

                        fn(options, function (err, result) {
                            if (err)
                                return callbackSeries(err);
                            callbackSeries();

                        })
                    } else {
                        callbackSeries();
                    }
                },


            ],

            // at the end
            function (err) {

                if (err) {
                    if (err != "stop") {
                        mainController.setRecordErrorMessage(err);

                        if (callback)
                            return callback(err);
                    }

                } else {
                    mainController.setRecordMessage("enregistrement sauvé");
                    self.currentRecordChanges = {};
                    if (callback)
                        return callback();
                    if (!isNewRecord)
                        ;// dialog.dialog("close");
                }
            }
        )
    }


    self.execSqlUpdateRecord = function (table, record, callback) {
        var sql = "Update " + table + " set ";
        var i = 0;
        for (var key in record) {


            if (i++ > 0)
                sql += ","
            var type = mainController.getFieldType(table, key)
            if (type == "number") {
                if (record[key] == "")
                    sql += key + "= null"
                else
                    sql += key + "=" + (""+record[key]).replace(",", ".");

            } else if (type == "string") {
                var str = self.escapeMySqlChars(record[key]);
                sql += key + "='" + str + "'";
            } else if (type == "date") {
                var str = (""+record[key]).replace(/\//g, "-");// date mysql  2018-09-21
                sql += key + "='" + str + "'";
            }
        }
        sql += " where id= " + context.currentRecord.id;
        //    console.log(sql);


        mainController.execSql(sql, function (err, json) {
            if (err)
                return callback(err);


            callback(null, json);
        })

    };


    self.execSqlCreateRecord = function (table, record, callback) {
        var sql1 = "insert into " + table + " ( ";
        var sql2 = " values ( ";
        var i = 0;
        for (var key in record) {
            if (i++ > 0) {
                sql1 += ","
                sql2 += ","
            }
            sql1 += key;
            if (!record[key])
                sql2 += "null";
            else {
                var type = mainController.getFieldType(table, key)
                if (type == "number")
                    sql2 += ("" + record[key]).replace(",", ".");
                else if (type == "string") {
                    var str = self.escapeMySqlChars(record[key]);
                    sql2 += "'" + str + "'";
                } else if (type == "date") {
                    var str = ("" + record[key]).replace(/\//g, "-");// date mysql  2018-09-21
                    sql2 += "'" + str + "'";
                }
            }

        }
        var sql = sql1 + ")" + sql2 + ")";
        console.log(sql);

        mainController.execSql(sql, function (err, json) {
            if (err)
                return callback(err);
            var newId = json.insertId;
            return callback(null, newId);

        })

    }


    self.deleteRecord = function () {
        $("#dialogD3").dialog("close")
        var ok = true;
        var linkedTables = [];
        if (config.tableDefs[context.currentTable].relations)
            relations = Object.keys(config.tableDefs[context.currentTable].relations);

        /* var canBeDeleted = 0;
         /* relations.forEach(function (relation) {

                 var dataTableDivName = "linkedRecordsDiv_" + relation;

                 if ($("#" + dataTableDivName).html().indexOf("dataTables_wrapper") > -1) {// si des lignes de datatable
                     canBeDeleted += 1;


                 }
             })*/
        /* if (canBeDeleted > 0)
             return alert("vous devez au préalable supprimer les  liens");


         if (!canBeDeleted)
             return;*/

        function deleteInner(){
            var canBeDeleted = confirm("supprimer cet enregistrement de la table " + context.currentTable + " ?");
            if (canBeDeleted) {
                self.execSQLDeleteRecord(context.currentTable, context.currentRecord.id, function (err, result) {
                    if (err) {
                        return mainController.setRecordErrorMessage(err)
                    }
                    mainController.setRecordMessage(result);
                    dialog.dialog("close");
                    listController.listRecords(context.currentListQueries[context.currentTable]);
                    if (config.tableDefs[context.currentTable].onAfterDelete) {
                        config.tableDefs[context.currentTable].onAfterDelete(context.currentRecord, function (err, result) {

                        });
                    }


                })
            }
        }



        if (config.tableDefs[context.currentTable].onBeforeDelete) {
            config.tableDefs[context.currentTable].onBeforeDelete(context.currentRecord, function (err, result) {
                if(err)
                    return mainController.setRecordErrorMessage(err);

                deleteInner();


            });
        }else{
            deleteInner();
        }


    }


    self.execSQLDeleteRecord = function (table, recordId, callback) {
        var sql = "delete from " + table + " where id=" + recordId;
        mainController.execSql(sql, function (err, json) {
            if (err)
                return callback(err)
            return callback(null, "enregistrement supprimé");


        })

    }


    self.setAttributesValue = function (table, targetObj, sourceObj, changeType) {
        self.currentRecordChanges = []

        if (!changeType)
            changeType = "table";
        for (var key in targetObj) {

            var value = "";
            if (sourceObj)
                var value = sourceObj[key];
            if (!value)
                value = "";
            var type = targetObj[key].type;
            var _userRole = self.userRole;

            if (type && type == 'readOnly' || _userRole == "read") {
                //   value = util.convertHyperlinks(value);
                targetObj[key].value = "&nbsp;:&nbsp;<b><span id='attr_"+key+"'>" + value + "</span></b>";
                continue;
            }

            var selectValues = null;


            var selectValues = config.lists[table + "." + key];


            //if (type && type == 'select' && selectValues) {
            if (selectValues) {
                var str = "<select  onchange='recordController.incrementChanges(this,\"" + changeType + "\");' class='objAttrInput' id='attr_" + key + "'>"
                str += "<option  value=''></option>";
                for (var i = 0; i < selectValues.length; i++) {

                    var val = selectValues[i];
                    var strId;
                    var strText;
                    if (val.id) {//dynamic select
                        strText = val.name;
                        strId = val.id;
                    } else {//simple value and text
                        strText = val;
                        strId = val;
                    }

                    var selected = "";
                    if (value == selectValues[i])
                        selected = " selected ";

                    str += "<option value='" + strId + "' " + selected
                        + " >" + strText + "</option>";
                }

                str += "</select>";
                value = str;
            } else if (type == 'hidden') {
                value = "<input type='hidden'  id='attr_" + key + "'value='" + value + "'>";
            } else if (type == 'password') {
                value = "<input type='password' onkeyup='recordController.incrementChanges(this,\"" + changeType + "\");' class='objAttrInput' " + strCols + "id='attr_"
                    + key + "'value='" + value + "'>";
            }
            /*    else if(type=='date'){


                        value = "<input onkeypress='recordController.incrementChanges(this,\"" + changeType + "\");' class='objAttrInput datePicker' " + strCols + "id='attr_"
                            + key + "' value='" + value + "'>";

                }*/
            else if (!type || type == 'string' || type == 'number' || type == 'date') {

                if (type == 'date') {
                    var date = new Date(value);
                    value = util.dateToStringFR(date);

                } else if (type == 'number') {


                    if (value) {
                        var decimalSeparator = ".";
                        if (config.locale == "FR")
                            decimalSeparator = ","

                        value = ("" + value).replace(".", decimalSeparator);


                        // Ajout des zeros des décimales
                        var fieldInfos = mainController.getFieldDataModelInfos(context.currentTable, key);


                        if (fieldInfos && fieldInfos.numericScale && fieldInfos.numericScale > 0) {
                            var valueStr = "" + value;
                            var p = valueStr.indexOf(decimalSeparator);
                            if(p>-1){
                                var xx = valueStr.length - p - 1;
                                while ((valueStr.length - p - 1) < fieldInfos.numericScale) {
                                    valueStr += "0";
                                }
                                value = valueStr;
                            }
                            value = valueStr;
                        }

                    } else
                        value = "";

                } else if (type == 'string') {
                    value = ("" + value).replace(/\\/g, "");
                }

                var cols = targetObj[key].cols;
                var rows = targetObj[key].rows;
                var strCols = ""

                if (rows) {// textarea
                    if (false && cols)
                        strCols = " cols='" + cols + "' ";
                    rows = " rows='" + rows + "' ";
                    value = "<textArea  onkeyup='recordController.incrementChanges(this,\"" + changeType + "\");' class='objAttrInput TA' " + type + "' " + strCols + rows
                        + "id='attr_" + key + "' > " + value + "</textarea>";
                } else {
                    if (false && cols)
                        strCols = " size='" + cols + "' ";
                    value = "<input onkeyup='recordController.incrementChanges(this,\"" + changeType + "\");' class='objAttrInput " + type + "' " + strCols + "id='attr_"
                        + key + "' value='" + value + "'>";
                }
            }
            targetObj[key].value = value;
        }

    }

    self.checkConstraints = function (isNewRecord, callbackOuter) {
        var constraintErrors = [];
        var constraintsArray = [];
        if (!config.tableDefs[context.currentTable].fieldConstraints)
            return callbackOuter(null, constraintErrors)
        $(".objAttrInput").each(function () {
            var value = $(this).val();
            var fieldName = $(this).attr("id").substring(5);

            var constraints = config.tableDefs[context.currentTable].fieldConstraints[fieldName];
            if (constraints) {

                constraintsArray.push({fieldName: fieldName, value: value, constraints: constraints})
            }

        })

        async.eachSeries(constraintsArray, function (field, callback) {// !! unique is async

                var fieldConstraints = [];
                for (var key in field.constraints) {
                    fieldConstraints.push(key);
                }

                async.eachSeries(fieldConstraints, function (key, callback2) {// !! unique is async
                    if (key == "mandatory") {
                        if (field.value == null || field.value == "")
                            constraintErrors.push(field.fieldName + " est obligatoire");
                        return callback2();

                    }
                    if (key == "mandatoryOnNew" && isNewRecord) {
                        if (!context.currentRecord.id && (field.value == null || field.value == ""))
                            constraintErrors.push(field.fieldName + " est obligatoire");
                        return callback2();

                    } else if (key == "unique") { // async
                        // si la valeur a été modifiée
                        if (self.currentRecordChanges[field.fieldName] && self.currentRecordChanges[field.fieldName] != context.currentRecord[field.fieldName]) {
                            self.isUnique(context.currentTable, field.fieldName, field.value, function (err, result) {
                                if (err)
                                    return callbackOuter(err)
                                if (result != true)
                                    constraintErrors.push("la valeur de " + field.fieldName + " doit être unique (" + field.value + ")")
                                return callback2();
                            })
                        } else
                            return callback2()
                    } else if (key == "format") {
                        if (field.constraints[key].regex) {
                            if (field.value == null || !field.value.match(field.constraints[key].regex))
                                constraintErrors.push(field.fieldName + " doit avoir le format " + field.constraints[key].message);
                            return callback2();
                        }

                    } else
                        return callback2();
                }, function (err) {//callback2
                    if (err) {
                        return callback(err)
                    }
                    return callback();

                })


            },

            function (err) {
                if (err) {
                    return callbackOuter(err)
                }
                return callbackOuter(null, constraintErrors);

            }
        )


    }
    self.isUnique = function (table, column, value, callback) {


        var type = mainController.getFieldType(table, column);
        if (type == "number")
            value = value;
        else if (type == "string")
            value = "'" + value + "'";
        else
            value = "'" + value + "'";
        var sql = "select " + column + " from " + table + " where " + column + "=" + value;
        mainController.execSql(sql, function (err, result) {
            if (err)
                return clabback(err);
            if (result.length == 0)
                return callback(null, true);
            return callback(null, false);
        })

    }


    self.incrementChanges = function (input) {
        $("#recordMessageSpan").html("");

        var message = null;

        var fieldName = $(input).attr('id').substring(5);
        var value = $(input).val();


        if (!self.currentRecordChanges[fieldName]) {
            self.isModifying += 1;
        }
        var classe = $(input).attr("class");
        if (classe.indexOf("number") > -1) {
            if (!value.match(/^[0-9,.-]*$/)) {
                //  var matchAlpha = value.match(/[a-zA-Z]+/)
                //   if (value.match(/[a-zA-Z]+/).length > 0)
                message = fieldName + " nombre invalide " + value;
                value = value.replace(",", ".")
            }


        }
        if (message) {
            var position = $(input).position()
            $("#recordMessageSpan").css("position", "absolute")
            $("#recordMessageSpan").css("left", position.left + 300)
            $("#recordMessageSpan").css("top", position.top)
            $("#recordMessageSpan").html(message);
            $("#saveRecordButton").attr("disabled", true);

            $(".objAttrInput").attr("disabled", true);
            $(input).removeAttr("disabled");
            $(input).focus();

            //  self.canSave += 1;
        } else {

            self.canSave -= 1;
            self.canSave = Math.max(self.canSave, 0);
            if (true || self.canSave == 0) {
                $("#saveRecordButton").removeAttr("disabled");
                $(".objAttrInput").removeAttr("disabled");
            }
            self.currentRecordChanges[fieldName] = value;
        }

    }


    self.setModifiedValues = function (obj, classId) {
        var fields = $(classId);
        if (!obj)
            obj = {}
        for (var i = 0; i < fields.length; i++) {

            var fieldId = $(fields[i]).attr('id').substring(5);
            var fieldValue = $(fields[i]).val();
            if (!fieldValue || fieldValue.length == 0)
                continue;
            if (fieldValue == " ")
                continue;

            obj[fieldId] = fieldValue;

        }
        return obj;

    }

    self.getDynamicSelectValues = function (source) {
        var dynamicSelectValuesField = {};
        self.allDynamicSelectValues[source.field] = dynamicSelectValuesField;
        var sourceSelectValues = [];
        var sourceSelectIds = [];
        var query = {};
        if (source.query) {

            for (var key in source.query) {
                if (source.query[key].indexOf("$") == 0)
                    query [key] = eval(source.query[key].substring(1));
                else
                    query [key] = source.query[key];

            }

        }
        /*  if (source.distinct) {
         var options = devisuProxy.getDistinct(dbName, source.collection, query, source.distinct);
         return options;
         }
         else {*/
        var options = devisuProxy.loadData(dbName, source.collection, query);
        var field = "name";
        if (source.distinct)
            field = source.distinct;
        for (var i = 0; i < options.length; i++) {
            dynamicSelectValuesField[options[i][field]] = options[i].id;
            var name = options[i][field];
            var id = options[i].id;

            if (sourceSelectIds.indexOf(name) < 0) {
                sourceSelectIds.push(id);
                sourceSelectValues.push(name);
                // sourceSelectValues.push({id: id, name: name});
            }
        }
        return util.sortByField(sourceSelectValues, "name");
        // }
    }

    self.drawAttributes = function (targetObj, zoneId) {
        var str = "<table>";
        var strHidden = "";
        var dateFieldIds = [];

        var fieldTools = config.tableDefs[context.currentTable].fieldTools;
        if (!fieldTools)
            fieldTools = {};

        for (var key in targetObj) {
            var fieldToolStr = ""
            if (fieldTools[key]) {
                if (!Array.isArray(fieldTools[key]))
                    fieldTools[key] = [fieldTools[key]];
                fieldTools[key].forEach(function (tool) {

                    fieldToolStr = "&nbsp;&nbsp;<Button onclick='" + tool.toolFn + "(" + context.currentRecord.id + ")'>" + tool.title + "</Button>"
                })
            }


            var strVal = targetObj[key].value;

            if (targetObj[key].type == "date") {
                dateFieldIds.push("attr_" + key);

            }


            //var fieldTitle = targetObj[key].title;
            var fieldLabel = targetObj[key].label;
            if (!fieldLabel)
                fieldLabel = key;


            var constraintsClassStr = "";
            if (config.tableDefs[context.currentTable].fieldConstraints) {
                var constraints = config.tableDefs[context.currentTable].fieldConstraints[key];
                if (constraints) {
                    if (constraints.mandatory)
                        constraintsClassStr = "class='field-mandatory'"
                    if (constraints.mandatoryOnNew)
                        constraintsClassStr = "class='field-mandatoryOnNew'"

                }
            }


            var desc = targetObj[key].desc;
            if (desc) {
                desc = "<img src='/toutlesens/icons/questionMark.png' width=" + self.iconSize + " title='" + desc + "'>";
            } else
                desc = "";

            if (targetObj[key].type == 'hidden') {
                strHidden += "<input type='hidden' id='attr_" + key + "' value='" + strVal + ">"
            } else {
                className = 'mandatoryFieldLabel';
                /*  if (!fieldTitle)
                      fieldTitle = key;*/

                var className = 'fieldLabel';


                str += "<tr " + constraintsClassStr + "><td align='right'><span class=" + className + ">" + fieldLabel + "</span></td><td>" + desc + "</td><td align='left' ><span class='fieldvalue'>" + strVal + fieldToolStr + "</span></td></tr>";
            }
        }
        str += "</table>" + strHidden;
        $("#" + zoneId).css("visibility", "visible");
        $("#" + zoneId).html(str).promise().done(function () {
            setDatePickerOnFields(dateFieldIds);

        });


    }

    function setDatePickerOnFields(dateFieldIds) {
        dateFieldIds.forEach(function (dateField) {

            var field = $('#' + dateField);

            field.datepicker({
                dateFormat: "yy/mm/dd",
                onSelect: function (d, i) {
                    if (d !== i.lastVal) {
                        $(this).change();
                    }
                }
            }).change(function (event) {
                recordController.incrementChanges(this, "table");
            });

        })
    }


    return self;

})
()
