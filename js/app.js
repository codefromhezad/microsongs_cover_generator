var Generator = {


	/* CONSTS */
	PIXELS_PER_SIDE: 40,
	NUM_COLORS: 14,


	/* UI ACCESSORS */
	$table: null,
	$color_selector: null,


	/* DATA ACCESSORS */
	colors: [],
	currentColor: null,
	pixels: [],
	lastSavedState: null,


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


	/* DATA SAVING / LOADING */
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
				table += '<td><div class="cell" data-pixel-index="'+(x + y * Generator.PIXELS_PER_SIDE)+'" data-color="-1"></div></td>';
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
				Generator.setCurrentColor(color_id);
			}
		})
	},


	/* UI UPDATERS */
	setCurrentColor: function(color_id) {
		Generator.currentColor = color_id;

		var $ui_color = Generator.$color_selector.find('[data-color-index='+Generator.currentColor+']');

		Generator.$color_selector.find('.current').removeClass('current');
		$ui_color.addClass('current');
	},


	/* MAIN() / INIT FUNCTION */
	init: function() {
		Generator.generateRandomColors();

		Generator.buildTable();
		Generator.buildColorSelector();

		Generator.setCurrentColor(0);

		Generator.bindListeners();

		$('#table-pane').append(Generator.$table);
		$('#colors-pane').append(Generator.$color_selector);
	}
}