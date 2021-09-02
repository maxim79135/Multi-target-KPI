"use strict";
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

export enum CardClassNames {
    Root = "root",
    CardsContainer = "cardsContainer",
    CardContainer = "card card-",
    CategoryLabel = "category category-",
    DataLabel = "data data-",
}

interface IDataGroup {
    displayName?: string;
    mainMeasureValue?: number;
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
    private svgRect: SVGRect[];

    constructor(target: HTMLElement) {
        this.root = select(target).classed(CardClassNames.Root, true);
        this.cardsContainer = this.root
            .append("div")
            .classed(CardClassNames.CardsContainer, true);
    }

    public getModel(): ICardViewModel {
        return this.model;
    }

    public visualTransform(
        options: VisualUpdateOptions,
        settings: CardSettings
    ) {
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
                ? dataCategorical.categories[
                      dataCategorical.categories.length - 1
                  ]
                : null;
            let categories = category ? category.values : [""];

            for (let i = 0; i < categories.length; i++) {
                let dataGroup: IDataGroup = {};
                for (let ii = 0; ii < dataCategorical.values.length; ii++) {
                    let dataValue = dataCategorical.values[ii];
                    let value: any = dataValue.values[i];

                    if (dataValue.source.roles["main_measure"]) {
                        dataGroup.displayName = category
                            ? categories[i].toString()
                            : dataValue.source.displayName;
                        dataGroup.mainMeasureValue = value;
                    }

                    dataGroups.push(dataGroup);
                    if (dataGroup) break;
                }
                //dataGroups.push({});
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
                this.cardsPerRow > 1
                    ? this.model.settings.multiple.cardsMargin
                    : 0,
            bottom:
                this.numberOfRows > 1
                    ? this.model.settings.multiple.cardsMargin
                    : 0,
        };

        this.cardViewport = {
            width: Math.floor(
                (viewport.width -
                    (this.cardMargin.left + this.cardMargin.right) *
                        this.cardsPerRow) /
                    this.cardsPerRow
            ),
            height: Math.floor(
                (viewport.height -
                    (this.cardMargin.top + this.cardMargin.bottom) *
                        this.numberOfRows) /
                    this.numberOfRows
            ),
        };
    }

    public createCardContainer() {
        this.cardsContainer.selectAll(".card").remove();
        this.svgRect = [];

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
            let svg = cardContainer
                .append("svg")
                .style("width", "100%")
                .style("height", "100%");
            this.svgRect.push(
                <SVGRect>(<SVGElement>svg.node()).getBoundingClientRect()
            );
        }
    }

    public createLabels() {
        if (this.model.settings.categoryLabel.show) {
            this.createCategoryLabel();
        }
        this.createDataLabel();
    }

    private createCategoryLabel() {
        for (let i = 0; i < this.model.dataGroups.length; i++) {
            let svg = this.cardsContainer.select(".card-" + i).select("svg");
            let categoryLabel = svg
                .append("g")
                .classed(CardClassNames.CategoryLabel + i, true);
            categoryLabel.append("text");

            let svgRect = this.svgRect[i];
            let textProperties = this.getTextProperties(
                this.model.settings.categoryLabel
            );
            textProperties.text = this.model.dataGroups[i].displayName;
            this.updateLabelStyles(
                categoryLabel,
                this.model.settings.categoryLabel
            );

            if (this.model.settings.categoryLabel.wordWrap) {
                let maxDataHeight = svgRect.height * 0.4;
                this.updateLabelValueWithWrapping(
                    categoryLabel,
                    textProperties,
                    this.model.dataGroups[i].displayName,
                    svgRect.width,
                    maxDataHeight
                );
            } else {
                let categoryValue =
                    TextMeasurementService.getTailoredTextOrDefault(
                        textProperties,
                        svgRect.width
                    );
                this.updateLabelValueWithoutWrapping(
                    categoryLabel,
                    categoryValue
                );
            }
            let categoryLabelSize = this.getLabelSize(categoryLabel);
            let x: number;
            let y: number =
                this.model.settings.categoryLabel.paddingTop +
                categoryLabelSize.height;

            if (
                this.model.settings.categoryLabel.horizontalAlignment ==
                "center"
            ) {
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
                x =
                    svgRect.width -
                    this.model.settings.categoryLabel.paddingSide;
                categoryLabel.select("text").attr("text-anchor", "end");
            }

            categoryLabel.attr("transform", translate(x, y));
        }
    }

    private createDataLabel() {
        for (let i = 0; i < this.model.dataGroups.length; i++) {
            let svg = this.cardsContainer.select(".card-" + i).select("svg");
            let dataLabel = svg
                .append("g")
                .classed(CardClassNames.DataLabel + i, true);
            dataLabel.append("text");

            let svgRect = this.svgRect[i];
            let textProperties = this.getTextProperties(
                this.model.settings.dataLabel
            );
            textProperties.text =
                this.model.dataGroups[i].mainMeasureValue.toString();
            this.updateLabelStyles(dataLabel, this.model.settings.dataLabel);
            let categoryValue = TextMeasurementService.getTailoredTextOrDefault(
                textProperties,
                svgRect.width
            );
            this.updateLabelValueWithoutWrapping(dataLabel, categoryValue);

            let categoryExist = this.elementExist(svg.select(".category-" + i));

            let x: number, y: number;
            let dataLabelSize = this.getLabelSize(dataLabel);
            if (categoryExist) {
                let categoryLabelSize = this.getLabelSize(
                    svg.select(".category-" + i)
                );
                x = svgRect.width / 4;
                y =
                    this.model.settings.categoryLabel.paddingTop +
                    categoryLabelSize.height +
                    (svgRect.height -
                        this.model.settings.categoryLabel.paddingTop -
                        categoryLabelSize.height) /
                        2 +
                    dataLabelSize.height / 2;
            } else {
                x = svgRect.width / 2;
            }
            dataLabel.select("text").attr("text-anchor", "middle");
            dataLabel.attr("transform", translate(x, y));
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
        let maxNumLines: number = Math.max(
            1,
            Math.floor(maxHeight / textHeight)
        );
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

    private elementExist(labelGroup: Selection<BaseType, any, any, any>) {
        if (labelGroup) {
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
}
