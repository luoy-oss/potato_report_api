// 直播数据类型定义

export interface StreamSession {
  start_time: string; // ISO 8601 格式
  end_time: string;
  duration_minutes: number;
  title?: string;
}

export interface DailyStats {
  date: string; // YYYY-MM-DD
  total_minutes: number;
  session_count: number;
  sessions?: {
    start_time: string; // HH:mm 或 ISO 8601
    end_time: string;
    duration_minutes: number;
    crosses_midnight?: boolean; // 是否跨天
  }[];
}

export interface HourlyDistribution {
  hour: number; // 0-23
  total_minutes: number;
  session_count: number;
}

export interface WeekdayDistribution {
  weekday: number; // 0-6, 0=Sunday
  total_minutes: number;
  session_count: number;
}

// 周报请求数据
export interface WeeklyReportRequest {
  streamer_name: string;
  avatar?: string; // 支持 URL 或 base64 (data:image/...;base64,...)
  week_start: string; // YYYY-MM-DD
  week_end: string;
  total_stream_minutes: number;
  stream_days: number;
  session_count: number;
  peak_hour: number; // 最活跃的小时 0-23
  peak_hour_minutes: number;
  longest_session_minutes: number;
  streak_days: number; // 连续直播天数
  daily_stats: DailyStats[];
  hourly_distribution?: HourlyDistribution[];
}

// 月报请求数据
export interface MonthlyReportRequest {
  streamer_name: string;
  avatar?: string; // 支持 URL 或 base64 (data:image/...;base64,...)
  month: string; // YYYY-MM
  total_stream_minutes: number;
  stream_days: number;
  session_count: number;
  peak_hour: number;
  peak_hour_minutes: number;
  longest_session_minutes: number;
  streak_days: number;
  daily_stats: DailyStats[];
  weekly_stats: {
    week: number; // 1-5
    total_minutes: number;
  }[];
  hourly_distribution?: HourlyDistribution[];
  weekday_distribution?: WeekdayDistribution[];
}

// 年度总结请求数据
export interface YearlyReportRequest {
  streamer_name: string;
  avatar?: string; // 支持 URL 或 base64 (data:image/...;base64,...)
  year: number;
  total_stream_minutes: number;
  total_stream_hours: number;
  stream_days: number;
  session_count: number;
  peak_hour: number;
  peak_hour_minutes: number;
  longest_session_minutes: number;
  longest_streak_days: number; // 年度最长连续直播天数
  monthly_stats: {
    month: number; // 1-12
    total_minutes: number;
    stream_days: number;
  }[];
  top_streaming_months: {
    month: number;
    total_minutes: number;
  }[];
  weekday_distribution?: WeekdayDistribution[];
}

// API 响应类型
export interface ReportResponse {
  success: boolean;
  image_url?: string;
  error?: string;
}

// 辅助函数：格式化时长
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return `${hours}小时${mins > 0 ? `${mins}分钟` : ""}`;
  }
  return `${mins}分钟`;
}

// 辅助函数：格式化小时
export function formatHour(hour: number): string {
  if (hour === 0) return "00:00";
  if (hour < 12) return `${hour.toString().padStart(2, "0")}:00`;
  return `${hour.toString().padStart(2, "0")}:00`;
}

// 辅助函数：获取星期名称
export function getWeekdayName(weekday: number): string {
  const names = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  return names[weekday] || "";
}

// 辅助函数：获取月份名称
export function getMonthName(month: number): string {
  const names = [
    "一月",
    "二月",
    "三月",
    "四月",
    "五月",
    "六月",
    "七月",
    "八月",
    "九月",
    "十月",
    "十一月",
    "十二月",
  ];
  return names[month - 1] || "";
}
