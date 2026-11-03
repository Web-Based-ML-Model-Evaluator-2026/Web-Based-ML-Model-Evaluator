import React, { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import { BarChart3 } from 'lucide-react';

// Register core Chart.js controllers, scales, and plugins
Chart.register(...registerables);

export default function MetricCharts({ visualizationData }) {
  const chartCanvasRef = useRef(null);
  const chartInstanceRef = useRef(null);

  useEffect(() => {
    if (!chartCanvasRef.current || !visualizationData) return;

    // Destroy existing instance to prevent canvas reuse errors
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const ctx = chartCanvasRef.current.getContext('2d');
    const isClassification = visualizationData.task_type === 'classification';

    // Model comparison color palette
    const palette = [
      { bg: 'rgba(37, 99, 235, 0.8)', border: '#2563eb' },
      { bg: 'rgba(16, 185, 129, 0.8)', border: '#10b981' },
      { bg: 'rgba(245, 158, 11, 0.8)', border: '#f59e0b' }
    ];

    const datasets = visualizationData.models.map((model, idx) => ({
      label: model.name,
      data: model.scores,
      backgroundColor: palette[idx % palette.length].bg,
      borderColor: palette[idx % palette.length].border,
      borderWidth: 1.5,
      borderRadius: 4
    }));

    chartInstanceRef.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: visualizationData.metrics_list,
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              font: { family: 'sans-serif', size: 12 },
              color: '#334155'
            }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const val = context.raw;
                return `${context.dataset.label}: ${typeof val === 'number' ? val.toFixed(4) : val}`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: isClassification ? 1.0 : undefined,
            title: {
              display: true,
              text: isClassification ? 'Score (0.0 to 1.0)' : 'Error / Value',
              color: '#475569',
              font: { weight: 'bold', size: 11 }
            },
            grid: { color: 'rgba(226, 232, 240, 0.6)' }
          },
          x: {
            grid: { display: false },
            ticks: { color: '#334155', font: { weight: 'bold' } }
          }
        }
      }
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [visualizationData]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
          <BarChart3 className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-800">
            Model Performance Comparison
          </h2>
          <p className="text-xs text-slate-500 capitalize">
            {visualizationData?.task_type || 'classification'} evaluation metrics across models
          </p>
        </div>
      </div>

      <div className="h-80 w-full relative">
        <canvas ref={chartCanvasRef}></canvas>
      </div>
    </div>
  );
}