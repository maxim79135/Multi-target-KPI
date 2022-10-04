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

import powerbi from "powerbi-visuals-api";
import { CardSettings, AdditionalItem, DataLabel } from "../settings";
import {
  IAdditionalMeasure,
  ICardViewModel,
  IDataGroup,
  ITooltipValue,
} from "./ViewModel";
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import { getValue } from "../utils/objectEnumerationUtility";
import { prepareMeasureText } from "../utils/prepareMeasureText";
import { valueFormatter } from "powerbi-visuals-utils-formattingutils";
import DataView = powerbi.DataView;
import PrimitiveValue = powerbi.PrimitiveValue;

import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import DataViewValueColumn = powerbi.DataViewValueColumn;
function parseSettings(dataView: DataView): CardSettings {
  return <CardSettings>CardSettings.parse(dataView);
}

// tslint:disable-next-line: max-func-body-length
function getAdditionalSettings(
  value: DataViewValueColumn,
  settings: CardSettings
): AdditionalItem {
  let additionalSetting: AdditionalItem;
  additionalSetting = settings.additionalItems.find(
    (i) => i.metadata === value.source.queryName
  );
  if (additionalSetting) return additionalSetting;
  else {
    additionalSetting = new AdditionalItem();
    additionalSetting.measureDisplayName = value.source.displayName;
    additionalSetting.metadata = value.source.queryName;
    additionalSetting.componentType = <string>(
      getValue(
        value.source.objects,
        "additional",
        "componentType",
        additionalSetting.componentType
      )
    );
    additionalSetting.displayUnit = <number>(
      getValue(
        value.source.objects,
        "additional",
        "displayUnit",
        additionalSetting.displayUnit
      )
    );
    additionalSetting.decimalPlaces = <number>(
      getValue(
        value.source.objects,
        "additional",
        "decimalPlaces",
        additionalSetting.decimalPlaces
      )
    );
    additionalSetting.invertVariance = <boolean>(
      getValue(
        value.source.objects,
        "additional",
        "invertVariance",
        additionalSetting.invertVariance
      )
    );
    additionalSetting.suppressBlankAndNaN = <boolean>(
      getValue(
        value.source.objects,
        "additional",
        "suppressBlankAndNaN",
        additionalSetting.suppressBlankAndNaN
      )
    );
    additionalSetting.blankAndNaNReplaceText = <string>(
      getValue(
        value.source.objects,
        "additional",
        "blankAndNaNReplaceText",
        additionalSetting.blankAndNaNReplaceText
      )
    );
    additionalSetting.componentTypeForColor = <string>(
      getValue(
        value.source.objects,
        "additionalMeasureColors",
        "componentTypeForColor",
        additionalSetting.componentTypeForColor
      )
    );
    additionalSetting.invertVarianceForColor = <boolean>(
      getValue(
        value.source.objects,
        "additionalMeasureColors",
        "invertVarianceForColor",
        additionalSetting.invertVarianceForColor
      )
    );
    additionalSetting.unmatchedColor = getValue(
      value.source.objects,
      "additionalMeasureColors",
      "unmatchedColor",
      additionalSetting.unmatchedColor
    );
    if (additionalSetting.unmatchedColor["solid"])
      additionalSetting.unmatchedColor =
        additionalSetting.unmatchedColor["solid"]["color"];

    additionalSetting.conditionFormatting = <boolean>(
      getValue(
        value.source.objects,
        "additionalMeasureColors",
        "conditionFormatting",
        additionalSetting.conditionFormatting
      )
    );
    additionalSetting.condition1 = <boolean>(
      getValue(
        value.source.objects,
        "additionalMeasureColors",
        "condition1",
        additionalSetting.condition1
      )
    );
    additionalSetting.condition2 = <boolean>(
      getValue(
        value.source.objects,
        "additionalMeasureColors",
        "condition2",
        additionalSetting.condition2
      )
    );
    additionalSetting.condition3 = <boolean>(
      getValue(
        value.source.objects,
        "additionalMeasureColors",
        "condition3",
        additionalSetting.condition3
      )
    );
    additionalSetting.comparisonOperator1 = <string>(
      getValue(
        value.source.objects,
        "additionalMeasureColors",
        "comparisonOperator1",
        additionalSetting.comparisonOperator1
      )
    );
    additionalSetting.comparisonOperator2 = <string>(
      getValue(
        value.source.objects,
        "additionalMeasureColors",
        "comparisonOperator2",
        additionalSetting.comparisonOperator2
      )
    );
    additionalSetting.comparisonOperator3 = <string>(
      getValue(
        value.source.objects,
        "additionalMeasureColors",
        "comparisonOperator3",
        additionalSetting.comparisonOperator3
      )
    );
    additionalSetting.value1 = <number>(
      getValue(
        value.source.objects,
        "additionalMeasureColors",
        "value1",
        additionalSetting.value1
      )
    );
    additionalSetting.value2 = <number>(
      getValue(
        value.source.objects,
        "additionalMeasureColors",
        "value2",
        additionalSetting.value2
      )
    );
    additionalSetting.value3 = <number>(
      getValue(
        value.source.objects,
        "additionalMeasureColors",
        "value3",
        additionalSetting.value3
      )
    );
    additionalSetting.assignColor1 = <string>(
      getValue(
        value.source.objects,
        "additionalMeasureColors",
        "assignColor1",
        additionalSetting.assignColor1
      )
    );
    additionalSetting.assignColor2 = <string>(
      getValue(
        value.source.objects,
        "additionalMeasureColors",
        "assignColor2",
        additionalSetting.assignColor2
      )
    );
    additionalSetting.assignColor3 = <string>(
      getValue(
        value.source.objects,
        "additionalMeasureColors",
        "assignColor3",
        additionalSetting.assignColor3
      )
    );
    settings.additionalItems.push(additionalSetting);
    return additionalSetting;
  }
}

function calculateAdditionalValue(
  mainMeasureValue: number,
  additionalMeasureValue: number,
  componentType: string,
  invert: boolean
): number {
  let result: number = null;
  if (mainMeasureValue || additionalMeasureValue)
    switch (componentType) {
      case "measure": {
        result = mainMeasureValue;
        break;
      }
      case "changeOver": {
        if (!mainMeasureValue)
          result = invert ? additionalMeasureValue : -additionalMeasureValue;
        else if (!additionalMeasureValue)
          result = invert ? -mainMeasureValue : mainMeasureValue;
        else
          result = invert
            ? additionalMeasureValue - mainMeasureValue
            : mainMeasureValue - additionalMeasureValue;
        break;
      }
      case "percentageChangeOver": {
        if (!invert) {
          if (
            mainMeasureValue &&
            additionalMeasureValue &&
            additionalMeasureValue != 0
          )
            result = mainMeasureValue / additionalMeasureValue - 1;
        } else {
          if (
            mainMeasureValue &&
            additionalMeasureValue &&
            mainMeasureValue != 0
          )
            result = additionalMeasureValue / mainMeasureValue - 1;
        }
        break;
      }
      case "percentageOver": {
        if (!invert) {
          if (
            mainMeasureValue &&
            additionalMeasureValue &&
            additionalMeasureValue != 0
          )
            result = mainMeasureValue / additionalMeasureValue;
        } else {
          if (
            mainMeasureValue &&
            additionalMeasureValue &&
            mainMeasureValue != 0
          )
            result = additionalMeasureValue / mainMeasureValue;
        }
        break;
      }
    }
  return Number(Number(result).toFixed(4));
}

function comparisonValues(
  value1: number,
  value2: number,
  operator: string
): boolean {
  switch (operator) {
    case ">":
      return value1 > value2;
    case ">=":
      return value1 >= value2;
    case "<":
      return value1 < value2;
    case "<=":
      return value1 <= value2;
    case "=":
      return value1 == value2;
  }
}

function updateAdditionalMeasureColor(
  additionalSettings: AdditionalItem,
  value: number,
  value2Text: string,
  comparisonOperator: string,
  conditionText: string,
  assignColorText: string
) {
  if (
    additionalSettings[conditionText] &&
    comparisonValues(value, additionalSettings[value2Text], comparisonOperator)
  ) {
    if (additionalSettings[assignColorText]["solid"])
      return additionalSettings[assignColorText]["solid"]["color"];
    else return additionalSettings[assignColorText];
  }
  return undefined;
}

// tslint:disable-next-line: max-func-body-length
export function visualTransform(
  options: VisualUpdateOptions,
  host: IVisualHost
): ICardViewModel {
  let dataViews: DataView[] = options.dataViews;
  let dataGroups: IDataGroup[] = [];
  let settings: CardSettings = parseSettings(dataViews[0]);
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
    let categories: PrimitiveValue[] = [];
    if (category) {
      categories = category.values;
    } else {
      dataCategorical.values.forEach(() => categories.push(null));
    }

    for (let i = 0; i < categories.length; i++) {
      let dataGroup: IDataGroup = { additionalMeasures: [], tooltipValues: [] };

      for (let ii = 0; ii < dataCategorical.values.length; ii++) {
        let index = categories[i] ? ii : i;
        let dataValue = dataCategorical.values[index];
        let value: any = dataValue.values[categories[i] ? i : 0];
        let valueType = dataValue.source.type;
        if (dataValue.source.roles["Main Measure"]) {
          console.log(dataValue, 123);

          if (categories[i]) {
            if (settings.category.labelAsMeasurename) {
              dataGroup.displayName = dataValue.source.displayName;
            } else {
              dataGroup.displayName = category
                ? categories[i].toString()
                : dataValue.source.displayName;
            }
          } else {
            if (category) dataGroup.displayName = "";
            else dataGroup.displayName = dataValue.source.displayName;
          }
          dataGroup.mainMeasureValue =
            valueType.numeric || valueType.integer ? value : null;
          dataGroup.mainMeasureDataLabel = prepareMeasureText(
            value,
            valueType,
            dataValue.objects
              ? <string>dataValue.objects[0]["general"]["formatString"]
              : valueFormatter.getFormatStringByColumn(dataValue.source),
            settings.dataLabel.displayUnit,
            settings.dataLabel.decimalPlaces,
            false,
            settings.dataLabel.suppressBlankAndNaN,
            settings.dataLabel.blankAndNaNReplaceText,
            host.locale
          );
          dataGroup.isPercentage =
            dataValue.source &&
            dataValue.source.format &&
            dataValue.source.format.indexOf("%") != -1;
        }
        if (dataValue.source.roles["additional"]) {
          let additionalMeasure: IAdditionalMeasure = {};
          let additionalSettings = getAdditionalSettings(dataValue, settings);
          additionalMeasure.displayName = additionalSettings.measureDisplayName;
          additionalMeasure.measureValue =
            valueType.numeric || valueType.integer ? value : null;

          additionalMeasure.isPercentage =
            dataValue.source &&
            dataValue.source.format &&
            dataValue.source.format.indexOf("%") != -1;
          additionalMeasure.calculatedValue = calculateAdditionalValue(
            dataGroup.mainMeasureValue,
            additionalMeasure.measureValue,
            additionalSettings.componentType,
            additionalSettings.invertVariance
          );
          let additionalMeasureForColor = calculateAdditionalValue(
            dataGroup.mainMeasureValue,
            additionalMeasure.measureValue,
            additionalSettings.componentTypeForColor,
            additionalSettings.invertVarianceForColor
          );
          if (!additionalSettings.conditionFormatting) {
            additionalMeasure.labelFill = additionalSettings.unmatchedColor;
          }

          if (additionalSettings.conditionFormatting) {
            let color1, color2, color3: string;
            switch (additionalSettings.componentTypeForColor) {
              case "f(x)":
                additionalMeasure.labelFill = additionalSettings.unmatchedColor;
                break;
              case "measure":
                color1 = updateAdditionalMeasureColor(
                  additionalSettings,
                  value,
                  "value1",
                  additionalSettings.comparisonOperator1,
                  "condition1",
                  "assignColor1"
                );
                color2 = updateAdditionalMeasureColor(
                  additionalSettings,
                  value,
                  "value2",
                  additionalSettings.comparisonOperator2,
                  "condition2",
                  "assignColor2"
                );
                color3 = updateAdditionalMeasureColor(
                  additionalSettings,
                  value,
                  "value3",
                  additionalSettings.comparisonOperator3,
                  "condition3",
                  "assignColor3"
                );

                if (color1 != undefined) additionalMeasure.labelFill = color1;
                else if (color2 != undefined)
                  additionalMeasure.labelFill = color2;
                else if (color3 != undefined)
                  additionalMeasure.labelFill = color3;
                break;
              case "changeOver":
                color1 = updateAdditionalMeasureColor(
                  additionalSettings,
                  additionalMeasureForColor,
                  "value1",
                  additionalSettings.comparisonOperator1,
                  "condition1",
                  "assignColor1"
                );
                color2 = updateAdditionalMeasureColor(
                  additionalSettings,
                  additionalMeasureForColor,
                  "value2",
                  additionalSettings.comparisonOperator2,
                  "condition2",
                  "assignColor2"
                );
                color3 = updateAdditionalMeasureColor(
                  additionalSettings,
                  additionalMeasureForColor,
                  "value3",
                  additionalSettings.comparisonOperator3,
                  "condition3",
                  "assignColor3"
                );

                if (color1 != undefined) additionalMeasure.labelFill = color1;
                else if (color2 != undefined)
                  additionalMeasure.labelFill = color2;
                else if (color3 != undefined)
                  additionalMeasure.labelFill = color3;
                break;
              case "percentageChangeOver":
                color1 = updateAdditionalMeasureColor(
                  additionalSettings,
                  additionalMeasureForColor * 100,
                  "value1",
                  additionalSettings.comparisonOperator1,
                  "condition1",
                  "assignColor1"
                );
                color2 = updateAdditionalMeasureColor(
                  additionalSettings,
                  additionalMeasureForColor * 100,
                  "value2",
                  additionalSettings.comparisonOperator2,
                  "condition2",
                  "assignColor2"
                );
                color3 = updateAdditionalMeasureColor(
                  additionalSettings,
                  additionalMeasureForColor * 100,
                  "value3",
                  additionalSettings.comparisonOperator3,
                  "condition3",
                  "assignColor3"
                );

                if (color1 != undefined) additionalMeasure.labelFill = color1;
                else if (color2 != undefined)
                  additionalMeasure.labelFill = color2;
                else if (color3 != undefined)
                  additionalMeasure.labelFill = color3;
                break;
              case "percentageOver":
                color1 = updateAdditionalMeasureColor(
                  additionalSettings,
                  additionalMeasureForColor * 100,
                  "value1",
                  additionalSettings.comparisonOperator1,
                  "condition1",
                  "assignColor1"
                );
                color2 = updateAdditionalMeasureColor(
                  additionalSettings,
                  additionalMeasureForColor * 100,
                  "value2",
                  additionalSettings.comparisonOperator2,
                  "condition2",
                  "assignColor2"
                );
                color3 = updateAdditionalMeasureColor(
                  additionalSettings,
                  additionalMeasureForColor * 100,
                  "value3",
                  additionalSettings.comparisonOperator3,
                  "condition3",
                  "assignColor3"
                );

                if (color1 != undefined) additionalMeasure.labelFill = color1;
                else if (color2 != undefined)
                  additionalMeasure.labelFill = color2;
                else if (color3 != undefined)
                  additionalMeasure.labelFill = color3;
                break;
            }
          }

          switch (additionalSettings.componentType) {
            case "measure": {
              additionalMeasure.dataLabel = prepareMeasureText(
                value,
                valueType,
                dataValue.objects
                  ? <string>dataValue.objects[0]["general"]["formatString"]
                  : valueFormatter.getFormatStringByColumn(dataValue.source),
                additionalSettings.displayUnit,
                additionalSettings.decimalPlaces,
                false,
                additionalSettings.suppressBlankAndNaN,
                additionalSettings.blankAndNaNReplaceText,
                host.locale
              );
              break;
            }
            case "changeOver": {
              if (dataGroup.isPercentage && additionalMeasure.isPercentage) {
                additionalMeasure.dataLabel =
                  prepareMeasureText(
                    additionalMeasure.calculatedValue * 100,
                    { numeric: true },
                    "#,0.00",
                    1,
                    additionalSettings.decimalPlaces,
                    true,
                    false,
                    "",
                    host.locale
                  ) + "ppt";
              } else {
                additionalMeasure.dataLabel = prepareMeasureText(
                  additionalMeasure.calculatedValue,
                  valueType,
                  dataValue.objects
                    ? <string>dataValue.objects[0]["general"]["formatString"]
                    : valueFormatter.getFormatStringByColumn(dataValue.source),
                  additionalSettings.displayUnit,
                  additionalSettings.decimalPlaces,
                  true,
                  additionalSettings.suppressBlankAndNaN,
                  additionalSettings.blankAndNaNReplaceText,
                  host.locale
                );
              }
              break;
            }
            case "percentageChangeOver": {
              additionalMeasure.dataLabel =
                prepareMeasureText(
                  additionalMeasure.calculatedValue * 100,
                  { numeric: true },
                  "#,0.00",
                  1,
                  additionalSettings.decimalPlaces,
                  true,
                  false,
                  "",
                  host.locale
                ) + "%";
              break;
            }
            case "percentageOver": {
              additionalMeasure.dataLabel =
                prepareMeasureText(
                  additionalMeasure.calculatedValue * 100,
                  { numeric: true },
                  "#,0.00",
                  1,
                  additionalSettings.decimalPlaces,
                  false,
                  false,
                  "",
                  host.locale
                ) + "%";
              break;
            }
          }
          dataGroup.additionalMeasures.push(additionalMeasure);
        }
        if (dataValue.source.roles["tooltips"]) {
          dataGroup.tooltipValues.push({
            displayName: dataValue.source.displayName,
            dataLabel: prepareMeasureText(
              value,
              valueType,
              dataValue.objects
                ? <string>dataValue.objects[0]["general"]["formatString"]
                : valueFormatter.getFormatStringByColumn(dataValue.source),
              1,
              0,
              false,
              false,
              "",
              "ru-RU"
            ),
          });
        }

        if (index != ii) continue;
      }

      // add selectionId
      if (category) {
        dataGroup.selectionId = host
          .createSelectionIdBuilder()
          .withCategory(category, i)
          .createSelectionId();
      } else {
        dataGroup.selectionId = host
          .createSelectionIdBuilder()
          .withMeasure(dataCategorical.values[0].source.queryName)
          .createSelectionId();
      }
      dataGroups.push(dataGroup);
    }
    console.log(dataGroups);
  }

  return { settings, dataGroups };
}
