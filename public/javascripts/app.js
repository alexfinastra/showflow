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
				//$(".table").load(" .table");
			},
			progress: function(progress){
				//received progress
				$('.progress-bar').html("Progress: " + Math.round(progress) + "%");
				$('.progress-bar').width(progress + "%");
				//$(".table").load(" .table");
			},
			success: function(data){
				//upload successful				
				$('.progress').addClass("invisible");
				$('.progress-bar').html("");				
				$('.form-control').val('');
				//$(".table").load(" .table");
				console.log("upload success " + data)
				var editor=document.getElementById("editor");
	  		
	  		if(data.indexOf("<") == -1){
	  			$('#xml-editor').removeClass("hidden")
	  			$("textarea#txt-editor").val(data);
	  			$("textarea#txt-editor").data("text", data); 
	  		}
	  		else{
	  			  		var docSpec={
	  							onchange: function(){
	  								console.log("I been changed now!")
	  							},
	  							validate: function(obj){
	  								console.log("I be validatin' now!")
	  							},
	  							elements: {
	  								"GrpHdr": {
	  									menu: [{
	  										caption: "Append an <MsgId>",
	  										action: Xonomy.newElementChild,
	  										actionParameter: "<MsgId/>"
	  									}]
	  								},
	  								"MsgId": {
	  									menu: [{
	  											caption: "Add @label=\"something\"",
	  											action: Xonomy.newAttribute,
	  											actionParameter: {name: "label", value: "something"},
	  											hideIf: function(jsElement){
	  												return jsElement.hasAttribute("label");
	  											}
	  										}, {
	  											caption: "Delete this <MsgId>",
	  											action: Xonomy.deleteElement
	  										}, {
	  											caption: "New <MsgId> before this",
	  											action: Xonomy.newElementBefore,
	  											actionParameter: "<MsgId/>"
	  										}, {
	  											caption: "New <MsgId> after this",
	  											action: Xonomy.newElementAfter,
	  											actionParameter: "<MsgId/>"
	  										}],
	  									canDropTo: ["GrpHdr"],
	  									attributes: {
	  										"value": {
	  											asker: Xonomy.askString,
	  											menu: [{
	  												caption: "Delete this @value",
	  												action: Xonomy.deleteAttribute
	  											}]
	  										}
	  									}
	  								}
	  							}
	  						};
	  		
	  						Xonomy.render(data, editor, docSpec);
	  						$('#xml-editor').removeClass("hidden")}
			},
			error: function(error){
				//upload failed
				$('.progress').html("Failure!<br>" + error.name + ": " + error.message);
				//$(".table").load(" .table");
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
  });

  $("#txt-editor").niceScroll({
     cursorcolor: '#FFFFFF',
     cursorwidth: 4,
  });

	$('#dismiss, .overlay').on('click', function () {
	  $('#sidebar').removeClass('active');
	  $('.overlay').fadeOut();
	});

	$('#currentFlow').on('click', function(){
		location.href = '/flow/current'
	})

	$('#sendmsg').on('click', function(){
		var len = location.pathname.split('/').length
		var uid = location.pathname.split('/')[len -1]
		var editor=document.getElementById("editor");
		var fileName = $('.modal-header').data("file");
		$.ajax({
			type: 'GET',
			url: '/folder/send/' + uid,
			data: {file: fileName, xml: Xonomy.harvest()}
		})
		.done(function (response) {	
				location.reload();
	  		console.log(response);
	  })
	  .fail(function (response) {
	      console.log(response);
	  });
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

	$("#editor").niceScroll({
     cursorcolor: '#FFFFFF',
     cursorwidth: 4,
     cursorborder: '1px'
  });	
   
  $('#canceldmsg').on('click', function(){
  	$('#xml-editor').addClass("hidden")
  });

  $('.messageformat').on('click', function(event){  
	  var button = $(event.currentTarget) 
	  var href = button.data('href') 		 	  
	  $.ajax({
      type: 'GET',
      url: href
	  })
	  .done(function (response) {	
	  		var editor=document.getElementById("editor");
	  		var docSpec={
					onchange: function(){
						console.log("I been changed now!")
					},
					validate: function(obj){
						console.log("I be validatin' now!")
					},
					elements: {
						"GrpHdr": {
							menu: [{
								caption: "Append an <MsgId>",
								action: Xonomy.newElementChild,
								actionParameter: "<MsgId/>"
							}]
						},
						"MsgId": {
							menu: [{
									caption: "Add @label=\"something\"",
									action: Xonomy.newAttribute,
									actionParameter: {name: "label", value: "something"},
									hideIf: function(jsElement){
										return jsElement.hasAttribute("label");
									}
								}, {
									caption: "Delete this <MsgId>",
									action: Xonomy.deleteElement
								}, {
									caption: "New <MsgId> before this",
									action: Xonomy.newElementBefore,
									actionParameter: "<MsgId/>"
								}, {
									caption: "New <MsgId> after this",
									action: Xonomy.newElementAfter,
									actionParameter: "<MsgId/>"
								}],
							canDropTo: ["GrpHdr"],
							attributes: {
								"value": {
									asker: Xonomy.askString,
									menu: [{
										caption: "Delete this @value",
										action: Xonomy.deleteAttribute
									}]
								}
							}
						}
					}
				};

				Xonomy.render(response.data, editor, docSpec);
				$('#xml-editor').removeClass("hidden")
	  })
	  .fail(function (response) {
	      console.log(response);
	  });
	})
});
