export enum chartTypes {
  AREA_CHART = "AreaChart",
}

export interface IChartSeries {
  dataKey: string;
  strokeColor?: string;
  strokeWidth?: number;
  hasGradient?: boolean;
}

export interface IChartData {
  data: unknown[],
  series: IChartSeries[]
}
