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
  location.href = "/payments/flow/" + data["env"] + "/" + data["key"];
}

function selectPaymentNodeCompare(data) { 	
	$('#sidebar').removeClass('active');
  $('.overlay').fadeOut();
  location.href = location.href.replace("/flow/", "/compare/") + "/" + data["env"]+ "/" + data["key"]; 
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

function lazyLoadMID(node, display) {
	var nurl = '/payments/tree/' + node["key"] + "/" + ((node["mid"] != undefined )?  node["mid"] : 'blank');
	$.ajax({
    type: 'GET',
    url: nurl,
    dataType: "json",
  })
  .done(function (response) {	
  	 display(response.nodes);
  });
};

function lazyLoadScore(node, display) {
	var usecase = location.href.split("/").pop();
	var nurl = '/payments/tree/' + node["key"] + "/" + usecase + "/" + ((node["score"] != undefined )?  node["score"] : '1')
	$.ajax({
    type: 'GET',
    url: nurl,
    dataType: "json",
  })
  .done(function (response) {	
  	 display(response.nodes);
  });
}

function buildPaymentsTree(data, type = 'payments', compare = false){
	var lazyLoadFunc = (type.indexOf('payments') != -1 ) ? lazyLoadMID : lazyLoadScore ;
	return $('#treeflows').treeview({
	      data: data,
	      showCheckbox: false,
	      lazyLoad: lazyLoadFunc,
	      showIcon: true,
        backColor: "#fafafa",
        showBorder: false,
        selectable: true,
        selectedIcon: 'fas fa-open', 
        showTags: true,
        tagsClass: 'badge badge-pill badge-success float-right mr-5 p-2',       
	      onNodeSelected  : function (event, data) { 
	      	if(compare){
	      		selectPaymentNodeCompare(data);
	      	} else {
		      	selectPaymentNode(data);
		      }
	      }
	    });
};

function searchBy(ext, type){
	$.ajax({
	    type: 'GET',
	    url: '/payments' + ext,
	    dataType: "json",
	  })
		.done(function (response) {
	    $paymentsTree = buildPaymentsTree(response.tree, type);
	  })
	  .fail(function (response) {
	      console.log(response);
	  });
}

function searchMID(e){
	var pattern = $('#inputsearch').val();
	searchBy("/bymid/"+pattern, 'payments');
}

function searchScore(e){
	var pattern = $('#similarityRange').val();
	var usecase = location.href.split("/").pop() 
	searchBy("/byscore/"+ usecase +"/"+ pattern, 'score');
}


function displayPaymentsTree(type, compare = false){
	$.ajax({
	    type: 'GET',
	    url: '/payments/tree',
	    dataType: "json",
	  })
	  .done(function (response) {
	    var $paymentsTree = buildPaymentsTree(response.tree, type, compare);
      if(type.indexOf('score') != -1){
	  		$('#similarityRange').on('change', searchScore); 
	  	}

      if(type.indexOf('payments') != -1){
		  	$('#btnsearch').on('click', searchMID);

	      $('#btnclearsearch').on('click', function (e) {
	        $('#inputsearch').val('');
	        searchBy('/tree');
	      });	
	  	}
	  })
	  .fail(function (response) {
	      console.log(response);
	  });
}

	

$(document).ready(function(){			
	//$('[data-toggle="popover"]').popover();

	//$.fn.editable.defaults.mode = 'inline';
	$('.description').editable();	

  $("#flowmanagement").niceScroll({
     cursorcolor: '#FFFFFF',
     cursorwidth: 4,
  });

  $("#details").niceScroll({
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
		location.href = location.href.replace("/flow/", "/activities/")
	});

	$('#showFlow').on('click', function(){
		location.href = location.href.replace("/activities/", "/flow/")
	});

	$('#exitFlows').on('click', function(){		
		location.href = "/logout"
	});


	$('#listFlows').on('click', function () { 	  
 	  openSideBar();
 	  $('#tree_title').hide();
    $('#mid-search').show();	
    $('#similarity-search').hide();  
		$.ajax({
	    type: 'GET',
	    url: '/usecases/tree',
	    dataType: "json",
	  })
	  .done(function (response) {
	    var $allmids = response.tree
	    var $usecasesTree = $('#treeflows').treeview({
	      data: response.tree,
	      levels: 1,
	      showCheckbox: false,
	      showIcon: true,
        backColor: "#fafafa",
        showBorder: false,
        selectable: true,
        selectedIcon: 'fas fa-open',        
	      onNodeSelected  : function(event, data) {	       
        	location.href = "/usecases/template/"+ data["env"]+ "/" + data["key"];         		
	      }
	    });

	    var search = function(e) {
	      var pattern = $('#inputsearch').val();
	      var options = {
	        ignoreCase: true,
	        exactMatch: false,
	        revealResults: true
	      };
	      //$usecasesTree.treeview({data: $allmids})
	      var results = $usecasesTree.treeview('search', [ pattern, options ]);
	      //$usecasesTree.treeview({data: results,
	        //onNodeSelected  : function (event, data) { 
        		//location.href = "/usecases/template/"+ data["env"]+ "/" + data["key"]; 
		      //}
	      //})

	      //var output = "<p class='small'>" + results.length + ' matches found</p>';
	      //$('#searchoutput').html(output);
      }

      $('#btnsearch').on('click', search);
      //$('#inputsearch').on('keyup', search);

      $('#btnclearsearch').on('click', function (e) {
        $usecasesTree.treeview('clearSearch');
        $usecasesTree.treeview({data: $allmids})
        $('#inputsearch').val('');
        $('#searchoutput').html('');
      });

      $(".treeview").niceScroll({
		     cursorcolor: '#FFFFFF',
		     cursorwidth: 4,
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
    displayPaymentsTree('payments');
	});
	
	$('#similarFlow').on('click', function () {
 	 	openSideBar();
 	  $('#tree_title').hide();
    $('#mid-search').hide();	
    $('#similarity-search').show();   
    rangeSlider();
 	  displayPaymentsTree('score');
	});

	$('#compareFlow').on('click', function () {
 	 	openSideBar();
 	 	$('#tree_title').hide();
    $('#mid-search').show();	
    $('#similarity-search').hide();  
    displayPaymentsTree('payments', true); 	   	  
	});	



	var $subflow_modal = $('#subflow');
	var uid = "";
	var back = "";
	var env = "";
	var mid="";
	var view = "";
	// Show loader & then get content when modal is shown
	$(document).on("click", ".btn-subflow", function(e){	
	  e.preventDefault();
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
	        $('.description').editable();	
		      $subflow_modal.niceScroll({
				     cursorcolor: '#FFFFFF',
				     cursorwidth: 4,
				  });
	      }
	    });
	});


	var $flowmanagement_modal = $('#flowmanagement');
	$(document).on("click", ".btn-flowmanagement", function(e){	
	  e.preventDefault();
	  env = $(e.target).data('env') != undefined ? $(e.target).data('env') : env;
	  uid = $(e.target).data('uid') != undefined ? $(e.target).data('uid') : uid;
	  back = $(e.target).data('back') != undefined ? $(e.target).data('back') : back;	  
	  $flowmanagement_modal
	    .addClass('modal-scrollfix')
	    .find('.modal-body')
	    .html('loading...')
	    .load("/usecases/flowmanagement/" + env + "/"+ uid + "/" + back, function() {
	      // Use Bootstrap's built-in function to fix scrolling (to no avail)
	      if(($flowmanagement_modal.data('bs.modal') || {})._isShown == false){
	      	$flowmanagement_modal
	        	.removeClass('modal-scrollfix')
	        	.modal('handleUpdate')
	        	.modal('show');
	        }
	    });
	});

	var $details_modal = $('#details');
	$(document).on("click", ".btn-details", function(e){	
	  e.preventDefault();
	  env = $(e.target).data('env') != undefined ? $(e.target).data('env') : env;
	  mid = $(e.target).data('mid') != undefined ? $(e.target).data('mid') : mid;
	  uid = $(e.target).data('uid') != undefined ? $(e.target).data('uid') : uid;
	  view = $(e.target).data('view') != undefined ? $(e.target).data('view') : view;
	  $details_modal
	    .addClass('modal-scrollfix')
	    .find('.modal-body')
	    .html('loading...')
	    .load("/payments/details/" + env + "/"+ mid + "/" + uid  + "/" + view , function() {
	      // Use Bootstrap's built-in function to fix scrolling (to no avail)
	      if(($details_modal.data('bs.modal') || {})._isShown == false){
	      	$details_modal
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
