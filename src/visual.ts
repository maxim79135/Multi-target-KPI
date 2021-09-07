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
import VisualEnumerationInstanceKinds = powerbi.VisualEnumerationInstanceKinds;
import { dataViewWildcard } from "powerbi-visuals-utils-dataviewutils";

import { CardSettings } from "./settings";
import { Card } from "./Card";
export type Selection = d3.Selection<any, any, any, any>;

export class CardKPI implements IVisual {
  private card: Card;

  constructor(options: VisualConstructorOptions) {
    this.card = new Card(options.element);
  }

  public update(options: VisualUpdateOptions) {
    let settings = CardKPI.parseSettings(options.dataViews[0]);

    this.card.visualTransform(options, settings);
    this.card.updateViewport(options.viewport);
    this.card.createCardContainer();
    this.card.createLabels();
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
    let model = this.card.getModel();
    switch (objectName) {
      case "card":
        objectEnumeration.push({
          objectName: objectName,
          properties: {
            backFill: model.settings.card.backFill,
            borderShow: model.settings.card.borderShow,
          },
          propertyInstanceKind: {
            backFill: VisualEnumerationInstanceKinds.ConstantOrRule,
          },
          altConstantValueSelector: null,
          selector: dataViewWildcard.createDataViewWildcardSelector(
            dataViewWildcard.DataViewWildcardMatchingOption.InstancesAndTotals
          ),
        });
        model.settings.card.borderShow &&
          objectEnumeration.push({
            objectName: objectName,
            properties: {
              borderFill: model.settings.card.borderFill,
              borderType: model.settings.card.borderType,
              borderWeight: model.settings.card.borderWeight,
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
            cardsPerRow: model.settings.multiple.cardsPerRow,
            cardsMargin: model.settings.multiple.cardsMargin,
            spaceBeforeFirstComponent:
              model.settings.multiple.spaceBeforeFirstComponent,
            spaceBetweenCardComponent:
              model.settings.multiple.spaceBetweenCardComponent,
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
            spaceBeforeFirstComponent: {
              numberRange: {
                min: 0,
                max: 100,
              },
            },
            spaceBetweenCardComponent: {
              numberRange: {
                min: 0,
                max: 100,
              },
            },
          },
          selector: null,
        });
        break;

      case "categoryLabel":
        objectEnumeration.push({
          objectName: objectName,
          properties: {
            show: model.settings.categoryLabel.show,
            horizontalAlignment:
              model.settings.categoryLabel.horizontalAlignment,
            paddingTop: model.settings.categoryLabel.paddingTop,
            paddingSide: model.settings.categoryLabel.paddingSide,
            color: model.settings.categoryLabel.color,
            textSize: model.settings.categoryLabel.textSize,
            fontFamily: model.settings.categoryLabel.fontFamily,
            wordWrap: model.settings.categoryLabel.wordWrap,
            isItalic: model.settings.categoryLabel.isItalic,
            isBold: model.settings.categoryLabel.isBold,
          },
          validValues: {
            paddingTop: {
              numberRange: {
                min: 0,
                max: 15,
              },
            },
            paddingSide: {
              numberRange: {
                min: 0,
                max: 15,
              },
            },
          },
          selector: null,
        });
        break;

      case "dataLabel":
        objectEnumeration.push({
          objectName: objectName,
          properties: {
            color: model.settings.dataLabel.color,
            textSize: model.settings.dataLabel.textSize,
            fontFamily: model.settings.dataLabel.fontFamily,
            isItalic: model.settings.dataLabel.isItalic,
            isBold: model.settings.dataLabel.isBold,
            displayUnit: model.settings.dataLabel.displayUnit,
            decimalPlaces: model.settings.dataLabel.decimalPlaces,
            percentageWidth: model.settings.dataLabel.percentageWidth,
          },
          validValues: {
            decimalPlaces: {
              numberRange: {
                min: 0,
                max: 9,
              },
            },
            percentageWidth: {
              numberRange: {
                min: 30,
                max: 70,
              },
            },
          },
          propertyInstanceKind: {
            color: VisualEnumerationInstanceKinds.ConstantOrRule,
          },
          altConstantValueSelector: null,
          selector: dataViewWildcard.createDataViewWildcardSelector(
            dataViewWildcard.DataViewWildcardMatchingOption.InstancesAndTotals
          ),
        });
        break;

      case "additionalCategoryLabel":
        objectEnumeration.push({
          objectName: objectName,
          properties: {
            show: model.settings.additionalCategoryLabel.show,
            horizontalAlignment:
              model.settings.additionalCategoryLabel.horizontalAlignment,
            paddingBottom: model.settings.additionalCategoryLabel.paddingBottom,
            color: model.settings.additionalCategoryLabel.color,
            textSize: model.settings.additionalCategoryLabel.textSize,
            fontFamily: model.settings.additionalCategoryLabel.fontFamily,
            wordWrap: model.settings.additionalCategoryLabel.wordWrap,
            isItalic: model.settings.additionalCategoryLabel.isItalic,
            isBold: model.settings.additionalCategoryLabel.isBold,
          },
          validValues: {
            paddingBottom: {
              numberRange: {
                min: 0,
                max: 50,
              },
            },
          },
          propertyInstanceKind: {
            color: VisualEnumerationInstanceKinds.ConstantOrRule,
          },
          altConstantValueSelector: null,
          selector: dataViewWildcard.createDataViewWildcardSelector(
            dataViewWildcard.DataViewWildcardMatchingOption.InstancesAndTotals
          ),
        });
        break;

      case "measureComparison":
        objectEnumeration.push({
          objectName: objectName,
          properties: {
            show: model.settings.measureComparison.show,
            paddingBottom: model.settings.measureComparison.paddingBottom,
            paddingRight: model.settings.measureComparison.paddingRight,
            color: model.settings.measureComparison.color,
            textSize: model.settings.measureComparison.textSize,
            fontFamily: model.settings.measureComparison.fontFamily,
            isItalic: model.settings.measureComparison.isItalic,
            isBold: model.settings.measureComparison.isBold,
            componentType: model.settings.measureComparison.componentType,
            comparisonOperator:
              model.settings.measureComparison.comparisonOperator,
            condition1: model.settings.measureComparison.condition1,
            condition2: model.settings.measureComparison.condition2,
            condition3: model.settings.measureComparison.condition3,
            condition4: model.settings.measureComparison.condition4,
          },
          validValues: {
            paddingBottom: {
              numberRange: {
                min: 0,
                max: 50,
              },
            },
            paddingRight: {
              numberRange: {
                min: 0,
                max: 50,
              },
            },
          },
          propertyInstanceKind: {
            color: VisualEnumerationInstanceKinds.ConstantOrRule,
          },
          altConstantValueSelector: null,
          selector: dataViewWildcard.createDataViewWildcardSelector(
            dataViewWildcard.DataViewWildcardMatchingOption.InstancesAndTotals
          ),
        });
        break;
    }
    console.log(objectEnumeration);

    return objectEnumeration;
  }
}
