/*
 *  Power BI Visualizations
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

import { dataViewObjectsParser } from "powerbi-visuals-utils-dataviewutils";
import powerbi from "powerbi-visuals-api";
import DataViewObjectsParser = dataViewObjectsParser.DataViewObjectsParser;

export class AdditionalItem {
  public measureDisplayName: string;
  public metadata: string;
  public componentType: string = "measure";
  public displayUnit: number = 0;
  public decimalPlaces: number = 0;
  public suppressBlankAndNaN: boolean = false;
  public blankAndNaNReplaceText: string = "";
  public invertVariance: boolean = false;
  public componentTypeForColor: string = "measure";
  public unmatchedColor: string = "#333333";
  public conditionFormatting: boolean = false;
  public condition1: boolean = false;
  public comparisonOperator1: string = ">";
  public condition2: boolean = false;
  public comparisonOperator2: string = ">";
  public condition3: boolean = false;
  public comparisonOperator3: string = ">";
  public value1: number = null;
  public value2: number = null;
  public value3: number = null;
  public assignColor1: string = "#333333";
  public assignColor2: string = "#333333";
  public assignColor3: string = "#333333";
  public invertVarianceForColor: boolean = false;
}

export class AdditionalCategory {
  public fontFamily: string =
    "'Segoe UI', wf_segoe-ui_normal, helvetica, arial, sans-serif";
  public wordWrap_: boolean = false;
  public textSize: number = 12;
  public isItalic: boolean = false;
  public isBold: boolean = false;
  public color: string = "#333333";
}

export class Category {
  public cardsPerRow: number = 5;
  public cardsMargin: number = 15;
  public spaceBeforeFirstComponent: number = 15;
  public labelAsMeasurename: boolean = false;
}

export class Background {
  public backFill: string = null;
  public transparency: number = 0;
  public borderShow: boolean = false;
  public borderFill: string = "#000000";
  public borderType: string = "solid";
  public borderWeight: number = 1;
  public show: boolean = false;
  public percentageWidth: number = 50;
  public layout: boolean = true;
}
export class DataLabel {
  public color: string = "#333333";
  public displayUnit: number = 0;
  public decimalPlaces: number = 0;
  public textSize: number = 27;
  public fontFamily: string =
    "'Segoe UI', wf_segoe-ui_normal, helvetica, arial, sans-serif";
  public isItalic: boolean = false;
  public isBold: boolean = false;
  public verticalAlignment: string = "middle";
  public horizontalAlignment: string = "center";
  public suppressBlankAndNaN: boolean = false;
  public blankAndNaNReplaceText: string = "";
  public paddingTop: number = 0;
  public paddingBottom: number = 0;
  public paddingSide: number = 0;
  public font: boolean = false;
  public alignment: boolean = false;
}

export class Additional {
  public paddingTop: number = 0;
  public paddingBottom: number = 0;
  public paddingLeft: number = 0;
  public paddingRight: number = 0;
  public wordWrap_: boolean = false;
  public horizontalAlignment: string = "center";
  public layoutType: string = "vertical";
  public verticalTextAnchor: string = "middle";
  public textAnchor: string = "left";
  public marginOfMeasure: number = 5;
  public percentageWidth: number = 50;
  public showAdditionalOptions: boolean = false;
  public backFill: string = null;
  public transparency: number = 0;

  // text formatting
  public textSize: number = 12;
  public fontFamily: string =
    "'Segoe UI', wf_segoe-ui_normal, helvetica, arial, sans-serif";
  public isItalic: boolean = false;
  public isBold: boolean = false;

  public font: boolean = false;
  public alignment: boolean = false;
}

export class CategoryLabel {
  public show: boolean = true;
  public position: string = "aboveMainMeasure";
  public horizontalAlignment: string = "center";
  public paddingTop: number = 0;
  public paddingSide: number = 5;
  public color: string = "#333333";
  public textSize: number = 15;
  public fontFamily: string =
    "'Segoe UI', wf_segoe-ui_normal, helvetica, arial, sans-serif";
  public wordWrap_: boolean = false;
  public isItalic: boolean = false;
  public isBold: boolean = false;
  public font: boolean = false;
}

export class Grid {
  public percentageWidth: number = 50;
  public wireframe: string = "left";
  public labelAsMeasurename: boolean = false;
  public position: string = "aboveMainMeasure";
  public cardsPerRow: number = 5;
  public cardsMargin: number = 15;
  public layoutType: string = "vertical";
}

export class Alignment {
  public vertical: string = "middle";
  public horizontal: string = "center";
  public show_additional_vertical: boolean = false;
  public show_additional_horizontal: boolean = false;
  public verticalMainMeasure: string = "middle";
  public verticalAdditionalMeasure: string = "middle";
  public horizontalMainMeasure: string = "center";
  public horizontalAdditionalMeasureName: string = "center";
  public horizontalAdditionalMeasureValue: string = "center";
  public horizontalCategory: string = "center";
}

export class CardSettings extends DataViewObjectsParser {
  public category: Category = new Category();
  public background: Background = new Background();
  public additional: Additional = new Additional();
  public additionalItems: AdditionalItem[] = [];
  public dataLabel: DataLabel = new DataLabel();
  public categoryLabel: CategoryLabel = new CategoryLabel();
  public additionalCategory: AdditionalCategory = new AdditionalCategory();
  public grid: Grid = new Grid();
  public alignment: Alignment = new Alignment();
}
