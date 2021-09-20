"use strict";
import * as d3 from "d3";
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import DataView = powerbi.DataView;
import {
  stringExtensions as StringExtensions,
  textMeasurementService as TextMeasurementService,
  wordBreaker,
  interfaces,
} from "powerbi-visuals-utils-formattingutils";
import { manipulation } from "powerbi-visuals-utils-svgutils";
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;

import { BaseType, select, Selection } from "d3-selection";
import powerbi from "powerbi-visuals-api";
import { CardSettings } from "./settings";
import { TextProperties } from "powerbi-visuals-utils-formattingutils/lib/src/interfaces";
import { ICardViewModel, ILabelProperties } from "./model/ViewModel";

import translate = manipulation.translate;
import transform = manipulation.parseTranslateTransform;

export enum CardClassNames {
  Root = "root",
  CardsContainer = "cardsContainer",
  CardContainer = "card card-",
  CategoryLabel = "category category-",
  DataLabel = "data data-",
  AdditionalCategoryContainer = "additional-category-container additional-category-container-",
  AdditionalCategoryLabel = "additional-category additional-category-",
  AdditionalMeasureContainer = "additional-measure-container additional-measure-container-",
  AdditionalMeasureLabel = "additional-measure additional-measure-",
}

export class Card {
  private root: Selection<BaseType, any, any, any>;
  private cardsContainer: Selection<BaseType, any, any, any>;
  private cards: Selection<BaseType, any, any, any>[];
  private svg: Selection<BaseType, any, any, any>[];
  private categoryLabels: Selection<BaseType, any, any, any>[];
  private dataLabels: Selection<BaseType, any, any, any>[];
  private additionalCategoryContainers: Array<
    Selection<BaseType, any, any, any>[]
  >;
  private additionalMeasureContainers: Array<
    Selection<BaseType, any, any, any>[]
  >;
  private cardViewport: { width: number; height: number };
  private cardMargin: {
    left: number;
    top: number;
    right: number;
    bottom: number;
  };
  private numberOfCards: number;
  private cardsPerRow: number;
  private numberOfRows: number;
  private maxMainMeasureWidth: number;

  private model: ICardViewModel;

  constructor(target: VisualConstructorOptions) {
    this.root = select(target.element).classed(CardClassNames.Root, true);
    this.cardsContainer = this.root
      .append("div")
      .classed(CardClassNames.CardsContainer, true);
  }

  public setModel(model: ICardViewModel) {
    this.model = model;
  }

  public updateViewport(viewport: powerbi.IViewport) {
    this.numberOfCards = this.model.dataGroups.length;
    this.cardsPerRow = Math.min(
      this.numberOfCards,
      this.model.settings.multiple.cardsPerRow
    );
    this.numberOfRows = Math.ceil(this.numberOfCards / this.cardsPerRow);
    this.cardMargin = {
      left: 0,
      top: 0,
      right:
        this.cardsPerRow > 1 ? this.model.settings.multiple.cardsMargin : 0,
      bottom:
        this.numberOfRows > 1 ? this.model.settings.multiple.cardsMargin : 0,
    };

    this.cardViewport = {
      width: Math.floor(
        (viewport.width -
          (this.cardMargin.left + this.cardMargin.right) * this.cardsPerRow) /
          this.cardsPerRow
      ),
      height: Math.floor(
        (viewport.height -
          (this.cardMargin.top + this.cardMargin.bottom) * this.numberOfRows) /
          this.numberOfRows
      ),
    };
    this.maxMainMeasureWidth = this.model.settings.dataLabel.percentageWidth;
  }

  public createCardContainer() {
    this.cardsContainer.selectAll(".card").remove();
    this.cards = [];
    this.svg = [];

    for (let i = 0; i < this.model.dataGroups.length; i++) {
      let cardContainer = this.cardsContainer
        .append("div")
        .classed(CardClassNames.CardContainer + i, true)
        .style("margin-left", this.cardMargin.left + "px")
        .style("margin-right", this.cardMargin.right + "px")
        .style("margin-top", this.cardMargin.top + "px")
        .style("margin-bottom", this.cardMargin.bottom + "px")
        .style("width", this.cardViewport.width + "px")
        .style("height", this.cardViewport.height + "px")
        .style("background", this.model.settings.card.backFill)
        .style(
          "border",
          this.model.settings.card.borderShow
            ? this.model.settings.card.borderWeight +
                "px " +
                this.model.settings.card.borderType +
                " " +
                this.model.settings.card.borderFill
            : ""
        );
      this.cards.push(cardContainer);
      this.svg.push(
        cardContainer
          .append("svg")
          .style("width", "100%")
          .style("height", "100%")
      );
    }
    if (this.model.dataGroups.length > 0) {
      let svgRect = this.getSVGRect(this.svg[0]);
      this.maxMainMeasureWidth =
        (svgRect.width * this.maxMainMeasureWidth) / 100;
    }
  }

  public createLabels() {
    this.dataLabels = [];
    this.categoryLabels = [];
    this.additionalCategoryContainers = [];
    this.additionalMeasureContainers = [];

    if (this.model.settings.categoryLabel.show) {
      this.createCategoryLabel();
    }
    if (
      this.model.dataGroups.length > 0 &&
      this.model.dataGroups[0].additionalMeasures.length > 0
    ) {
      this.createAdditionalMeasureLabel();
      this.createAdditionalCategoryLabel();
    }
    this.createDataLabel();
  }

  private createCategoryLabel() {
    for (let i = 0; i < this.model.dataGroups.length; i++) {
      let svg = this.svg[i];
      let categoryLabel = svg
        .append("g")
        .classed(CardClassNames.CategoryLabel + i, true);
      categoryLabel.append("text");

      let svgRect = this.getSVGRect(svg);
      let textProperties = this.getTextProperties(
        this.model.settings.categoryLabel
      );
      textProperties.text = this.model.dataGroups[i].displayName;
      this.updateLabelStyles(categoryLabel, this.model.settings.categoryLabel);

      if (this.model.settings.categoryLabel.wordWrap) {
        let maxDataHeight = svgRect.height / 2;
        this.updateLabelValueWithWrapping(
          categoryLabel,
          textProperties,
          this.model.dataGroups[i].displayName,
          svgRect.width,
          maxDataHeight
        );
      } else {
        let categoryValue = TextMeasurementService.getTailoredTextOrDefault(
          textProperties,
          svgRect.width
        );
        this.updateLabelValueWithoutWrapping(categoryLabel, categoryValue);
      }
      let categoryLabelSize = this.getLabelSize(categoryLabel);
      let x: number;
      let y: number =
        this.model.settings.categoryLabel.paddingTop + categoryLabelSize.height;

      if (this.model.settings.categoryLabel.horizontalAlignment == "center") {
        x = svgRect.width / 2;
        categoryLabel.select("text").attr("text-anchor", "middle");
      } else if (
        this.model.settings.categoryLabel.horizontalAlignment == "left"
      ) {
        x = this.model.settings.categoryLabel.paddingSide;
        categoryLabel.select("text").attr("text-anchor", "start");
      } else if (
        this.model.settings.categoryLabel.horizontalAlignment == "right"
      ) {
        x = svgRect.width - this.model.settings.categoryLabel.paddingSide;
        categoryLabel.select("text").attr("text-anchor", "end");
      }

      categoryLabel.attr("transform", translate(x, y));
      this.categoryLabels.push(categoryLabel);
    }
  }

  private createDataLabel() {
    for (let i = 0; i < this.model.dataGroups.length; i++) {
      let svg = this.svg[i];
      let dataLabel = svg
        .append("g")
        .classed(CardClassNames.DataLabel + i, true);
      dataLabel.append("text");

      let svgRect = this.getSVGRect(svg);
      let textProperties = this.getTextProperties(
        this.model.settings.dataLabel
      );
      textProperties.text = this.model.dataGroups[i].mainMeasureDataLabel;
      this.updateLabelStyles(dataLabel, this.model.settings.dataLabel);
      let categoryValue = TextMeasurementService.getTailoredTextOrDefault(
        textProperties,
        this.maxMainMeasureWidth
      );
      this.updateLabelValueWithoutWrapping(dataLabel, categoryValue);
      let dataLabelSize = this.getLabelSize(dataLabel);

      let x: number, y: number;

      if (
        this.model.dataGroups.length == 0 ||
        this.model.dataGroups[0].additionalMeasures.length == 0
      )
        this.maxMainMeasureWidth = svgRect.width;
      if (this.model.settings.dataLabel.horizontalAlignment == "center") {
        x = this.maxMainMeasureWidth / 2;
        dataLabel.select("text").attr("text-anchor", "middle");
      } else if (this.model.settings.dataLabel.horizontalAlignment == "left") {
        x = dataLabelSize.width / 2;
        dataLabel.select("text").attr("text-anchor", "start");
      } else if (this.model.settings.dataLabel.horizontalAlignment == "right") {
        x = this.maxMainMeasureWidth - dataLabelSize.width / 2;
        dataLabel.select("text").attr("text-anchor", "end");
      }

      if (this.categoryLabels.length == 0) {
        y = svgRect.height / 2;
      } else {
        let categoryLabelSize = this.getLabelSize(this.categoryLabels[i]);
        let startYPos =
          this.model.settings.categoryLabel.paddingTop +
          categoryLabelSize.height +
          (svgRect.height -
            this.model.settings.categoryLabel.paddingTop -
            categoryLabelSize.height) /
            2;
        if (this.model.settings.dataLabel.verticalAlignment == "middle") {
          y = startYPos;
          dataLabel.select("text").style("dominant-baseline", "middle");
        } else if (this.model.settings.dataLabel.verticalAlignment == "top") {
          y = startYPos - dataLabelSize.height;
          dataLabel.select("text").style("dominant-baseline", "text-top");
        } else if (
          this.model.settings.dataLabel.verticalAlignment == "bottom"
        ) {
          y = svgRect.height - dataLabelSize.height / 2;
          dataLabel.select("text").style("dominant-baseline", "text-bottom");
        }
      }

      dataLabel.select("text").style("dominant-baseline", "middle");
      dataLabel.select("text").attr("text-anchor", "middle");
      dataLabel.attr("transform", translate(x, y));
      this.dataLabels.push(dataLabel);
    }
  }

  private createAdditionalCategoryLabel() {
    this.additionalCategoryContainers = [];

    for (let i = 0; i < this.model.dataGroups.length; i++) {
      let svg = this.svg[i];
      let svgRect = this.getSVGRect(svg);
      let additionalCategoryContainter = svg
        .append("g")
        .classed(CardClassNames.AdditionalCategoryContainer + i, true);
      let additionalCategoryLabels: Selection<BaseType, any, any, any>[] = [];
      let additionalMeasureContainer = this.additionalMeasureContainers[i];

      this.model.dataGroups[0].additionalMeasures.map((v, j, array) => {
        let additionalCategoryLabel = additionalCategoryContainter
          .append("g")
          .classed(CardClassNames.AdditionalCategoryLabel + i + j, true);
        additionalCategoryLabel.append("text");
        let textProperties = this.getTextProperties(
          this.model.settings.additionalItems[j]
        );
        textProperties.text = v.displayName;
        let additionalCategoryWidth: number;
        if (this.model.settings.additional.layoutType == "horizontal") {
          additionalCategoryWidth =
            (svgRect.width -
              this.maxMainMeasureWidth -
              // this.model.settings.measureComparison.paddingRight -
              this.model.settings.multiple.spaceBeforeFirstComponent -
              (array.length - 1) *
                this.model.settings.multiple.spaceBetweenCardComponent) /
            array.length;
        } else {
          additionalCategoryWidth =
            (svgRect.width -
              this.maxMainMeasureWidth -
              this.model.settings.multiple.spaceBeforeFirstComponent) /
            2;
        }

        this.updateLabelStyles(
          additionalCategoryLabel,
          this.model.settings.additionalItems[j]
        );

        if (this.model.settings.additional.wordWrap) {
          let maxDataHeight = svgRect.height / 2;
          this.updateLabelValueWithWrapping(
            additionalCategoryLabel,
            textProperties,
            v.displayName,
            additionalCategoryWidth,
            maxDataHeight
          );
        } else {
          let categoryValue = TextMeasurementService.getTailoredTextOrDefault(
            textProperties,
            additionalCategoryWidth
          );
          this.updateLabelValueWithoutWrapping(
            additionalCategoryLabel,
            categoryValue
          );
        }

        let additionalCategoryLabelSize = this.getLabelSize(
          additionalCategoryLabel
        );
        let textAnchor = additionalMeasureContainer[j]
          .select("text")
          .attr("text-anchor");
        let x, y: number;

        if (this.model.settings.additional.layoutType == "horizontal") {
          x = Number(
            transform(additionalMeasureContainer[j].attr("transform")).x
          );
          y =
            Number(
              transform(additionalMeasureContainer[j].attr("transform")).y
            ) -
            additionalCategoryLabelSize.height -
            this.model.settings.additional.verticalPadding;
        } else {
          console.log(textAnchor);

          let startXPosition =
            this.maxMainMeasureWidth +
            this.model.settings.multiple.spaceBeforeFirstComponent +
            additionalCategoryWidth;
          switch (textAnchor) {
            case "middle":
              x = startXPosition + additionalCategoryWidth / 2;
              break;
            case "start":
              x = startXPosition;
              break;
            case "end":
              x = startXPosition + additionalCategoryWidth;
              break;
          }
          y = Number(
            transform(additionalMeasureContainer[j].attr("transform")).y
          );
        }
        additionalCategoryLabel.select("text").attr("text-anchor", textAnchor);
        additionalCategoryLabel
          .select("text")
          .style("dominant-baseline", "middle");
        additionalCategoryLabel.attr("transform", translate(x, y));
        additionalCategoryLabels.push(additionalCategoryLabel);
      });
      this.additionalCategoryContainers.push(additionalCategoryLabels);
    }
  }

  private createAdditionalMeasureLabel() {
    for (let i = 0; i < this.model.dataGroups.length; i++) {
      let svg = this.svg[i];
      let svgRect = this.getSVGRect(svg);
      let additionalMeasureContainter = svg
        .append("g")
        .classed(CardClassNames.AdditionalMeasureContainer + i, true);
      let additionalMeasureLabels = [];

      this.model.dataGroups[0].additionalMeasures.map((v, j, array) => {
        let additionalMeasureLabel = additionalMeasureContainter
          .append("g")
          .classed(CardClassNames.AdditionalMeasureLabel + i + j, true);
        additionalMeasureLabel.append("text");
        let textProperties = this.getTextProperties(
          this.model.settings.additionalItems[j]
        );
        textProperties.text =
          this.model.dataGroups[i].additionalMeasures[j].dataLabel;
        let additionalMeasureWidth, additionalMeasureHeight: number;
        if (this.model.settings.additional.layoutType == "horizontal") {
          additionalMeasureWidth =
            (svgRect.width -
              this.maxMainMeasureWidth -
              // this.model.settings.measureComparison.paddingRight -
              this.model.settings.multiple.spaceBeforeFirstComponent -
              (array.length - 1) *
                this.model.settings.multiple.spaceBetweenCardComponent) /
            array.length;
        } else {
          additionalMeasureWidth =
            (svgRect.width -
              this.maxMainMeasureWidth -
              this.model.settings.multiple.spaceBeforeFirstComponent) /
            2;
          additionalMeasureHeight =
            (svgRect.height -
              this.getSVGRect(this.categoryLabels[i]).height -
              this.model.settings.categoryLabel.paddingTop -
              (array.length - 1) *
                this.model.settings.multiple.spaceBetweenCardComponent -
              2 * this.model.settings.additional.verticalPadding) /
            array.length;
        }
        this.updateLabelStyles(additionalMeasureLabel, {
          fontFamily: this.model.settings.additionalItems[j].fontFamily,
          textSize: this.model.settings.additionalItems[j].textSize,
          isItalic: this.model.settings.additionalItems[j].isItalic,
          isBold: this.model.settings.additionalItems[j].isBold,
          color: this.model.dataGroups[i].additionalMeasures[j].labelFill,
        });
        let measureValue = TextMeasurementService.getTailoredTextOrDefault(
          textProperties,
          additionalMeasureWidth
        );
        this.updateLabelValueWithoutWrapping(
          additionalMeasureLabel,
          measureValue
        );

        console.log(additionalMeasureWidth);

        let additionalMeasureLabelSize = this.getLabelSize(
          additionalMeasureLabel
        );
        let x, y: number;
        let startXMeasures =
          this.maxMainMeasureWidth +
          this.model.settings.multiple.spaceBeforeFirstComponent +
          j * additionalMeasureWidth +
          j * this.model.settings.multiple.spaceBetweenCardComponent;
        let startYMeasures =
          this.getSVGRect(this.categoryLabels[i]).height +
          this.model.settings.categoryLabel.paddingTop +
          this.model.settings.additional.verticalPadding +
          j * additionalMeasureHeight +
          j * this.model.settings.multiple.spaceBetweenCardComponent;
        if (this.model.settings.additional.layoutType == "horizontal") {
          y =
            svgRect.height -
            additionalMeasureLabelSize.height / 2 -
            this.model.settings.additional.verticalPadding;
          if (this.model.settings.additional.horizontalAlignment == "center") {
            x = startXMeasures + additionalMeasureWidth / 2;
            additionalMeasureLabel.select("text").attr("text-anchor", "middle");
          } else if (
            this.model.settings.additional.horizontalAlignment == "left"
          ) {
            x = startXMeasures;
            additionalMeasureLabel.select("text").attr("text-anchor", "start");
          } else if (
            this.model.settings.additional.horizontalAlignment == "right"
          ) {
            x = startXMeasures + additionalMeasureWidth;
            additionalMeasureLabel.select("text").attr("text-anchor", "end");
          }
        } else {
          startXMeasures =
            this.maxMainMeasureWidth +
            this.model.settings.multiple.spaceBeforeFirstComponent;
          if (this.model.settings.additional.horizontalAlignment == "center") {
            x = startXMeasures + additionalMeasureWidth / 2;
            additionalMeasureLabel.select("text").attr("text-anchor", "middle");
          } else if (
            this.model.settings.additional.horizontalAlignment == "left"
          ) {
            x = startXMeasures;
            additionalMeasureLabel.select("text").attr("text-anchor", "start");
          } else if (
            this.model.settings.additional.horizontalAlignment == "right"
          ) {
            x = startXMeasures + additionalMeasureWidth;
            additionalMeasureLabel.select("text").attr("text-anchor", "end");
          }
          y = startYMeasures + additionalMeasureHeight / 2;
        }

        additionalMeasureLabel
          .select("text")
          .style("dominant-baseline", "middle");
        additionalMeasureLabel.attr("transform", translate(x, y));
        additionalMeasureLabels.push(additionalMeasureLabel);
      });
      this.additionalMeasureContainers.push(additionalMeasureLabels);
    }
  }

  private getTextProperties(properties): TextProperties {
    return {
      fontFamily: properties.fontFamily,
      fontSize: properties.textSize + "px",
      fontWeight: properties.isBold ? "bold" : "normal",
      fontStyle: properties.isItalic ? "italic" : "normal",
    };
  }

  private updateLabelStyles(label: Selection<BaseType, any, any, any>, styles) {
    label
      .select("text")
      .style("font-family", styles.fontFamily)
      .style("font-size", styles.textSize + "px")
      .style("font-style", styles.isItalic === true ? "italic" : "normal")
      .style("font-weight", styles.isBold === true ? "bold" : "normal")
      .style("fill", styles.color);
  }

  private updateLabelValueWithoutWrapping(
    label: Selection<BaseType, any, any, any>,
    value: string
  ) {
    label.select("text").text(value);
  }

  private updateLabelValueWithWrapping(
    label: Selection<BaseType, any, any, any>,
    textProperties: TextProperties,
    value: string,
    maxWidth: number,
    maxHeight: number
  ) {
    let textHeight: number =
      TextMeasurementService.estimateSvgTextHeight(textProperties);
    let maxNumLines: number = Math.max(1, Math.floor(maxHeight / textHeight));
    let labelValues = wordBreaker.splitByWidth(
      value,
      textProperties,
      TextMeasurementService.measureSvgTextWidth,
      maxWidth,
      maxNumLines,
      TextMeasurementService.getTailoredTextOrDefault
    );
    label
      .select("text")
      .selectAll("tspan")
      .data(labelValues)
      .enter()
      .append("tspan")
      .attr("x", 0)
      .attr("dy", (d, i) => {
        if (i === 0) {
          return 0;
        } else {
          return textHeight;
        }
      })
      .text((d) => {
        return d;
      });
  }

  private elementExist(element: Selection<BaseType, any, any, any>) {
    if (!element.empty()) {
      return true;
    } else {
      return false;
    }
  }

  private getLabelSize(
    labelGroup: Selection<BaseType, any, any, any>
  ): SVGRect {
    if (this.elementExist(labelGroup)) {
      return <SVGRect>(<any>labelGroup.node()).getBBox();
    } else {
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
    }
  }

  private getSVGRect(element: Selection<BaseType, any, any, any>): DOMRect {
    return <SVGRect>(<SVGElement>element.node()).getBoundingClientRect();
  }
}
