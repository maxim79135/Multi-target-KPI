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

import { BaseType, select, Selection } from "d3-selection";
import powerbi from "powerbi-visuals-api";
import { CardSettings } from "./settings";
import { TextProperties } from "powerbi-visuals-utils-formattingutils/lib/src/interfaces";

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

interface IAdditionalMeasure {
  id?: string;
  name?: string;
  value?: number;
}

interface IDataGroup {
  displayName?: string;
  mainMeasureValue?: number;
  additionalMeasures?: IAdditionalMeasure[];
}

interface ICardViewModel {
  settings: CardSettings;
  dataGroups: IDataGroup[];
}

interface ILabelProperties {
  textSize: number;
  fontFamily: string;
  isBold: boolean;
  isItalic: boolean;
  color: string;
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
  private model: ICardViewModel;
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
  private isAdditionalCategoryExist: boolean = false;
  private isAdditionalMeasureExist: boolean = false;

  constructor(target: HTMLElement) {
    this.root = select(target).classed(CardClassNames.Root, true);
    this.cardsContainer = this.root
      .append("div")
      .classed(CardClassNames.CardsContainer, true);
  }

  public getModel(): ICardViewModel {
    return this.model;
  }

  public visualTransform(options: VisualUpdateOptions, settings: CardSettings) {
    let dataViews: DataView[] = options.dataViews;
    let dataGroups: IDataGroup[] = [];
    if (
      dataViews &&
      dataViews[0] &&
      dataViews[0].categorical &&
      dataViews[0].categorical.values
    ) {
      let dataCategorical = dataViews[0].categorical;
      let category = dataCategorical.categories
        ? dataCategorical.categories[dataCategorical.categories.length - 1]
        : null;
      let categories = category ? category.values : [""];

      for (let i = 0; i < categories.length; i++) {
        let dataGroup: IDataGroup = {};
        dataGroup.additionalMeasures = [];

        for (let ii = 0; ii < dataCategorical.values.length; ii++) {
          let dataValue = dataCategorical.values[ii];
          let value: any = dataValue.values[i];

          if (dataValue.source.roles["main_measure"]) {
            dataGroup.displayName = category
              ? categories[i].toString()
              : dataValue.source.displayName;
            dataGroup.mainMeasureValue = value;
          }

          [
            "measureComparison1",
            "measureComparison2",
            "measureComparison3",
          ].map((v) => {
            if (dataValue.source.roles[v] && settings.measureComparison[v].show)
              dataGroup.additionalMeasures.push({
                id: v,
                name: dataValue.source.displayName,
                value: <number>dataValue.values[i],
              });
          });
          dataGroup.additionalMeasures.sort((a, b) => {
            if (a.id > b.id) return 1;
            if (a.id < b.id) return -1;
            return 0;
          });
        }
        dataGroups.push(dataGroup);
      }
    }
    this.model = { settings, dataGroups };
    this.numberOfCards = this.model.dataGroups.length;
    this.cardsPerRow = Math.min(
      this.numberOfCards,
      this.model.settings.multiple.cardsPerRow
    );
    this.numberOfRows = Math.ceil(this.numberOfCards / this.cardsPerRow);
  }

  public updateViewport(viewport: powerbi.IViewport) {
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
  }

  public createLabels() {
    this.dataLabels = [];
    this.categoryLabels = [];
    this.additionalCategoryContainers = [];
    this.additionalMeasureContainers = [];
    this.isAdditionalCategoryExist = false;
    this.isAdditionalMeasureExist = false;

    if (this.model.settings.categoryLabel.show) {
      this.createCategoryLabel();
    }
    if (this.model.settings.additionalCategoryLabel.show) {
      this.createAdditionalCategoryLabel();
      this.isAdditionalCategoryExist = true;
    }
    if (
      this.model.settings.measureComparison1.show ||
      this.model.settings.measureComparison2.show ||
      this.model.settings.measureComparison3.show
    ) {
      this.createAdditionalMeasureLabel();
      this.isAdditionalMeasureExist = true;
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
      textProperties.text = Number(
        this.model.dataGroups[i].mainMeasureValue
      ).toFixed(this.model.settings.dataLabel.decimalPlaces);

      this.updateLabelStyles(dataLabel, this.model.settings.dataLabel);
      let categoryValue = TextMeasurementService.getTailoredTextOrDefault(
        textProperties,
        svgRect.width / 2
      );
      this.updateLabelValueWithoutWrapping(dataLabel, categoryValue);

      let x: number, y: number;
      if (this.categoryLabels.length > 0) {
        let categoryLabelSize = this.getLabelSize(this.categoryLabels[i]);
        y =
          this.model.settings.categoryLabel.paddingTop +
          categoryLabelSize.height +
          (svgRect.height -
            this.model.settings.categoryLabel.paddingTop -
            categoryLabelSize.height) /
            2;
      } else {
        y = svgRect.height / 2;
      }
      if (!this.isAdditionalMeasureExist) x = svgRect.width / 2;
      else x = svgRect.width / 4;

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

      this.model.dataGroups[0].additionalMeasures.map((v, j, array) => {
        let additionalCategoryLabel = additionalCategoryContainter
          .append("g")
          .classed(CardClassNames.AdditionalCategoryLabel + i + j, true);
        additionalCategoryLabel.append("text");
        let textProperties = this.getTextProperties(
          this.model.settings.additionalCategoryLabel
        );
        textProperties.text = v.name;
        let additionalCategoryWidth = svgRect.width / (2 * array.length);

        this.updateLabelStyles(
          additionalCategoryLabel,
          this.model.settings.additionalCategoryLabel
        );

        if (this.model.settings.additionalCategoryLabel.wordWrap) {
          let maxDataHeight = svgRect.height / 2;
          this.updateLabelValueWithWrapping(
            additionalCategoryLabel,
            textProperties,
            v.name,
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
        let x: number;
        let y: number;

        if (this.categoryLabels.length > 0) {
          let categoryLabelSize = this.getLabelSize(this.categoryLabels[i]);
          y =
            this.model.settings.categoryLabel.paddingTop +
            categoryLabelSize.height +
            additionalCategoryLabelSize.height / 2 +
            this.model.settings.additionalCategoryLabel.paddingTop;
        } else {
          y = svgRect.height / 2 - additionalCategoryLabelSize.height;
        }
        if (
          this.model.settings.additionalCategoryLabel.horizontalAlignment ==
          "center"
        ) {
          x =
            svgRect.width / 2 +
            j * additionalCategoryWidth +
            additionalCategoryWidth / 2;
          additionalCategoryLabel.select("text").attr("text-anchor", "middle");
        } else if (
          this.model.settings.additionalCategoryLabel.horizontalAlignment ==
          "left"
        ) {
          x =
            svgRect.width / 2 +
            j * additionalCategoryWidth +
            this.model.settings.additionalCategoryLabel.paddingSide;
          additionalCategoryLabel.select("text").attr("text-anchor", "start");
        } else if (
          this.model.settings.additionalCategoryLabel.horizontalAlignment ==
          "right"
        ) {
          x =
            svgRect.width / 2 +
            j * additionalCategoryWidth +
            additionalCategoryWidth -
            this.model.settings.multiple.spaceBetweenCardComponent -
            this.model.settings.additionalCategoryLabel.paddingSide;
          additionalCategoryLabel.select("text").attr("text-anchor", "end");
        }
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
          this.model.settings.measureComparison[v.id]
        );
        textProperties.text =
          this.model.dataGroups[i].additionalMeasures[j].value.toString();
        let additionalMeasureWidth = svgRect.width / (2 * array.length);

        this.updateLabelStyles(
          additionalMeasureLabel,
          this.model.settings.measureComparison[v.id]
        );
        let measureValue = TextMeasurementService.getTailoredTextOrDefault(
          textProperties,
          additionalMeasureWidth
        );
        this.updateLabelValueWithoutWrapping(
          additionalMeasureLabel,
          measureValue
        );

        let additionalMeasureLabelSize = this.getLabelSize(
          additionalMeasureLabel
        );
        let x: number, y: number;

        if (this.isAdditionalCategoryExist) {
          x = Number(
            transform(this.additionalCategoryContainers[i][j].attr("transform"))
              .x
          );
          y =
            Number(
              transform(
                this.additionalCategoryContainers[i][j].attr("transform")
              ).y
            ) +
            additionalMeasureLabelSize.height +
            this.model.settings.measureComparison[v.id].paddingTop;
        } else {
          //   if (this.categoryLabels.length > 0) {
          x =
            svgRect.width / 2 +
            j * additionalMeasureWidth +
            additionalMeasureWidth / 2;
          additionalMeasureLabel.select("text").attr("text-anchor", "middle");
          y = svgRect.height / 2;
          //   }
        }
        additionalMeasureLabel.select("text").attr("text-anchor", "middle");
        additionalMeasureLabel
          .select("text")
          .style("dominant-baseline", "middle");
        additionalMeasureLabel.attr("transform", translate(x, y));
        additionalMeasureLabels.push(additionalMeasureLabel);
      });
      this.additionalMeasureContainers.push(additionalMeasureLabels);
    }
  }

  private getTextProperties(properties: ILabelProperties): TextProperties {
    return {
      fontFamily: properties.fontFamily,
      fontSize: properties.textSize + "px",
      fontWeight: properties.isBold ? "bold" : "normal",
      fontStyle: properties.isItalic ? "italic" : "normal",
    };
  }

  private updateLabelStyles(
    label: Selection<BaseType, any, any, any>,
    styles: ILabelProperties
  ) {
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
