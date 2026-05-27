import { ImageResponse } from "@vercel/og";
import type { NextRequest } from "next/server";
import type { WeeklyReportRequest } from "@/lib/types/report";
import { formatDuration, formatHour } from "@/lib/types/report";

export const runtime = "edge";

// 获取图片并转换为 base64
async function fetchImageAsBase64(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") || "image/png";
    // Edge Runtime 兼容的 base64 转换
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);
    return `data:${contentType};base64,${base64}`;
  } catch {
    return url; // 如果获取失败，返回原始 URL
  }
}

// 判断是否为 base64 格式
function isBase64(str: string): boolean {
  return str.startsWith("data:image/");
}

// ArrayBuffer 转 base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// 可爱风格的颜色配置
const colors = {
  pink: "#FF9ECD",
  purple: "#B8A9E8",
  mint: "#A8E6CF",
  peach: "#FFD3B6",
  cream: "#FFF5E6",
  coral: "#FF8B94",
  sky: "#A8D8EA",
  lavender: "#E8D5E8",
};

// 每天一个颜色
const dayColors = [
  "#FF9ECD", // 周日 - 粉色
  "#A8D8EA", // 周一 - 天蓝
  "#A8E6CF", // 周二 - 薄荷
  "#FFD3B6", // 周三 - 桃色
  "#B8A9E8", // 周四 - 紫色
  "#FF8B94", // 周五 - 珊瑚
  "#E8D5E8", // 周六 - 薰衣草
];

// 获取配置的时区偏移（小时），默认东八区
function getTimezoneOffset(): number {
  const tz = process.env.REPORT_TIMEZONE || "Asia/Shanghai";
  // 简单映射常见时区
  const tzMap: Record<string, number> = {
    "Asia/Shanghai": 8,
    "Asia/Tokyo": 9,
    "America/New_York": -5,
    "America/Los_Angeles": -8,
    "Europe/London": 0,
    "UTC": 0,
  };
  return tzMap[tz] ?? 8; // 默认东八区
}

// 解析时间字符串为小时数（支持 HH:mm 或 ISO 8601）
function parseTimeToHours(timeStr: string): number {
  if (timeStr.includes("T")) {
    // ISO 8601 格式，解析后转换为目标时区
    const date = new Date(timeStr);
    const offset = getTimezoneOffset();
    const utcHours = date.getUTCHours();
    const utcMinutes = date.getUTCMinutes();
    let targetHours = utcHours + offset;
    if (targetHours >= 24) targetHours -= 24;
    if (targetHours < 0) targetHours += 24;
    return targetHours + utcMinutes / 60;
  }
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours + (minutes || 0) / 60;
}

// 格式化时间显示
function formatTime(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

export async function POST(req: NextRequest) {
  try {
    // 解析 multipart/form-data
    const formData = await req.formData();
    const dataStr = formData.get("data") as string;

    if (!dataStr) {
      return new Response(
        JSON.stringify({ success: false, error: "缺少 data 字段" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const data: WeeklyReportRequest = JSON.parse(dataStr);

    // 调试日志：打印接收到的数据
    console.log("[report-api] ====== 接收到的原始数据 ======");
    console.log("[report-api] streamer_name:", data.streamer_name);
    console.log("[report-api] week_start:", data.week_start, "week_end:", data.week_end);
    console.log("[report-api] daily_stats:", JSON.stringify(data.daily_stats, null, 2));
    console.log("[report-api] timezone offset:", getTimezoneOffset());

    if (!data.streamer_name || !data.week_start || !data.week_end) {
      return new Response(
        JSON.stringify({ success: false, error: "缺少必要字段" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 处理头像文件
    let avatarSrc: string | undefined;
    const avatarFile = formData.get("avatar") as File | null;
    if (avatarFile) {
      const buffer = await avatarFile.arrayBuffer();
      const base64 = arrayBufferToBase64(buffer);
      const type = avatarFile.type || "image/png";
      avatarSrc = `data:${type};base64,${base64}`;
      console.log(`[report-api] 头像文件已接收: ${avatarFile.name}, type=${type}, size=${buffer.byteLength} bytes`);
    } else {
      // 兼容：如果 data 中有 avatar 字段（URL 或 base64）
      avatarSrc = data.avatar;
      if (avatarSrc && !isBase64(avatarSrc)) {
        avatarSrc = await fetchImageAsBase64(avatarSrc);
      }
    }

    const weekDays = ["日", "一", "二", "三", "四", "五", "六"];
    const dailyStats = data.daily_stats || [];
    const dailyData = dailyStats.map((day) => {
      // 直接解析 YYYY-MM-DD 格式
      const [year, month, dateNum] = day.date.split("-").map(Number);
      // 创建 UTC 日期
      const utcDate = new Date(Date.UTC(year, month - 1, dateNum, 0, 0, 0));
      const offset = getTimezoneOffset();
      // 将 UTC 时间转换为目标时区的时间
      // 对于东八区 (offset=8)，UTC 00:00 = 北京 08:00
      // 所以日期不变，但星期几的计算应该基于时区时间
      const offsetMs = offset * 60 * 60 * 1000;
      const targetDate = new Date(utcDate.getTime() + offsetMs);
      const weekDay = weekDays[targetDate.getUTCDay()];
      const dayIndex = targetDate.getUTCDay();
      return { ...day, weekDay, dayIndex };
    });

    // 调试日志：打印处理后的数据
    console.log("[report-api] ====== 处理后的数据 ======");
    console.log("[report-api] dailyData:", JSON.stringify(dailyData.map(d => ({
      date: d.date,
      weekDay: d.weekDay,
      dayIndex: d.dayIndex,
      sessions: d.sessions?.map(s => ({
        start_time: s.start_time,
        end_time: s.end_time,
        duration_minutes: s.duration_minutes,
      }))
    })), null, 2));

    const backgroundUrl = process.env.REPORT_BACKGROUND_URL;

    // 时间轴配置（0-24小时）
    const timeLabels = [0, 4, 8, 12, 16, 20, 24];
    const chartHeight = 280; // 时间表区域高度

    return new ImageResponse(
      (
        <div
          style={{
            width: "1200px",
            height: "630px",
            display: "flex",
            flexDirection: "column",
            fontFamily: "sans-serif",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* 背景层 */}
          {backgroundUrl ? (
            <img
              src={backgroundUrl}
              style={{
                position: "absolute",
                width: "1200px",
                height: "630px",
                objectFit: "cover",
              }}
            />
          ) : (
            <div
              style={{
                position: "absolute",
                width: "1200px",
                height: "630px",
                background: `linear-gradient(135deg, ${colors.cream} 0%, ${colors.lavender} 50%, ${colors.sky} 100%)`,
              }}
            />
          )}

          {/* 半透明遮罩层 */}
          <div
            style={{
              position: "absolute",
              width: "1200px",
              height: "630px",
              background: "rgba(255, 255, 255, 0.8)",
            }}
          />

          {/* 装饰圆圈 */}
          <div
            style={{
              position: "absolute",
              top: "-50px",
              right: "-50px",
              width: "180px",
              height: "180px",
              borderRadius: "50%",
              background: colors.pink,
              opacity: 0.25,
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "-60px",
              left: "-60px",
              width: "200px",
              height: "200px",
              borderRadius: "50%",
              background: colors.mint,
              opacity: 0.25,
            }}
          />

          {/* 主内容区 */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              padding: "28px 36px",
              position: "relative",
              zIndex: 1,
              height: "100%",
            }}
          >
            {/* 顶部标题区 */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "16px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                {avatarSrc ? (
                  <img
                    src={avatarSrc}
                    width={56}
                    height={56}
                    style={{
                      borderRadius: "50%",
                      border: `3px solid ${colors.pink}`,
                      boxShadow: "0 3px 10px rgba(255, 158, 205, 0.3)",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "56px",
                      height: "56px",
                      borderRadius: "50%",
                      background: `linear-gradient(135deg, ${colors.pink}, ${colors.purple})`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "22px",
                      color: "white",
                      fontWeight: "bold",
                      border: "3px solid white",
                    }}
                  >
                    {data.streamer_name.charAt(0)}
                  </div>
                )}
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span
                    style={{
                      fontSize: "24px",
                      fontWeight: "bold",
                      color: "#4A4A6A",
                    }}
                  >
                    {data.streamer_name}
                  </span>
                  <span style={{ fontSize: "13px", color: "#8B8BA3" }}>
                    {data.week_start} ~ {data.week_end}
                  </span>
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  background: `linear-gradient(135deg, ${colors.pink}, ${colors.purple})`,
                  padding: "8px 20px",
                  borderRadius: "20px",
                  boxShadow: "0 3px 10px rgba(184, 169, 232, 0.4)",
                }}
              >
                <span style={{ fontSize: "13px", color: "white", fontWeight: "600" }}>直播周报</span>
              </div>
            </div>

            {/* 主要数据卡片区 */}
            <div
              style={{
                display: "flex",
                gap: "12px",
                marginBottom: "14px",
              }}
            >
              {/* 总时长卡片 */}
              <div
                style={{
                  flex: 1,
                  background: "rgba(255, 255, 255, 0.9)",
                  borderRadius: "16px",
                  padding: "14px 16px",
                  display: "flex",
                  flexDirection: "column",
                  boxShadow: "0 3px 15px rgba(255, 158, 205, 0.12)",
                  border: `2px solid ${colors.pink}`,
                }}
              >
                <span style={{ fontSize: "12px", color: "#8B8BA3" }}>
                  本周总时长
                </span>
                <span
                  style={{
                    fontSize: "26px",
                    fontWeight: "bold",
                    color: "#FF6B9D",
                    marginTop: "4px",
                  }}
                >
                  {formatDuration(data.total_stream_minutes)}
                </span>
                <span style={{ fontSize: "11px", color: "#ACACC4", marginTop: "2px" }}>
                  共 {data.session_count} 场直播
                </span>
              </div>

              {/* 直播天数卡片 */}
              <div
                style={{
                  flex: 1,
                  background: "rgba(255, 255, 255, 0.9)",
                  borderRadius: "16px",
                  padding: "14px 16px",
                  display: "flex",
                  flexDirection: "column",
                  boxShadow: "0 3px 15px rgba(168, 230, 207, 0.12)",
                  border: `2px solid ${colors.mint}`,
                }}
              >
                <span style={{ fontSize: "12px", color: "#8B8BA3" }}>
                  直播天数
                </span>
                <span
                  style={{
                    fontSize: "26px",
                    fontWeight: "bold",
                    color: "#5DBE8A",
                    marginTop: "4px",
                  }}
                >
                  {data.stream_days} 天
                </span>
                <span style={{ fontSize: "11px", color: "#ACACC4", marginTop: "2px" }}>
                  连续直播 {data.streak_days} 天
                </span>
              </div>

              {/* 最活跃时段卡片 */}
              <div
                style={{
                  flex: 1,
                  background: "rgba(255, 255, 255, 0.9)",
                  borderRadius: "16px",
                  padding: "14px 16px",
                  display: "flex",
                  flexDirection: "column",
                  boxShadow: "0 3px 15px rgba(255, 211, 182, 0.12)",
                  border: `2px solid ${colors.peach}`,
                }}
              >
                <span style={{ fontSize: "12px", color: "#8B8BA3" }}>
                  最活跃时段
                </span>
                <span
                  style={{
                    fontSize: "26px",
                    fontWeight: "bold",
                    color: "#E8956C",
                    marginTop: "4px",
                  }}
                >
                  {formatHour(data.peak_hour)}
                </span>
                <span style={{ fontSize: "11px", color: "#ACACC4", marginTop: "2px" }}>
                  累计 {formatDuration(data.peak_hour_minutes)}
                </span>
              </div>

              {/* 最长单场卡片 */}
              <div
                style={{
                  flex: 1,
                  background: "rgba(255, 255, 255, 0.9)",
                  borderRadius: "16px",
                  padding: "14px 16px",
                  display: "flex",
                  flexDirection: "column",
                  boxShadow: "0 3px 15px rgba(184, 169, 232, 0.12)",
                  border: `2px solid ${colors.purple}`,
                }}
              >
                <span style={{ fontSize: "12px", color: "#8B8BA3" }}>
                  最长单场
                </span>
                <span
                  style={{
                    fontSize: "26px",
                    fontWeight: "bold",
                    color: "#9B8AD8",
                    marginTop: "4px",
                  }}
                >
                  {formatDuration(data.longest_session_minutes)}
                </span>
                <span style={{ fontSize: "11px", color: "#ACACC4", marginTop: "2px" }}>
                  耐力达人
                </span>
              </div>
            </div>

            {/* 课表式时间轴 */}
            <div
              style={{
                flex: 1,
                background: "rgba(255, 255, 255, 0.92)",
                borderRadius: "16px",
                padding: "14px 18px",
                display: "flex",
                flexDirection: "column",
                boxShadow: "0 3px 15px rgba(168, 216, 234, 0.12)",
                border: `2px solid ${colors.sky}`,
              }}
            >
              <span
                style={{
                  fontSize: "14px",
                  color: "#4A4A6A",
                  fontWeight: "600",
                  marginBottom: "10px",
                }}
              >
                本周直播时间表
              </span>
              
              <div
                style={{
                  display: "flex",
                  flex: 1,
                  position: "relative",
                }}
              >
                {/* 左侧时间轴 */}
                <div
                  style={{
                    width: "40px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    paddingTop: "24px",
                    paddingBottom: "4px",
                    height: `${chartHeight}px`,
                  }}
                >
                  {timeLabels.map((hour) => (
                    <span
                      key={hour}
                      style={{
                        fontSize: "10px",
                        color: "#9B9BB8",
                        textAlign: "right",
                        paddingRight: "8px",
                      }}
                    >
                      {hour.toString().padStart(2, "0")}:00
                    </span>
                  ))}
                </div>

                {/* 时间表主体 */}
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    gap: "6px",
                  }}
                >
                  {dailyData.map((day, index) => {
                    const hasStreams = day.sessions && day.sessions.length > 0;
                    return (
                      <div
                        key={index}
                        style={{
                          flex: 1,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                        }}
                      >
                        {/* 星期标题 */}
                        <span
                          style={{
                            fontSize: "12px",
                            fontWeight: "600",
                            color: hasStreams ? dayColors[day.dayIndex] : "#CACAD8",
                            marginBottom: "6px",
                            padding: "2px 8px",
                            background: hasStreams ? `${dayColors[day.dayIndex]}20` : "transparent",
                            borderRadius: "8px",
                          }}
                        >
                          周{day.weekDay}
                        </span>
                        
                        {/* 时间条区域 */}
                        <div
                          style={{
                            flex: 1,
                            width: "100%",
                            background: "#F8F8FC",
                            borderRadius: "10px",
                            position: "relative",
                            height: `${chartHeight}px`,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            overflow: "hidden",
                          }}
                        >
                          {/* 网格线 */}
                          {timeLabels.slice(0, -1).map((hour, i) => (
                            <div
                              key={hour}
                              style={{
                                position: "absolute",
                                top: `${(i / (timeLabels.length - 1)) * 100}%`,
                                left: "0",
                                right: "0",
                                height: "1px",
                                background: "#ECECF4",
                              }}
                            />
                          ))}
                          
                          {hasStreams ? (
                            // 渲染直播时段
                            day.sessions!.map((session, sIndex) => {
                              const startHour = parseTimeToHours(session.start_time);
                              let endHour = parseTimeToHours(session.end_time);
                              
                              // 处理跨天情况
                              if (session.crosses_midnight || endHour < startHour) {
                                endHour = 24;
                              }
                              
                              const topPercent = (startHour / 24) * 100;
                              const heightPercent = ((endHour - startHour) / 24) * 100;
                              
                              return (
                                <div
                                  key={sIndex}
                                  style={{
                                    position: "absolute",
                                    top: `${topPercent}%`,
                                    left: "8%",
                                    right: "8%",
                                    height: `${Math.max(heightPercent, 3)}%`,
                                    background: `linear-gradient(180deg, ${dayColors[day.dayIndex]} 0%, ${dayColors[day.dayIndex]}CC 100%)`,
                                    borderRadius: "6px",
                                    boxShadow: `0 2px 6px ${dayColors[day.dayIndex]}40`,
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    padding: "2px",
                                  }}
                                >
                                  <span
                                    style={{
                                      fontSize: "9px",
                                      color: "white",
                                      fontWeight: "600",
                                      textShadow: "0 1px 2px rgba(0,0,0,0.2)",
                                      textAlign: "center",
                                    }}
                                  >
                                    {formatTime(startHour)}
                                  </span>
                                  {heightPercent > 8 && (
                                    <span
                                      style={{
                                        fontSize: "8px",
                                        color: "rgba(255,255,255,0.9)",
                                        textAlign: "center",
                                      }}
                                    >
                                      |
                                    </span>
                                  )}
                                  <span
                                    style={{
                                      fontSize: "9px",
                                      color: "white",
                                      fontWeight: "600",
                                      textShadow: "0 1px 2px rgba(0,0,0,0.2)",
                                      textAlign: "center",
                                    }}
                                  >
                                    {session.crosses_midnight || endHour >= 24 ? "次日" : formatTime(endHour)}
                                  </span>
                                </div>
                              );
                            })
                          ) : (
                            // 没有直播的日子
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: "10px",
                              }}
                            >
                              <span
                                style={{
                                  fontSize: "20px",
                                  marginBottom: "4px",
                                }}
                              >
                                🥔
                              </span>
                              <span
                                style={{
                                  fontSize: "10px",
                                  color: "#ACACC4",
                                  textAlign: "center",
                                  lineHeight: "1.3",
                                }}
                              >
                                土豆又
                              </span>
                              <span
                                style={{
                                  fontSize: "10px",
                                  color: "#ACACC4",
                                  textAlign: "center",
                                  lineHeight: "1.3",
                                }}
                              >
                                偷懒了
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 右侧时间轴 */}
                <div
                  style={{
                    width: "40px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    paddingTop: "24px",
                    paddingBottom: "4px",
                    height: `${chartHeight}px`,
                  }}
                >
                  {timeLabels.map((hour) => (
                    <span
                      key={hour}
                      style={{
                        fontSize: "10px",
                        color: "#9B9BB8",
                        textAlign: "left",
                        paddingLeft: "8px",
                      }}
                    >
                      {hour.toString().padStart(2, "0")}:00
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error("生成周报图片失败:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "生成图片失败",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function GET() {
  const testData: WeeklyReportRequest = {
    streamer_name: "小可爱主播",
    avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=cute",
    week_start: "2024-01-15",
    week_end: "2024-01-21",
    total_stream_minutes: 2580,
    stream_days: 5,
    session_count: 8,
    peak_hour: 20,
    peak_hour_minutes: 480,
    longest_session_minutes: 320,
    streak_days: 15,
    daily_stats: [
      {
        date: "2024-01-15",
        total_minutes: 360,
        session_count: 2,
        sessions: [
          { start_time: "14:00", end_time: "17:30", duration_minutes: 210 },
          { start_time: "20:00", end_time: "22:30", duration_minutes: 150 },
        ],
      },
      {
        date: "2024-01-16",
        total_minutes: 420,
        session_count: 1,
        sessions: [
          { start_time: "19:00", end_time: "02:00", duration_minutes: 420, crosses_midnight: true },
        ],
      },
      {
        date: "2024-01-17",
        total_minutes: 0,
        session_count: 0,
        sessions: [],
      },
      {
        date: "2024-01-18",
        total_minutes: 480,
        session_count: 2,
        sessions: [
          { start_time: "10:00", end_time: "12:00", duration_minutes: 120 },
          { start_time: "20:00", end_time: "02:00", duration_minutes: 360, crosses_midnight: true },
        ],
      },
      {
        date: "2024-01-19",
        total_minutes: 540,
        session_count: 1,
        sessions: [
          { start_time: "18:00", end_time: "03:00", duration_minutes: 540, crosses_midnight: true },
        ],
      },
      {
        date: "2024-01-20",
        total_minutes: 480,
        session_count: 2,
        sessions: [
          { start_time: "13:00", end_time: "16:00", duration_minutes: 180 },
          { start_time: "21:00", end_time: "02:00", duration_minutes: 300, crosses_midnight: true },
        ],
      },
      {
        date: "2024-01-21",
        total_minutes: 0,
        session_count: 0,
        sessions: [],
      },
    ],
  };

  const request = new Request("http://localhost/api/report/weekly", {
    method: "POST",
    body: JSON.stringify(testData),
    headers: { "Content-Type": "application/json" },
  });

  return POST(request as NextRequest);
}
