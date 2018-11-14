function goBack() {
  window.history.back();
}

$(document).ready(function(){	
	$('#similarity-search').hide()

	$('input#cots-upload[type=file]').change(function(){		
		$(this).simpleUpload("/onboard/upload/" + $("#cots-container").data().evn , {
			start: function(file){							
				$('#cots-progress.progress').removeClass("invisible");
				$('#cots-progress-bar.progress-bar').html("");
				$('#cots-progress-bar.progress-bar').width(0);
			},
			progress: function(progress){
				$('#cots-progress-bar.progress-bar').html("  " + Math.round(progress) + " % ");
				$('#cots-progress-bar.progress-bar').width(progress + "%");
			},
			success: function(data){						
				$('#cots-progress.progress').addClass("invisible");
				$('#cots-progress-bar.progress-bar').html("");				
				location.href = "/onboard/parsefile/" + data
			},
			error: function(error){
				$('#cots-progress.progress').html("Failure!<br>" + error.name + ": " + error.message);
			}
		});
	});

	$('#sidebar').css({'top': '68px'});	
	var height = $('#sidebar').height() - $('#sidebar table thead tr th').height() - 68;
	$('.table-fixed tbody').css({'height': (height + 'px')});
  $("#sidebar").niceScroll({
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

	if($('#splitview').is(':visible')){
		Split(['#right', '#left'], {	    
		    
		})
	}
		
	if($('#activities').is(':visible')){
		arr = location.href.split("/")
		if ( $.fn.dataTable.isDataTable( '#activities' ) ) {
	    table = $('#activities').DataTable();					   
    	table.ajax.url("/onboard/selectnode/step/" +  arr[5]).load();	        	
		}
		else {
		  table =  $('#activities').DataTable({
        serverSide: true,
        ajax : "/onboard/selectnode/step/" +  arr[5],
        columns: [				            
            { "data": "time" },
            { "data": "service" },			            
            { "data": "activity" }
        ],        
        order: [[ 0, 'asc' ],[1, 'asc']],			        
        displayLength: 50,
        responsive: true
    	});
		}	    	
	}

	$('#showActivities').on('click', function(){
		arr = location.href.split("/")
		arr[6] = "table"
		location.href = arr.join("/")
	});

	$('#showFlow').on('click', function(){
		arr = location.href.split("/")
		arr[6] = "flow"
		location.href = arr.join("/")
	});

	$('#exitFlows').on('click', function(){		
		location.href = "/logout"
	});


	$('#listFlows').on('click', function () {
 	  if($('#sidebar').hasClass('active') == false){
 	  	$('#sidebar').addClass('active'); 	  	
	    $('.overlay').fadeIn();
	    $('.collapse.in').toggleClass('in');
	    $('a[aria-expanded=true]').attr('aria-expanded', 'false');	    
 	  } 
		
		$('#similarity-search').hide()
	  $('#mid-search').show()
		$.ajax({
	    type: 'GET',
	    url: '/onboard/tree',
	    dataType: "json",
	  })
	  .done(function (response) {
	    var $allmids = response.tree;	    
	    var $searchableTree = $('#treecots').treeview({
	      data: response.tree,
	      showCheckbox: false,
	      showIcon: true,
        backColor: "#fafafa",
        showBorder: false,
        selectable: true,
        selectedIcon: 'fas fa-open',
        //checkedIcon: 'fa fa-check-square-o',
        //uncheckedIcon: 'fa fa-square-o',
	      onNodeSelected  : function(event, data) {	       
        	parent = $('#treecots').treeview('getParent', data);         		
        	//$('.table-responsive').show()
        	$('#payflow').hide();
        	$('#activities').show();  
        	$('#sidebar').removeClass('active');

	  			$('.overlay').fadeOut();
        	if ( $.fn.dataTable.isDataTable( '#activities' ) ) {
				    table = $('#activities').DataTable();					   
	        	table.ajax.url("/onboard/selectnode/" + parent["key"] + "/" +  data["key"]).load();	        	
					}
					else {
					  table =  $('#activities').DataTable({
			        serverSide: true,
			        ajax : "/onboard/selectnode/" + parent["key"] + "/" +  data["key"],
			        columns: [				            
			            { "data": "time" },
			            { "data": "service" },			            
			            { "data": "activity" }
			        ],        
			        order: [[ 0, 'asc' ],[1, 'asc']],			        
			        displayLength: 10,
			        responsive: true
			    	});
					}	             
					location.href = "/onboard/showflow/" + data["key"] + "/flow";
	      }
	    });

      var search = function(e) {
        var pattern = $('#input-search').val();
        var options = {
          ignoreCase: true,
          exactMatch: false,
          revealResults: true
        };
        $searchableTree.treeview({data: $allmids})
        var results = $searchableTree.treeview('search', [ pattern, options ]);
        $searchableTree.treeview({data: results,
        	onNodeSelected  : function(event, data) {	       
	        	parent = $('#treecots').treeview('getParent', data);         		
	        	//$('.table-responsive').show()
	        	$('#payflow').hide();
	        	$('#activities').show();  
	        	$('#sidebar').removeClass('active');

		  			$('.overlay').fadeOut();
	        	if ( $.fn.dataTable.isDataTable( '#activities' ) ) {
					    table = $('#activities').DataTable();					   
		        	table.ajax.url("/onboard/selectnode/" + parent["key"] + "/" +  data["key"]).load();	        	
						}
						else {
						  table =  $('#activities').DataTable({
				        serverSide: true,
				        ajax : "/onboard/selectnode/" + parent["key"] + "/" +  data["key"],
				        columns: [				            
				            { "data": "time" },
				            { "data": "service" },			            
				            { "data": "activity" }
				        ],        
				        order: [[ 0, 'asc' ],[1, 'asc']],			        
				        displayLength: 10,
				        responsive: true
				    	});
						}	             
						location.href = "/onboard/showflow/" + data["key"] + "/flow";
		      }
        })

        var output = "<p class='small'>" + results.length + ' matches found</p>';
        //$.each(results, function (index, result) {
        //  output += '<p>- ' + result.text + '</p>';
        //});
        $('#search-output').html(output);
      }

      $('#btn-search').on('click', search);
      $('#input-search').on('keyup', search);

      $('#btn-clear-search').on('click', function (e) {
        $searchableTree.treeview('clearSearch');
        $searchableTree.treeview({data: $allmids})
        $('#input-search').val('');
        $('#search-output').html('');
      });

	  })
	  .fail(function (response) {
	      console.log(response);
	  });

	});
	
	$('#compareFlow').on('click', function () {
 	 	if($('#sidebar').hasClass('active') == false){
 	  	$('#sidebar').addClass('active'); 	  	
	    $('.overlay').fadeIn();
	    $('.collapse.in').toggleClass('in');
	    $('a[aria-expanded=true]').attr('aria-expanded', 'false');	    
 	  } 

 	  $('#similarity-search').hide()
	  $('#mid-search').show()
 	  $.ajax({
	    type: 'GET',
	    url: '/onboard/tree',
	    dataType: "json",
	  })
	  .done(function (response) {
	    var $allmids = response.tree;	    
	    var $searchableTree = $('#treecots').treeview({
	      data: response.tree,
	      showCheckbox: false,
	      showIcon: true,
        backColor: "#fafafa",
        showBorder: false,
        selectable: true,
        selectedIcon: 'fas fa-open',
        //checkedIcon: 'fa fa-check-square-o',
        //uncheckedIcon: 'fa fa-square-o',
	      onNodeSelected  : function(event, data) {	       
        	parent = $('#treecots').treeview('getParent', data);         		
        	//$('.table-responsive').show()
        	//$('#payflow').hide();
        	//$('#activities').show();  
        	$('#sidebar').removeClass('active');

	  			$('.overlay').fadeOut();
        	arr = location.href.split("/")
					if(arr[5].indexOf('template') > -1){
						arr[5] = data["key"]
						arr[6] = "flow"
					} else{
						arr[6] = "split"
						arr[7] = data["key"];		
					}
					
					location.href = arr.join("/");
	      }
	    });
	  });
	});	


	$('#similarFlow').on('click', function () {
 	 	if($('#sidebar').hasClass('active') == false){
 	  	$('#sidebar').addClass('active'); 	  	
	    $('.overlay').fadeIn();
	    $('.collapse.in').toggleClass('in');
	    $('a[aria-expanded=true]').attr('aria-expanded', 'false');	    
 	  } 

 	  $('#similarity-search').show()
	  $('#mid-search').hide()
 	  $.ajax({
	    type: 'GET',
	    url: '/onboard/tree',
	    dataType: "json",
	  })
	  .done(function (response) {
	  	var slider = new Slider('#similar',{
				tooltip: 'always',
				formatter: function(value) {
					return  value ;
				}
			});
			

	    var $allmids = response.tree;	    
	    var $searchableTree = $('#treecots').treeview({
	      data: response.tree,
	      showCheckbox: false,
	      showIcon: true,
        backColor: "#fafafa",
        showBorder: false,
        selectable: true,
        selectedIcon: 'fas fa-open',
        //checkedIcon: 'fa fa-check-square-o',
        //uncheckedIcon: 'fa fa-square-o',
	      onNodeSelected  : function(event, data) {	       
        	parent = $('#treecots').treeview('getParent', data);         		
        	//$('.table-responsive').show()
        	//$('#payflow').hide();
        	//$('#activities').show();  
        	$('#sidebar').removeClass('active');

	  			$('.overlay').fadeOut();
        	arr = location.href.split("/")
					if(arr[5].indexOf('template') > -1){
						arr[5] = data["key"]
						arr[6] = "flow"
					} else{
						arr[6] = "split"
						arr[7] = data["key"];		
					}
					
					location.href = arr.join("/");
	      }
	    });
	  });
	});

	$('.timeline-item').on('click', function(){
		arr = location.href.split("/")
		arr[6] = "table"		
		location.href = arr.join("/")
	});

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

});
