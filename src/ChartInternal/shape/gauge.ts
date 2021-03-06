/**
 * Copyright (c) 2017 ~ present NAVER Corp.
 * billboard.js project is licensed under the MIT license
 */
import {select as d3Select} from "d3-selection";
import CLASS from "../../config/classes";
import {isFunction} from "../../module/util";

export default {
	initGauge(): void {
		const $$ = this;
		const {config, $el: {arcs}} = $$;
		const appendText = className => {
			arcs.append("text")
				.attr("class", className)
				.style("text-anchor", "middle")
				.style("pointer-events", "none");
		};

		if ($$.hasType("gauge")) {
			arcs.append($$.hasMultiArcGauge() ? "g" : "path")
				.attr("class", CLASS.chartArcsBackground);

			config.gauge_units && appendText(CLASS.chartArcsGaugeUnit);

			if (config.gauge_label_show) {
				appendText(CLASS.chartArcsGaugeMin);
				!config.gauge_fullCircle && appendText(CLASS.chartArcsGaugeMax);
			}
		}
	},

	updateGaugeMax(): void {
		const $$ = this;
		const {config, state} = $$;
		const hasMultiGauge = $$.hasMultiArcGauge();

		// to prevent excluding total data sum during the init(when data.hide option is used), use $$.rendered state value
		const max = hasMultiGauge ?
			$$.getMinMaxData().max[0].value : $$.getTotalDataSum(state.rendered);

		// if gauge_max less than max, make max to max value
		if (max > config.gauge_max) {
			config.gauge_max = max;
		}
	},

	redrawMultiArcGauge(): void {
		const $$ = this;
		const {config, state, $el} = $$;
		const {hiddenTargetIds} = $$.state;

		const arcLabelLines = $el.main.selectAll(`.${CLASS.arcs}`)
			.selectAll(`.${CLASS.arcLabelLine}`)
			.data($$.arcData.bind($$));

		const mainArcLabelLine = arcLabelLines.enter()
			.append("rect")
			.attr("class", d => `${CLASS.arcLabelLine} ${CLASS.target} ${CLASS.target}-${d.data.id}`)
			.merge(arcLabelLines);

		mainArcLabelLine
			.style("fill", d => ($$.levelColor ? $$.levelColor(d.data.values[0].value) : $$.color(d.data)))
			.style("display", config.gauge_label_show ? "" : "none")
			.each(function(d) {
				let lineLength = 0;
				const lineThickness = 2;
				let x = 0;
				let y = 0;
				let transform = "";

				if (hiddenTargetIds.indexOf(d.data.id) < 0) {
					const updated = $$.updateAngle(d);
					const innerLineLength = state.gaugeArcWidth / $$.filterTargetsToShow($$.data.targets).length *
						(updated.index + 1);
					const lineAngle = updated.endAngle - Math.PI / 2;
					const arcInnerRadius = state.radius - innerLineLength;
					const linePositioningAngle = lineAngle - (arcInnerRadius === 0 ? 0 : (1 / arcInnerRadius));

					lineLength = state.radiusExpanded - state.radius + innerLineLength;
					x = Math.cos(linePositioningAngle) * arcInnerRadius;
					y = Math.sin(linePositioningAngle) * arcInnerRadius;
					transform = `rotate(${lineAngle * 180 / Math.PI}, ${x}, ${y})`;
				}

				d3Select(this)
					.attr("x", x)
					.attr("y", y)
					.attr("width", lineLength)
					.attr("height", lineThickness)
					.attr("transform", transform)
					.style("stroke-dasharray", `0, ${lineLength + lineThickness}, 0`);
			});
	},

	textForGaugeMinMax(value: number, isMax?: boolean): number | string {
		const $$ = this;
		const {config} = $$;
		const format = config.gauge_label_extents;

		return isFunction(format) ? format.bind($$.api)(value, isMax) : value;
	},

	getGaugeLabelHeight(): 20 | 0 {
		const {config} = this;

		return this.config.gauge_label_show && !config.gauge_fullCircle ? 20 : 0;
	},

	getPaddingBottomForGauge() {
		const $$ = this;

		return $$.getGaugeLabelHeight() * ($$.config.gauge_label_show ? 2 : 2.5);
	}
};
