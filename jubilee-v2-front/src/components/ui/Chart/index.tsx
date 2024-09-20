import Container from "~/components/ui/Container";
import Separator from "~/components/ui/Separator";
import {
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Area,
  ResponsiveContainer,
} from "recharts";
import { Icon } from "@fortawesome/fontawesome-svg-core";
import CustomTooltip from "./customTooltip";
import * as S from "./styles";
import { Fragment, useMemo } from "react";
import { IChartData, chartTypes } from "~/types/chart";

interface IChartProps {
  config: IChartData;
  stats?: Array<{ label: string; value: string | number }>;
  tooltipIcon?: Icon;
  type?: chartTypes;
  aspect?: number;
  header?: React.ReactNode;
  tooltipFormatValue?: (value: unknown) => string;
  tooltipFormatLabel?: (value: unknown) => string;
}

const defaultStrokeColor = "#00B815";

/* This chart always uses the data key "x" to represent the x-axis. */
const Chart = ({
  config,
  stats,
  header,
  type = chartTypes.AREA_CHART,
  tooltipFormatValue,
  tooltipFormatLabel,
  tooltipIcon,
  aspect = 3,
}: IChartProps) => {
  const chart: any = useMemo(() => {
    const tooltip = (
      <Tooltip
        content={
          <CustomTooltip
            tooltipIcon={tooltipIcon}
            tooltipFormatValue={tooltipFormatValue}
            tooltipFormatLabel={tooltipFormatLabel}
          />
        }
      />
    );

    const definitions = (
      <defs>
        {config.series.map((series, i) =>
          series.hasGradient ? (
            <linearGradient
              key={i}
              id={`gradient_${i}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1">
              <stop
                offset="5%"
                stopColor={series.strokeColor || defaultStrokeColor}
                stopOpacity={0.4}
              />
              <stop
                offset="70%"
                stopColor={series.strokeColor || defaultStrokeColor}
                stopOpacity={0}
              />
            </linearGradient>
          ) : null
        )}
      </defs>
    );

    switch (type) {
      case chartTypes.AREA_CHART:
        return (
          <AreaChart
            data={config.data}
            margin={{ top: 40, right: 30, left: 10, bottom: 30 }}>
            {definitions}
            <XAxis axisLine={false} tickLine={false} dataKey="x" />
            <YAxis axisLine={false} tickLine={false} />
            <CartesianGrid vertical={false} strokeDasharray="5 5" />
            {tooltip}
            {config.series.map((series, i) => (
              <Area
                type="monotone"
                key={series.dataKey}
                strokeWidth={series.strokeWidth || 4}
                dataKey={series.dataKey}
                stroke={series.strokeColor || defaultStrokeColor}
                fillOpacity={1}
                fill={`url(#gradient_${i})`}
              />
            ))}
          </AreaChart>
        );
      default:
        console.error("Invalid chart type.");
        return null;
    }
  }, [config, type]);

  const chartHeader = useMemo(() => {
    return stats ? (
      <S.ChartHeader>
        {stats.map((elm, i) => (
          <Fragment key={i}>
            <S.HeaderCell>
              <label>{elm.label}</label>
              <span>{elm.value}</span>
            </S.HeaderCell>
            {i !== stats.length - 1 ? <Separator type="vertical" /> : null}
          </Fragment>
        ))}
      </S.ChartHeader>
    ) : null;
  }, [stats]);

  return (
    <Container flexDirection="column" padding="0" gap={1} width="100%">
      {header || chartHeader}
      <ResponsiveContainer width="100%" height="100%" aspect={aspect}>
        {chart}
      </ResponsiveContainer>
    </Container>
  );
};

export default Chart;
