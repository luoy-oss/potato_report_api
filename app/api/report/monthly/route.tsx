import { ImageResponse } from "@vercel/og";
import type { NextRequest } from "next/server";
import type { MonthlyReportRequest } from "@/lib/types/report";
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

export async function POST(req: NextRequest) {
  try {
    const data: MonthlyReportRequest = await req.json();

    if (!data.streamer_name || !data.month) {
      return new Response(
        JSON.stringify({ success: false, error: "缺少必要字段" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 处理头像：如果不是 base64，则先获取并转换
    let avatarSrc = data.avatar;
    if (avatarSrc && !isBase64(avatarSrc)) {
      avatarSrc = await fetchImageAsBase64(avatarSrc);
    }

    const weeklyStats = data.weekly_stats || [];
    const maxWeeklyMinutes = Math.max(
      ...weeklyStats.map((w) => w.total_minutes),
      1
    );

    const backgroundUrl = process.env.REPORT_BACKGROUND_URL;

    // 格式化月份
    let monthDisplay = data.month;
    if (data.month.includes("-")) {
      const [year, month] = data.month.split("-");
      monthDisplay = `${year}年${parseInt(month)}月`;
    }

    // 星期分布数据处理
    const weekdayData = Array.isArray(data.weekday_distribution)
      ? typeof data.weekday_distribution[0] === "number"
        ? (data.weekday_distribution as number[])
        : (data.weekday_distribution as { weekday: number; total_minutes: number }[]).map(
            (w) => w.total_minutes
          )
      : [0, 0, 0, 0, 0, 0, 0];

    const maxWeekdayMinutes = Math.max(...weekdayData, 1);

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
                background: `linear-gradient(135deg, ${colors.lavender} 0%, ${colors.cream} 50%, ${colors.mint} 100%)`,
              }}
            />
          )}

          {/* 半透明遮罩 */}
          <div
            style={{
              position: "absolute",
              width: "1200px",
              height: "630px",
              background: "rgba(255, 255, 255, 0.78)",
            }}
          />

          {/* 装饰圆圈 */}
          <div
            style={{
              position: "absolute",
              top: "-60px",
              left: "-60px",
              width: "220px",
              height: "220px",
              borderRadius: "50%",
              background: colors.purple,
              opacity: 0.25,
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "-70px",
              right: "-70px",
              width: "240px",
              height: "240px",
              borderRadius: "50%",
              background: colors.mint,
              opacity: 0.25,
            }}
          />
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: "150px",
              height: "150px",
              borderRadius: "50%",
              background: colors.pink,
              opacity: 0.15,
            }}
          />

          {/* 主内容区 */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              padding: "32px 40px",
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
                marginBottom: "20px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                {avatarSrc ? (
                  <img
                    src={avatarSrc}
                    width={68}
                    height={68}
                    style={{
                      borderRadius: "50%",
                      border: `4px solid ${colors.purple}`,
                      boxShadow: "0 4px 12px rgba(184, 169, 232, 0.3)",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "68px",
                      height: "68px",
                      borderRadius: "50%",
                      background: `linear-gradient(135deg, ${colors.purple}, ${colors.pink})`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "26px",
                      color: "white",
                      fontWeight: "bold",
                      border: "4px solid white",
                      boxShadow: "0 4px 12px rgba(184, 169, 232, 0.3)",
                    }}
                  >
                    {data.streamer_name.charAt(0)}
                  </div>
                )}
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span
                    style={{
                      fontSize: "26px",
                      fontWeight: "bold",
                      color: "#4A4A6A",
                    }}
                  >
                    {data.streamer_name}
                  </span>
                  <span style={{ fontSize: "14px", color: "#8B8BA3" }}>
                    {monthDisplay} 直播月报
                  </span>
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  background: `linear-gradient(135deg, ${colors.purple}, ${colors.coral})`,
                  padding: "10px 24px",
                  borderRadius: "24px",
                  boxShadow: "0 4px 12px rgba(255, 139, 148, 0.4)",
                }}
              >
                <span style={{ fontSize: "14px", color: "white", fontWeight: "600" }}>直播月报</span>
              </div>
            </div>

            {/* 主要数据卡片区 */}
            <div
              style={{
                display: "flex",
                gap: "14px",
                marginBottom: "16px",
              }}
            >
              {/* 总时长卡片 */}
              <div
                style={{
                  flex: 1,
                  background: "rgba(255, 255, 255, 0.92)",
                  borderRadius: "18px",
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                  boxShadow: "0 4px 16px rgba(255, 158, 205, 0.15)",
                  border: `2px solid ${colors.pink}`,
                }}
              >
                <span style={{ fontSize: "12px", color: "#8B8BA3" }}>
                  本月总时长
                </span>
                <span
                  style={{
                    fontSize: "28px",
                    fontWeight: "bold",
                    color: "#FF6B9D",
                    marginTop: "6px",
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
                  background: "rgba(255, 255, 255, 0.92)",
                  borderRadius: "18px",
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                  boxShadow: "0 4px 16px rgba(168, 230, 207, 0.15)",
                  border: `2px solid ${colors.mint}`,
                }}
              >
                <span style={{ fontSize: "12px", color: "#8B8BA3" }}>
                  直播天数
                </span>
                <span
                  style={{
                    fontSize: "28px",
                    fontWeight: "bold",
                    color: "#5DBE8A",
                    marginTop: "6px",
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
                  background: "rgba(255, 255, 255, 0.92)",
                  borderRadius: "18px",
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                  boxShadow: "0 4px 16px rgba(255, 211, 182, 0.15)",
                  border: `2px solid ${colors.peach}`,
                }}
              >
                <span style={{ fontSize: "12px", color: "#8B8BA3" }}>
                  最活跃时段
                </span>
                <span
                  style={{
                    fontSize: "28px",
                    fontWeight: "bold",
                    color: "#E8956C",
                    marginTop: "6px",
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
                  background: "rgba(255, 255, 255, 0.92)",
                  borderRadius: "18px",
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                  boxShadow: "0 4px 16px rgba(184, 169, 232, 0.15)",
                  border: `2px solid ${colors.purple}`,
                }}
              >
                <span style={{ fontSize: "12px", color: "#8B8BA3" }}>
                  最长单场
                </span>
                <span
                  style={{
                    fontSize: "28px",
                    fontWeight: "bold",
                    color: "#9B8AD8",
                    marginTop: "6px",
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
            <div style={{ display: "flex", gap: "14px", flex: 1 }}>
              {/* 每周分布图 */}
              <div
                style={{
                  flex: 1,
                  background: "rgba(255, 255, 255, 0.92)",
                  borderRadius: "18px",
                  padding: "16px 20px",
                  display: "flex",
                  flexDirection: "column",
                  boxShadow: "0 4px 16px rgba(168, 216, 234, 0.15)",
                  border: `2px solid ${colors.sky}`,
                }}
              >
                <span
                  style={{
                    fontSize: "13px",
                    color: "#4A4A6A",
                    fontWeight: "600",
                    marginBottom: "12px",
                  }}
                >
                  每周直播时长
                </span>
                <div
                  style={{
                    display: "flex",
                    flex: 1,
                    gap: "12px",
                  }}
                >
                  {weeklyStats.map((week, index) => {
                    const weekNum = week.week_number ?? week.week ?? index + 1;
                    const value = week.total_minutes;
                    const scaledSpacer = Math.round((maxWeeklyMinutes - value) * 100 / maxWeeklyMinutes);
                    const scaledBar = Math.round(value * 100 / maxWeeklyMinutes) || 1;
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
                        <div style={{ flex: scaledSpacer }} />
                        <div
                          style={{
                            flex: scaledBar,
                            minHeight: "32px",
                            width: "100%",
                            maxWidth: "50px",
                            background:
                              value > 0
                                ? `linear-gradient(180deg, ${colors.sky} 0%, #7EC8E3 100%)`
                                : "#E8E8F0",
                            borderRadius: "10px 10px 4px 4px",
                            boxShadow: value > 0 ? "0 2px 6px rgba(168, 216, 234, 0.4)" : "none",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "11px",
                              color: value > 0 ? "#fff" : "#ACACAC",
                              fontWeight: "700",
                              textShadow: value > 0 ? "0 1px 2px rgba(0,0,0,0.2)" : "none",
                            }}
                          >
                            {value > 0 ? `${Math.floor(value / 60)}h` : "-"}
                          </span>
                        </div>
                        <span
                          style={{
                            fontSize: "11px",
                            color: "#6B6B8A",
                            marginTop: "6px",
                            fontWeight: "500",
                          }}
                        >
                          第{weekNum}周
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 星期分布图 */}
              <div
                style={{
                  flex: 1,
                  background: "rgba(255, 255, 255, 0.92)",
                  borderRadius: "18px",
                  padding: "16px 20px",
                  display: "flex",
                  flexDirection: "column",
                  boxShadow: "0 4px 16px rgba(255, 158, 205, 0.15)",
                  border: `2px solid ${colors.pink}`,
                }}
              >
                <span
                  style={{
                    fontSize: "13px",
                    color: "#4A4A6A",
                    fontWeight: "600",
                    marginBottom: "12px",
                  }}
                >
                  星期分布
                </span>
                <div
                  style={{
                    display: "flex",
                    flex: 1,
                    gap: "10px",
                  }}
                >
                  {["日", "一", "二", "三", "四", "五", "六"].map((day, index) => {
                    const minutes = weekdayData[index] || 0;
                    const scaledSpacer = Math.round((maxWeekdayMinutes - minutes) * 100 / maxWeekdayMinutes);
                    const scaledBar = Math.round(minutes * 100 / maxWeekdayMinutes) || 1;
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
                        <div style={{ flex: scaledSpacer }} />
                        <div
                          style={{
                            flex: scaledBar,
                            minHeight: "28px",
                            width: "100%",
                            maxWidth: "36px",
                            background:
                              minutes > 0
                                ? `linear-gradient(180deg, ${colors.pink} 0%, #FF7BAC 100%)`
                                : "#E8E8F0",
                            borderRadius: "8px 8px 4px 4px",
                            boxShadow: minutes > 0 ? "0 2px 6px rgba(255, 158, 205, 0.4)" : "none",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "10px",
                              color: minutes > 0 ? "#fff" : "#ACACAC",
                              fontWeight: "700",
                              textShadow: minutes > 0 ? "0 1px 2px rgba(0,0,0,0.2)" : "none",
                            }}
                          >
                            {minutes > 0 ? `${Math.floor(minutes / 60)}h` : "-"}
                          </span>
                        </div>
                        <span
                          style={{
                            fontSize: "11px",
                            color: "#6B6B8A",
                            marginTop: "6px",
                            fontWeight: "500",
                          }}
                        >
                          {day}
                        </span>
                      </div>
                    );
                  })}
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
    console.error("生成月报图片失败:", error);
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
  const testData: MonthlyReportRequest = {
    streamer_name: "小可爱主播",
    avatar: "https://imgurl or base64",
    month: "2024-01",
    total_stream_minutes: 10240,
    stream_days: 25,
    session_count: 48,
    peak_hour: 21,
    peak_hour_minutes: 1920,
    longest_session_minutes: 420,
    streak_days: 18,
    daily_stats: [],
    weekly_stats: [
      { week_number: 1, total_minutes: 2400, session_count: 12 },
      { week_number: 2, total_minutes: 2800, session_count: 14 },
      { week_number: 3, total_minutes: 2640, session_count: 11 },
      { week_number: 4, total_minutes: 2400, session_count: 11 },
    ],
    weekday_distribution: [960, 1440, 1680, 1440, 1920, 1440, 1360],
  };

  const request = new Request("http://localhost/api/report/monthly", {
    method: "POST",
    body: JSON.stringify(testData),
    headers: { "Content-Type": "application/json" },
  });

  return POST(request as NextRequest);
}
