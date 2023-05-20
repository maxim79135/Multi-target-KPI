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
  private dataLabels: Selection<BaseType, any, any, any>[];
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
    const settings = this.model.settings;
    this.numberOfCards = this.model.dataGroups.length;
    this.cardsPerRow = Math.min(this.numberOfCards, settings.grid.cardsPerRow);
    this.numberOfRows = Math.ceil(this.numberOfCards / this.cardsPerRow);
    this.cardMargin = {
      left: 0,
      top: 0,
      right: this.cardsPerRow > 1 ? settings.grid.cardsMargin : 0,
      bottom: this.numberOfRows > 1 ? settings.grid.cardsMargin : 0,
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
    this.maxMainMeasureWidth = settings.grid.percentageWidth;
  }

  // eslint:disable-next-line: max-func-body-length
  public createCardContainer() {
    this.cardsContainer.selectAll(".card").remove();
    this.cards = [];
    this.svg = [];
    const settings = this.model.settings;

    this.cardsContainer.on("click", (event: PointerEvent) => {
      if (this.model.dataGroups.length <= 1) return;
      const dataPoint = select(<d3.BaseType>event.target).datum();
      if (this.host.hostCapabilities.allowInteractions) {
        if (!dataPoint) this.selectionManager.clear();
      }
    });

    this.cardsContainer.on("contextmenu", (event: PointerEvent) => {
      const eventTarget: EventTarget = event.target;
      const dataPoint: any = select(<d3.BaseType>eventTarget).datum();

      this.selectionManager.showContextMenu(
        dataPoint ? dataPoint.selectionId : {},
        {
          x: event.clientX,
          y: event.clientY,
        }
      );
      event.preventDefault();
    });

    for (let i = 0; i < this.model.dataGroups.length; i++) {
      const marginRight =
        (i + 1) % this.cardsPerRow == 0 && i != 0 ? 0 : this.cardMargin.right;
      const cardContainer = this.cardsContainer
        .append("div")
        .classed(CardClassNames.CardContainer + i, true)
        .style("margin-left", this.cardMargin.left + "px")
        .style("margin-right", marginRight + "px")
        .style("margin-top", this.cardMargin.top + "px")
        .style("margin-bottom", this.cardMargin.bottom + "px")
        .style("width", this.cardViewport.width + "px")
        .style("height", this.cardViewport.height + "px");

      cardContainer.on(
        "click",
        (event: PointerEvent, dataPoint: IDataGroup) => {
          if (this.model.dataGroups.length <= 1) return;

          if (this.host.hostCapabilities.allowInteractions) {
            const isCtrlPressed: boolean = event.ctrlKey;
            this.selectionManager.select(
              dataPoint ? dataPoint.selectionId : {},
              isCtrlPressed
            );
          }
        }
      );
      if (settings.background.layoutShow) {
        const backgroundColor = d3.color(settings.background.backFill);
        backgroundColor.opacity = 1 - settings.background.transparency / 100;
        cardContainer.style("background-color", backgroundColor.formatRgb());
      }
      if (settings.background.borderShow) {
        cardContainer
          .style(
            "border",
            settings.background.borderShow
              ? settings.background.borderWeight +
                  "px solid" +
                  // settings.background.borderType +
                  // " " +
                  settings.background.borderFill
              : ""
          )
          .style("border-radius", `${settings.background.roundEdges}px`);
      }
      this.cards.push(cardContainer);
      this.svg.push(
        cardContainer
          .append("svg")
          .style("width", "100%")
          .style("height", "100%")
      );
    }
    const svgRect = this.getSVGRect(this.svg[0]);
    if (this.model.dataGroups.length > 0) {
      this.maxMainMeasureWidth =
        (svgRect.width * this.maxMainMeasureWidth) / 100;
      if (this.model.dataGroups[0].additionalMeasures.length == 0)
        this.maxMainMeasureWidth = svgRect.width;
      this.additionalMeasureContainerWidth =
        svgRect.width -
        this.maxMainMeasureWidth -
        settings.constants.additionalPaddingLeft -
        settings.constants.additionalPaddingRight;
    } else this.maxMainMeasureWidth = svgRect.width;
  }

  public draw() {
    this.dataLabels = [];
    this.categoryLabels = [];
    this.additionalCategoryContainers = [];
    this.additionalMeasureContainers = [];

    if (this.model.settings.grid.showMeasureName) {
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
    const cardSelection = this.cardsContainer
      .selectAll(".card")
      .data(this.model.dataGroups);
    const cardSelectionMerged = cardSelection
      .enter()
      .append("rect")
      .merge(<any>cardSelection);

    this.tooltipServiceWrapper.addTooltip(
      cardSelectionMerged.select("svg"),
      (datapoint: IDataGroup) => this.getTooltipData(datapoint),
      (datapoint: IDataGroup) => datapoint.selectionId
    );
  }

  private getTooltipData(values: IDataGroup): VisualTooltipDataItem[] {
    const tooltipData: VisualTooltipDataItem[] = [];

    tooltipData.push({
      displayName: values.displayName,
      value: values.mainMeasureDataLabel,
    });

    const additionalMeasures = values.additionalMeasures;
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

  // eslint-disable-next-line max-lines-per-function
  private createCategoryLabel() {
    for (let i = 0; i < this.model.dataGroups.length; i++) {
      const svg = this.svg[i];
      const categoryLabel = svg
        .append("g")
        .classed(CardClassNames.CategoryLabel + i, true);
      categoryLabel.append("text");

      const svgRect = this.getSVGRect(svg);
      const settings = this.model.settings;
      const style = {
        fontFamily: settings.font.categoryFontFamily,
        textSize: settings.font.categoryTextSize,
        isItalic: settings.font.categoryIsItalic,
        isBold: settings.font.categoryIsBold,
        isUnderline: settings.font.categoryIsUnderline,
        color: settings.color.color,
      };
      const textProperties = this.getTextProperties(style);
      textProperties.text = this.model.dataGroups[i].displayName;
      this.updateLabelStyles(categoryLabel, style);

      if (settings.font.categoryWordWrap_) {
        const maxDataHeight = svgRect.height / 2;
        this.updateLabelValueWithWrapping(
          categoryLabel,
          textProperties,
          this.model.dataGroups[i].displayName,
          svgRect.width,
          maxDataHeight
        );
      } else {
        const categoryValue = TextMeasurementService.getTailoredTextOrDefault(
          textProperties,
          svgRect.width
        );
        this.updateLabelValueWithoutWrapping(categoryLabel, categoryValue);
      }

      // init start position
      const xStartPos = 0;
      const yStartPos = 0;
      let maxWidth: number;
      let maxHeight: number;
      if (settings.grid.position == "aboveMainMeasure") {
        maxWidth = this.maxMainMeasureWidth;
        if (settings.grid.layoutType == "horizontal") {
          maxHeight = svgRect.height / 2;
        } else {
          if (
            settings.alignment.verticalAdditionalMeasureName == "left" ||
            settings.alignment.verticalAdditionalMeasureName == "right"
          ) {
            if (
              this.model.dataGroups[0].additionalMeasures.length == 1 ||
              this.model.dataGroups[0].additionalMeasures.length == 2
            )
              maxHeight = svgRect.height / 2;
            else maxHeight = svgRect.height / 3;
          } else {
            maxHeight =
              svgRect.height /
              this.model.dataGroups[0].additionalMeasures.length /
              2;
          }
        }
      } else {
        maxWidth = svgRect.width;
        if (settings.grid.layoutType == "horizontal") {
          maxHeight = svgRect.height / 3;
        } else {
          if (
            settings.alignment.verticalAdditionalMeasureName == "left" ||
            settings.alignment.verticalAdditionalMeasureName == "right"
          ) {
            maxHeight =
              svgRect.height /
              (this.model.dataGroups[0].additionalMeasures.length + 1);
          } else {
            maxHeight =
              svgRect.height /
              (this.model.dataGroups[0].additionalMeasures.length * 2 + 1);
          }
        }
      }

      // update position
      categoryLabel.attr("transform", translate(xStartPos, yStartPos));
      this.setXPos(
        categoryLabel,
        maxWidth,
        settings.alignment.horizontalCategory,
        settings.constants.categoryPaddingSide,
        settings.font.categoryWordWrap_
      );
      this.setYPos(
        categoryLabel,
        maxHeight,
        settings.alignment.verticalCategory,
        settings.constants.categoryPaddingTop
      );

      categoryLabel.select("text").style("dominant-baseline", "middle");
      this.categoryLabels.push(categoryLabel);
    }
  }

  private createDataLabel() {
    for (let i = 0; i < this.model.dataGroups.length; i++) {
      const svg = this.svg[i];
      const dataLabel = svg
        .append("g")
        .classed(CardClassNames.DataLabel + i, true);
      dataLabel.append("text");

      const svgRect = this.getSVGRect(svg);
      const settings = this.model.settings;
      if (!settings.color.mainShow) {
        settings.color.mainColor = settings.color.color;
      }
      const style = {
        fontFamily: settings.font.mainFontFamily,
        textSize: settings.font.mainTextSize,
        isItalic: settings.font.mainIsItalic,
        isBold: settings.font.mainIsBold,
        isUnderline: settings.font.mainIsUnderline,
        color: settings.color.mainColor,
      };
      const textProperties = this.getTextProperties(style);
      textProperties.text = this.model.dataGroups[i].mainMeasureDataLabel;
      this.updateLabelStyles(dataLabel, style);
      const mainMeasure = TextMeasurementService.getTailoredTextOrDefault(
        textProperties,
        this.maxMainMeasureWidth
      );
      this.updateLabelValueWithoutWrapping(dataLabel, mainMeasure);

      // init start position
      const xStartPos = 0;
      let yStartPos: number;
      if (this.categoryLabels.length == 0) {
        yStartPos = 0;
      } else {
        if (settings.grid.position == "aboveMainMeasure") {
          if (settings.grid.layoutType == "horizontal") {
            yStartPos = svgRect.height / 2;
          } else {
            if (
              settings.alignment.verticalAdditionalMeasureName == "left" ||
              settings.alignment.verticalAdditionalMeasureName == "right"
            ) {
              if (
                this.model.dataGroups[0].additionalMeasures.length == 1 ||
                this.model.dataGroups[0].additionalMeasures.length == 2
              )
                yStartPos = svgRect.height / 2;
              else yStartPos = svgRect.height / 3;
            } else {
              yStartPos =
                svgRect.height /
                this.model.dataGroups[0].additionalMeasures.length /
                2;
            }
          }
        } else {
          yStartPos = svgRect.width;
          if (settings.grid.layoutType == "horizontal") {
            yStartPos = svgRect.height / 3;
          } else {
            if (
              settings.alignment.verticalAdditionalMeasureName == "left" ||
              settings.alignment.verticalAdditionalMeasureName == "right"
            ) {
              yStartPos =
                svgRect.height /
                (this.model.dataGroups[0].additionalMeasures.length + 1);
            } else {
              yStartPos =
                svgRect.height /
                (this.model.dataGroups[0].additionalMeasures.length * 2 + 1);
            }
          }
        }
      }
      const maxHeight = svgRect.height - yStartPos;
      dataLabel.attr("transform", translate(xStartPos, yStartPos));

      // update position
      this.setXPos(
        dataLabel,
        this.maxMainMeasureWidth,
        settings.alignment.horizontalMainMeasure,
        settings.constants.mainMeasurePaddingSide
      );
      this.setYPos(
        dataLabel,
        maxHeight,
        settings.alignment.verticalMainMeasure,
        settings.constants.mainMeasurePaddingBottom
      );
      dataLabel.select("text").style("dominant-baseline", "middle");

      this.dataLabels.push(dataLabel);
    }
  }

  // eslint-disable-next-line max-lines-per-function
  private createAdditionalCategoryLabel() {
    this.additionalCategoryContainers = [];
    const settings = this.model.settings;

    for (let i = 0; i < this.model.dataGroups.length; i++) {
      const svg = this.svg[i];
      const svgRect = this.getSVGRect(svg);
      const additionalCategoryContainter = svg
        .append("g")
        .classed(CardClassNames.AdditionalCategoryContainer + i, true);
      const additionalCategoryLabels: Selection<BaseType, any, any, any>[] = [];

      // eslint-disable-next-line max-lines-per-function
      this.model.dataGroups[0].additionalMeasures.map((v, j, array) => {
        const style: IFontProperties = {
          fontFamily: settings.font.additionalNameFontFamily,
          textSize: settings.font.additionalNameTextSize,
          isItalic: settings.font.additionalNameIsItalic,
          isBold: settings.font.additionalNameIsBold,
          isUnderline: settings.font.additionalNameIsUnderline,
          color: settings.color.color,
        };
        const additionalCategoryLabel = additionalCategoryContainter
          .append("g")
          .classed(CardClassNames.AdditionalCategoryLabel + i + j, true);
        additionalCategoryLabel.append("text");
        const textProperties = this.getTextProperties(style);
        textProperties.text = v.displayName;

        let maxHeight: number;
        let xStartPos: number;
        let yStartPos: number;
        if (settings.grid.layoutType == "horizontal") {
          xStartPos =
            this.maxMainMeasureWidth +
            settings.constants.additionalPaddingLeft +
            j * this.additionalMeasureWidth +
            j * settings.constants.marginOfMeasure;
          if (settings.grid.position == "aboveMainMeasure") {
            yStartPos = 0;
            maxHeight = svgRect.height / 2;
          } else {
            yStartPos = svgRect.height / 3;
            maxHeight = svgRect.height / 3;
          }
        } else {
          const isTopBottomAlignment =
            settings.alignment.verticalAdditionalMeasureName == "top" ||
            settings.alignment.verticalAdditionalMeasureName == "bottom";
          this.additionalMeasureWidth =
            (svgRect.width -
              this.maxMainMeasureWidth -
              settings.constants.additionalPaddingLeft -
              settings.constants.additionalPaddingRight -
              settings.constants.marginOfMeasure *
                (isTopBottomAlignment ? 0 : 1)) /
            (isTopBottomAlignment ? 1 : 2);
          xStartPos =
            this.maxMainMeasureWidth +
            settings.constants.additionalPaddingLeft +
            (isTopBottomAlignment
              ? 0
              : settings.alignment.verticalAdditionalMeasureName == "right"
              ? this.additionalMeasureWidth
              : 0);

          if (settings.grid.position == "aboveMainMeasure") {
            if (
              settings.alignment.verticalAdditionalMeasureName == "left" ||
              settings.alignment.verticalAdditionalMeasureName == "right"
            ) {
              if (
                this.model.dataGroups[0].additionalMeasures.length == 1 ||
                this.model.dataGroups[0].additionalMeasures.length == 2
              )
                maxHeight = svgRect.height / 2;
              else maxHeight = svgRect.height / 3;
            } else {
              maxHeight =
                svgRect.height /
                this.model.dataGroups[0].additionalMeasures.length /
                2;
            }

            if (!isTopBottomAlignment) yStartPos = j * maxHeight;
            else {
              yStartPos =
                (array.length - 1) * settings.constants.marginOfMeasure +
                (j * 2 +
                  (settings.alignment.verticalAdditionalMeasureName == "top"
                    ? 0
                    : 1)) *
                  maxHeight;
            }
          } else {
            if (
              settings.alignment.verticalAdditionalMeasureName == "left" ||
              settings.alignment.verticalAdditionalMeasureName == "right"
            ) {
              maxHeight =
                svgRect.height /
                (this.model.dataGroups[0].additionalMeasures.length + 1);
              yStartPos =
                maxHeight +
                (array.length - 1) * settings.constants.marginOfMeasure +
                j * maxHeight;
            } else {
              maxHeight =
                svgRect.height /
                (this.model.dataGroups[0].additionalMeasures.length * 2 + 1);
              yStartPos =
                maxHeight +
                (j * 2 +
                  (settings.alignment.verticalAdditionalMeasureName == "top"
                    ? 0
                    : 1)) *
                  maxHeight;
            }
          }
        }
        additionalCategoryLabel.attr(
          "transform",
          translate(xStartPos, yStartPos)
        );

        this.updateLabelStyles(additionalCategoryLabel, style);
        if (settings.font.additionalNameWordWrap_) {
          this.updateLabelValueWithWrapping(
            additionalCategoryLabel,
            textProperties,
            v.displayName,
            this.additionalMeasureWidth,
            maxHeight
          );
        } else {
          const categoryValue = TextMeasurementService.getTailoredTextOrDefault(
            textProperties,
            this.additionalMeasureWidth
          );
          this.updateLabelValueWithoutWrapping(
            additionalCategoryLabel,
            categoryValue
          );
        }

        // update position
        let alignment: string;
        if (settings.grid.layoutType == "horizontal") {
          alignment = settings.alignment.horizontalAdditionalMeasureValue;
        } else {
          alignment = settings.alignment.horizontalAdditionalMeasureName;
        }
        this.setXPos(
          additionalCategoryLabel,
          this.additionalMeasureWidth,
          alignment,
          0,
          settings.font.additionalNameWordWrap_
        );
        this.setYPos(
          additionalCategoryLabel,
          maxHeight,
          settings.alignment.verticalAdditionalMeasure,
          settings.constants.additionalPaddingBottom
        );
        additionalCategoryLabel
          .select("text")
          .style("dominant-baseline", "middle");

        additionalCategoryLabels.push(additionalCategoryLabel);
      });
      this.additionalCategoryContainers.push(additionalCategoryLabels);
    }
  }

  // eslint-disable-next-line max-lines-per-function
  private createAdditionalMeasureLabel() {
    for (let i = 0; i < this.model.dataGroups.length; i++) {
      const svg = this.svg[i];
      const svgRect = this.getSVGRect(svg);
      const additionalMeasureContainter = svg
        .append("g")
        .classed(CardClassNames.AdditionalMeasureContainer + i, true);

      const additionalMeasureLabels = [];
      const settings = this.model.settings;

      // eslint-disable-next-line max-lines-per-function
      this.model.dataGroups[0].additionalMeasures.map((v, j, array) => {
        const additionalMeasureLabel = additionalMeasureContainter
          .append("g")
          .classed(CardClassNames.AdditionalMeasureLabel + i + j, true);
        additionalMeasureLabel.append("text");
        const style: IFontProperties = {
          fontFamily: settings.font.additionalValueFontFamily,
          textSize: settings.font.additionalValueTextSize,
          isItalic: settings.font.additionalValueIsItalic,
          isBold: settings.font.additionalValueIsBold,
          isUnderline: settings.font.additionalValueIsUnderline,
          color: v.labelFill,
        };
        const textProperties = this.getTextProperties(style);
        textProperties.text = v.dataLabel;

        let maxHeight: number;
        let xStartPos: number;
        let yStartPos: number;
        if (settings.grid.layoutType == "horizontal") {
          this.additionalMeasureWidth =
            (svgRect.width -
              this.maxMainMeasureWidth -
              settings.constants.additionalPaddingLeft -
              settings.constants.additionalPaddingRight -
              (array.length - 1) * settings.constants.marginOfMeasure) /
            array.length;
          xStartPos =
            this.maxMainMeasureWidth +
            settings.constants.additionalPaddingLeft +
            j * this.additionalMeasureWidth +
            j * settings.constants.marginOfMeasure;
          if (settings.grid.position == "aboveMainMeasure") {
            yStartPos = svgRect.height / 2;
          } else {
            yStartPos = (svgRect.height * 2) / 3;
          }
          maxHeight = svgRect.height - yStartPos;
        } else {
          const isTopBottomAlignment =
            settings.alignment.verticalAdditionalMeasureName == "top" ||
            settings.alignment.verticalAdditionalMeasureName == "bottom";
          this.additionalMeasureWidth =
            (svgRect.width -
              this.maxMainMeasureWidth -
              settings.constants.additionalPaddingLeft -
              settings.constants.additionalPaddingRight -
              settings.constants.marginOfMeasure *
                (isTopBottomAlignment ? 0 : 1)) /
            (isTopBottomAlignment ? 1 : 2);
          xStartPos =
            this.maxMainMeasureWidth +
            settings.constants.additionalPaddingLeft +
            (isTopBottomAlignment
              ? 0
              : settings.alignment.verticalAdditionalMeasureName == "left"
              ? this.additionalMeasureWidth
              : 0);

          if (settings.grid.position == "aboveMainMeasure") {
            if (
              settings.alignment.verticalAdditionalMeasureName == "left" ||
              settings.alignment.verticalAdditionalMeasureName == "right"
            ) {
              if (
                this.model.dataGroups[0].additionalMeasures.length == 1 ||
                this.model.dataGroups[0].additionalMeasures.length == 2
              )
                maxHeight = svgRect.height / 2;
              else maxHeight = svgRect.height / 3;
            } else {
              maxHeight =
                svgRect.height /
                this.model.dataGroups[0].additionalMeasures.length /
                2;
            }

            if (!isTopBottomAlignment) yStartPos = j * maxHeight;
            else {
              yStartPos =
                (array.length - 1) * settings.constants.marginOfMeasure +
                (j * 2 +
                  (settings.alignment.verticalAdditionalMeasureName == "top"
                    ? 1
                    : 0)) *
                  maxHeight;
            }
          } else {
            if (
              settings.alignment.verticalAdditionalMeasureName == "left" ||
              settings.alignment.verticalAdditionalMeasureName == "right"
            ) {
              maxHeight =
                svgRect.height /
                (this.model.dataGroups[0].additionalMeasures.length + 1);
              yStartPos =
                maxHeight +
                (array.length - 1) * settings.constants.marginOfMeasure +
                j * maxHeight;
            } else {
              maxHeight =
                svgRect.height /
                (this.model.dataGroups[0].additionalMeasures.length * 2 + 1);
              yStartPos =
                maxHeight +
                (j * 2 +
                  (settings.alignment.verticalAdditionalMeasureName == "top"
                    ? 1
                    : 0)) *
                  maxHeight;
            }
          }
        }
        additionalMeasureLabel.attr(
          "transform",
          translate(xStartPos, yStartPos)
        );

        this.updateLabelStyles(additionalMeasureLabel, style);
        const measureValue = TextMeasurementService.getTailoredTextOrDefault(
          textProperties,
          this.additionalMeasureWidth
        );
        this.updateLabelValueWithoutWrapping(
          additionalMeasureLabel,
          measureValue
        );

        // update position
        this.setXPos(
          additionalMeasureLabel,
          this.additionalMeasureWidth,
          settings.alignment.horizontalAdditionalMeasureValue
        );
        this.setYPos(
          additionalMeasureLabel,
          maxHeight,
          settings.alignment.verticalAdditionalMeasure,
          settings.constants.additionalPaddingBottom
        );
        additionalMeasureLabel
          .select("text")
          .style("dominant-baseline", "middle");

        additionalMeasureLabels.push(additionalMeasureLabel);
      });
      this.additionalMeasureContainers.push(additionalMeasureLabels);
    }
  }

  private setYPos(
    elem: Selection<BaseType, any, any, any>,
    maxHeight: number,
    alignment: string,
    padding = 0
  ) {
    let y: number;
    const elemHeight = this.getSVGRect(elem).height;
    switch (alignment) {
      case "middle":
        y = maxHeight / 2;
        break;

      case "top":
        y = elemHeight / 2 + padding;
        break;

      case "bottom":
        y = maxHeight - elemHeight / 2 - padding;
        break;
    }
    console.log(elem, alignment, y);

    elem.select("text").attr("y", y);
  }

  private setXPos(
    elem: Selection<BaseType, any, any, any>,
    maxWidth: number,
    alignment: string,
    padding = 0,
    wordWrap_ = false
  ) {
    let x: number;
    switch (alignment) {
      case "center":
        x = maxWidth / 2;
        elem.attr("text-anchor", "middle");
        break;

      case "left":
        x = padding;
        elem.attr("text-anchor", "start");
        break;

      case "right":
        x = maxWidth - padding;
        elem.attr("text-anchor", "end");
        break;
    }
    elem.select("text").attr("x", x);
    if (wordWrap_) elem.select("text").selectAll("tspan").attr("x", x);
  }

  // eslint-disable-next-line max-lines-per-function
  public async createLandingPage() {
    this.removeLandingPage();
    this.cardsContainer.style("width", "100%").style("height", "100%");
    const landingPage = this.cardsContainer
      .append("div")
      .classed("landing-page", true)
      .style("overflow-x", "hidden")
      .style("overflow-y", "auto")
      // .style("width", "calc(100%-2rem)")
      .style("height", this.getSVGRect(this.cardsContainer).height + "px");

    // header
    const headerContainer = landingPage
      .append("div")
      .classed("landing-header-container", true);
    headerContainer
      .append("div")
      .classed("landing-logo-container", true)
      .append("div")
      .classed("landing-logo-card", true);

    const headerTextContainer = headerContainer
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
    const landing_description = landingPage
      .append("div")
      .classed("landing-description", true);
    landing_description
      .append("text")
      .text("Crisp-n-clear visualization for your KPIs!");
    landing_description.append("br");
    landing_description
      .append("text")
      .text(
        "We are developing dashboards for 12 years, and business customers often ask for several indicators for cards: v/s target, previous year and something else."
      );
    landing_description.append("br");
    landing_description
      .append("text")
      .text(
        "Also specific labels alignment, which is possible with separate text labels. Instead of this we developed “all-in-one” KPI card and share it with you for free."
      );

    // main
    const mainContainer = landingPage
      .append("div")
      .classed("landing-main-container", true);
    mainContainer.append("div").classed("landing-main-card", true);
    const mainInfo = mainContainer
      .append("div")
      .classed("landing-main-info", true);
    mainInfo
      .append("div")
      .classed("landing-main-info-header", true)
      .text("Key features:");
    const mainInfoDescription = mainInfo
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
    const landing_main_info_footer = mainInfo
      .append("div")
      .classed("landing-main-info-footer", true);
    landing_main_info_footer
      .append("text")
      .text(
        "You will save your time for design and developing supplementary measures. Also you will optimize report performance: it works in a single query."
      );
    landing_main_info_footer.append("br");
    landing_main_info_footer
      .append("text")
      .text("Start a new level of business dashboarding!");

    // footer
    landingPage.append("hr").classed("landgin-footer-hr", true);
    const footerContainer = landingPage
      .append("div")
      .classed("landing-footer-container", true);
    const footerContactsContainer = footerContainer
      .append("div")
      .classed("landing-footer-contacts-container", true);
    footerContactsContainer
      .append("div")
      .classed("landing-footer-contact-header", true)
      .text("Contacts");
    const footerContactsEmailContainer = footerContactsContainer
      .append("div")
      .classed("landing-footer-contact-email", true);
    footerContactsEmailContainer
      .append("a")
      .on("click", () => this.host.launchUrl("https://alexkolokolov.com/en/"))
      .append("div")
      .classed("landing-footer-contact-email-icon", true);
    const email = footerContactsEmailContainer
      .append("div")
      .classed("landing-footer-contact-email-text", true);
    email.append("div").text("Alex Kolokolov");
    email
      .append("div")
      .classed("footer-email", true)
      .text("Email: dashboard@alexkolokolov.com");

    // icons
    const footerContactsIconsContainer = footerContainer
      .append("div")
      .classed("landing-footer-contact-icon-container", true);

    const footerContactsIcon1 = footerContactsIconsContainer
      .append("div")
      .classed("landing-footer-contact-icon1", true);
    footerContactsIcon1
      .append("div")
      .classed("landing-footer-contact-icon1-img", true);
    footerContactsIcon1
      .append("div")
      .classed("landing-footer-contact-icon1-text", true)
      .text("Go to the instructions");

    const footerContactsIcon2 = footerContactsIconsContainer
      .append("div")
      .classed("landing-footer-contact-icon2", true);
    footerContactsIcon2
      .append("div")
      .classed("landing-footer-contact-icon2-img", true);
    footerContactsIcon2
      .append("div")
      .classed("landing-footer-contact-icon2-text", true)
      .text("View the video instructions");

    const footerContactsIcon3 = footerContactsIconsContainer
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
    const textHeight: number =
      TextMeasurementService.estimateSvgTextHeight(textProperties);
    const maxNumLines: number = Math.max(1, Math.floor(maxHeight / textHeight));
    const labelValues = wordBreaker.splitByWidth(
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
