"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

type ReportType = "weekly" | "monthly" | "yearly";

const reportConfig = {
  weekly: {
    label: "周报",
    color: "from-pink-400 to-purple-400",
    borderColor: "border-pink-300",
  },
  monthly: {
    label: "月报",
    color: "from-purple-400 to-indigo-400",
    borderColor: "border-purple-300",
  },
  yearly: {
    label: "年度总结",
    color: "from-amber-400 to-orange-400",
    borderColor: "border-amber-300",
  },
};

export default function ReportTestPage() {
  const [selectedType, setSelectedType] = useState<ReportType>("weekly");
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const generateReport = async (type: ReportType) => {
    setLoading(true);
    setImageUrl(null);
    try {
      const response = await fetch(`/api/report/${type}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setImageUrl(url);
      }
    } catch (error) {
      console.error("生成报告失败:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 p-6 md:p-10">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* 标题区域 */}
        <div className="text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 shadow-sm backdrop-blur">
            <span className="bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text font-medium text-transparent">
              直播数据报告
            </span>
          </div>
          <h1 className="bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 bg-clip-text text-4xl font-bold text-transparent">
            报告图片生成 API
          </h1>
          <p className="mt-3 text-gray-600">
            为主播生成精美的周报、月报和年度总结图片
          </p>
        </div>

        {/* 报告类型选择 */}
        <div className="flex flex-wrap justify-center gap-4">
          {(["weekly", "monthly", "yearly"] as const).map((type) => {
            const config = reportConfig[type];
            const isSelected = selectedType === type;
            return (
              <button
                key={type}
                onClick={() => {
                  setSelectedType(type);
                  generateReport(type);
                }}
                disabled={loading}
                className={`group relative overflow-hidden rounded-2xl px-8 py-4 font-medium transition-all duration-300 ${
                  isSelected
                    ? `bg-gradient-to-r ${config.color} text-white shadow-lg shadow-purple-200`
                    : "border-2 border-gray-200 bg-white/80 text-gray-700 hover:border-purple-300 hover:shadow-md"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span>{config.label}</span>
                </span>
              </button>
            );
          })}
        </div>

        {/* 预览卡片 */}
        <Card className="overflow-hidden border-2 border-purple-100 bg-white/80 shadow-xl backdrop-blur">
          <CardHeader className="border-b border-purple-50 bg-gradient-to-r from-pink-50 to-purple-50">
            <div className="flex items-center gap-3">
              <div>
                <CardTitle className="text-gray-800">
                  {reportConfig[selectedType].label}预览
                </CardTitle>
                <CardDescription>
                  使用测试数据生成的示例图片
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {loading && (
              <div className="flex h-80 items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="h-12 w-12 animate-spin rounded-full border-4 border-purple-200 border-t-purple-500"></div>
                  <span className="text-gray-500">正在生成报告图片...</span>
                </div>
              </div>
            )}
            {imageUrl && !loading && (
              <div className="overflow-hidden rounded-xl border-2 border-purple-100 shadow-lg">
                <img
                  src={imageUrl}
                  alt="Report Preview"
                  className="w-full"
                  crossOrigin="anonymous"
                />
              </div>
            )}
            {!imageUrl && !loading && (
              <div className="flex h-80 flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-purple-200 bg-purple-50/50">
                <span className="text-gray-500">点击上方按钮生成报告图片</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 环境变量配置 */}
        <Card className="border-2 border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div>
                <CardTitle className="text-amber-800">环境变量配置</CardTitle>
                <CardDescription className="text-amber-700">
                  可选的自定义配置
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-amber-200 bg-white/80 p-4">
              <div className="flex items-start gap-3">
                <code className="rounded bg-amber-100 px-2 py-1 text-sm font-semibold text-amber-800">
                  REPORT_BACKGROUND_URL
                </code>
                <div className="text-sm text-gray-600">
                  <p>设置报告图片的背景图 URL。如果不设置，将使用默认的渐变背景。</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* API 使用说明 */}
        <Card className="border-2 border-purple-100 bg-white/80 backdrop-blur">
          <CardHeader className="border-b border-purple-50">
            <div className="flex items-center gap-3">
              <div>
                <CardTitle>API 使用说明</CardTitle>
                <CardDescription>详细的接口文档</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            <div className="rounded-xl border border-pink-200 bg-pink-50/50 p-4">
              <div className="mb-3 flex items-center gap-2">
                <h3 className="font-semibold text-pink-800">周报 API</h3>
              </div>
              <code className="block rounded-lg bg-white/80 p-3 text-sm font-medium text-pink-700">
                POST /api/report/weekly
              </code>
              <pre className="mt-3 overflow-x-auto rounded-lg bg-white/80 p-4 text-xs text-gray-700">
{`{
  "streamer_name": "小可爱主播",
  "avatar": "头像URL或base64 (可选)",
  "week_start": "2024-01-15",
  "week_end": "2024-01-21",
  "total_stream_minutes": 2580,
  "stream_days": 5,
  "session_count": 8,
  "peak_hour": 20,
  "peak_hour_minutes": 480,
  "longest_session_minutes": 320,
  "streak_days": 15,
  "daily_stats": [
    {
      "date": "2024-01-15",
      "total_minutes": 360,
      "session_count": 2,
      "sessions": [
        { "start_time": "14:00", "end_time": "17:30", "duration_minutes": 210 },
        { "start_time": "20:00", "end_time": "22:30", "duration_minutes": 150 }
      ]
    },
    {
      "date": "2024-01-16",
      "total_minutes": 420,
      "session_count": 1,
      "sessions": [
        { "start_time": "19:00", "end_time": "02:00", "duration_minutes": 420, "crosses_midnight": true }
      ]
    },
    {
      "date": "2024-01-17",
      "total_minutes": 0,
      "session_count": 0,
      "sessions": []
    },
    {
      "date": "2024-01-18",
      "total_minutes": 480,
      "session_count": 2,
      "sessions": [
        { "start_time": "10:00", "end_time": "12:00", "duration_minutes": 120 },
        { "start_time": "20:00", "end_time": "02:00", "duration_minutes": 360, "crosses_midnight": true }
      ]
    },
    {
      "date": "2024-01-19",
      "total_minutes": 540,
      "session_count": 1,
      "sessions": [
        { "start_time": "18:00", "end_time": "03:00", "duration_minutes": 540, "crosses_midnight": true }
      ]
    },
    {
      "date": "2024-01-20",
      "total_minutes": 480,
      "session_count": 2,
      "sessions": [
        { "start_time": "13:00", "end_time": "16:00", "duration_minutes": 180 },
        { "start_time": "21:00", "end_time": "02:00", "duration_minutes": 300, "crosses_midnight": true }
      ]
    },
    {
      "date": "2024-01-21",
      "total_minutes": 0,
      "session_count": 0,
      "sessions": []
    }
  ]
}`}
              </pre>
            </div>

            <div className="rounded-xl border border-purple-200 bg-purple-50/50 p-4">
              <div className="mb-3 flex items-center gap-2">
                <h3 className="font-semibold text-purple-800">月报 API</h3>
              </div>
              <code className="block rounded-lg bg-white/80 p-3 text-sm font-medium text-purple-700">
                POST /api/report/monthly
              </code>
              <pre className="mt-3 overflow-x-auto rounded-lg bg-white/80 p-4 text-xs text-gray-700">
{`{
  "streamer_name": "小可爱主播",
  "avatar": "头像URL或base64 (可选)",
  "month": "2024-01",
  "total_stream_minutes": 10240,
  "stream_days": 25,
  "session_count": 48,
  "peak_hour": 21,
  "peak_hour_minutes": 1920,
  "longest_session_minutes": 420,
  "streak_days": 18,
  "weekly_stats": [
    { "week_number": 1, "total_minutes": 2400, "session_count": 12 },
    { "week_number": 2, "total_minutes": 2800, "session_count": 14 },
    { "week_number": 3, "total_minutes": 2640, "session_count": 11 },
    { "week_number": 4, "total_minutes": 2400, "session_count": 11 }
  ],
  "weekday_distribution": [960, 1440, 1680, 1440, 1920, 1440, 1360]
}`}
              </pre>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
              <div className="mb-3 flex items-center gap-2">
                <h3 className="font-semibold text-amber-800">年度总结 API</h3>
              </div>
              <code className="block rounded-lg bg-white/80 p-3 text-sm font-medium text-amber-700">
                POST /api/report/yearly
              </code>
              <pre className="mt-3 overflow-x-auto rounded-lg bg-white/80 p-4 text-xs text-gray-700">
{`{
  "streamer_name": "小可爱主播",
  "avatar": "头像URL或base64 (可选)",
  "year": 2024,
  "total_stream_minutes": 108000,
  "stream_days": 280,
  "session_count": 520,
  "peak_hour": 21,
  "peak_hour_minutes": 21600,
  "longest_session_minutes": 720,
  "longest_streak_days": 45,
  "monthly_stats": [
    { "month": 1, "total_minutes": 8400, "stream_days": 22 },
    { "month": 2, "total_minutes": 7200, "stream_days": 20 },
    { "month": 3, "total_minutes": 9600, "stream_days": 25 },
    { "month": 4, "total_minutes": 8400, "stream_days": 22 },
    { "month": 5, "total_minutes": 10800, "stream_days": 28 },
    { "month": 6, "total_minutes": 9000, "stream_days": 24 },
    { "month": 7, "total_minutes": 10200, "stream_days": 26 },
    { "month": 8, "total_minutes": 9600, "stream_days": 25 },
    { "month": 9, "total_minutes": 8400, "stream_days": 22 },
    { "month": 10, "total_minutes": 9000, "stream_days": 24 },
    { "month": 11, "total_minutes": 8400, "stream_days": 22 },
    { "month": 12, "total_minutes": 9000, "stream_days": 24 }
  ],
  "top_streaming_months": [
    { "month": 5, "total_minutes": 10800 }
  ],
  "weekday_distribution": [
    { "weekday": 0, "total_minutes": 14400, "session_count": 60 }
  ]
}`}
              </pre>
            </div>

            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex items-start gap-3">
                <div>
                  <h3 className="mb-1 font-semibold text-emerald-800">头像字段说明</h3>
                  <p className="text-sm text-emerald-700">
                    <code className="rounded bg-emerald-100 px-1">avatar</code> 字段支持两种格式：
                  </p>
                  <ul className="mt-2 space-y-1 text-sm text-emerald-700">
                    <li>• URL 格式：图片链接地址</li>
                    <li>• Base64 格式：<code className="rounded bg-emerald-100 px-1">{"data:image/...;base64,..."}</code></li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-sky-200 bg-sky-50 p-4">
              <div className="flex items-start gap-3">
                <div>
                  <h3 className="mb-1 font-semibold text-sky-800">返回说明</h3>
                  <p className="text-sm text-sky-700">
                    API 直接返回 PNG 图片流，Content-Type 为 <code className="rounded bg-sky-100 px-1">image/png</code>。
                    可以直接用于 img 标签的 src 属性，或保存为文件。图片尺寸为 1200x630 像素。
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 底部 */}
        <div className="text-center text-sm text-gray-500">
          <p>Powered by @vercel/og</p>
        </div>
      </div>
    </main>
  );
}
