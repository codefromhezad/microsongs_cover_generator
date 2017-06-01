var Generator = {


	/* CONSTS */
	PIXELS_PER_SIDE: 40,
	NUM_COLORS: 14,


	/* UI ACCESSORS */
	$table: null,
	$color_selector: null,


	/* DATA ACCESSORS */
	colors: [],


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


	/* UI BUILDERS */
	buildTable: function() {
		var table = '<table id="screen-table">';
		for( var y = 0; y < Generator.PIXELS_PER_SIDE; y++ ) {
			table += '<tr>';
			for( var x = 0; x < Generator.PIXELS_PER_SIDE; x++ ) {
				table += '<td><div class="cell" data-color="-1"></div></td>';
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
							'<div class="color" style="background-color: '+color+';"></div>' +
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


	/* MAIN() / INIT FUNCTION */
	init: function() {
		Generator.generateRandomColors();

		Generator.buildTable();
		Generator.buildColorSelector();

		$('#table-pane').append(Generator.$table);
		$('#colors-pane').append(Generator.$color_selector);
	}
}