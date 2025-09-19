"use client";
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardTitle,
} from "../../ui/card";



import RenderTable from "./RenderTable";
import { ChartRenderer } from "./ChartRender";

type RawChartData = {
  type: string;
  xAxis: string;
  yAxis: string;
  data: {
    type: string;
    labels: string[];
    data: { label: string; value: number }[];
  };
};

type ChartRendererData = {
  type: string;
  title: string;
  labels: string[];
  data: number[];
};

// export function transformToChartRendererFormat(
//   rawChart: RawChartData
// ): ChartRendererData {
//   return {
//     type: rawChart.data.type,
//     title: `${rawChart.yAxis} by ${rawChart.xAxis}`,
//     labels: rawChart.data.data.map((d) => d.label),
//     data: rawChart.data.data.map((d) => d.value),
//   };
// }

const AnalyticCardFileApi = ({
  analyticCardWithFileApi,
}: {
  analyticCardWithFileApi: any;
}) => {
  const [currentIndex, setCurrentIndex] = React.useState(1);
  const rowsPerPage = 10;

  const totalRows = analyticCardWithFileApi?.table?.data?.rows || [];
  const totalPages = Math.ceil(totalRows.length / rowsPerPage);
  const paginatedRows = totalRows.slice(
    (currentIndex - 1) * rowsPerPage,
    currentIndex * rowsPerPage
  );
  return (
    <div className="w-full mt-2.5">
      <Card className="p-2.5  space-y-2.5">
        <CardTitle>{analyticCardWithFileApi?.table?.title}</CardTitle>
        <CardDescription>
          {analyticCardWithFileApi?.table?.description}
        </CardDescription>
        <CardContent className="w-full  p-0">
          <div className=" w-full ">
            <Tabs defaultValue="table" className="w-full">
              <TabsList className="grid grid-cols-2">
                <TabsTrigger value="table">Table</TabsTrigger>
                <TabsTrigger value="chart">Chart</TabsTrigger>
              </TabsList>
              <TabsContent value="table">

                <RenderTable table={analyticCardWithFileApi?.table} />

              </TabsContent>
              <TabsContent value="chart">
                <ChartRenderer chart={analyticCardWithFileApi?.chart} />
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-start">
          <p className="font-semibold">
            {analyticCardWithFileApi?.story?.title}
          </p>
          <p className="text-muted-foreground">
            {analyticCardWithFileApi?.story?.description}
          </p>
          {analyticCardWithFileApi?.story?.data?.map((item, index) => (
            <span key={index}>{item}</span>
          ))}
        </CardFooter>
      </Card>
    </div>
  );
};

export default AnalyticCardFileApi;
