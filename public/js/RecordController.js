var recordController = (function () {
    self = {};
    self.currentRecordChanges = {}
    self.currentRecordId;



    var setModifyMode = function () {

    }
    self.showData = function (table, id) {
        var sql = "select * from " + table + " where id=" + id;
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
                //   dataTable.loadJson("dataTableDiv", json)
                self.setAttributesValue(label, targetObj, node);
                self.drawAttributes(targetObj, "nodeFormDiv");
                var xx = json
            }, error: function (err) {
                mainController.setErrorMessage(err.responseText)
            }


        })
    }


    self.saveRecord = function () {
        if (!self.currentRecordId)// new Record
            return self.saveNewRecord();
        var sql = "Update " + mainController.currentTable + " set ";
        var i = 0;
        for (var key in self.currentRecordChanges) {
            if (i++ > 0)
                sql += ","
            var type = mainController.getFieldType(mainController.currentTable, key)
            if (type == "number")
                sql += key + "=" + self.currentRecordChanges[key];
            else if (type == "string")
                sql += key + "='" + self.currentRecordChanges[key] + "'";
            else if (type == "date")
                sql += key + "='" + self.currentRecordChanges[key] + "'";
        }
        sql += " where id= " + self.currentRecordId;
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
                mainController.setMessage("enregistrement sauvé");
                dialog.dialog("close");
                mainController.dataTables[mainController.currentTable].updateSelectedRow(self.currentRecordChanges)

            }, error: function (err) {
                mainController.setErrorMessage(err.responseText)
            }


        })
    }

    self.saveNewRecord = function () {

        var sql1 = "insert into " + mainController.currentTable + " ( ";
        var sql2 = " values ( ";
        var i = 0;
        for (var key in self.currentRecordChanges) {
            if (i++ > 0) {
                sql1 += ","
                sql2 += ","
            }
            sql1 += key;
            var type = mainController.getFieldType(mainController.currentTable, key)
            if (type == "number")
                sql2 +=  self.currentRecordChanges[key];
            else if (type == "string")
                sql2 += "'" + self.currentRecordChanges[key] + "'";
            else if (type == "date")
                sql2 +="'" + self.currentRecordChanges[key] + "'";
        }
       var  sql = sql1+")" +sql2+")";
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
                mainController.setMessage("enregistrement enregistré");
                dialog.dialog("close");
                for (var key in self.currentRecordChanges) {
                    var cells = $('#dataTable').rows({selected: true});

                    var x = "";
                    // cell.data(cell.data() + 1).draw();
                }


            }, error: function (err) {
                mainController.setErrorMessage(err.responseText)
            }


        })


    }

    self.addLinkedRecord = function () {
        var ww=1
        var table=mainController.dataTables["newLink_" + mainController.currentLinkedTable].table;
        var idx = table.rows('.selected', 0).indexes();
        var x=idx.length;


     //  var selectedRowsIndexes=table.rows('.selected').indexes();
        for(var i=0;i<idx.length;i++){
            var data= table.rows(idx[i]).data()[0]
           var sql="";
           if(mainController.currentTable=="versement")
               sql="insert into r_versement_magasin (id_versement,id_magasin) values("+self.currentRecordId+","+data.id+")";
           else    if(mainController.currentTable=="magasin")
               sql="insert into r_versement_magasin (id_magasin,id_versement)values("+data.id+","+self.currentRecordId+")";
           else
               return mainController.setErrorMessage("no table selected");
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
                    mainController.setMessage("lien enregistré");

                    for (var key in self.currentRecordChanges) {
                        var cells = $('#dataTable').rows({selected: true});

                        var x = "";
                        // cell.data(cell.data() + 1).draw();
                    }


                }, error: function (err) {
                    mainController.setErrorMessage(err.responseText)
                }


            })
        }

    }
    self.deleteLinkedRecord = function () {


    }


    self.displayRecordData = function (obj) {
        self.currentRecordId = obj.id;
        var table = mainController.currentTable;


        var targetObj = {}
        mainController.dataModel[table].forEach(function (field) {
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
        self.setAttributesValue(table, targetObj, obj);
        self.drawAttributes(targetObj, "recordDetailsDiv");
        $("#recordDetailsDiv").prepend("<span class='title'>"+table+"</span>")
        $("#recordDetailsDiv").append("<button id='saveRecordButton' onclick='recordController.saveRecord()'>Sauvegarder</button>")

        $("#tabs").tabs("enable", 1);
        $("#tabs").tabs("enable", 2);
        $("#tabs").tabs("option", "active", 0);


        //renommage du tab 1 du dailogue (à évoluer si d'autre relationsSelect

        $('#tabs a[href=#tabs-linkedRecordDiv]').text(mainController.currentLinkedTable + "s")

        $("#dialog").dialog({title: table});

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
                targetObj[key].value = "&nbsp;:&nbsp;<b>" + value + "</b>";
                continue;
            }

            var selectValues = null;

            /*  var selectFields = Schema.schema.fieldsSelectValues[table];
              if (selectFields) {
                  selectValues = selectFields[key];
                  if (selectValues) {
                      if (selectValues.source) {
                          selectValues.source.field = key;
                          selectValues = [];//self.getDynamicSelectValues(selectValues.source);
                      } else {

                          selectValues.sort();
                      }
                  }

              }*/


            //if (type && type == 'select' && selectValues) {
            if (selectValues) {
                var str = "<select  onkeypress='recordController.incrementChanges(this,\"" + changeType + "\");' class='objAttrInput' id='attr_" + key + "'>"
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
                value = "<input type='password' onkeypress='recordController.incrementChanges(this,\"" + changeType + "\");' class='objAttrInput' " + strCols + "id='attr_"
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
                    value = "<textArea  onkeypress='recordController.incrementChanges(this,\"" + changeType + "\");' class='objAttrInput' " + strCols + rows
                        + "id='attr_" + key + "' > " + value + "</textarea>";
                } else {
                    if (cols)
                        strCols = " size='" + cols + "' ";
                    value = "<input onkeypress='recordController.incrementChanges(this,\"" + changeType + "\");' class='objAttrInput' " + strCols + "id='attr_"
                        + key + "' value='" + value + "'>";
                }
            }
            targetObj[key].value = value;
        }

    }


    self.incrementChanges = function (input) {


        var fieldName = $(input).attr('id').substring(5);
        var value = $(input).val();
        if(!self.currentRecordChanges[fieldName]) {
            self.isModifying += 1;
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

        for (var key in targetObj) {

            var strVal = targetObj[key].value;


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


                str += "<tr><td align='right'><span class=" + className + ">" + fieldTitle + "</span></td><td>" + desc + "</td><td align='left' ><span class='fieldvalue'>" + strVal + "</span></td></tr>";
            }
        }
        str += "</table>" + strHidden;
        $("#" + zoneId).css("visibility", "visible");
        $("#" + zoneId).html(str).promise().done(function(){
            var xx=$('#attr_dateArrivee');
            console.log ($('#attr_dateArrivee').val())
           $('#attr_dateArrivee').datepicker({
               dateFormat: "yy/mm/dd"
           });
        });



    }


    return self;

})()