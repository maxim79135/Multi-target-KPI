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
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import { dataViewWildcard } from "powerbi-visuals-utils-dataviewutils";

import { Card } from "./Card";
import { visualTransform } from "./model/ViewModelHelper";
import { ICardViewModel } from "./model/ViewModel";
export type Selection = d3.Selection<any, any, any, any>;

export class CardKPI implements IVisual {
  private card: Card;
  private host: IVisualHost;
  private model: ICardViewModel;

  constructor(options: VisualConstructorOptions) {
    this.host = options.host;
    this.card = new Card(options);
  }

  public update(options: VisualUpdateOptions) {
    this.model = visualTransform(options, this.host);
    this.card.setModel(this.model);
    this.card.updateViewport(options.viewport);
    this.card.createCardContainer();
    this.card.createLabels();
    this.card.createTooltip();
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
    let model = this.model;
    const enumerationObject: powerbi.VisualObjectInstanceEnumerationObject = {
      containers: [],
      instances: [],
    };
    switch (objectName) {
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
            percentageWidth: model.settings.dataLabel.percentageWidth,
            verticalAlignment: model.settings.dataLabel.verticalAlignment,
            horizontalAlignment: model.settings.dataLabel.horizontalAlignment,
            fontFamily: model.settings.dataLabel.fontFamily,
            textSize: model.settings.dataLabel.textSize,
            color: model.settings.dataLabel.color,
            isItalic: model.settings.dataLabel.isItalic,
            isBold: model.settings.dataLabel.isBold,
            displayUnit: model.settings.dataLabel.displayUnit,
            decimalPlaces: model.settings.dataLabel.decimalPlaces,
            suppressBlankAndNaN: model.settings.dataLabel.suppressBlankAndNaN,
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
        if (this.model.settings.dataLabel.suppressBlankAndNaN)
          objectEnumeration.push({
            objectName: objectName,
            properties: {
              blankAndNaNReplaceText:
                this.model.settings.dataLabel.blankAndNaNReplaceText,
            },
            selector: null,
          });
        break;

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
            // spaceBeforeFirstComponent:
            //   model.settings.multiple.spaceBeforeFirstComponent,
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
          },
          selector: null,
        });
        break;

      case "additional":
        console.log(model.settings.additional);
        
        model.settings.additionalItems.length > 0 &&
          enumerationObject.instances.push({
            objectName,
            properties: {
              marginOfMeasure: model.settings.additional.marginOfMeasure,
              paddingTop: model.settings.additional.paddingTop,
              paddingBottom: model.settings.additional.paddingBottom,
              paddingLeft: model.settings.additional.paddingLeft,
              paddingRight: model.settings.additional.paddingRight,
              wordWrap: model.settings.additional.wordWrap,
              horizontalAlignment:
                model.settings.additional.horizontalAlignment,
              layoutType: model.settings.additional.layoutType,
            },
            validValues: {
              marginOfMeasure: {
                numberRange: {
                  min: 0,
                  max: 40,
                },
              },
              verticalPadding: {
                numberRange: {
                  min: 0,
                  max: 40,
                },
              },
              paddingTop: {
                numberRange: {
                  min: 0,
                  max: 40,
                },
              },
              paddingBottom: {
                numberRange: {
                  min: 0,
                  max: 40,
                },
              },
              paddingLeft: {
                numberRange: {
                  min: 0,
                  max: 40,
                },
              },
              paddingRight: {
                numberRange: {
                  min: 0,
                  max: 40,
                },
              },
            },
            selector: null,
          });
        if (model.settings.additional.layoutType == "vertical")
          enumerationObject.instances.push({
            objectName,
            properties: {
              verticalTextAnchor: model.settings.additional.verticalTextAnchor,
              textAnchor: model.settings.additional.textAnchor,
              percentageWidth: model.settings.additional.percentageWidth,
            },
            validValues: {
              percentageWidth: {
                numberRange: {
                  min: 30,
                  max: 70,
                },
              },
            },
            selector: null,
          });

        for (let i = 0; i < model.settings.additionalItems.length; i++) {
          const displayName: string =
            model.settings.additionalItems[i].measureDisplayName;
          const containerIdx: number =
            enumerationObject.containers.push({ displayName }) - 1;
          enumerationObject.instances.push({
            containerIdx,
            objectName,

            properties: {
              componentType: model.settings.additionalItems[i].componentType,
              invertVariance: model.settings.additionalItems[i].invertVariance,
              textSize: model.settings.additionalItems[i].textSize,
              fontFamily: model.settings.additionalItems[i].fontFamily,
              isItalic: model.settings.additionalItems[i].isItalic,
              isBold: model.settings.additionalItems[i].isBold,
              displayUnit: model.settings.additionalItems[i].displayUnit,
              decimalPlaces: model.settings.additionalItems[i].decimalPlaces,
              suppressBlankAndNaN:
                model.settings.additionalItems[i].suppressBlankAndNaN,
              blankAndNaNReplaceText:
                model.settings.additionalItems[i].blankAndNaNReplaceText,
            },
            validValues: {
              decimalPlaces: {
                numberRange: {
                  min: 0,
                  max: 9,
                },
              },
            },
            selector: { metadata: model.settings.additionalItems[i].metadata },
          });
        }
        return enumerationObject;

      case "additionalMeasureColors":
        for (let i = 0; i < model.settings.additionalItems.length; i++) {
          const displayName: string =
            model.settings.additionalItems[i].measureDisplayName;
          const containerIdx: number =
            enumerationObject.containers.push({ displayName }) - 1;
          enumerationObject.instances.push({
            containerIdx,
            objectName,
            properties: {
              unmatchedColor: model.settings.additionalItems[i].unmatchedColor,
              conditionFormatting:
                model.settings.additionalItems[i].conditionFormatting,
            },
            selector: { metadata: model.settings.additionalItems[i].metadata },
          });
          if (model.settings.additionalItems[i].conditionFormatting) {
            enumerationObject.instances[i].properties["componentTypeForColor"] =
              model.settings.additionalItems[i].componentTypeForColor;
            enumerationObject.instances[i].properties[
              "invertVarianceForColor"
            ] = model.settings.additionalItems[i].invertVarianceForColor;
            enumerationObject.instances[i].properties["condition1"] =
              model.settings.additionalItems[i].condition1;
            if (model.settings.additionalItems[i].condition1) {
              enumerationObject.instances[i].properties["comparisonOperator1"] =
                model.settings.additionalItems[i].comparisonOperator1;
              enumerationObject.instances[i].properties["value1"] =
                model.settings.additionalItems[i].value1;
              enumerationObject.instances[i].properties["assignColor1"] =
                model.settings.additionalItems[i].assignColor1;
            }
            enumerationObject.instances[i].properties["condition2"] =
              model.settings.additionalItems[i].condition2;
            if (model.settings.additionalItems[i].condition2) {
              enumerationObject.instances[i].properties["comparisonOperator2"] =
                model.settings.additionalItems[i].comparisonOperator2;
              enumerationObject.instances[i].properties["value2"] =
                model.settings.additionalItems[i].value2;
              enumerationObject.instances[i].properties["assignColor2"] =
                model.settings.additionalItems[i].assignColor2;
            }
            enumerationObject.instances[i].properties["condition3"] =
              model.settings.additionalItems[i].condition3;
            if (model.settings.additionalItems[i].condition3) {
              enumerationObject.instances[i].properties["comparisonOperator3"] =
                model.settings.additionalItems[i].comparisonOperator3;
              enumerationObject.instances[i].properties["value3"] =
                model.settings.additionalItems[i].value3;
              enumerationObject.instances[i].properties["assignColor3"] =
                model.settings.additionalItems[i].assignColor3;
            }
          }
        }
        return enumerationObject;
    }

    return objectEnumeration;
  }
}
