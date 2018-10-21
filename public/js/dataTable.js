var dataTable = function () {


    this.dataSet = [];
    this.columns = [];


    this.loadJson = function (containerDiv, json, options) {
        if (!options)
            options = {};

        height = 500;
        this.dataSet = [];
        this.columns = [];


        this.dataSet = json
        ;
        var keys = []
        json.forEach(function (line) {
            for (var key in line) {
                if (keys.indexOf(key) < 0)
                    keys.push(key);
            }
        })
        var columns = []
        keys.forEach(function (key) {
            columns.push({data: key, title: key})
        })


        var htmlStr = "<br><br><br></div><table style=' z-index:100 ' id='table_" + containerDiv + "'  class='myDatatable cell-border display nowrap'></table>"

        var xxx = $("#" + containerDiv).html();
        $("#" + containerDiv).html(htmlStr);
        $('#' + containerDiv).css("font-size", "10px");


        var height = $("#table_" + containerDiv).height() - 200
        $("#table_" + containerDiv).width("100%").height(height);
        var table = $("#table_" + containerDiv).DataTable({
            data: this.dataSet,
            columns: columns,
            /*   scrollX: true,
              scrollY: height - 100,
              fixedColumns: {
                  heightMatch: 'none'
              },
             dom: 'Bfrtip',
              buttons: [
                  //'copyHtml5',
                  'excelHtml5',
                  'csvHtml5',
                  'pdfHtml5'
              ]*/
        })
        /*   table.buttons().container()
               .appendTo( $('.col-sm-6:eq(0)', table.table().container() ) );*/


        $('#table_' + containerDiv + ' tbody').on('click', 'tr', function (event) {
            if ($(this).hasClass('selected')) {
                $(this).removeClass('selected');
                $("#table_" + containerDiv + " tbody tr").css("height", "20px");
            }
            else {
                if (options.onClick ) {
                    $('tr.selected').removeClass('selected');
                    $(this).addClass('selected');
                    var px = event.clientX;
                    var py = event.clientY;

                   var line= table.row( this ).data();
                  /*  var idx = table.cell('.selected', 0).index();
                    // var data = table.row( idx.row ).data();
                    var line = this.dataSet[idx.row];*/

                    options.onClick(line);
                    // recordController.displayRecordData(line);
                    $(dialog.dialog("open"))
                }


            }

        });


    }



}

