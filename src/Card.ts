"use strict";
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import DataView = powerbi.DataView;
import {
    stringExtensions as StringExtensions,
    textMeasurementService as TextMeasurementService,
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
}

interface IDataGroup {
    displayName?: string;
    mainMeasureValue?: number;
}

interface ICardViewModel {
    settings: CardSettings;
    dataGroups: IDataGroup[];
}

export class Card {
    private root: Selection<BaseType, any, any, any>;
    private cardContainer: Selection<BaseType, any, any, any>;
    private cardsContainer: Selection<BaseType, any, any, any>;
    private categoryLabel: Selection<BaseType, any, any, any>;
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

        for (let i = 0; i < this.model.dataGroups.length; i++) {
            this.cardsContainer
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
        }
    }

    public createCategoryLabel() {
        if (this.model.settings.categoryLabel.show) {
            for (let i = 0; i < this.model.dataGroups.length; i++) {
                this.cardContainer = this.cardsContainer.select(".card-" + i);
                let svg = this.cardContainer
                    .append("svg")
                    .style("width", "100%")
                    .style("height", "100%");
                this.categoryLabel = svg
                    .append("g")
                    .classed(CardClassNames.CategoryLabel + i, true);
                this.categoryLabel.append("text");

                let svgSize: SVGRect = <SVGRect>(
                    (<SVGElement>svg.node()).getBoundingClientRect()
                );
                let textProperties: TextProperties = {
                    fontFamily: this.model.settings.categoryLabel.fontFamily,
                    fontSize: this.model.settings.categoryLabel.textSize + "px",
                    text: this.model.dataGroups[i].displayName,
                };
                let categoryValue =
                    TextMeasurementService.getTailoredTextOrDefault(
                        textProperties,
                        svgSize.width
                    );
                this.categoryLabel
                    .select("text")
                    .style(
                        "font-size",
                        this.model.settings.categoryLabel.textSize + "px"
                    )
                    .style(
                        "font-family",
                        this.model.settings.categoryLabel.fontFamily
                    )
                    .style("fill", this.model.settings.categoryLabel.color)
                    .text(categoryValue);

                let categorySize = this.getLabelSize(this.categoryLabel);
                let x: number;
                let y: number =
                    this.model.settings.categoryLabel.paddingTop +
                    categorySize.height;

                if (
                    this.model.settings.categoryLabel.horizontalAlignment ==
                    "center"
                ) {
                    x = svgSize.width / 2;
                    this.categoryLabel
                        .select("text")
                        .attr("text-anchor", "middle");
                } else if (
                    this.model.settings.categoryLabel.horizontalAlignment ==
                    "left"
                ) {
                    x = this.model.settings.categoryLabel.paddingSide;
                    this.categoryLabel
                        .select("text")
                        .attr("text-anchor", "start");
                } else if (
                    this.model.settings.categoryLabel.horizontalAlignment ==
                    "right"
                ) {
                    x =
                        svgSize.width -
                        this.model.settings.categoryLabel.paddingSide;
                    this.categoryLabel
                        .select("text")
                        .attr("text-anchor", "end");
                }

                this.categoryLabel.attr("transform", translate(x, y));
            }
        }
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
