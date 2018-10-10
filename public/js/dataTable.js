var dataTable = (function () {
    var self = {};

    self.dataSet = [];
    self.columns = [];


    self.loadJson = function ( containerDiv,json,options) {
        if(!options)
            options={};

        height=500;
        self.dataSet = [];
        self.columns = [];


              self.dataSet = json
        ;
                var keys=[]
                json.forEach(function(line){
                    for(var key in line){
                        if(keys.indexOf(key)<0)
                            keys.push(key);
                    }
                })
        var columns=[]
        keys.forEach(function(key) {
            columns.push({data: key,title :key})
        })






                $("#"+containerDiv).html("<br><br><br></div><table style=' z-index:100 ' id='dataTable'  class='myDatatable cell-border display nowrap'></table>");
                $('#dataTable').css("font-size", "10px");


                var height = $("#"+containerDiv).height() - 200
                $('#dataTable').width("100%").height(height);
                var table = $('#dataTable').DataTable({
                    data: self.dataSet,
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


                $('#dataTable tbody').on('click', 'tr', function (event) {
                    if ($(this).hasClass('selected')) {
                        $(this).removeClass('selected');
                        $("#dataTable tbody tr").css("height", "20px");
                    }
                    else {
                        $('tr.selected').removeClass('selected');
                        $(this).addClass('selected');
                        var px = event.clientX;
                        var py = event.clientY;
                        var idx = table.cell('.selected', 0).index();
                        // var data = table.row( idx.row ).data();
                        var line = dataTable.dataSet[idx.row];
                        $( dialog.dialog( "open" ))


                    }
                });



    }



    return self;

})()

