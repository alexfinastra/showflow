function goBack() {
  window.history.back();
}

function handleClick(cb) {
		var url = "/onboard/selectrow/" + cb.id + "/" +  cb.checked;
		var rowId = "#" + cb.id.replace("cb_", "row_").toLowerCase();	  
	  $.ajax({
  		type: 'GET',
  		url: url,
  		dataType: 'json'
  	})
  	.done(function(response){
  		$(rowId).fadeOut(800, function(){
        $(rowId).html(response.row).fadeIn().delay(2000);
      });
  		//alertify.success("Refresh " + rowId);
  	})
}

function handleScript(el) {	
	var rowId = "#" + el.dataset.rowid.toLocaleLowerCase()
	$.ajax({
		type: 'GET',
		url: el.dataset.href,
		dataType: 'json'
	})
	.done(function(response){
		$(rowId).fadeOut(800, function(){
      $(rowId).html(response.row).fadeIn().delay(2000);
    });
		//alertify.success("Refresh " + rowId);
	})
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

	$('input#msg[type=file]').change(function(){
		$(this).simpleUpload("/folder/upload/" + $("#upload-container").data().row , {
			start: function(file){				
				$('.progress').removeClass("invisible");
				$('.progress-bar').html("");
				$('.progress-bar').width(0);
			},
			progress: function(progress){
				$('.progress-bar').html("Progress: " + Math.round(progress) + "%");
				$('.progress-bar').width(progress + "%");
			},
			success: function(data){
				//upload successful				
				$('.progress').addClass("invisible");
				$('.progress-bar').html("");				
				$('.form-control').val('');
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


	$('input#cots-upload[type=file]').change(function(){
		$(this).simpleUpload("/onboard/upload/" + $("#cots-container").data().evn , {
			start: function(file){				
				$('#cots-progress.progress').removeClass("invisible");
				$('#cots-progress-bar.progress-bar').html("");
				$('#cots-progress-bar.progress-bar').width(0);
			},
			progress: function(progress){
				$('#cots-progress-bar.progress-bar').html("Progress: " + Math.round(progress) + "%");
				$('#cots-progress-bar.progress-bar').width(progress + "%");
			},
			success: function(data){		
				$('#cots-progress.progress').addClass("invisible");
				$('#cots-progress-bar.progress-bar').html("");				
				location.href = "/onboard/parsecots/" + data
			},
			error: function(error){
				$('#cots-progress.progress').html("Failure!<br>" + error.name + ": " + error.message);
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

  $("#treecots").niceScroll({
     cursorcolor: '#FFFFFF',
     cursorwidth: 4,
  });

  $("#modal-contex").niceScroll({
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

	if($('#treecots').is(':visible')){
		$.ajax({
	    type: 'GET',
	    url: '/onboard/tree',
	    dataType: "json",
	  })
	  .done(function (response) {
	    $('#treecots').treeview({
	      data: response.tree,
	      showCheckbox: false,
	      showIcon: true,
        backColor: "#fafafa",
        showBorder: false,
        selectable: true,
        selectedIcon: 'fa fa-open',
        //checkedIcon: 'fa fa-check-square-o',
        //uncheckedIcon: 'fa fa-square-o',
	      onNodeSelected  : function(event, data) {
	        if(data["nodes"] == null || data["nodes"] == undefined){
	        	parent = $('#treecots').treeview('getParent', data)              
	        	$.ajax({
	        		type: 'GET',
	        		url: "/onboard/selectnode/" + parent["key"] + "/" +  data["key"],
	        		dataType: 'json'
	        	})
	        	.done(function(response){
	        		$("#cots").fadeOut(800, function(){
                $("#cots").html(response.cots).fadeIn().delay(2000);
                window.scrollTo(0, 0);
              });
	        	})
	        }        
	      }
	    });
	    $("#treecots.treeview").show();
	  })
	  .fail(function (response) {
	      console.log(response);
	  });
	}

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
	      	showIcon: false,
          showCheckbox: true,
          showBorder: false,	      	
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




/*
  		$(function() {

       




       


        
       

       



        var $expandibleTree = $('#treeview-expandible').treeview({
          data: defaultData,
          onNodeCollapsed: function(event, node) {
            $('#expandible-output').prepend('<p>' + node.text + ' was collapsed</p>');
          },
          onNodeExpanded: function (event, node) {
            $('#expandible-output').prepend('<p>' + node.text + ' was expanded</p>');
          }
        });

        var findExpandibleNodess = function() {
          return $expandibleTree.treeview('search', [ $('#input-expand-node').val(), { ignoreCase: false, exactMatch: false } ]);
        };
        var expandibleNodes = findExpandibleNodess();

        // Expand/collapse/toggle nodes
        $('#input-expand-node').on('keyup', function (e) {
          expandibleNodes = findExpandibleNodess();
          $('.expand-node').prop('disabled', !(expandibleNodes.length >= 1));
        });

        $('#btn-expand-node.expand-node').on('click', function (e) {
          var levels = $('#select-expand-node-levels').val();
          $expandibleTree.treeview('expandNode', [ expandibleNodes, { levels: levels, silent: $('#chk-expand-silent').is(':checked') }]);
        });

        $('#btn-collapse-node.expand-node').on('click', function (e) {
          $expandibleTree.treeview('collapseNode', [ expandibleNodes, { silent: $('#chk-expand-silent').is(':checked') }]);
        });

        $('#btn-toggle-expanded.expand-node').on('click', function (e) {
          $expandibleTree.treeview('toggleNodeExpanded', [ expandibleNodes, { silent: $('#chk-expand-silent').is(':checked') }]);
        });

        // Expand/collapse all
        $('#btn-expand-all').on('click', function (e) {
          var levels = $('#select-expand-all-levels').val();
          $expandibleTree.treeview('expandAll', { levels: levels, silent: $('#chk-expand-silent').is(':checked') });
        });

        $('#btn-collapse-all').on('click', function (e) {
          $expandibleTree.treeview('collapseAll', { silent: $('#chk-expand-silent').is(':checked') });
        });



        var $checkableTree = $('#treeview-checkable').treeview({
          data: defaultData,
          showIcon: false,
          showCheckbox: true,
          onNodeChecked: function(event, node) {
            $('#checkable-output').prepend('<p>' + node.text + ' was checked</p>');
          },
          onNodeUnchecked: function (event, node) {
            $('#checkable-output').prepend('<p>' + node.text + ' was unchecked</p>');
          }
        });

        var findCheckableNodess = function() {
          return $checkableTree.treeview('search', [ $('#input-check-node').val(), { ignoreCase: false, exactMatch: false } ]);
        };
        var checkableNodes = findCheckableNodess();

        // Check/uncheck/toggle nodes
        $('#input-check-node').on('keyup', function (e) {
          checkableNodes = findCheckableNodess();
          $('.check-node').prop('disabled', !(checkableNodes.length >= 1));
        });

        $('#btn-check-node.check-node').on('click', function (e) {
          $checkableTree.treeview('checkNode', [ checkableNodes, { silent: $('#chk-check-silent').is(':checked') }]);
        });

        $('#btn-uncheck-node.check-node').on('click', function (e) {
          $checkableTree.treeview('uncheckNode', [ checkableNodes, { silent: $('#chk-check-silent').is(':checked') }]);
        });

        $('#btn-toggle-checked.check-node').on('click', function (e) {
          $checkableTree.treeview('toggleNodeChecked', [ checkableNodes, { silent: $('#chk-check-silent').is(':checked') }]);
        });

        // Check/uncheck all
        $('#btn-check-all').on('click', function (e) {
          $checkableTree.treeview('checkAll', { silent: $('#chk-check-silent').is(':checked') });
        });

        $('#btn-uncheck-all').on('click', function (e) {
          $checkableTree.treeview('uncheckAll', { silent: $('#chk-check-silent').is(':checked') });
        });



        var $disabledTree = $('#treeview-disabled').treeview({
          data: defaultData,
          onNodeDisabled: function(event, node) {
            $('#disabled-output').prepend('<p>' + node.text + ' was disabled</p>');
          },
          onNodeEnabled: function (event, node) {
            $('#disabled-output').prepend('<p>' + node.text + ' was enabled</p>');
          },
          onNodeCollapsed: function(event, node) {
            $('#disabled-output').prepend('<p>' + node.text + ' was collapsed</p>');
          },
          onNodeUnchecked: function (event, node) {
            $('#disabled-output').prepend('<p>' + node.text + ' was unchecked</p>');
          },
          onNodeUnselected: function (event, node) {
            $('#disabled-output').prepend('<p>' + node.text + ' was unselected</p>');
          }
        });

        var findDisabledNodes = function() {
          return $disabledTree.treeview('search', [ $('#input-disable-node').val(), { ignoreCase: false, exactMatch: false } ]);
        };
        var disabledNodes = findDisabledNodes();

        // Expand/collapse/toggle nodes
        $('#input-disable-node').on('keyup', function (e) {
          disabledNodes = findDisabledNodes();
          $('.disable-node').prop('disabled', !(disabledNodes.length >= 1));
        });

        $('#btn-disable-node.disable-node').on('click', function (e) {
          $disabledTree.treeview('disableNode', [ disabledNodes, { silent: $('#chk-disable-silent').is(':checked') }]);
        });

        $('#btn-enable-node.disable-node').on('click', function (e) {
          $disabledTree.treeview('enableNode', [ disabledNodes, { silent: $('#chk-disable-silent').is(':checked') }]);
        });

        $('#btn-toggle-disabled.disable-node').on('click', function (e) {
          $disabledTree.treeview('toggleNodeDisabled', [ disabledNodes, { silent: $('#chk-disable-silent').is(':checked') }]);
        });

        // Expand/collapse all
        $('#btn-disable-all').on('click', function (e) {
          $disabledTree.treeview('disableAll', { silent: $('#chk-disable-silent').is(':checked') });
        });

        $('#btn-enable-all').on('click', function (e) {
          $disabledTree.treeview('enableAll', { silent: $('#chk-disable-silent').is(':checked') });
        });



        var $tree = $('#treeview12').treeview({
          data: json
        });
  		});*/
  	