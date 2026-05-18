import { ImageResponse } from "@vercel/og";
import type { NextRequest } from "next/server";
import type { YearlyReportRequest } from "@/lib/types/report";
import { formatDuration, formatHour } from "@/lib/types/report";

export const runtime = "edge";

const colors = {
  pink: "#FF9ECD",
  purple: "#B8A9E8",
  mint: "#A8E6CF",
  peach: "#FFD3B6",
  cream: "#FFF5E6",
  coral: "#FF8B94",
  sky: "#A8D8EA",
  lavender: "#E8D5E8",
  gold: "#FFD700",
  orange: "#FFB347",
};

export async function POST(req: NextRequest) {
  try {
    const data: YearlyReportRequest = await req.json();

    if (!data.streamer_name || !data.year) {
      return new Response(
        JSON.stringify({ success: false, error: "缺少必要字段" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const maxMonthlyMinutes = Math.max(
      ...data.monthly_stats.map((m) => m.total_minutes),
      1
    );

    const totalHours = Math.round(data.total_stream_minutes / 60);

    const weekdayData = data.weekday_distribution || [];
    const maxWeekdayMinutes = Math.max(
      ...weekdayData.map((w) => w.total_minutes),
      1
    );

    const topMonth = data.top_streaming_months?.[0];
    const backgroundUrl = process.env.REPORT_BACKGROUND_URL;

    const monthNames = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];
    const weekdayNames = ["日", "一", "二", "三", "四", "五", "六"];

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
                background: `linear-gradient(135deg, ${colors.cream} 0%, ${colors.peach} 30%, ${colors.lavender} 70%, ${colors.sky} 100%)`,
              }}
            />
          )}

          {/* 半透明遮罩 */}
          <div
            style={{
              position: "absolute",
              width: "1200px",
              height: "630px",
              background: "rgba(255, 255, 255, 0.75)",
            }}
          />

          {/* 装饰元素 */}
          <div
            style={{
              position: "absolute",
              top: "-80px",
              right: "-80px",
              width: "280px",
              height: "280px",
              borderRadius: "50%",
              background: colors.gold,
              opacity: 0.2,
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "-100px",
              left: "-100px",
              width: "300px",
              height: "300px",
              borderRadius: "50%",
              background: colors.pink,
              opacity: 0.2,
            }}
          />
          <div
            style={{
              position: "absolute",
              top: "50%",
              right: "200px",
              width: "120px",
              height: "120px",
              borderRadius: "50%",
              background: colors.mint,
              opacity: 0.2,
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
                marginBottom: "18px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                {data.avatar_url ? (
                  <img
                    src={data.avatar_url}
                    width={72}
                    height={72}
                    style={{
                      borderRadius: "50%",
                      border: `4px solid ${colors.gold}`,
                      boxShadow: "0 4px 16px rgba(255, 215, 0, 0.4)",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "72px",
                      height: "72px",
                      borderRadius: "50%",
                      background: `linear-gradient(135deg, ${colors.gold}, ${colors.orange})`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "28px",
                      color: "white",
                      fontWeight: "bold",
                      border: "4px solid white",
                      boxShadow: "0 4px 16px rgba(255, 215, 0, 0.4)",
                    }}
                  >
                    {data.streamer_name.charAt(0)}
                  </div>
                )}
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span
                    style={{
                      fontSize: "28px",
                      fontWeight: "bold",
                      color: "#4A4A6A",
                    }}
                  >
                    {data.streamer_name}
                  </span>
                  <span style={{ fontSize: "14px", color: "#8B8BA3" }}>
                    {data.year} 年度直播总结
                  </span>
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                  }}
                >
                  <span
                    style={{
                      fontSize: "42px",
                      fontWeight: "bold",
                      color: "#D4A500",
                    }}
                  >
                    {data.year}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    background: `linear-gradient(135deg, ${colors.gold}, ${colors.orange})`,
                    padding: "10px 20px",
                    borderRadius: "20px",
                    boxShadow: "0 4px 12px rgba(255, 179, 71, 0.4)",
                  }}
                >
                  <span style={{ fontSize: "14px", color: "white", fontWeight: "600" }}>年度总结</span>
                </div>
              </div>
            </div>

            {/* 主要统计数据 */}
            <div
              style={{
                display: "flex",
                gap: "12px",
                marginBottom: "14px",
              }}
            >
              {/* 总时长高亮卡片 */}
              <div
                style={{
                  flex: 1.3,
                  background: "rgba(255, 255, 255, 0.92)",
                  borderRadius: "18px",
                  padding: "18px",
                  display: "flex",
                  flexDirection: "column",
                  boxShadow: "0 4px 16px rgba(255, 215, 0, 0.2)",
                  border: `2px solid ${colors.gold}`,
                }}
              >
                <span style={{ fontSize: "12px", color: "#8B8BA3" }}>
                  年度总时长
                </span>
                <span
                  style={{
                    fontSize: "32px",
                    fontWeight: "bold",
                    color: "#D4A500",
                    marginTop: "4px",
                  }}
                >
                  {totalHours} 小时
                </span>
                <span style={{ fontSize: "11px", color: "#ACACC4", marginTop: "2px" }}>
                  共 {data.session_count} 场直播
                </span>
              </div>

              {/* 直播天数 */}
              <div
                style={{
                  flex: 1,
                  background: "rgba(255, 255, 255, 0.92)",
                  borderRadius: "18px",
                  padding: "18px",
                  display: "flex",
                  flexDirection: "column",
                  boxShadow: "0 4px 16px rgba(184, 169, 232, 0.15)",
                  border: `2px solid ${colors.purple}`,
                }}
              >
                <span style={{ fontSize: "12px", color: "#8B8BA3" }}>
                  直播天数
                </span>
                <span
                  style={{
                    fontSize: "26px",
                    fontWeight: "bold",
                    color: "#9B8AD8",
                    marginTop: "4px",
                  }}
                >
                  {data.stream_days} 天
                </span>
                <span style={{ fontSize: "11px", color: "#ACACC4", marginTop: "2px" }}>
                  最长连续 {data.longest_streak_days} 天
                </span>
              </div>

              {/* 最活跃时段 */}
              <div
                style={{
                  flex: 1,
                  background: "rgba(255, 255, 255, 0.92)",
                  borderRadius: "18px",
                  padding: "18px",
                  display: "flex",
                  flexDirection: "column",
                  boxShadow: "0 4px 16px rgba(168, 216, 234, 0.15)",
                  border: `2px solid ${colors.sky}`,
                }}
              >
                <span style={{ fontSize: "12px", color: "#8B8BA3" }}>
                  最活跃时段
                </span>
                <span
                  style={{
                    fontSize: "26px",
                    fontWeight: "bold",
                    color: "#6B9AC4",
                    marginTop: "4px",
                  }}
                >
                  {formatHour(data.peak_hour)}
                </span>
                <span style={{ fontSize: "11px", color: "#ACACC4", marginTop: "2px" }}>
                  累计 {formatDuration(data.peak_hour_minutes)}
                </span>
              </div>

              {/* 最长单场 */}
              <div
                style={{
                  flex: 1,
                  background: "rgba(255, 255, 255, 0.92)",
                  borderRadius: "18px",
                  padding: "18px",
                  display: "flex",
                  flexDirection: "column",
                  boxShadow: "0 4px 16px rgba(255, 158, 205, 0.15)",
                  border: `2px solid ${colors.pink}`,
                }}
              >
                <span style={{ fontSize: "12px", color: "#8B8BA3" }}>
                  最长单场
                </span>
                <span
                  style={{
                    fontSize: "26px",
                    fontWeight: "bold",
                    color: "#FF6B9D",
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

            {/* 图表区域 */}
            <div
              style={{
                display: "flex",
                flex: 1,
                gap: "12px",
              }}
            >
              {/* 月度直播时长分布 */}
              <div
                style={{
                  flex: 2,
                  background: "rgba(255, 255, 255, 0.92)",
                  borderRadius: "18px",
                  padding: "14px 18px",
                  display: "flex",
                  flexDirection: "column",
                  boxShadow: "0 4px 16px rgba(168, 230, 207, 0.15)",
                  border: `2px solid ${colors.mint}`,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "10px",
                  }}
                >
                  <span style={{ fontSize: "12px", color: "#4A4A6A", fontWeight: "600" }}>
                    月度直播时长
                  </span>
                  {topMonth && (
                    <span style={{ fontSize: "11px", color: "#D4A500", fontWeight: "600" }}>
                      最活跃: {monthNames[topMonth.month - 1]} ({Math.floor(topMonth.total_minutes / 60)}h)
                    </span>
                  )}
                </div>
                <div
                  style={{
                    display: "flex",
                    flex: 1,
                    gap: "6px",
                  }}
                >
                  {data.monthly_stats.map((month) => {
                    const heightPercent =
                      (month.total_minutes / maxMonthlyMinutes) * 100;
                    const isTopMonth = topMonth?.month === month.month;
                    return (
                      <div
                        key={month.month}
                        style={{
                          flex: 1,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                        }}
                      >
                        <div style={{ flex: 1 }} />
                        <div
                          style={{
                            width: "100%",
                            maxWidth: "36px",
                            height: `${Math.max(heightPercent, 18)}%`,
                            minHeight: "24px",
                            background: isTopMonth
                              ? `linear-gradient(180deg, ${colors.gold} 0%, ${colors.orange} 100%)`
                              : month.total_minutes > 0
                              ? `linear-gradient(180deg, ${colors.mint} 0%, #7DDBA3 100%)`
                              : "#E8E8F0",
                            borderRadius: "8px 8px 4px 4px",
                            boxShadow: month.total_minutes > 0 ? "0 2px 6px rgba(168, 230, 207, 0.4)" : "none",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "9px",
                              color: month.total_minutes > 0 ? "#fff" : "#ACACAC",
                              fontWeight: "700",
                              textShadow: month.total_minutes > 0 ? "0 1px 2px rgba(0,0,0,0.2)" : "none",
                            }}
                          >
                            {month.total_minutes > 0
                              ? `${Math.floor(month.total_minutes / 60)}h`
                              : "-"}
                          </span>
                        </div>
                        <span
                          style={{
                            fontSize: "9px",
                            color: isTopMonth ? "#D4A500" : "#6B6B8A",
                            marginTop: "4px",
                            fontWeight: "500",
                          }}
                        >
                          {month.month}月
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 星期分布 */}
              <div
                style={{
                  flex: 1,
                  background: "rgba(255, 255, 255, 0.92)",
                  borderRadius: "18px",
                  padding: "14px 18px",
                  display: "flex",
                  flexDirection: "column",
                  boxShadow: "0 4px 16px rgba(255, 211, 182, 0.15)",
                  border: `2px solid ${colors.peach}`,
                }}
              >
                <span
                  style={{
                    fontSize: "12px",
                    color: "#4A4A6A",
                    fontWeight: "600",
                    marginBottom: "10px",
                  }}
                >
                  星期分布
                </span>
                <div
                  style={{
                    display: "flex",
                    flex: 1,
                    gap: "6px",
                  }}
                >
                  {weekdayData.length > 0
                    ? weekdayData.map((day) => {
                        const heightPercent =
                          (day.total_minutes / maxWeekdayMinutes) * 100;
                        return (
                          <div
                            key={day.weekday}
                            style={{
                              flex: 1,
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                            }}
                          >
                            <div style={{ flex: 1 }} />
                            <div
                              style={{
                                width: "100%",
                                maxWidth: "30px",
                                height: `${Math.max(heightPercent, 18)}%`,
                                minHeight: "22px",
                                background:
                                  day.total_minutes > 0
                                    ? `linear-gradient(180deg, ${colors.peach} 0%, #FFB896 100%)`
                                    : "#E8E8F0",
                                borderRadius: "6px 6px 3px 3px",
                                boxShadow: day.total_minutes > 0 ? "0 2px 6px rgba(255, 211, 182, 0.4)" : "none",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <span
                                style={{
                                  fontSize: "9px",
                                  color: day.total_minutes > 0 ? "#fff" : "#ACACAC",
                                  fontWeight: "700",
                                  textShadow: day.total_minutes > 0 ? "0 1px 2px rgba(0,0,0,0.2)" : "none",
                                }}
                              >
                                {day.total_minutes > 0
                                  ? `${Math.floor(day.total_minutes / 60)}h`
                                  : "-"}
                              </span>
                            </div>
                            <span
                              style={{
                                fontSize: "10px",
                                color: "#6B6B8A",
                                marginTop: "4px",
                                fontWeight: "500",
                              }}
                            >
                              {weekdayNames[day.weekday]}
                            </span>
                          </div>
                        );
                      })
                    : [0, 1, 2, 3, 4, 5, 6].map((weekday) => (
                        <div
                          key={weekday}
                          style={{
                            flex: 1,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                          }}
                        >
                          <div style={{ flex: 1 }} />
                          <div
                            style={{
                              width: "100%",
                              maxWidth: "30px",
                              height: "18%",
                              minHeight: "22px",
                              background: "#E8E8F0",
                              borderRadius: "6px 6px 3px 3px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "9px",
                                color: "#ACACAC",
                              }}
                            >
                              -
                            </span>
                          </div>
                          <span
                            style={{
                              fontSize: "10px",
                              color: "#6B6B8A",
                              marginTop: "4px",
                              fontWeight: "500",
                            }}
                          >
                            {weekdayNames[weekday]}
                          </span>
                        </div>
                      ))}
                </div>
              </div>
            </div>

            {/* 底部标语 */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginTop: "12px",
              }}
            >
              <span style={{ fontSize: "13px", color: "#8B8BA3" }}>
                感谢陪伴，{data.year} 一路有你 💕
              </span>
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
    console.error("生成年度总结图片失败:", error);
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
  const testData: YearlyReportRequest = {
    streamer_name: "小可爱主播",
    avatar_url: "https://api.dicebear.com/7.x/adventurer/svg?seed=annual",
    year: 2024,
    total_stream_minutes: 108000,
    total_stream_hours: 1800,
    stream_days: 280,
    session_count: 520,
    peak_hour: 21,
    peak_hour_minutes: 21600,
    longest_session_minutes: 720,
    longest_streak_days: 45,
    monthly_stats: [
      { month: 1, total_minutes: 8400, stream_days: 22 },
      { month: 2, total_minutes: 7200, stream_days: 20 },
      { month: 3, total_minutes: 9600, stream_days: 25 },
      { month: 4, total_minutes: 8400, stream_days: 22 },
      { month: 5, total_minutes: 10800, stream_days: 28 },
      { month: 6, total_minutes: 9000, stream_days: 24 },
      { month: 7, total_minutes: 10200, stream_days: 26 },
      { month: 8, total_minutes: 9600, stream_days: 25 },
      { month: 9, total_minutes: 8400, stream_days: 22 },
      { month: 10, total_minutes: 9000, stream_days: 24 },
      { month: 11, total_minutes: 8400, stream_days: 22 },
      { month: 12, total_minutes: 9000, stream_days: 24 },
    ],
    top_streaming_months: [
      { month: 5, total_minutes: 10800 },
      { month: 7, total_minutes: 10200 },
      { month: 3, total_minutes: 9600 },
    ],
    weekday_distribution: [
      { weekday: 0, total_minutes: 14400, session_count: 60 },
      { weekday: 1, total_minutes: 16800, session_count: 70 },
      { weekday: 2, total_minutes: 18000, session_count: 75 },
      { weekday: 3, total_minutes: 15600, session_count: 65 },
      { weekday: 4, total_minutes: 19200, session_count: 80 },
      { weekday: 5, total_minutes: 13200, session_count: 55 },
      { weekday: 6, total_minutes: 10800, session_count: 45 },
    ],
  };

  const request = new Request("http://localhost/api/report/yearly", {
    method: "POST",
    body: JSON.stringify(testData),
    headers: { "Content-Type": "application/json" },
  });

  return POST(request as NextRequest);
}
