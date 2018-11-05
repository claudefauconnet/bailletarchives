var recordController = (function () {
    self = {};
    self.currentRecordChanges = {}


    var setModifyMode = function () {

    }
    self.displayRecordData = function (obj) {
        context.currentRecordId = obj.id;
        var table = context.currentTable;


        var targetObj = {}
        context.dataModel[table].forEach(function (field) {
            targetObj[field.name] = {
                type: mainController.getFieldType(table, field.name)
            }

            if (targetObj.type == "number")
                targetObj[field.name].cols = 10;
            if ((field.maxLength && field.maxLength > 50) || field.dataType == "text") {
                targetObj[field.name].cols = 60;
                targetObj[field.name].rows = 2;
            }
            else if (field.maxLength && field.maxLength <= 50)
                targetObj[field.name].cols = field.maxLength;


            if (field.name == "id") {
                targetObj[field.name].type = "readOnly"
            }
        })
        recordController.setAttributesValue(table, targetObj, obj);
        recordController.drawAttributes(targetObj, "recordDetailsDiv");

        if (obj && obj.id)
            $("#recordDetailsDiv").prepend("<button id='deleteRecordButton'  onclick='recordController.deleteRecord()'>Supprimer</button>&nbsp;&nbsp;")

        $("#recordDetailsDiv").prepend("<button id='saveRecordButton'  onclick='recordController.saveRecord()'>Enregistrer</button>&nbsp;&nbsp;<span id='recordMessageSpan'></span>")

        $("#recordDetailsDiv").prepend("<span class='title'>" + table + "</span>&nbsp;&nbsp;");

        $("#saveRecordButton").attr("disabled", true);
        $(dialog.dialog("open"))


        mainController.setTabs();

        $("#dialog").dialog({title: table});

    }


    self.saveRecord = function () {
        if (!context.currentRecordId)// new Record
            return self.saveNewRecord();
        var sql = "Update " + context.currentTable + " set ";
        var i = 0;
        for (var key in self.currentRecordChanges) {
            if (i++ > 0)
                sql += ","
            var type = mainController.getFieldType(context.currentTable, key)
            if (type == "number")
                sql += key + "=" + self.currentRecordChanges[key];
            else if (type == "string")
                sql += key + "='" + self.currentRecordChanges[key] + "'";
            else if (type == "date") {
                var str = self.currentRecordChanges[key].replace(/\//g, "-");// date mysql  2018-09-21
                sql += key + "='" + str + "'";
            }
        }
        sql += " where id= " + context.currentRecordId;
        console.log(sql);

        mainController.execSql(sql, function (err, json) {
            if (err)
                mainController.setErrorMessage(err)

            mainController.setMessage("enregistrement sauvé");
            dialog.dialog("close");

            ///*******************************A finir*******************************************************************************
            context.dataTables[context.currentTable].updateSelectedRow(self.currentRecordChanges)
            return;
            // delete linked records
            mainController.execSql(sql, function (err, json) {
                if (err)
                    mainController.setErrorMessage(err)
                    ;
            })

        })


    }

    self.saveNewRecord = function () {

        var sql1 = "insert into " + context.currentTable + " ( ";
        var sql2 = " values ( ";
        var i = 0;
        for (var key in self.currentRecordChanges) {
            if (i++ > 0) {
                sql1 += ","
                sql2 += ","
            }
            sql1 += key;
            var type = mainController.getFieldType(context.currentTable, key)
            if (type == "number")
                sql2 += self.currentRecordChanges[key];
            else if (type == "string")
                sql2 += "'" + self.currentRecordChanges[key] + "'";
            else if (type == "date") {
                var str = self.currentRecordChanges[key].replace(/\//g, "-");// date mysql  2018-09-21
                sql2 += "'" + str + "'";
            }

        }
        var sql = sql1 + ")" + sql2 + ")";
        console.log(sql);

        mainController.execSql(sql, function (err, json) {
            if (err)
                mainController.setErrorMessage(err);
            mainController.setMessage("enregistrement enregistré");

            var sql = "SELECT max(id) as id from " + context.currentTable;
            mainController.execSql(sql, function (err, json) {
                if (err)
                    mainController.setErrorMessage(err)
                context.currentRecordId = json[0].id;
                mainController.setTabs();

            })
        })


    }

    self.deleteRecord = function () {
        listController.loadLinkedRecords();
        var linkedtable = context.dataTables["linked_" + context.currentLinkedTable];
        var linkedRecordsData = linkedtable.dataSet;
        var nlinks = linkedtable.dataSet.length;
        var ok = ""
        if (nlinks > 0)
            ok = confirm("supprimer l'enregsitrement les " + nlinks + " liens associés ?");
        else
            ok = confirm("supprimer l'enregsitrement ?");

        if (!ok)
            return;


        var sql = "delete from " + context.currentTable + " where id=" + context.currentRecordId;
        mainController.execSql(sql, function (err, json) {
            if (err)
                mainController.setErrorMessage(err)
                mainController.setMessage("enregistrement supprimé");
                dialog.dialog("close");
                listRecords.listRecords();
                linkedRecordsData.forEach(function (linkedRecord) {
                    var sql = "delete from r_versement_magasin where id_" + context.currentLinkedTable + "=" + linkedRecord.id;
                    mainController.execSql(sql, function (err, json) {
                        if (err)
                            mainController.setErrorMessage(err)
                    })
                })

        })


    }


    self.setAttributesValue = function (table, targetObj, sourceObj, changeType) {
        self.currentRecordChanges = []
        var selectFields = config.tableDefs[context.currentTable].fieldConstraints;
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
                targetObj[key].value = "&nbsp;:&nbsp;<b>" + value + "</b>";
                continue;
            }

            var selectValues = null;


            if (selectFields) {
                selectValues = selectFields[key];
                if (selectValues) {
                    selectValues = selectValues.values.sort();

                }

            }


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
            }

            else if (type == 'password') {
                value = "<input type='password' onkeyup='recordController.incrementChanges(this,\"" + changeType + "\");' class='objAttrInput' " + strCols + "id='attr_"
                    + key + "'value='" + value + "'>";
            }
            /*    else if(type=='date'){


                        value = "<input onkeypress='recordController.incrementChanges(this,\"" + changeType + "\");' class='objAttrInput datePicker' " + strCols + "id='attr_"
                            + key + "' value='" + value + "'>";

                }*/
            else if (!type || type == 'string' || type == 'number' || type == 'date') {
                var cols = targetObj[key].cols;
                var rows = targetObj[key].rows;
                var strCols = ""

                if (rows) {// textarea
                    if (cols)
                        strCols = " cols='" + cols + "' ";
                    rows = " rows='" + rows + "' ";
                    value = "<textArea  onkeyup='recordController.incrementChanges(this,\"" + changeType + "\");' class='objAttrInput' " + type + "' " + strCols + rows
                        + "id='attr_" + key + "' > " + value + "</textarea>";
                } else {
                    if (cols)
                        strCols = " size='" + cols + "' ";
                    value = "<input onkeyup='recordController.incrementChanges(this,\"" + changeType + "\");' class='objAttrInput " + type + "' " + strCols + "id='attr_"
                        + key + "' value='" + value + "'>";
                }
            }
            targetObj[key].value = value;
        }

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
            // if (!value.match(/-?\d*[\.|,]?\d*/))
            var xx = value.match(/[a-zA-Z]+/)
            if (value.match(/[a-zA-Z]+/).length > 0)
                message = fieldName + " nombre invalide " + value;
            value = value.replace(",", ".")


        }
        if (message) {
            $("#recordMessageSpan").html(message);
            $("#saveRecordButton").attr("disabled", true);
        }
        else {
            $("#saveRecordButton").removeAttr("disabled");
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

        var fieldTools=config.tableDefs[context.currentTable].fieldTools;
        if(!fieldTools)
            fieldTools={};

        for (var key in targetObj) {
var fieldToolStr=""
            if(fieldTools[key]){
                fieldToolStr="&nbsp;&nbsp;<Button onclick='tools."+fieldTools[key].toolFn+"("+context.currentRecordId+")'>"+fieldTools[key].title+"</Button>"
            }


            var strVal = targetObj[key].value;
            if (targetObj[key].type == "date")
                dateFieldIds.push("attr_" + key);


            var fieldTitle = targetObj[key].title;

            var desc = targetObj[key].desc;
            if (desc) {
                desc = "<img src='/toutlesens/icons/questionMark.png' width=" + self.iconSize + " title='" + desc + "'>";
            }
            else
                desc = "";

            if (targetObj[key].type == 'hidden') {
                strHidden += "<input type='hidden' id='attr_" + key + "' value='" + strVal + ">"
            } else {
                className = 'mandatoryFieldLabel';
                if (!fieldTitle)
                    fieldTitle = key;
                var className = 'fieldLabel';


                if (targetObj[key].control == 'mandatory')
                    className = 'mandatoryFieldLabel';


                str += "<tr><td align='right'><span class=" + className + ">" + fieldTitle + "</span></td><td>" + desc + "</td><td align='left' ><span class='fieldvalue'>" + strVal +fieldToolStr+ "</span></td></tr>";
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

})()