var Generator = {

	/* DATA CONSTS */
	NULL_PIXEL: -1,

	/* APP CONSTS */
	PIXELS_PER_SIDE: 40,
	NUM_COLORS: 14,


	/* UI ACCESSORS */
	$table: null,
	$color_selector: null,


	/* DATA ACCESSORS */
	colors: [],
	selectedColor: null,
	pixels: [],
	lastSavedState: null,
	userIsDrawing: false,


	/* DATA HELPERS */
	generateRandomColors: function() {
		for(var i = 0; i < Generator.NUM_COLORS; i++) {
			var r = (Math.floor(Math.random() * 256));
			var g = (Math.floor(Math.random() * 256));
			var b = (Math.floor(Math.random() * 256));
			var randomColor = 'rgb('+r+','+g+','+b+')';
			Generator.colors.push(randomColor);
		}
	},


	/* DATA INITIATING / SAVING / LOADING */
	initPixelsValue: function() {
		var total_pixels = Generator.PIXELS_PER_SIDE * Generator.PIXELS_PER_SIDE;

		for(var i = 0; i < total_pixels; i++) {
			Generator.pixels[i] = Generator.NULL_PIXEL;
		}
	},

	saveState: function() {
		Generator.lastSavedState = JSON.stringify({
			colors: Generator.colors,
			pixels: Generator.pixels
		});
	},


	/* UI BUILDERS */
	buildTable: function() {
		var table = '<table id="screen-table">';
		for( var y = 0; y < Generator.PIXELS_PER_SIDE; y++ ) {
			table += '<tr>';
			for( var x = 0; x < Generator.PIXELS_PER_SIDE; x++ ) {
				table += '<td><div class="cell" data-pixel-index="'+(x + y * Generator.PIXELS_PER_SIDE)+'" data-color="'+Generator.NULL_PIXEL+'"></div></td>';
			}
			table += '</tr>';
		}
		table += '</table>';

		Generator.$table = $(table);
	},

	buildColorSelector: function() {
		var selector = '<div id="color-selector">';
		for( var c = 0; c < Generator.NUM_COLORS; c++ ) {
			var color = Generator.colors[c];
			selector += '<div class="color-wrapper" data-color-index="'+c+'">' +
							'<div class="color" style="background-color: '+color+';">' +
								'<div class="select-indicator"></div>' +
							'</div>' +
							'<div class="metas">' +
								'<div class="counter">' +
									'<span class="available">5</span> / ' +
									'<span class="total">12</span>' +
								'</div>' +
							'</div>' +
					    '</div>';
		}
		selector += '</div>';

		Generator.$color_selector = $(selector);
	},


	/* UI LISTENERS */
	bindListeners: function() {
		var $body = $('body');

		/* User interacts with color selector */
		$body.on('click', '#color-selector .color-wrapper', function(e) {
			e.preventDefault();

			var $this = $(this);
			var $target = $(e.target);

			var color_id = parseInt($this.attr('data-color-index'));
			
			/* Select color */
			if( $target.is('.select-indicator') ) {
				Generator.setSelectedColor(color_id);
			}
		});

		/* User starts drawing */
		$body.on('mousedown', '#screen-table', function(e) {
			e.preventDefault();
			Generator.userIsDrawing = true;
		});

		/* User stops drawing */
		$body.on('mouseup mouseleave', '#screen-table', function(e) {
			e.preventDefault();
			Generator.userIsDrawing = false;
		});

		/* User is moving mouse over screen "pixels" */
		$body.on('mouseenter', '#screen-table .cell', function(e) {
			if( ! Generator.userIsDrawing ) {
				return;
			}

			Generator.setCellColor($(this), Generator.selectedColor);
		});
	},


	/* UI / DATA UPDATERS */
	setSelectedColor: function(color_id) {
		Generator.selectedColor = color_id;

		var $ui_color = Generator.$color_selector.find('[data-color-index='+Generator.selectedColor+']');

		Generator.$color_selector.find('.current').removeClass('current');
		$ui_color.addClass('current');
	},

	setCellColor: function($cell, color_id) {
		var cell_index = $cell.attr('data-pixel-index');
		Generator.pixels[cell_index] = color_id;
		$cell.attr('data-color', color_id);

		var css_color = 'transparent';
		if( color_id != Generator.NULL_PIXEL ) {
			css_color = Generator.colors[color_id];
		}

		$cell.css('background-color', css_color);
	},


	/* MAIN() / INIT FUNCTION */
	init: function() {
		Generator.generateRandomColors();
		
		Generator.initPixelsValue();

		Generator.buildTable();
		Generator.buildColorSelector();

		Generator.setSelectedColor(0);

		Generator.bindListeners();

		$('#table-pane').append(Generator.$table);
		$('#colors-pane').append(Generator.$color_selector);
	}
}