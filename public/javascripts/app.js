function goBack() {
  window.history.back();
}


$(document).ready(function(){
	$('input[type=file]').change(function(){
		$(this).simpleUpload("/folder/upload/" + $("#upload-container").data().row , {
			start: function(file){
				//upload started
				$('.progress').removeClass("invisible");
				$('.progress-bar').html("");
				$('.progress-bar').width(0);
			},
			progress: function(progress){
				//received progress
				$('.progress-bar').html("Progress: " + Math.round(progress) + "%");
				$('.progress-bar').width(progress + "%");
			},
			success: function(data){
				//upload successful				
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


$(function () {
	var socket = io.connect('http://localhost:3000');
  socket.on('add', function(msg){          
    alertify.success(" File added ");
  });
  socket.on('change', function(msg){          
    alertify.log(" File updated ");
  });
  socket.on('unlink', function(msg){          
    alertify.error(" File removed ");
  });
});

