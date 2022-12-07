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
import "regenerator-runtime/runtime";
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;

import { BaseType, select, Selection } from "d3-selection";
const getEvent = () => require("d3-selection").event;
import powerbi from "powerbi-visuals-api";
import { TextProperties } from "powerbi-visuals-utils-formattingutils/lib/src/interfaces";
import { ICardViewModel, IDataGroup } from "./model/ViewModel";
import { IFontProperties } from "./model/visualTransform";
import {
  createTooltipServiceWrapper,
  ITooltipServiceWrapper,
} from "powerbi-visuals-utils-tooltiputils";
import VisualTooltipDataItem = powerbi.extensibility.VisualTooltipDataItem;
import ISelectionManager = powerbi.extensibility.ISelectionManager;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import translate = manipulation.translate;
import parseTranslateTransform = manipulation.parseTranslateTransform;

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
  private host: IVisualHost;
  private tooltipServiceWrapper: ITooltipServiceWrapper;
  private selectionManager: ISelectionManager;
  private root: Selection<BaseType, any, any, any>;
  private cardsContainer: Selection<BaseType, any, any, any>;
  private cards: Selection<BaseType, any, any, any>[];
  private svg: Selection<BaseType, any, any, any>[];
  private categoryLabels: Selection<BaseType, any, any, any>[];
  public dataLabels: Selection<BaseType, any, any, any>[];
  private additionalCategoryContainers: Selection<BaseType, any, any, any>[][];
  private additionalMeasureContainers: Selection<BaseType, any, any, any>[][];
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
  private additionalMeasureWidth: number;
  private additionalCategoryWidth: number;
  private additionalMeasureContainerWidth: number;

  private model: ICardViewModel;

  constructor(target: VisualConstructorOptions) {
    this.root = select(target.element).classed(CardClassNames.Root, true);
    this.host = target.host;
    this.cardsContainer = this.root
      .append("div")
      .classed(CardClassNames.CardsContainer, true);
    this.tooltipServiceWrapper = createTooltipServiceWrapper(
      target.host.tooltipService,
      target.element
    );
    this.selectionManager = target.host.createSelectionManager();
  }

  public setModel(model: ICardViewModel) {
    this.model = model;
  }

  public updateViewport(viewport: powerbi.IViewport) {
    this.numberOfCards = this.model.dataGroups.length;
    this.cardsPerRow = Math.min(
      this.numberOfCards,
      this.model.settings.category.cardsPerRow
    );
    this.numberOfRows = Math.ceil(this.numberOfCards / this.cardsPerRow);
    this.cardMargin = {
      left: 0,
      top: 0,
      right:
        this.cardsPerRow > 1 ? this.model.settings.category.cardsMargin : 0,
      bottom:
        this.numberOfRows > 1 ? this.model.settings.category.cardsMargin : 0,
    };

    this.cardViewport = {
      width: Math.floor(
        (viewport.width -
          (this.cardMargin.left + this.cardMargin.right) *
            (this.cardsPerRow - 1)) /
          this.cardsPerRow
      ),
      height: Math.floor(
        (viewport.height -
          (this.cardMargin.top + this.cardMargin.bottom) * this.numberOfRows) /
          this.numberOfRows
      ),
    };
    this.maxMainMeasureWidth = this.model.settings.grid.percentageWidth;
  }

  public createCardContainer() {
    this.cardsContainer.selectAll(".card").remove();
    this.cards = [];
    this.svg = [];

    for (let i = 0; i < this.model.dataGroups.length; i++) {
      let marginRight =
        (i + 1) % this.cardsPerRow == 0 && i != 0 ? 0 : this.cardMargin.right;
      let cardContainer = this.cardsContainer
        .append("div")
        .classed(CardClassNames.CardContainer + i, true)
        .style("margin-left", this.cardMargin.left + "px")
        .style("margin-right", marginRight + "px")
        .style("margin-top", this.cardMargin.top + "px")
        .style("margin-bottom", this.cardMargin.bottom + "px")
        .style("width", this.cardViewport.width + "px")
        .style("height", this.cardViewport.height + "px");
      this.cardsContainer.on("contextmenu", () => {
        const mouseEvent: MouseEvent = getEvent();
        const eventTarget: EventTarget = mouseEvent.target;
        let dataPoint: any = select(<d3.BaseType>eventTarget).datum();

        this.selectionManager.showContextMenu(
          dataPoint ? dataPoint.selectionId : {},
          {
            x: mouseEvent.clientX,
            y: mouseEvent.clientY,
          }
        );
        mouseEvent.preventDefault();
      });

      this.cardsContainer.on("click", () => {
        if (this.model.dataGroups.length <= 1) return;

        if (this.host.hostCapabilities.allowInteractions) {
          const mouseEvent: MouseEvent = getEvent();
          const eventTarget: EventTarget = mouseEvent.target;
          let dataPoint: any = select(<d3.BaseType>eventTarget).datum();
          if (!dataPoint) this.selectionManager.clear();
        }
      });

      cardContainer.on("click", () => {
        if (this.model.dataGroups.length <= 1) return;

        if (this.host.hostCapabilities.allowInteractions) {
          const mouseEvent: MouseEvent = getEvent();
          const eventTarget: EventTarget = mouseEvent.target;
          let dataPoint: any = select(<d3.BaseType>eventTarget).datum();
          const isCtrlPressed: boolean = mouseEvent.ctrlKey;
          this.selectionManager.select(
            dataPoint ? dataPoint.selectionId : {},
            isCtrlPressed
          );
        }
      });
      if (this.model.settings.background.layoutShow) {
        let backgroundColor = d3.color(this.model.settings.background.backFill);
        backgroundColor.opacity =
          1 - this.model.settings.background.transparency / 100;
        cardContainer.style("background-color", backgroundColor.formatRgb());
      }
      if (this.model.settings.background.borderShow) {
        cardContainer
          .style(
            "border",
            this.model.settings.background.borderShow
              ? this.model.settings.background.borderWeight +
                  "px solid" +
                  // this.model.settings.background.borderType +
                  // " " +
                  this.model.settings.background.borderFill
              : ""
          )
          .style(
            "border-radius",
            `${this.model.settings.background.roundEdges}px`
          );
      }
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
      this.additionalMeasureContainerWidth =
        svgRect.width -
        this.maxMainMeasureWidth -
        this.model.settings.additional.paddingLeft -
        this.model.settings.additional.paddingRight;
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

  public createTooltip() {
    let cardSelection = this.cardsContainer
      .selectAll(".card")
      .data(this.model.dataGroups);
    let cardSelectionMerged = cardSelection
      .enter()
      .append("rect")
      .merge(<any>cardSelection);

    this.tooltipServiceWrapper.addTooltip(
      cardSelectionMerged.select("svg"),
      (datapoint: IDataGroup) => this.getTooltipData(datapoint, "additional"),
      (datapoint: IDataGroup) => datapoint.selectionId
    );

    // this.tooltipServiceWrapper.addTooltip(
    //   cardSelectionMerged.select(".data"),
    //   (datapoint: IDataGroup) => this.getTooltipData(datapoint, "main"),
    //   (datapoint: IDataGroup) => datapoint.selectionId
    // );
  }

  private getTooltipData(
    values: IDataGroup,
    type: string
  ): VisualTooltipDataItem[] {
    let tooltipData: VisualTooltipDataItem[] = [];

    // } else if (type == "main") {
    tooltipData.push({
      displayName: values.displayName,
      value: values.mainMeasureDataLabel,
    });
    // }

    // if (type == "additional") {
    let additionalMeasures = values.additionalMeasures;
    for (let i = 0; i < additionalMeasures.length; i++) {
      tooltipData.push({
        displayName: additionalMeasures[i].displayName,
        value: additionalMeasures[i].dataLabel,
      });
    }

    for (let i = 0; i < values.tooltipValues.length; i++) {
      tooltipData.push({
        displayName: values.tooltipValues[i].displayName,
        value: values.tooltipValues[i].dataLabel,
      });
    }

    return tooltipData;
  }

  private createCategoryLabel() {
    for (let i = 0; i < this.model.dataGroups.length; i++) {
      let svg = this.svg[i];
      let categoryLabel = svg
        .append("g")
        .classed(CardClassNames.CategoryLabel + i, true);
      categoryLabel.append("text");

      let svgRect = this.getSVGRect(svg);
      const settings = this.model.settings;
      let style = {
        fontFamily: settings.font.categoryfontFamily,
        textSize: settings.font.categoryTextSize,
        isItalic: settings.font.categoryIsItalic,
        isBold: settings.font.categoryIsBold,
        isUnderline: settings.font.categoryIsUnderline,
        color: settings.color.categoryColor,
      };
      let textProperties = this.getTextProperties(style);
      textProperties.text = this.model.dataGroups[i].displayName;
      this.updateLabelStyles(categoryLabel, style);

      if (settings.font.categoryWordWrap_) {
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
      let categoryLabelSize = this.getSVGRect(categoryLabel);
      let x: number;
      let y: number =
        settings.categoryLabel.paddingTop + categoryLabelSize.height;

      if (settings.categoryLabel.horizontalAlignment == "center") {
        if (
          settings.categoryLabel.position == "aboveMainMeasure" &&
          this.model.dataGroups[i].additionalMeasures.length > 0
        ) {
          x = this.maxMainMeasureWidth / 2;
        } else {
          x = svgRect.width / 2;
        }
        categoryLabel.select("text").attr("text-anchor", "middle");
      } else if (settings.categoryLabel.horizontalAlignment == "left") {
        x = settings.categoryLabel.paddingSide;
        categoryLabel.select("text").attr("text-anchor", "start");
      } else if (settings.categoryLabel.horizontalAlignment == "right") {
        if (
          settings.categoryLabel.position == "aboveMainMeasure" &&
          this.model.dataGroups[i].additionalMeasures.length > 0
        ) {
          x = this.maxMainMeasureWidth - settings.categoryLabel.paddingSide;
        } else {
          x = svgRect.width - settings.categoryLabel.paddingSide;
        }
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
      const settings = this.model.settings;
      let style = {
        fontFamily: settings.font.mainfontFamily,
        textSize: settings.font.mainTextSize,
        isItalic: settings.font.mainIsItalic,
        isBold: settings.font.mainIsBold,
        isUnderline: settings.font.mainIsUnderline,
        color: settings.color.mainColor,
      };
      let textProperties = this.getTextProperties(style);
      textProperties.text = this.model.dataGroups[i].mainMeasureDataLabel;
      this.updateLabelStyles(dataLabel, style);
      let categoryValue = TextMeasurementService.getTailoredTextOrDefault(
        textProperties,
        this.maxMainMeasureWidth
      );
      this.updateLabelValueWithoutWrapping(dataLabel, categoryValue);
      let dataLabelSize = this.getSVGRect(dataLabel);

      let x: number, y: number;

      if (
        this.model.dataGroups.length == 0 ||
        this.model.dataGroups[0].additionalMeasures.length == 0
      )
        this.maxMainMeasureWidth = svgRect.width;
      if (settings.dataLabel.horizontalAlignment == "center") {
        x = this.maxMainMeasureWidth / 2;
      } else if (settings.dataLabel.horizontalAlignment == "left") {
        x = dataLabelSize.width / 2 + settings.dataLabel.paddingSide;
      } else if (settings.dataLabel.horizontalAlignment == "right") {
        x =
          this.maxMainMeasureWidth -
          dataLabelSize.width / 2 -
          settings.dataLabel.paddingSide;
      }

      if (this.categoryLabels.length == 0) {
        y = svgRect.height / 2;
      } else {
        let categoryLabelSize = this.getSVGRect(this.categoryLabels[i]);
        if (settings.dataLabel.verticalAlignment == "middle") {
          y =
            settings.categoryLabel.paddingTop +
            categoryLabelSize.height +
            (svgRect.height -
              settings.categoryLabel.paddingTop -
              categoryLabelSize.height) /
              2;
        } else if (settings.dataLabel.verticalAlignment == "top") {
          y =
            settings.categoryLabel.paddingTop +
            categoryLabelSize.height +
            dataLabelSize.height / 2 +
            settings.dataLabel.paddingTop;
        } else if (settings.dataLabel.verticalAlignment == "bottom") {
          y =
            svgRect.height -
            dataLabelSize.height / 2 -
            settings.dataLabel.paddingBottom;
        }
      }

      dataLabel.select("text").style("dominant-baseline", "middle");
      dataLabel.select("text").attr("text-anchor", "middle");
      dataLabel.attr("transform", translate(x, y));
      this.dataLabels.push(dataLabel);
    }
  }

  // tslint:disable-next-line: max-func-body-length
  private createAdditionalCategoryLabel() {
    this.additionalCategoryContainers = [];
    const settings = this.model.settings;

    for (let i = 0; i < this.model.dataGroups.length; i++) {
      let svg = this.svg[i];
      let svgRect = this.getSVGRect(svg);
      let additionalCategoryContainter = svg
        .append("g")
        .classed(CardClassNames.AdditionalCategoryContainer + i, true);
      let additionalCategoryLabels: Selection<BaseType, any, any, any>[] = [];
      let additionalMeasureContainer = this.additionalMeasureContainers[i];
      let minYPos = Math.min.apply(
        Math,
        additionalMeasureContainer.map((v) =>
          Math.abs(this.getSVGRect(svg).y - this.getSVGRect(v).top)
        )
      );
      // tslint:disable-next-line: max-func-body-length
      this.model.dataGroups[0].additionalMeasures.map((v, j, array) => {
        let style: IFontProperties = {
          fontFamily: settings.font.additionalNamefontFamily,
          textSize: settings.font.additionalNameTextSize,
          isItalic: settings.font.additionalNameIsItalic,
          isBold: settings.font.additionalNameIsBold,
          isUnderline: settings.font.additionalNameIsUnderline,
          color: v.labelFill,
        };
        let additionalCategoryLabel = additionalCategoryContainter
          .append("g")
          .classed(CardClassNames.AdditionalCategoryLabel + i + j, true);
        additionalCategoryLabel.append("text");
        let textProperties = this.getTextProperties(style);
        textProperties.text = v.displayName;
        if (settings.additional.layoutType == "horizontal") {
          this.additionalCategoryWidth =
            (svgRect.width -
              this.maxMainMeasureWidth -
              settings.additional.paddingRight -
              settings.additional.paddingLeft -
              (array.length - 1) * settings.additional.marginOfMeasure) /
            array.length;
        } else {
          if (
            settings.additional.textAnchor == "left" ||
            settings.additional.textAnchor == "right"
          ) {
            this.additionalCategoryWidth =
              ((svgRect.width -
                this.maxMainMeasureWidth -
                settings.additional.paddingLeft -
                settings.additional.paddingRight) *
                (100 - settings.additional.percentageWidth)) /
              100;
          } else {
            this.additionalCategoryWidth =
              svgRect.width -
              this.maxMainMeasureWidth -
              settings.additional.paddingLeft -
              settings.additional.paddingRight;
          }
        }

        this.updateLabelStyles(additionalCategoryLabel, style);

        if (settings.font.additionalNameWordWrap_) {
          let maxDataHeight = svgRect.height / 2;
          this.updateLabelValueWithWrapping(
            additionalCategoryLabel,
            textProperties,
            v.displayName,
            this.additionalCategoryWidth,
            maxDataHeight
          );
        } else {
          let categoryValue = TextMeasurementService.getTailoredTextOrDefault(
            textProperties,
            this.additionalCategoryWidth
          );
          this.updateLabelValueWithoutWrapping(
            additionalCategoryLabel,
            categoryValue
          );
        }

        let textAnchor = additionalMeasureContainer[j]
          .select("text")
          .attr("text-anchor");
        let x: number, y: number;

        if (settings.additional.layoutType == "horizontal") {
          x = Number(
            parseTranslateTransform(
              additionalMeasureContainer[j].attr("transform")
            ).x
          );
          y = minYPos - this.getSVGRect(additionalCategoryLabel).height / 2;
          additionalCategoryLabel
            .select("text")
            .style("dominant-baseline", "text-bottom");
        } else {
          let startXPosition: number;
          if (
            settings.additional.textAnchor == "left" ||
            settings.additional.textAnchor == "right"
          ) {
            startXPosition =
              this.maxMainMeasureWidth +
              settings.additional.paddingLeft +
              (settings.additional.textAnchor == "left"
                ? 0
                : this.additionalMeasureWidth);
            y = Number(
              parseTranslateTransform(
                additionalMeasureContainer[j].attr("transform")
              ).y
            );
            additionalCategoryLabel
              .select("text")
              .style("dominant-baseline", "middle");
          } else {
            startXPosition =
              this.maxMainMeasureWidth + settings.additional.paddingLeft;
            y =
              settings.additional.textAnchor == "top"
                ? Math.abs(
                    this.getSVGRect(svg).y -
                      this.getSVGRect(additionalMeasureContainer[j]).top
                  ) - 5
                : Math.abs(
                    this.getSVGRect(svg).y -
                      this.getSVGRect(additionalMeasureContainer[j]).bottom
                  ) + this.getSVGRect(additionalCategoryLabel).height;
          }
          switch (textAnchor) {
            case "middle":
              x = startXPosition + this.additionalCategoryWidth / 2;
              break;
            case "start":
              x = startXPosition;
              break;
            case "end":
              x = startXPosition + this.additionalCategoryWidth;
              break;
          }
        }
        additionalCategoryLabel.select("text").attr("text-anchor", textAnchor);
        additionalCategoryLabel.attr("transform", translate(x, y));
        additionalCategoryLabels.push(additionalCategoryLabel);
      });
      this.additionalCategoryContainers.push(additionalCategoryLabels);
    }
  }

  // tslint:disable-next-line: max-func-body-length
  private createAdditionalMeasureLabel() {
    for (let i = 0; i < this.model.dataGroups.length; i++) {
      let svg = this.svg[i];
      let svgRect = this.getSVGRect(svg);
      let additionalMeasureContainter = svg
        .append("g")
        .classed(CardClassNames.AdditionalMeasureContainer + i, true);

      // background color
      // let backgroundColor = d3.color(this.model.settings.additional.backFill);
      // backgroundColor.opacity =
      //   1 - this.model.settings.additional.transparency / 100;
      let additionalMeasureLabels = [];
      const settings = this.model.settings;

      // tslint:disable-next-line: max-func-body-length
      this.model.dataGroups[0].additionalMeasures.map((v, j, array) => {
        let additionalMeasureLabel = additionalMeasureContainter
          .append("g")
          .classed(CardClassNames.AdditionalMeasureLabel + i + j, true);
        additionalMeasureLabel.append("text");
        let style: IFontProperties = {
          fontFamily: settings.font.additionalValuefontFamily,
          textSize: settings.font.additionalValueTextSize,
          isItalic: settings.font.additionalValueIsItalic,
          isBold: settings.font.additionalValueIsBold,
          isUnderline: settings.font.additionalValueIsUnderline,
          color: v.labelFill,
        };
        let textProperties = this.getTextProperties(style);
        textProperties.text = v.dataLabel;
        let additionalMeasureHeight: number;
        if (settings.additional.layoutType == "horizontal") {
          this.additionalMeasureWidth =
            (svgRect.width -
              this.maxMainMeasureWidth -
              settings.additional.paddingRight -
              settings.additional.paddingLeft -
              (array.length - 1) * settings.additional.marginOfMeasure) /
            array.length;
        } else {
          let verticalPadding: number;
          if (array.length == 3 || array.length == 6) {
            verticalPadding =
              settings.additional.paddingTop +
              settings.additional.paddingBottom;
          } else {
            switch (settings.additional.verticalTextAnchor) {
              case "top":
                verticalPadding = settings.additional.paddingTop;
                break;
              case "middle":
                verticalPadding =
                  settings.additional.paddingTop +
                  settings.additional.paddingBottom;
                break;
              case "bottom":
                verticalPadding = settings.additional.paddingBottom;
            }
          }
          if (
            settings.additional.textAnchor == "left" ||
            settings.additional.textAnchor == "right"
          ) {
            this.additionalMeasureWidth =
              (this.additionalMeasureContainerWidth *
                settings.additional.percentageWidth) /
              100;
            additionalMeasureHeight =
              (svgRect.height -
                this.getSVGRect(this.categoryLabels[i]).height -
                settings.categoryLabel.paddingTop -
                (array.length - 1) * settings.additional.marginOfMeasure -
                verticalPadding) /
              (settings.additional.verticalTextAnchor == "middle"
                ? array.length
                : 3);
          } else {
            this.additionalMeasureWidth = this.additionalMeasureContainerWidth;
            additionalMeasureHeight =
              (svgRect.height -
                this.getSVGRect(this.categoryLabels[i]).height -
                settings.categoryLabel.paddingTop -
                (array.length - 1) * settings.additional.marginOfMeasure -
                verticalPadding) /
              (settings.additional.verticalTextAnchor == "middle"
                ? 2 * array.length
                : 6);
          }
        }
        this.updateLabelStyles(additionalMeasureLabel, style);
        let measureValue = TextMeasurementService.getTailoredTextOrDefault(
          textProperties,
          this.additionalMeasureWidth
        );
        this.updateLabelValueWithoutWrapping(
          additionalMeasureLabel,
          measureValue
        );

        let x: number,
          y: number,
          startXMeasures: number,
          startYMeasures: number;

        if (settings.additional.layoutType == "horizontal") {
          startXMeasures =
            this.maxMainMeasureWidth +
            settings.additional.paddingLeft +
            j * this.additionalMeasureWidth +
            j * settings.additional.marginOfMeasure;
          y = svgRect.height - settings.additional.paddingBottom;
          if (settings.additional.horizontalAlignment == "center") {
            x = startXMeasures + this.additionalMeasureWidth / 2;
            additionalMeasureLabel.select("text").attr("text-anchor", "middle");
          } else if (settings.additional.horizontalAlignment == "left") {
            x = startXMeasures;
            additionalMeasureLabel.select("text").attr("text-anchor", "start");
          } else if (settings.additional.horizontalAlignment == "right") {
            x = startXMeasures + this.additionalMeasureWidth;
            additionalMeasureLabel.select("text").attr("text-anchor", "end");
            additionalMeasureLabel
              .select("text")
              .style("dominant-baseline", "text-bottom");
          }
        } else {
          if (
            settings.additional.textAnchor == "left" ||
            settings.additional.textAnchor == "right"
          ) {
            startXMeasures =
              this.maxMainMeasureWidth +
              settings.additional.paddingLeft +
              (settings.additional.textAnchor == "left"
                ? (this.additionalMeasureContainerWidth *
                    (100 - settings.additional.percentageWidth)) /
                  100
                : 0);
            startYMeasures =
              settings.categoryLabel.paddingTop +
              this.getSVGRect(this.categoryLabels[i]).height +
              (settings.additional.verticalTextAnchor !== "top"
                ? settings.additional.paddingTop
                : 0) +
              (j +
                (settings.additional.verticalTextAnchor == "bottom"
                  ? 3 - array.length
                  : 0)) *
                additionalMeasureHeight +
              j * settings.additional.marginOfMeasure;
          } else {
            startXMeasures =
              this.maxMainMeasureWidth + settings.additional.paddingLeft;
            startYMeasures =
              this.getSVGRect(this.categoryLabels[i]).height +
              settings.categoryLabel.paddingTop +
              settings.additional.paddingTop +
              (j * 2 +
                (settings.additional.textAnchor == "top" ? 1 : 0) +
                (settings.additional.verticalTextAnchor == "bottom" ? 1 : 0)) *
                additionalMeasureHeight +
              j * settings.additional.marginOfMeasure;
          }
          if (settings.additional.horizontalAlignment == "center") {
            x = startXMeasures + this.additionalMeasureWidth / 2;
            additionalMeasureLabel.select("text").attr("text-anchor", "middle");
          } else if (settings.additional.horizontalAlignment == "left") {
            x = startXMeasures;
            additionalMeasureLabel.select("text").attr("text-anchor", "start");
          } else if (settings.additional.horizontalAlignment == "right") {
            x = startXMeasures + this.additionalMeasureWidth;
            additionalMeasureLabel.select("text").attr("text-anchor", "end");
          }
          y = startYMeasures + additionalMeasureHeight / 2;
          additionalMeasureLabel
            .select("text")
            .style("dominant-baseline", "middle");
        }

        additionalMeasureLabel.attr("transform", translate(x, y));
        additionalMeasureLabels.push(additionalMeasureLabel);
      });
      this.additionalMeasureContainers.push(additionalMeasureLabels);
    }
  }

  // tslint:disable-next-line: max-func-body-length
  public async createLandingPage() {
    this.removeLandingPage();
    this.cardsContainer.style("width", "100%").style("height", "100%");
    let landingPage = this.cardsContainer
      .append("div")
      .classed("landing-page", true)
      .style("overflow-x", "hidden")
      .style("overflow-y", "auto")
      // .style("width", "calc(100%-2rem)")
      .style("height", this.getSVGRect(this.cardsContainer).height + "px");

    // header
    let headerContainer = landingPage
      .append("div")
      .classed("landing-header-container", true);
    headerContainer
      .append("div")
      .classed("landing-logo-container", true)
      .append("div")
      .classed("landing-logo-card", true);

    let headerTextContainer = headerContainer
      .append("div")
      .classed("landing-header-text", true);
    headerTextContainer
      .append("div")
      .classed("landing-header1", true)
      .text("Multi target KPI");
    headerTextContainer
      .append("div")
      .classed("landing-header2", true)
      .text("by Institute of Business Intelligence");

    // description
    landingPage.append("div").classed("landing-description", true).html(
      "Crisp-n-clear visualization for your KPIs! <br> \
        We are developing dashboards for 12 years, and business customers often ask for several indicators for cards: v/s target, previous year and something else. <br> \
        Also specific labels alignment, which is possible with separate text labels. Instead of this we developed “all-in-one” KPI card and share it with you for free."
    );

    // main
    let mainContainer = landingPage
      .append("div")
      .classed("landing-main-container", true);
    mainContainer.append("div").classed("landing-main-card", true);
    let mainInfo = mainContainer
      .append("div")
      .classed("landing-main-info", true);
    mainInfo
      .append("div")
      .classed("landing-main-info-header", true)
      .text("Key features:");
    let mainInfoDescription = mainInfo
      .append("ul")
      .classed("landing-main-info-description", true);
    mainInfoDescription
      .append("li")
      .text("Up to 3 additional indicators in the single card");
    mainInfoDescription.append("li").text("Category multiplies");
    mainInfoDescription
      .append("li")
      .text("Pixel perfect alignment setting for non-designers");
    mainInfoDescription.append("li").text("Built-in (blank) & NaN turn-off");
    mainInfoDescription.append("li").text("Simple conditional formatting");
    mainInfo.append("div").classed("landing-main-info-footer", true).html(
      "You will save your time for design and developing supplementary measures. Also you will optimize report performance: it works in a single query. <br> \
        Start a new level of business dashboarding!"
    );

    // footer
    landingPage.append("hr").classed("landgin-footer-hr", true);
    let footerContainer = landingPage
      .append("div")
      .classed("landing-footer-container", true);
    let footerContactsContainer = footerContainer
      .append("div")
      .classed("landing-footer-contacts-container", true);
    footerContactsContainer
      .append("div")
      .classed("landing-footer-contact-header", true)
      .text("Contacts");
    let footerContactsEmailContainer = footerContactsContainer
      .append("div")
      .classed("landing-footer-contact-email", true);
    footerContactsEmailContainer
      .append("a")
      .on("click", () => this.host.launchUrl("https://alexkolokolov.com/en/"))
      // .attr("href", "https://alexkolokolov.com/en/")
      // .attr("target", "_blank")
      // .attr("rel", "noopener noreferrer")
      .append("div")
      .classed("landing-footer-contact-email-icon", true);
    let email = footerContactsEmailContainer
      .append("div")
      .classed("landing-footer-contact-email-text", true);
    email.append("div").text("Alex Kolokolov");
    email
      // .append("a")
      // .on("click", () => this.host.launchUrl("mailto:dashboard@alexkolokolov.com"))
      // .attr("href", "mailto:dashboard@alexkolokolov.com")
      // .attr("target", "_blank")
      .append("div")
      .classed("footer-email", true)
      .text("Email: dashboard@alexkolokolov.com");

    // icons
    let footerContactsIconsContainer = footerContainer
      .append("div")
      .classed("landing-footer-contact-icon-container", true);

    let footerContactsIcon1 = footerContactsIconsContainer
      .append("div")
      .classed("landing-footer-contact-icon1", true);
    footerContactsIcon1
      .append("div")
      .classed("landing-footer-contact-icon1-img", true);
    footerContactsIcon1
      .append("div")
      .classed("landing-footer-contact-icon1-text", true)
      .text("Go to the instructions");

    let footerContactsIcon2 = footerContactsIconsContainer
      .append("div")
      .classed("landing-footer-contact-icon2", true);
    footerContactsIcon2
      .append("div")
      .classed("landing-footer-contact-icon2-img", true);
    footerContactsIcon2
      .append("div")
      .classed("landing-footer-contact-icon2-text", true)
      .text("View the video instructions");

    let footerContactsIcon3 = footerContactsIconsContainer
      .append("div")
      .classed("landing-footer-contact-icon3", true);
    footerContactsIcon3
      .append("div")
      .classed("landing-footer-contact-icon3-img", true);
    footerContactsIcon3
      .append("div")
      .classed("landing-footer-contact-icon3-text", true)
      .text("Get templates");
  }

  public removeLandingPage() {
    this.cardsContainer.selectAll(".landing-page").remove();
  }

  private getTextProperties(properties: IFontProperties): TextProperties {
    return {
      fontFamily: properties.fontFamily,
      fontSize: properties.textSize + "pt",
      fontWeight: properties.isBold ? "bold" : "normal",
      fontStyle: properties.isItalic ? "italic" : "normal",
    };
  }

  private updateLabelStyles(
    label: Selection<BaseType, any, any, any>,
    style: IFontProperties
  ) {
    label
      .select("text")
      .style("font-family", style.fontFamily)
      .style("font-size", style.textSize + "pt")
      .style("fill", style.color);
    if (style.isBold === true) {
      label.style("font-weight", "bold");
    }
    if (style.isItalic === true) {
      label.style("font-style", "italic");
    }
    if (style.isUnderline) {
      label.style("text-decoration", "underline");
    }
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
