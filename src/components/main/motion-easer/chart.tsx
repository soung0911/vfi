import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
} from "chart.js";
import "chartjs-plugin-dragdata";
import { useAtom } from "jotai";
import { useTheme } from "next-themes";
import { inputFileStateAtom } from "@/store/motion-easer-store";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export interface MotionEaserChartRef {
  getChartData: () => number[];
  updateAllData: (value: number) => void;
}

const MotionEaserChart = forwardRef<MotionEaserChartRef>(({}, ref) => {
  const { theme } = useTheme();

  const [inputFileState] = useAtom(inputFileStateAtom);
  const [dataSet, setDataSet] = useState<number[]>([]);
  const labels =
    inputFileState.previews &&
    inputFileState.previews.map((preview, idx) => idx + 1);
  const chartRef = useRef<ChartJS<"bar">>(null);

  useEffect(() => {
    setDataSet(inputFileState.previews.map(() => 0));
  }, [inputFileState.previews]);

  useImperativeHandle(ref, () => ({
    getChartData: () => dataSet,
    updateAllData: (value: number) => {
      setDataSet(
        inputFileState.previews.map((_, idx) => {
          if (idx === inputFileState.previews.length - 1) {
            return 0;
          } else {
            return value;
          }
        })
      );
      if (chartRef.current) {
        chartRef.current.data.datasets[0].data = dataSet;
        chartRef.current.update();
      }
    },
  }));

  const data = {
    labels: labels?.slice(0, -1),
    datasets: [
      {
        data: dataSet,
        borderWidth: 1,
        borderRadius: 5,
        backgroundColor: "rgba(75, 192, 192)",
        ...(theme === "dark" && { borderColor: "#666" }),
      },
    ],
  };

  const options = {
    responsive: true,
    interaction: {
      intersect: false,
      mode: "index" as const,
      axis: "x" as const,
    },
    plugins: {
      tooltip: { enabled: true },
      legend: { display: false },
      dragData: {
        round: 0,
        showTooltip: true,
        magnet: {
          to: Math.round,
        },
        onDrag: function (
          event: MouseEvent | TouchEvent,
          datasetIndex: number,
          index: number
        ) {
          if (event.target instanceof HTMLElement) {
            event.target.style.cursor = "grabbing";
          }

          if (index === inputFileState.previews.length - 1) {
            return false;
          }
        },
        onDragEnd: function (
          event: MouseEvent | TouchEvent,
          datasetIndex: number,
          index: number,
          value: number
        ) {
          if (event.target instanceof HTMLElement) {
            event.target.style.cursor = "default";
          }

          const allowedValues = [0, 1, 3, 7];
          const closestValue = allowedValues.reduce((prev, curr) =>
            Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev
          );

          const newDataSet = dataSet.map((val, idx) =>
            idx === index ? closestValue : val
          );

          setDataSet(newDataSet);

          if (chartRef.current) {
            chartRef.current.update();
          }
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Frame number",
        },
        grid: {
          color: theme === "dark" ? "#666" : undefined,
        },
        ticks: {
          autoSkip: true,
          maxRotation: 0,
          minRotation: 0,
        },
      },
      y: {
        title: {
          display: true,
          text: "The number of mid frames",
        },
        min: 0,
        max: 7,
        ticks: {
          stepSize: 1,
          callback: (value: number) => {
            return [0, 1, 3, 5, 7].includes(value) ? value : "";
          },
        },
        grid: {
          color: theme === "dark" ? "#666" : undefined,
        },
      },
    },
  };

  return <Bar ref={chartRef} data={data} options={options as never} />;
});

MotionEaserChart.displayName = "MotionEaserChart";

export default MotionEaserChart;
