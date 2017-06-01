var Generator = {

	/* DATA CONSTS */
	NULL_PIXEL: -1,

	/* APP CONSTS */
	PIXELS_PER_SIDE: 40,
	NUM_COLORS: 14,
	MAX_PIXELS_PER_COLOR: [
		90, // Apex
		122, // A better sight
		89, // An entity
		135, // Canopy
		128, // Retrofutur
		108, // Four Chords For Astor
		116, // Skylines
		131, // What was that?
		125, // Drum and Grass
		120, // Asking for a favour at the worst time
		113, // Liars
		117, // Crawlers
		120, // Centipede
		86 // ??
	],


	/* UI ACCESSORS */
	$table: null,
	$color_selector: null,


	/* DATA ACCESSORS */
	colors: [],
	usedPixelsPerColor: [],
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
	initPixelsValueAndAvailablePixels: function() {

		// Set all pixels to their default value (NULL_PIXEL)
		var total_pixels = Generator.PIXELS_PER_SIDE * Generator.PIXELS_PER_SIDE;
		for(var i = 0; i < total_pixels; i++) {
			Generator.pixels[i] = Generator.NULL_PIXEL;
		}

		// Set default available pixels per color
		for(var i = 0; i < Generator.NUM_COLORS; i++) {
			Generator.usedPixelsPerColor[i] = 0;
		}

	},

	saveState: function() {
		Generator.lastSavedState = JSON.stringify({
			colors: Generator.colors,
			pixels: Generator.pixels,
			usedPixelsPerColor: Generator.usedPixelsPerColor
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
									'<span class="available">'+Generator.usedPixelsPerColor[c]+'</span> / ' +
									'<span class="total">'+Generator.MAX_PIXELS_PER_COLOR[c]+'</span>' +
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
				
				/* Except if no pixel available for this color, in this case, do nothing */
				if( $this.hasClass('empty') ) {
					return;
				}

				Generator.setSelectedColor(color_id);
			}
		});

		/* User starts drawing */
		$body.on('mousedown', '#screen-table', function(e) {
			e.preventDefault();
			Generator.userIsDrawing = true;

			var $target = $(e.target);
			if( $target.is('.cell') ) {
				Generator.setCellColor($target, Generator.selectedColor);
				Generator.checkColorAvailabilityToUpdateSelectors();
			}
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
			Generator.checkColorAvailabilityToUpdateSelectors();
		});
	},


	/* UI / DATA UPDATERS */
	setSelectedColor: function(color_id) {
		Generator.selectedColor = color_id;

		var $ui_color = Generator.$color_selector.find('[data-color-index='+Generator.selectedColor+']');

		Generator.$color_selector.find('.current').removeClass('current');
		$ui_color.addClass('current');
	},

	checkColorAvailabilityToUpdateSelectors: function() {
		for( var c = 0; c < Generator.NUM_COLORS; c++ ) {
			var colorCounter = Generator.usedPixelsPerColor[c];
			var colorMax = Generator.MAX_PIXELS_PER_COLOR[c];
			var $colorSelectorUI = Generator.$color_selector.find('[data-color-index='+c+']');

			if( colorCounter >= colorMax ) {
				$colorSelectorUI.addClass('empty');
			} else {
				$colorSelectorUI.removeClass('empty');
			}
		}
	},

	updateColorCounter(color_id) {
		var $wrapper = Generator.$color_selector.find('[data-color-index='+color_id+']');
		$wrapper.find('.metas .counter .available').text(Generator.usedPixelsPerColor[color_id]);
	},

	setCellColor: function($cell, color_id) {
		var cell_index = $cell.attr('data-pixel-index');
		var cell_initial_color = $cell.attr('data-color');
		var css_color = 'transparent';

		// If same color, do nothing !
		if( color_id == cell_initial_color ) {
			return;
		}

		// If not erasing ...
		if(color_id != Generator.NULL_PIXEL) {

			// Check there are available pixels for color_id
			var colorCounter = Generator.usedPixelsPerColor[color_id];
			var colorMax = Generator.MAX_PIXELS_PER_COLOR[color_id];

			// If not, do nothing !
			if( colorCounter >= colorMax ) {
				Generator.userIsDrawing = false;
				return;
			}

			// Else, if there is already a color on the cell,
			// overwrite it, and increment the number of 
			// available pixels for this initial color
			if( cell_initial_color != Generator.NULL_PIXEL ) {
				Generator.usedPixelsPerColor[cell_initial_color] -= 1;
				Generator.updateColorCounter(cell_initial_color);
			}

			// Finally, set Pixel Color
			css_color = Generator.colors[color_id];
			Generator.usedPixelsPerColor[color_id] += 1;
			Generator.updateColorCounter(color_id);
		}
		
		Generator.pixels[cell_index] = color_id;
		$cell.attr('data-color', color_id);
		$cell.css('background-color', css_color);
	},


	/* MAIN() / INIT FUNCTION */
	init: function() {
		Generator.generateRandomColors();

		Generator.initPixelsValueAndAvailablePixels();

		Generator.buildTable();
		Generator.buildColorSelector();

		Generator.setSelectedColor(0);

		Generator.bindListeners();

		$('#table-pane').append(Generator.$table);
		$('#colors-pane').append(Generator.$color_selector);
	}
}