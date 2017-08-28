function goBack() {
  window.history.back();
}


$(document).ready(function(){

	$('input[type=file]').change(function(){

		$(this).simpleUpload("/folder/upload/" + $("#upload-container").data().row , {

			start: function(file){
				//upload started
				//$('#filename').html(file.name);
				$('.progress').removeClass("invisible");
				//$('.progress').html("");
				$('.progress-bar').width(0);
			},

			progress: function(progress){
				//received progress
				//$('.progress').html("Progress: " + Math.round(progress) + "%");
				$('.progress-bar').width(progress + "%");
			},

			success: function(data){
				//upload successful
				//$('#progress').html("Success!<br>Data: " + JSON.stringify(data));
				$('#progress').addClass("invisible");
				location.reload();
			},

			error: function(error){
				//upload failed
				$('.progress').html("Failure!<br>" + error.name + ": " + error.message);
			}

		});

	});

});