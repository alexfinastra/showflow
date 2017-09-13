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
      			location.href = "/flow/load/" + data["folder"] + "/" + data["text"]
      		}			    
			  },
			  onNodeUnchecked: function(event, data) {
      		if(data["nodes"] != null && data["nodes"] != undefined){
      			location.href = "/folder/flows/" + data["folder"]
      			//alertify.alert("One sec Sir ! ")
      		}			    
			  }
      });
  })
  .fail(function (response) {
      console.log(response);
  });

  //$('#tree').on('nodeSelected', function(event, data) {
	//  console.log(data);
  //});

  $("#sidebar").niceScroll({
     cursorcolor: '#53619d',
     cursorwidth: 4,
     cursorborder: 'none'
 });

 $('#dismiss, .overlay').on('click', function () {
    $('#sidebar').removeClass('active');
    $('.overlay').fadeOut();
 });

 $('#sidebarCollapse').on('click', function () {
     $('#sidebar').addClass('active');
     $('.overlay').fadeIn();
     $('.collapse.in').toggleClass('in');
     $('a[aria-expanded=true]').attr('aria-expanded', 'false');
 });
  
});

