function goBack() {
  window.history.back();
}


$(document).ready(function(){

	$('#allrun').on('click', function(){
		var opts = {
		  lines: 11 // The number of lines to draw
		, length: 0 // The length of each line
		, width: 25 // The line thickness
		, radius: 75 // The radius of the inner circle
		, scale: 0.5 // Scales overall size of the spinner
		, corners: 0.7 // Corner roundness (0..1)
		, color: '#007bff' // #rgb or #rrggbb or array of colors
		, opacity: 0.25 // Opacity of the lines
		, rotate: 0 // The rotation offset
		, direction: 1 // 1: clockwise, -1: counterclockwise
		, speed: 1.5 // Rounds per second
		, trail: 54 // Afterglow percentage
		, fps: 20 // Frames per second when using setTimeout() as a fallback for CSS
		, zIndex: 2e9 // The z-index (defaults to 2000000000)
		, className: 'spinner' // The CSS class to assign to the spinner
		, top: '50%' // Top position relative to parent
		, left: '50%' // Left position relative to parent
		, shadow: false // Whether to render a shadow
		, hwaccel: false // Whether to use hardware acceleration
		, position: 'absolute' // Element positioning
		}	
		var target = document.getElementById('loader')
		var spinner = new Spinner(opts).spin(target);
	})

	$('#allback').on('click', function(){
		var opts = {
		  lines: 11 // The number of lines to draw
		, length: 0 // The length of each line
		, width: 25 // The line thickness
		, radius: 75 // The radius of the inner circle
		, scale: 0.5 // Scales overall size of the spinner
		, corners: 0.7 // Corner roundness (0..1)
		, color: '#dc3545' // #rgb or #rrggbb or array of colors
		, opacity: 0.25 // Opacity of the lines
		, rotate: 0 // The rotation offset
		, direction: -1 // 1: clockwise, -1: counterclockwise
		, speed: 1.5 // Rounds per second
		, trail: 54 // Afterglow percentage
		, fps: 20 // Frames per second when using setTimeout() as a fallback for CSS
		, zIndex: 2e9 // The z-index (defaults to 2000000000)
		, className: 'spinner' // The CSS class to assign to the spinner
		, top: '50%' // Top position relative to parent
		, left: '50%' // Left position relative to parent
		, shadow: false // Whether to render a shadow
		, hwaccel: false // Whether to use hardware acceleration
		, position: 'absolute' // Element positioning
		}	
		var target = document.getElementById('loader')
		var spinner = new Spinner(opts).spin(target);
	})

	$('input[type=file]').change(function(){
		$(this).simpleUpload("/folder/upload/" + $("#upload-container").data().row , {
			start: function(file){
				//upload started
				$('.progress').removeClass("invisible");
				$('.progress-bar').html("");
				$('.progress-bar').width(0);
				$(".table").load(" .table");
			},
			progress: function(progress){
				//received progress
				$('.progress-bar').html("Progress: " + Math.round(progress) + "%");
				$('.progress-bar').width(progress + "%");
				$(".table").load(" .table");
			},
			success: function(data){
				//upload successful				
				$('.progress').addClass("invisible");
				$('.progress-bar').html("");				
				$('.form-control').val('');
				$(".table").load(" .table");
			},
			error: function(error){
				//upload failed
				$('.progress').html("Failure!<br>" + error.name + ": " + error.message);
				$(".table").load(" .table");
			}
		});
	});

	var socket = io();
	socket.on('add', function(msg){ 
		$(".table").load(" .table");
		alertify.success(" File added to the folder.");
	});
	socket.on('unlink', function(msg){          
		$(".table").load(" .table");
		alertify.error(" File removed from the folder.");
	});
	socket.on('reloadflow', function(msg){          
		$(".table").load(" .table");
	});

  $("#sidebar").niceScroll({
     cursorcolor: '#FFFFFF',
     cursorwidth: 4,
     cursorborder: 'none'
  });

	$('#dismiss, .overlay').on('click', function () {
	  $('#sidebar').removeClass('active');
	  $('.overlay').fadeOut();
	});

	$('#currentFlow').on('click', function(){
		location.href = '/flow/current'
	})

	$('#listFlows').on('click', function () {
 	  if($('#sidebar').hasClass('active') == false){
 	  	$('#sidebar').addClass('active');
	    $('.overlay').fadeIn();
	    $('.collapse.in').toggleClass('in');
	    $('a[aria-expanded=true]').attr('aria-expanded', 'false');
 	  } 

 	  $.ajax({
      type: 'GET',
      url: '/flow/tree',
      dataType: "json",
	  })
	  .done(function (response) {
	      $('#tree').treeview({
	      	data: response.tree,
	      	showCheckbox: true,
	      	onNodeSelected: function(event, data) {
	      		if(data["nodes"] == null || data["nodes"] == undefined){
	      			location.href = "/flow/load/" + data["folder"] + "/" + "template" + data["text"].split(" ").join("_")
	      		}			    
				  },
				  onNodeUnchecked: function(event, data) {
	      		if(data["nodes"] != null && data["nodes"] != undefined){
	      			location.href = "/folder/flows/" + data["folder"]
	      		}			    
				  }
	      });
	      $("#tree.treeview").show();
        $("#editflow.treeview").hide();
	  })
	  .fail(function (response) {
	      console.log(response);
	  });
	});
/*
	$('#edit-flow').on('click', function () {
    if($('#sidebar').hasClass('active') == false){
 	  	$('#sidebar').addClass('active');
	    $('.overlay').fadeIn();
	    $('.collapse.in').toggleClass('in');
	    $('a[aria-expanded=true]').attr('aria-expanded', 'false');
 	  } 

 	  $.ajax({
      type: 'GET',
      url: '/flow/edittree',
      dataType: "json",
	  })
	  .done(function (response) {
	      $('#editflow').treeview({
	      	data: response.tree,
	      	showCheckbox: false,
	      	onNodeSelected: function(event, data) {
	      		if(data["nodes"] == null || data["nodes"] == undefined){
	      			//$('#edit-flow').data().filepath
	      			//location.href = "/flow/load/" + data["folder"] + "/" + data["text"]
	      		}			    
				  }
	      });
	      $("#tree.treeview").hide();
        $("#editflow.treeview").show();
	  })
	  .fail(function (response) {
	      console.log(response);
	  });
	});
*/	 
	$("#to_schemas").select2({
	    theme: "bootstrap"
	});

	$("#from_schemas").select2({
	    theme: "bootstrap"
	});
});

