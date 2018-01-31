module.exports = hamburgerCommand = {
    uploadFile: function(e) {
        $(".navbar-toggler").trigger('click');

        // NEED TO CALL THE API TO SUBMIT THE UPLOADED FILE.
        var data = new FormData();
        var fileData = $("#parloFileUpload").prop("files")[0];

        var fileName = fileData["name"];

        data.append('parloFileUpload', fileData);
        // append other variables to data if you want: data.append('field_name_x', field_value_x);

        // $.ajax({
        //     type: 'POST',               
        //     processData: false, // important
        //     contentType: false, // important
        //     data: data,
        //     url: your_ajax_path,
        //     dataType : 'json',  
        //     success: function(jsonData){
        //     }
        // });
        hamburgerCommand.updateTextOnScreen(fileName); 
    },
    updateTextOnScreen: function(fileName) {
        var html  = '<div class="row msg_container base_sent"><div class="col-xs-1 col-md-1"><img src="https://d54za3sdpelx8.cloudfront.net/images/parlo_Logo-sm.png" class="iconImageSize"></div><div class="col-md-11 col-xs-11"><div class="messages msg_sent "><p>Thank you, your file '+fileName+' has been uploaded.</p></div></div></div>';
        commonFunction.appendTextToDiv(html, "#chatBox", 0);
    }
}