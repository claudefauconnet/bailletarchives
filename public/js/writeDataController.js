var writeDataController = (function () {
    self = {};
var setModifyMode=function(){




}


    self.showData = function (table,id) {


        self.currentNodeChanges = []


        var sql = "select * from "+table+" where id="+id;

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
                self.setAttributesValue(label, attrObject, node);
                self.drawAttributes(attrObject, "nodeFormDiv");
                var xx = json
            }, error: function (err) {
                self.setErrorMessage(err.responseText)
            }


        })
    }
    self.setAttributesValue = function (label, attrObject, obj, changeType) {
        self.currentNodeChanges = []
        self.currentLabel = label;
        if (!changeType)
            changeType = "node";
        for (var key in attrObject) {
            var value = "";
            if (obj)
                var value = obj[key];
            if (!value)
                value = "";
            var type = attrObject[key].type;
            var _userRole = self.userRole;

            if (type && type == 'readOnly' || _userRole == "read") {
                value = util.convertHyperlinks(value);
                attrObject[key].value = "&nbsp;:&nbsp;<b>" + value + "</b>";
                continue;
            }

            var selectValues = null;

            var selectFields = Schema.schema.fieldsSelectValues[label];
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

            }


            //if (type && type == 'select' && selectValues) {
            if (selectValues) {
                var str = "<select  onblur='incrementChanges(this,\"" + changeType + "\");' class='objAttrInput' id='attr_" + key + "'>"
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
                value = "<input type='password' onblur='incrementChanges(this,\"" + changeType + "\");' class='objAttrInput' " + strCols + "id='attr_"
                    + key + "'value='" + value + "'>";
            }
            else if (!type || type == 'text') {
                var cols = attrObject[key].cols;
                var rows = attrObject[key].rows;
                var strCols = ""

                if (rows) {// textarea
                    if (cols)
                        strCols = " cols='" + cols + "' ";
                    rows = " rows='" + rows + "' ";
                    value = "<textArea  onblur='incrementChanges(this,\"" + changeType + "\");' class='objAttrInput' " + strCols + rows
                        + "id='attr_" + key + "' > " + value + "</textarea>";
                } else {
                    if (cols)
                        strCols = " size='" + cols + "' ";
                    value = "<input onblur='incrementChanges(this,\"" + changeType + "\");' class='objAttrInput' " + strCols + "id='attr_"
                        + key + "' value='" + value + "'>";
                }
            }
            attrObject[key].value = value;
        }

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

    self.drawAttributes = function (attrObject, zoneId) {
        var str = "<table>";
        var strHidden = "";

        for (var key in attrObject) {

            var strVal = attrObject[key].value;


            var fieldTitle = attrObject[key].title;

            var desc = attrObject[key].desc;
            if (desc) {
                desc = "<img src='/toutlesens/icons/questionMark.png' width=" + self.iconSize + " title='" + desc + "'>";
            }
            else
                desc = "";

            if (attrObject[key].type == 'hidden') {
                strHidden += "<input type='hidden' id='attr_" + key + "' value='" + strVal + ">"
            } else {
                className = 'mandatoryFieldLabel';
                if (!fieldTitle)
                    fieldTitle = key;
                var className = 'fieldLabel';


                if (attrObject[key].control == 'mandatory')
                    className = 'mandatoryFieldLabel';


                str += "<tr><td align='right'><span class=" + className + ">" + fieldTitle + "</span></td><td>" + desc + "</td><td align='left' ><span class='fieldvalue'>" + strVal + "</span></td></tr>";
            }
        }
        str += "</table>" + strHidden;
        $("#" + zoneId).css("visibility", "visible");
        $("#" + zoneId).html(str);

    }







    return self;

})()