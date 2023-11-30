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
  private targetValue: number;

  constructor(
    target: Selection<BaseType, any, any, any>,
    data: IDataGroup,
    settings: CardSettings,
    host: IVisualHost,
  ) {
    this.bulletChartContainer = target
      .append("svg")
      .classed(BulletClassNames.BulletContainer, true)
      .style("width", "100%")
      .style("height", "calc(30% - 10px)")
      .style("margin-left", "2%");
    this.data = data;
    this.targetValue = this.data.bulletTargetValue ?? this.data.mainMeasureValue;
    this.settings = settings;
    this.host = host;
  }

  public getBulletChart(): Selection<BaseType, any, any, any> {
    return this.bulletChartContainer;
  }

  public draw() {
    const bulletSettings = this.settings.bulletChart;
    const maxValue = Math.max(
      this.data.mainMeasureValue,
      this.targetValue ?? this.data.mainMeasureValue,
    );
    const baseRectHeight =
      bulletSettings.targetLineShow && maxValue == this.data.mainMeasureValue
        ? "70%"
        : "100%";

    const xScale = d3
      .scaleLinear()
      .domain([0, maxValue])
      .range([0, this.getSVGRect(this.bulletChartContainer).width]);

    if (bulletSettings.mainColor == "") {
      bulletSettings.mainColor = this.host.colorPalette.getColor(
        this.data.mainMeasureDataLabel,
      ).value;
    }

    this.bulletChartTargetRect = this.bulletChartContainer
      .append("rect")
      .classed(BulletClassNames.BulletTargetRect, true)
      .attr("width", "96%")
      .attr("height", baseRectHeight)
      .style(
        "fill",
        maxValue == this.data.mainMeasureValue
          ? bulletSettings.mainColor
          : bulletSettings.targetColor,
      );
    if (
      bulletSettings.targetLineShow &&
      maxValue == this.data.mainMeasureValue
    ) {
      this.bulletChartTargetRect.attr("y", "15%");
    }
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
        .attr("height", baseRectHeight)
        .style("fill", bulletSettings.mainColor);
      if (
        bulletSettings.targetLineShow &&
        maxValue == this.data.mainMeasureValue
      ) {
        this.bulletChartMainRect.attr("y", "15%");
      }
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
      this.data.additionalMeasures.length > 0 &&
      bulletSettings.targetLineShow
    ) {
      this.bulletChartContainer
        .append("line")
        .attr("x1", () => xScale(this.targetValue))
        .attr("y1", 0)
        .attr("x2", () => xScale(this.targetValue))
        .attr("y2", this.getSVGRect(this.bulletChartContainer).height)
        .style("stroke", bulletSettings.targetLineColor)
        .style("stroke-width", bulletSettings.targetLineWeight);
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
