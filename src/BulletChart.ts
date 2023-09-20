"use strict";
import * as d3 from "d3";
import { BaseType, select, Selection } from "d3-selection";

import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import powerbi from "powerbi-visuals-api";
import { ICardViewModel, IDataGroup } from "./model/ViewModel";
import { CardSettings } from "./settings";

export enum BulletClassNames {
  Root = "root",
  BulletContainer = "bullet-container",
  BulletMainRect = "bullet-main-rect",
  BulletTargetRect = "bullet-target-rect",
}

export class BulletChart {
  private bulletChartContainer: Selection<BaseType, any, any, any>;
  private bulletChartMainRect: Selection<BaseType, any, any, any>;
  private bulletChartTargetRect: Selection<BaseType, any, any, any>;

  private host: IVisualHost;
  private data: IDataGroup;
  private settings: CardSettings;

  constructor(
    target: Selection<BaseType, any, any, any>,
    data: IDataGroup,
    settings: CardSettings,
  ) {
    this.bulletChartContainer = target
      .append("svg")
      .classed(BulletClassNames.BulletContainer, true)
      .style("width", "100%")
      .style("height", "30%")
      .style("margin-left", "2%")
      .style("margin-right", "2%");
    this.data = data;
    this.settings = settings;
  }

  public getBulletChart(): Selection<BaseType, any, any, any> {
    return this.bulletChartContainer;
  }

  public draw() {
    const bulletSettings = this.settings.bulletChart;
    const maxValue = Math.max(
      this.data.mainMeasureValue,
      this.data.additionalMeasures[0]?.measureValue ??
        this.data.mainMeasureValue,
    );

    const xScale = d3
      .scaleLinear()
      .domain([0, maxValue])
      .range([0, this.getSVGRect(this.bulletChartContainer).width]);

    this.bulletChartTargetRect = this.bulletChartContainer
      .append("rect")
      .classed(BulletClassNames.BulletTargetRect, true)
      .attr("width", "96%")
      .attr("height", "100%")
      .style(
        "fill",
        maxValue == this.data.mainMeasureValue
          ? bulletSettings.mainColor
          : bulletSettings.targetColor,
      );
    if (bulletSettings.borderShow) {
      this.bulletChartTargetRect
        .attr("rx", bulletSettings.roundEdges)
        .attr("ry", bulletSettings.roundEdges)
        .attr("stroke", bulletSettings.borderFill)
        .attr("stroke-width", bulletSettings.borderWeight);
    }

    if (maxValue != this.data.mainMeasureValue) {
      this.bulletChartMainRect = this.bulletChartContainer
        .append("rect")
        .classed(BulletClassNames.BulletMainRect, true)
        .attr("width", () => xScale(this.data.mainMeasureValue))
        .attr("height", "100%")
        .style("fill", bulletSettings.mainColor);
      if (bulletSettings.borderShow) {
        this.bulletChartMainRect
          .attr("rx", bulletSettings.roundEdges)
          .attr("ry", bulletSettings.roundEdges)
          .attr("stroke", bulletSettings.borderFill)
          .attr("stroke-width", bulletSettings.borderWeight);
      }
    }

    if (
      maxValue == this.data.mainMeasureValue &&
      this.data.additionalMeasures.length > 0
    ) {
      console.log(this.getSVGRect(this.bulletChartContainer));
      this.bulletChartContainer
        .append("line")
        .attr("x1", () => xScale(this.data.additionalMeasures[0]?.measureValue))
        .attr("y1", 0)
        .attr("x2", () => xScale(this.data.additionalMeasures[0]?.measureValue))
        .attr("y2", this.getSVGRect(this.bulletChartContainer).height)
        .style("stroke", "black")
        .style("stroke-width", 3);
    }
  }

  private getSVGRect(element: Selection<BaseType, any, any, any>): DOMRect {
    if (element == undefined)
      return {
        width: 0,
        height: 0,
        x: 0,
        y: 0,
        bottom: 0,
        top: 0,
        left: 0,
        right: 0,
        toJSON: null,
      };
    return <SVGRect>(<SVGElement>element.node()).getBoundingClientRect();
  }
}
