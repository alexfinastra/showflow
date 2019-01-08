function goBack() {
  window.history.back();
}

function openSideBar(){
	if($('#sidebar').hasClass('active') == false){
	  $('#sidebar').addClass('active'); 	  	
    $('.overlay').fadeIn();
    $('.collapse.in').toggleClass('in');
    $('a[aria-expanded=true]').attr('aria-expanded', 'false');
	} 
}

function selectPaymentNode(data) {
  parent = $('#treeflows').treeview('getParent', data);
  $('#sidebar').removeClass('active');
  $('.overlay').fadeOut();
  location.href = "/payments/flow/" + parent["key"] + "/" + data["key"];
}

function rangeSlider(){
  var slider = $('.slidecontainer'),
      range = $('#similarityRange'),
      value = $('.range-slider__value');
    
  slider.each(function(){

    value.each(function(){
      var value = $(this).prev().attr('value');
      $(this).html(value);
    });

    range.on('input', function(){
      $(this).next(value).html(this.value);
    });
  });
};

$(document).ready(function(){		
	$('#sidebar').css({'top': '68px'});		
	var height = $('#sidebar').height() - $('#sidebar table thead tr th').height() - 68;
	$('.table-fixed tbody').css({'height': (height + 'px')});
	
	$("#sidebar").niceScroll({
     cursorcolor: '#FFFFFF',
     cursorwidth: 4,
  });  

  $("#flowmanagement").niceScroll({
     cursorcolor: '#FFFFFF',
     cursorwidth: 4,
  });

  $("#subflow").niceScroll({
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


	// upload log file with progress
	$('input#logs-upload[type=file]').change(function(){		
		$(this).simpleUpload("/onboard/upload/" + $("#environment :selected").text() , {
			start: function(file){							
				$('#logs-progress.progress').removeClass("invisible");
				$('#logs-progress-bar.progress-bar').html("");
				$('#logs-progress-bar.progress-bar').width(0);
			},
			progress: function(progress){
				$('#logs-progress-bar.progress-bar').html("  " + Math.round(progress) + " % ");
				$('#logs-progress-bar.progress-bar').width(progress + "%");
			},
			success: function(data){						
				$('#logs-progress.progress').addClass("invisible");
				$('#logs-progress-bar.progress-bar').html("");
				console.log("Before send " + 	data);				
				location.href = "/onboard/parsefile/" + data
			},
			error: function(error){
				$('#logs-progress.progress').html("Failure!<br>" + error.name + ": " + error.message);
			}
		});
	});

		
	if($('#activities').is(':visible')){
		arr = location.href.split("/")
		if ( $.fn.dataTable.isDataTable( '#activities' ) ) {
	    table = $('#activities').DataTable();					   
    	table.ajax.url("/payments/tabledata/" +  arr[5] + "/" + arr[6]).load();	        	
		}
		else {
		  table =  $('#activities').DataTable({
        serverSide: true,
        ajax : "/payments/tabledata/" +  arr[5] + "/" + arr[6],
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
		location.href = location.href.replace("flow", "activities")
	});

	$('#showFlow').on('click', function(){
		location.href = location.href.replace("activities", "flow")
	});

	$('#exitFlows').on('click', function(){		
		location.href = "/logout"
	});


	$('#listFlows').on('click', function () { 	  
 	  openSideBar();
 	  $('#tree_title').show();
    $('#mid-search').hide();	
    $('#similarity-search').hide();  
		$.ajax({
	    type: 'GET',
	    url: '/usecases/tree',
	    dataType: "json",
	  })
	  .done(function (response) {
	    var $usecasesTree = $('#treeflows').treeview({
	      data: response.tree,
	      showCheckbox: false,
	      showIcon: true,
        backColor: "#fafafa",
        showBorder: false,
        selectable: true,
        selectedIcon: 'fas fa-open',        
	      onNodeSelected  : function(event, data) {	       
        	parent = $('#treeflows').treeview('getParent', data); 
        	gparent = $('#treeflows').treeview('getParent', parent); 
        	location.href = "/usecases/template/"+ gparent["key"]+ "/" + data["key"];        		
	      }
	    });
	  })
	  .fail(function (response) {
	      console.log(response);
	  });
	});

	$('#listPayments').on('click', function () {
 	  openSideBar();
 	  $('#tree_title').hide();
    $('#mid-search').show();	
    $('#similarity-search').hide();  
		$.ajax({
	    type: 'GET',
	    url: '/payments/tree',
	    dataType: "json",
	  })
	  .done(function (response) {
	    var $allmids = response.tree;	    
	    var $paymentsTree = $('#treeflows').treeview({
	      data: response.tree,
	      showCheckbox: false,
	      showIcon: true,
        backColor: "#fafafa",
        showBorder: false,
        selectable: true,
        selectedIcon: 'fas fa-open',        
	      onNodeSelected  : function (event, data) { 
	      	selectPaymentNode(data);
	      }
	    });

		  var search = function(e) {
	      var pattern = $('#inputsearch').val();
	      var options = {
	        ignoreCase: true,
	        exactMatch: false,
	        revealResults: true
	      };
	      $paymentsTree.treeview({data: $allmids})
	      var results = $paymentsTree.treeview('search', [ pattern, options ]);
	      $paymentsTree.treeview({data: results,
	        onNodeSelected  : function (event, data) { 
		      	selectPaymentNode(data);
		      }
	      })

	      var output = "<p class='small'>" + results.length + ' matches found</p>';
	      $('#searchoutput').html(output);
      }

      $('#btnsearch').on('click', search);
      $('#inputsearch').on('keyup', search);

      $('#btnclearsearch').on('click', function (e) {
        $paymentsTree.treeview('clearSearch');
        $paymentsTree.treeview({data: $allmids})
        $('#inputsearch').val('');
        $('#searchoutput').html('');
      });
	  })
	  .fail(function (response) {
	      console.log(response);
	  });
	});
	
	$('#compareFlow').on('click', function () {
 	 	openSideBar();
 	 	$('#tree_title').hide();
    $('#mid-search').show();	
    $('#similarity-search').hide();   	  
 	  $.ajax({
	    type: 'GET',
	    url: '/payments/tree',
	    dataType: "json",
	  })
	  .done(function (response) {	       
	    var $searchableTree = $('#treeflows').treeview({
	      data: response.tree,
	      showCheckbox: false,
	      showIcon: true,
        backColor: "#fafafa",
        showBorder: false,
        selectable: true,
        selectedIcon: 'fas fa-open',
	      onNodeSelected  : function(event, data) {	               	
        	parent = $('#treeflows').treeview('getParent', data); 
        	if(location.href.indexOf('flow') != -1){
        		location.href = location.href.replace("flow", "compare") + "/" + parent["key"]+ "/" + data["key"]; 	
        	} else{
        		location.href = location.href.replace("activities", "compare") + "/" + parent["key"]+ "/" + data["key"]; 	
        	}
	      }
	    });
	  });
	});	


	$('#similarFlow').on('click', function () {
 	 	openSideBar();
 	  $('#tree_title').hide();
    $('#mid-search').hide();	
    $('#similarity-search').show();   
    rangeSlider();
 	  $.ajax({
	    type: 'GET',
	    url: '/payments/tree',
	    dataType: "json",
	  })
	  .done(function (response) {	
	    var $similarTree = $('#treeflows').treeview({
	      data: response.tree,
	      showCheckbox: false,
	      showIcon: true,
        backColor: "#fafafa",
        showBorder: false,
        selectable: true,
        selectedIcon: 'fas fa-open',
	      onNodeSelected  : function(event, data) {	       
        	parent = $('#treeflows').treeview('getParent', data); 
        	location.href = "/payments/flow/"+ parent["key"]+ "/" + data["key"]; 
	      }
	    });
	  });
	});


	var $subflow_modal = $('#subflow');
	var $flowmanagement_modal = $('#flowmanagement');
	var uid = "";
	var back = "";
	var env = "";
	// Show loader & then get content when modal is shown
	$(document).on("click", ".timeline-panel.subflow", function(e){	
	  env = $(e.target).data('env') != undefined ? $(e.target).data('env') : env;
	  uid = $(e.target).data('uid') != undefined ? $(e.target).data('uid') : uid;
	  back = $(e.target).data('back') != undefined ? $(e.target).data('back') : back;	  
	  $subflow_modal
	    .addClass('modal-scrollfix')
	    .find('.modal-body')
	    .html('loading...')
	    .load("/usecases/subflow/" + env + "/"+ uid + "/" + back, function() {
	      // Use Bootstrap's built-in function to fix scrolling (to no avail)
	      if(($subflow_modal.data('bs.modal') || {})._isShown == false){
	      	$subflow_modal
	        	.removeClass('modal-scrollfix')
	        	.modal('handleUpdate')
	        	.modal('show');
	        }
	    });
	});


	$('#showTable').on('click', function(){
		arr = location.href.split("/")
		arr[6] = "table"		
		location.href = arr.join("/")
	});

});
