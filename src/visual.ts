/*
 *  Power BI Visual CLI
 *
 *  Copyright (c) Microsoft Corporation
 *  All rights reserved.
 *  MIT License
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the ""Software""), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *
 *  The above copyright notice and this permission notice shall be included in
 *  all copies or substantial portions of the Software.
 *
 *  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 *  THE SOFTWARE.
 */
"use strict";
import * as d3 from "d3";
import "core-js/stable";
import "./../style/visual.less";
import powerbi from "powerbi-visuals-api";
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
import VisualObjectInstance = powerbi.VisualObjectInstance;
import DataView = powerbi.DataView;
import VisualObjectInstanceEnumerationObject = powerbi.VisualObjectInstanceEnumerationObject;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import IViewport = powerbi.IViewport;
import VisualEnumerationInstanceKinds = powerbi.VisualEnumerationInstanceKinds;
import { dataViewWildcard } from "powerbi-visuals-utils-dataviewutils";

import { CardSettings } from "./settings";
export type Selection = d3.Selection<any, any, any, any>;

interface IDataGroup {
    displayName?: string;
    mainMeasureValue?: number;
}

interface ICardViewModel {
    settings: CardSettings;
    dataGroups: IDataGroup[];
}

export class CardKPI implements IVisual {
    private model: ICardViewModel;
    private host: IVisualHost;
    private element: Selection;
    private cardsContainer: Selection;

    constructor(options: VisualConstructorOptions) {
        this.element = d3.select(options.element);
        this.cardsContainer = this.element
            .append("div")
            .classed("cardsContainer", true);
        this.host = options.host;
    }

    public update(options: VisualUpdateOptions) {
        this.model = this.visualTransform(options);
        this.cardsContainer.selectAll(".card").remove();
        let numberOfCards = this.model.dataGroups.length;
        if (numberOfCards > 0) {
            let viewport = options.viewport;
            let cardsPerRow = Math.min(
                numberOfCards,
                this.model.settings.multiple.cardsPerRow
            );
            let numberOfRows = Math.ceil(numberOfCards / cardsPerRow);
            let cardMargin = {
                left: 0,
                top: 0,
                right:
                    cardsPerRow > 1
                        ? this.model.settings.multiple.cardsMargin
                        : 0,
                bottom:
                    numberOfRows > 1
                        ? this.model.settings.multiple.cardsMargin
                        : 0,
            };

            let cardViewport = {
                width: Math.floor(
                    (viewport.width -
                        (cardMargin.left + cardMargin.right) * cardsPerRow) /
                        cardsPerRow
                ),
                height: Math.floor(
                    (viewport.height -
                        (cardMargin.top + cardMargin.bottom) * numberOfRows) /
                        numberOfRows
                ),
            };

            for (let i = 0; i < this.model.dataGroups.length; i++) {
                let cardContainer = this.cardsContainer
                    .append("div")
                    .classed("card card-" + i, true)
                    .style("margin-left", cardMargin.left + "px")
                    .style("margin-right", cardMargin.right + "px")
                    .style("margin-top", cardMargin.top + "px")
                    .style("margin-bottom", cardMargin.bottom + "px")
                    .style("width", cardViewport.width + "px")
                    .style("height", cardViewport.height + "px")
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
    }

    private visualTransform(options: VisualUpdateOptions): ICardViewModel {
        let dataViews: DataView[] = options.dataViews;
        let dataGroups: IDataGroup[] = [];
        let settings: CardSettings;
        settings = CardKPI.parseSettings(dataViews[0]);
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
                }
                //dataGroups.push({});
            }
        }

        return { settings, dataGroups };
    }

    private static parseSettings(dataView: DataView): CardSettings {
        return <CardSettings>CardSettings.parse(dataView);
    }

    /**
     * This function gets called for each of the objects defined in the capabilities files and allows you to select which of the
     * objects and properties you want to expose to the users in the property pane.
     *
     */
    public enumerateObjectInstances(
        options: EnumerateVisualObjectInstancesOptions
    ): VisualObjectInstance[] | VisualObjectInstanceEnumerationObject {
        var objectName = options.objectName;
        var objectEnumeration: VisualObjectInstance[] = [];
        switch (objectName) {
            case "card":
                objectEnumeration.push({
                    objectName: objectName,
                    properties: {
                        backFill: this.model.settings.card.backFill,
                        borderShow: this.model.settings.card.borderShow,
                    },
                    propertyInstanceKind: {
                        backFill: VisualEnumerationInstanceKinds.ConstantOrRule,
                    },
                    altConstantValueSelector: null,
                    selector: dataViewWildcard.createDataViewWildcardSelector(
                        dataViewWildcard.DataViewWildcardMatchingOption
                            .InstancesAndTotals
                    ),
                });
                this.model.settings.card.borderShow &&
                    objectEnumeration.push({
                        objectName: objectName,
                        properties: {
                            borderFill: this.model.settings.card.borderFill,
                            borderType: this.model.settings.card.borderType,
                            borderWeight: this.model.settings.card.borderWeight,
                        },
                        validValues: {
                            borderWeight: {
                                numberRange: {
                                    min: 1,
                                    max: 30,
                                },
                            },
                        },
                        selector: null,
                    });
                break;

            case "multiple":
                objectEnumeration.push({
                    objectName: objectName,
                    properties: {
                        cardsPerRow: this.model.settings.multiple.cardsPerRow,
                        cardsMargin: this.model.settings.multiple.cardsMargin,
                    },
                    validValues: {
                        cardsPerRow: {
                            numberRange: {
                                min: 1,
                                max: 15,
                            },
                        },
                        cardsMargin: {
                            numberRange: {
                                min: 0,
                                max: 100,
                            },
                        },
                    },
                    selector: null,
                });
                break;
        }

        return objectEnumeration;
    }
}
