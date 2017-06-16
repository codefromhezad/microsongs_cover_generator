var Generator = {

	/* DATA CONSTS */
	NULL_PIXEL: -1,
	ALERT_WARNING: { swal_type: "warning", swal_title: "Be aware!", swal_ok_button: "Dully noted!" }, 
	ALERT_ERROR: { swal_type: "error", swal_title: "Oops!", swal_ok_button: "Oh okay :/" }, 
	ALERT_SUCCESS: { swal_type: "success", swal_title: "Oh yeah!", swal_ok_button: "Neat!" }, 
	ALERT_INFO: { swal_type: "info", swal_title: "Hey!", swal_ok_button: "Okay!" },

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
	$app: null,
	$table: null,
	$color_selector: null,
	$color_picker: null,
	$color_picker_ui: null,
	$selected_color_wrapper: null,

	/* DATA ACCESSORS */
	colors: [],
	usedPixelsPerColor: [],
	selectedColor: null,
	pixels: [],
	lastSavedState: null,
	userIsDrawing: false,
	eraserMode: false,
	colorPickerIsActive: false,


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

	isStateFileValid: function(jsonState) {
		return ( jsonState.colors && jsonState.pixels && jsonState.usedPixelsPerColor ) !== undefined;
	},

	saveState: function() {
		Generator.lastSavedState = JSON.stringify({
			colors: Generator.colors,
			pixels: Generator.pixels,
			usedPixelsPerColor: Generator.usedPixelsPerColor
		});
	},

	loadJsonState: function(jsonState) {
		Generator.colors = jsonState.colors;
		Generator.pixels = jsonState.pixels;
		Generator.usedPixelsPerColor = jsonState.usedPixelsPerColor;
	},

	saveToJsonFile: function() {
		Generator.saveState();
		
		var tstamp = new Date().getTime();
		var filename = 'microsongs_cover_export_'+tstamp+'.json';
		
		var element = document.createElement('a');
		element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(Generator.lastSavedState));
		element.setAttribute('download', filename);

		element.style.display = 'none';
		document.body.appendChild(element);
		element.click();
		document.body.removeChild(element);
	},

	/* ERRORS HANDLER */
	alert: function(alert_type_data, message) {
		swal({
			type: alert_type_data.swal_type,
			title: alert_type_data.swal_title,
			text: message,
			confirmButtonText: alert_type_data.swal_ok_button,
			html: true
		});
	},


	/* UI BUILDERS */
	buildTable: function() {
		var table = '<div id="screen-table">';
		for( var y = 0; y < Generator.PIXELS_PER_SIDE; y++ ) {
			table += '<div class="line">';
			for( var x = 0; x < Generator.PIXELS_PER_SIDE; x++ ) {
				var pixel_index = (x + y * Generator.PIXELS_PER_SIDE);
				var pixel_color_id = Generator.pixels[pixel_index];

				var css_color = 'transparent';
				if( pixel_color_id != Generator.NULL_PIXEL ) {
					css_color = Generator.colors[pixel_color_id];
				}
				
				table += '<div class="outer-cell">' +
					'<div class="cell" data-pixel-index="'+pixel_index+'" data-color="'+pixel_color_id+'" style="background-color: '+css_color+';"></div>' +
				'</div>';
			}
			table += '</div>';
		}
		table += '</div>';

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


	/* UI LISTENERS / PLUGIN INITIATORS */
	initPlugins: function() {

		/* Init color picker */
		Generator.$color_picker = $('#color-picker').spectrum({
			flat: true,
		    showInput: false,
		    showInitial: false,
		    allowEmpty: false,
		    clickoutFiresChange: true,
		    move: function(move_event) {
		    	/* Live color preview */
		    	var color_value = move_event.toHexString();
		    	Generator.updateSelectedColorRGB(color_value);
		    },
		    change: function(change_event) {
		    	if( ! Generator.colorPickerIsActive ) {
		    		return;
		    	}

		    	/* Save new color */
		    	var color_value = change_event.toHexString();

		    	Generator.colors[Generator.selectedColor] = color_value;
		    	Generator.updateSelectedColorRGB(color_value);
		    	Generator.hideColorPicker();
		    }
		});
		Generator.$color_picker_ui = $('.sp-container');

		/* Override "cancel" click since the plugin doesn't
		   triggers a "cancel" */
		Generator.$color_picker_ui.find('.sp-cancel').on('click', function(e) {
			e.preventDefault();
			e.stopPropagation();

			Generator.cancelColorSelection();
		})
	},

	bindListeners: function() {
		var $body = $('body');


		/* User selects color or sets erasing mode */
		$body.on('click', '#color-selector .color-wrapper', function(e) {
			e.preventDefault();

			if( Generator.colorPickerIsActive ) {
				return;
			}

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

		/* User wants to change RGB color for color_ID */
		$body.on('contextmenu', '#color-selector .color-wrapper .color', function(e) {
			e.preventDefault();

			if( Generator.colorPickerIsActive ) {
				return;
			}

			var $this = $(this);
			var $wrapper = $this.closest('.color-wrapper');

			var color_id = parseInt($wrapper.attr('data-color-index'));

			Generator.showColorPicker(color_id);
		});

		/* User starts drawing */
		$body.on('mousedown', '#screen-table', function(e) {
			e.preventDefault();

			if( Generator.colorPickerIsActive || e.which != 1  ) {
				return;
			}

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

			if( Generator.colorPickerIsActive ) {
				return;
			}

			Generator.userIsDrawing = false;
		});

		/* User is moving mouse over screen "pixels" */
		$body.on('mouseenter', '#screen-table .cell', function(e) {
			if( Generator.colorPickerIsActive || ! Generator.userIsDrawing ) {
				return;
			}

			Generator.setCellColor($(this), Generator.selectedColor);
			Generator.checkColorAvailabilityToUpdateSelectors();
		});

		/* MENU INTERACTIONS */
		/* Save to JSON file */
		$body.on('click', '#export-to-json-file', function(e) {
			e.preventDefault();

			if( Generator.colorPickerIsActive ) {
				return;
			}

			Generator.saveToJsonFile();
		});

		/* Avoid showing file dialog on import button is color picker is active */
		$body.on('click', '#import-json-file-file-input', function(e) {
			if( Generator.colorPickerIsActive ) {
				e.preventDefault();
				return;
			}
		});

		/* Load JSON file */
		$body.on('change', '#import-json-file-file-input', function(e) {
			if( Generator.colorPickerIsActive ) {
				return;
			}

			if (! e.target.files && e.target.files[0]) {
				return;
			}

			var file = e.target.files[0];
			var fileExtension = file.name.split('.').pop().toLowerCase();
			
			if( fileExtension === 'json' ) {
				var reader = new FileReader();
				reader.onload = function(e) {
					var isFileValid = true;
					var contents = e.target.result;
					var jsonState;

					try {
						jsonState = JSON.parse(contents);

						if( ! Generator.isStateFileValid(jsonState) ) {
							isFileValid = false;
						}
					} catch(e) {
						isFileValid = false;
					}
					
					if( isFileValid ) {
						Generator.loadJsonState(jsonState);
						Generator.init(true);
					} else {
						Generator.alert(Generator.ALERT_ERROR, 'Looks like the state file you selected is either invalid or corrupted');
					}
				};
				reader.readAsText(file);
			
			} else {
				Generator.alert(Generator.ALERT_ERROR, 'Looks like the file you selected is not a valid state file');
			}

		});
	},


	/* UI / DATA UPDATERS */
	setSelectedColor: function(color_id) {
		Generator.selectedColor = color_id;

		Generator.$selected_color_wrapper = Generator.$color_selector.find('[data-color-index='+Generator.selectedColor+']');

		Generator.$color_selector.find('.current').removeClass('current');
		Generator.$selected_color_wrapper.addClass('current');
	},

	updateSelectedColorRGB: function(color_value) {
		Generator.$selected_color_wrapper.find('.color').css('background', color_value);
		Generator.$table.find('.cell[data-color='+Generator.selectedColor+']').css({
			'background-color': color_value
		});
	},

	showColorPicker: function(color_id) {
		Generator.colorPickerIsActive = true;
		Generator.$app.addClass('color-picker-mode');

		var $wrapper = $('#color-selector .color-wrapper[data-color-index='+color_id+']');
		var color_value = Generator.colors[color_id];
		var wrapper_position_info = $wrapper[0].getBoundingClientRect();

		Generator.setSelectedColor(color_id);

		Generator.$color_picker.spectrum('set', color_value);
		Generator.$color_picker_ui.css({
			display: 'inline-block',
			top: wrapper_position_info.top,
			left: wrapper_position_info.right + 15
		});
		Generator.$color_picker.spectrum('reflow');
	},

	hideColorPicker: function() {
		Generator.colorPickerIsActive = false;
		Generator.$app.removeClass('color-picker-mode');
		Generator.$color_picker_ui.hide();
	},

	cancelColorSelection: function() {
		Generator.hideColorPicker();
		
		/* Reset color to original color */
		var color_value = Generator.colors[Generator.selectedColor];
		Generator.$selected_color_wrapper.find('.color').css('background', color_value);
		Generator.$table.find('.cell[data-color='+Generator.selectedColor+']').css({
			'background-color': color_value
		});
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
	init: function(reinitiating) {
		if( ! reinitiating ) {
			Generator.$app = $('#app');

			Generator.generateRandomColors();
			Generator.setInitialDefaultValues();
			Generator.initPlugins();
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

		Generator.checkColorAvailabilityToUpdateSelectors();
	}
}