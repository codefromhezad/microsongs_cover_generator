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
	eraserMode: false,


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
	setInitialDefaultValues: function() {

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

	loadState: function(stateString) {
		var jsonState = JSON.parse(stateString);

		Generator.colors = jsonState.colors;
		Generator.pixels = jsonState.pixels;
		Generator.usedPixelsPerColor = jsonState.usedPixelsPerColor;
	},


	/* UI BUILDERS */
	buildTable: function() {
		var table = '<table id="screen-table">';
		for( var y = 0; y < Generator.PIXELS_PER_SIDE; y++ ) {
			table += '<tr>';
			for( var x = 0; x < Generator.PIXELS_PER_SIDE; x++ ) {
				var pixel_index = (x + y * Generator.PIXELS_PER_SIDE);
				var pixel_color_id = Generator.pixels[pixel_index];

				var css_color = 'transparent';
				if( pixel_color_id != Generator.NULL_PIXEL ) {
					css_color = Generator.colors[pixel_color_id];
				}
				
				table += '<td><div class="cell" data-pixel-index="'+pixel_index+'" data-color="'+pixel_color_id+'" style="background-color: '+css_color+';"></div></td>';
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
								'<div class="mode-indicator">' +
									'<i class="fa fa-paint-brush"></i>' +
								'</div>' +
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

		/* User selects color */
		$body.on('click', '#color-selector .color-wrapper', function(e) {
			e.preventDefault();

			var $this = $(this);
			var color_id = parseInt($this.attr('data-color-index'));

			if( ! $this.hasClass('current') ) {
				Generator.setSelectedColor(color_id);
				Generator.setEraserMode(false);
			} else {
				if( ! Generator.eraserMode ) {
					Generator.setEraserMode(color_id);
				} else {
					Generator.setEraserMode(false);
				}
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

			Generator.saveState();
			Generator.updateCurrentStateTextarea();
		});

		/* User is moving mouse over screen "pixels" */
		$body.on('mouseenter', '#screen-table .cell', function(e) {
			if( ! Generator.userIsDrawing ) {
				return;
			}

			Generator.setCellColor($(this), Generator.selectedColor);
			Generator.checkColorAvailabilityToUpdateSelectors();
		});

		/* User loads saved state */
		$body.on('click', '#load-json-state-button', function(e) {
			e.preventDefault();

			var stateString = $('#load-state-json').val();
			Generator.loadState(stateString);
			Generator.init(true);
		})
	},


	/* UI / DATA UPDATERS */
	setSelectedColor: function(color_id) {
		Generator.selectedColor = color_id;

		var $ui_color = Generator.$color_selector.find('[data-color-index='+Generator.selectedColor+']');

		Generator.$color_selector.find('.current').removeClass('current');
		$ui_color.addClass('current');
	},

	setEraserMode: function(color_id) {
		if( color_id === false ) {
			Generator.eraserMode = false;
			var $icon = Generator.$color_selector.find('.mode-indicator .fa-eraser');
			$icon.removeClass().addClass('fa fa-paint-brush');
			$('#current-mode').text('Painting ...');
		} else {
			Generator.eraserMode = true;
			var $wrapper = Generator.$color_selector.find('[data-color-index='+color_id+']');
			$wrapper.find('.mode-indicator i').removeClass().addClass('fa fa-eraser');
			$('#current-mode').text('Erasing ...');
		}
	},

	updateCurrentStateTextarea: function() {
		$('#current-state-json').val(Generator.lastSavedState);
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

		// If not erasing ...
		if( ! Generator.eraserMode ) {

			// If same color, do nothing !
			if( color_id == cell_initial_color ) {
				return;
			}
			
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
		
		} else {
			// Else, if erasing, erase only currently selected color
			if( cell_initial_color != color_id ) {
				return;
			} else {
				color_id = Generator.NULL_PIXEL;
				Generator.usedPixelsPerColor[cell_initial_color] -= 1;
				Generator.updateColorCounter(cell_initial_color);
			}
		}
		
		Generator.pixels[cell_index] = color_id;
		$cell.attr('data-color', color_id);
		$cell.css('background-color', css_color);
	},

	/* MAIN() / INIT FUNCTION */
	init: function(fromLoadedState) {
		if( ! fromLoadedState ) {
			Generator.generateRandomColors();
			Generator.setInitialDefaultValues();

			Generator.bindListeners();
		}

		Generator.buildTable();
		Generator.buildColorSelector();

		Generator.setEraserMode(false);
		Generator.setSelectedColor(0);

		$('#table-pane').html('');
		$('#colors-pane').html('');

		$('#table-pane').append(Generator.$table);
		$('#colors-pane').append(Generator.$color_selector);

		Generator.updateCurrentStateTextarea();
		Generator.checkColorAvailabilityToUpdateSelectors();

		Generator.updateCurrentStateTextarea();
	}
}