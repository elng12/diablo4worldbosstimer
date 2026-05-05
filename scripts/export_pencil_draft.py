#!/usr/bin/env python3
import itertools
import json
from pathlib import Path


OUT = Path("/Users/elng/web/diablo4worldbosstimer/pencil-export.pen")

counter = itertools.count(1)


def uid(prefix: str) -> str:
    return f"{prefix}{next(counter)}"


def text(
    content: str,
    name: str,
    *,
    fill: str = "#F8FAFC",
    font_size: int = 14,
    font_weight: str = "400",
    width=None,
    height=None,
    text_growth=None,
    font_family='ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    line_height=None,
    **extra,
):
    node = {
        "type": "text",
        "id": uid("t"),
        "name": name,
        "content": content,
        "fill": fill,
        "fontFamily": font_family,
        "fontSize": font_size,
        "fontWeight": font_weight,
    }
    if width is not None:
        node["width"] = width
    if height is not None:
        node["height"] = height
    if text_growth is not None:
        node["textGrowth"] = text_growth
    if line_height is not None:
        node["lineHeight"] = line_height
    node.update(extra)
    return node


def icon(
    name: str,
    icon_name: str,
    *,
    fill: str = "#F8FAFC",
    size: int = 16,
    weight=None,
    **extra,
):
    node = {
        "type": "icon_font",
        "id": uid("i"),
        "name": name,
        "iconFontFamily": "lucide",
        "iconFontName": icon_name,
        "fill": fill,
        "width": size,
        "height": size,
    }
    if weight is not None:
        node["weight"] = weight
    node.update(extra)
    return node


def frame(
    name: str,
    *,
    id=None,
    children=None,
    fill=None,
    layout=None,
    gap=None,
    padding=None,
    width=None,
    height=None,
    x=None,
    y=None,
    corner_radius=None,
    justify_content=None,
    align_items=None,
    stroke=None,
    type_="frame",
    **extra,
):
    node = {
        "type": type_,
        "id": id or uid("f"),
        "name": name,
    }
    if fill is not None:
        node["fill"] = fill
    if layout is not None:
        node["layout"] = layout
    if gap is not None:
        node["gap"] = gap
    if padding is not None:
        node["padding"] = padding
    if width is not None:
        node["width"] = width
    if height is not None:
        node["height"] = height
    if x is not None:
        node["x"] = x
    if y is not None:
        node["y"] = y
    if corner_radius is not None:
        node["cornerRadius"] = corner_radius
    if justify_content is not None:
        node["justifyContent"] = justify_content
    if align_items is not None:
        node["alignItems"] = align_items
    if stroke is not None:
        node["stroke"] = stroke
    if children is not None:
        node["children"] = children
    node.update(extra)
    return node


def badge(label: str, fill_color: str, *, text_color: str = "#0B0D12", name: str = "badge", short=False):
    return frame(
        name,
        layout="horizontal",
        align_items="center",
        justify_content="center",
        gap=4,
        padding=[2, 8],
        corner_radius=999,
        fill=fill_color,
        children=[
            text(
                label,
                f"{name}Text",
                fill=text_color,
                font_size=11 if short else 12,
                font_weight="700",
            )
        ],
    )


def button(
    label: str,
    *,
    name: str,
    fill_color: str,
    text_color="#F8FAFC",
    icon_name=None,
    border: bool = False,
    height=40,
    text_size=13,
    padding=[0, 14],
):
    children = []
    if icon_name:
        children.append(icon(f"{name}Icon", icon_name, fill=text_color, size=16))
    children.append(text(label, f"{name}Label", fill=text_color, font_size=text_size, font_weight="700"))
    node = frame(
        name,
        layout="horizontal",
        align_items="center",
        justify_content="center",
        gap=6 if icon_name else 0,
        padding=padding,
        corner_radius=6,
        fill=fill_color,
        height=height,
        children=children,
    )
    if border:
        node["stroke"] = {"align": "inside", "fill": "#252B36", "thickness": 1}
    return node


def schedule_card(time_label: str, boss: str, location: str, region: str, chip_label: str, chip_fill: str):
    return frame(
        f"ScheduleEventCard {boss} {time_label}",
        layout="vertical",
        gap=4,
        padding=10,
        corner_radius=6,
        fill="#1A1F2A",
        stroke={"align": "inside", "fill": "#252B36", "thickness": 1},
        children=[
            frame(
                f"{boss} row",
                layout="horizontal",
                justify_content="space_between",
                align_items="center",
                children=[
                    text(time_label, f"{boss} time", fill="#F8FAFC", font_size=13, font_weight="700"),
                    badge(chip_label, chip_fill, name=f"{boss} chip", short=True),
                ],
            ),
            text(boss, f"{boss} boss", fill="#F8FAFC", font_size=12, font_weight="600"),
            text(location, f"{boss} location", fill="#A1A1AA", font_size=11, font_weight="400"),
            text(region, f"{boss} region", fill="#71717A", font_size=10, font_weight="400"),
        ],
    )


def faq_item(question: str, answer: str):
    return frame(
        "faq item",
        layout="vertical",
        gap=3,
        children=[
            text(question, "faqQuestion", fill="#F8FAFC", font_size=13, font_weight="700", text_growth="fixed-width", width="fill_container"),
            text(answer, "faqAnswer", fill="#71717A", font_size=12, font_weight="400", line_height=1.3, text_growth="fixed-width", width="fill_container"),
        ],
    )


def reward_card(title: str, note: str, value: str, value_fill="#8F7138"):
    return frame(
        f"{title} Rewards",
        layout="vertical",
        gap=5,
        padding=12,
        corner_radius=8,
        fill="#151922",
        stroke={"align": "inside", "fill": "#252B36", "thickness": 1},
        children=[
            text(title, f"{title} title", fill="#F8FAFC", font_size=14, font_weight="700"),
            text(note, f"{title} note", fill="#A1A1AA", font_size=12, font_weight="400", line_height=1.3, text_growth="fixed-width", width="fill_container"),
            text(value, f"{title} value", fill=value_fill, font_size=11, font_weight="600", text_growth="fixed-width", width="fill_container"),
        ],
    )


def timer_card(include_error=False):
    if include_error:
        return frame(
            "Next World Boss Timer Card Error",
            layout="vertical",
            gap=8,
            padding=14,
            corner_radius=8,
            fill="#151922",
            stroke={"align": "inside", "fill": "#EF4444", "thickness": 1},
            children=[
                frame(
                    "error row",
                    layout="horizontal",
                    gap=8,
                    align_items="center",
                    children=[
                        icon("errorIcon", "shield-alert", fill="#F8FAFC"),
                        text("Unable to load the next World Boss.", "errorTitle", fill="#F8FAFC", font_size=16, font_weight="700"),
                    ],
                ),
                text("Last known event can stay visible, but live data needs a retry.", "errorDesc", fill="#A1A1AA", font_size=13, font_weight="400", line_height=1.35, text_growth="fixed-width", width="fill_container"),
                button("Retry", name="retryButton", fill_color="#9F2B25", icon_name="refresh-cw", height=40),
            ],
        )

    return frame(
        "Next World Boss Timer Card",
        layout="vertical",
        gap=10,
        padding=14,
        corner_radius=8,
        fill="#151922",
        stroke={"align": "inside", "fill": "#2A2F3A", "thickness": 1},
        children=[
            frame(
                "Timer heading row",
                layout="horizontal",
                justify_content="space_between",
                align_items="center",
                children=[
                    text("Next World Boss", "timerLabel", fill="#A1A1AA", font_size=13, font_weight="700"),
                    badge("Predicted", "#F59E0B", name="confidenceBadge"),
                ],
            ),
            text("Ashava", "bossName", fill="#F8FAFC", font_size=32, font_weight="800", line_height=1),
            text("02:29:58", "countdown", fill="#D6A84F", font_size=48, font_weight="800", font_family="Courier", line_height=0.95),
            frame(
                "Local spawn time",
                layout="vertical",
                gap=3,
                padding=10,
                corner_radius=6,
                fill="#1A1F2A",
                stroke={"align": "inside", "fill": "#252B36", "thickness": 1},
                children=[
                    text("Spawns Today, 10:30 PM", "spawnLabel", fill="#F8FAFC", font_size=14, font_weight="600"),
                    text("Your local time: America/New_York", "timezoneLabel", fill="#71717A", font_size=11, font_weight="400"),
                ],
            ),
            frame(
                "Location summary",
                layout="vertical",
                gap=3,
                padding=[0, 2],
                children=[
                    text("Caen Adar", "locationName", fill="#F8FAFC", font_size=15, font_weight="700"),
                    text("Scosglen", "locationRegion", fill="#A1A1AA", font_size=13, font_weight="400"),
                ],
            ),
            button("Remind Me", name="remindButton", fill_color="#9F2B25", icon_name="bell", height=42, text_size=14),
            frame(
                "Waypoint and update",
                layout="vertical",
                gap=3,
                children=[
                    text("Suggested waypoint: Corbach", "waypointText", fill="#71717A", font_size=12, font_weight="400"),
                    text("Updated 2m ago", "updatedText", fill="#71717A", font_size=11, font_weight="400"),
                ],
            ),
        ],
    )


def mobile_main_screen(frame_id: str, *, name: str, include_full_sections: bool = True):
    children = [
        frame(
            "Compact Header",
            layout="horizontal",
            justify_content="space_between",
            align_items="center",
            padding=[0, 10],
            height=44,
            corner_radius=6,
            fill="#11141B",
            children=[
                text("D4 Boss Timer", "mobileLogo", fill="#F8FAFC", font_size=13, font_weight="700"),
                frame(
                    "menuButton",
                    layout="horizontal",
                    align_items="center",
                    gap=4,
                    padding=[4, 8],
                    corner_radius=4,
                    children=[
                        icon("menuIcon", "menu", fill="#A1A1AA", size=16),
                        text("Menu", "menuLabel", fill="#A1A1AA", font_size=12, font_weight="600"),
                    ],
                ),
            ],
        ),
        text("Diablo 4 World Boss Timer", "mobileH1", fill="#F8FAFC", font_size=22, font_weight="800", width="fill_container", text_growth="fixed-width", line_height=1.1),
        timer_card(),
        frame(
            "Below viewport actions",
            layout="horizontal",
            align_items="center",
            gap=8,
            height=40,
            children=[
                button("View Map", name="viewMapButton", fill_color="#1A1F2A", text_color="#A1A1AA", icon_name="map", border=True, height=36, text_size=13),
                button("Report Wrong Time", name="reportTextButton", fill_color="#00000000", text_color="#71717A", icon_name="flag", height=36, text_size=12, padding=[0, 10]),
            ],
        ),
        text("Route note: Ride northwest from Corbach and enter the arena from the southern path.", "routeNote", fill="#71717A", font_size=11, font_weight="400", line_height=1.25, width="fill_container", text_growth="fixed-width"),
    ]

    if include_full_sections:
        children.extend(
            [
                frame(
                    "Reminder Panel entry",
                    layout="vertical",
                    gap=8,
                    padding=14,
                    corner_radius=8,
                    fill="#151922",
                    stroke={"align": "inside", "fill": "#252B36", "thickness": 1},
                    children=[
                        text("Set a World Boss Reminder", "reminderTitle", fill="#F8FAFC", font_size=16, font_weight="700"),
                        text("Choose when to be reminded before Ashava spawns.", "reminderDesc", fill="#A1A1AA", font_size=13, font_weight="400", line_height=1.35, width="fill_container", text_growth="fixed-width"),
                        frame(
                            "ReminderLeadTimeOptions",
                            layout="horizontal",
                            gap=6,
                            children=[
                                button("5 min", name="lead5", fill_color="#1A1F2A", text_color="#A1A1AA", border=True, height=32, text_size=12),
                                button("15 min", name="lead15", fill_color="#9F2B25", text_color="#F8FAFC", height=32, text_size=12),
                                button("30 min", name="lead30", fill_color="#1A1F2A", text_color="#A1A1AA", border=True, height=32, text_size=12),
                                button("60 min", name="lead60", fill_color="#1A1F2A", text_color="#A1A1AA", border=True, height=32, text_size=12),
                            ],
                        ),
                        text("Reminder saved for this browser session.", "reminderSaved", fill="#22C55E", font_size=12, font_weight="600"),
                    ],
                ),
                frame(
                    "Upcoming 8 World Boss Schedule",
                    layout="vertical",
                    gap=8,
                    padding=14,
                    corner_radius=8,
                    fill="#151922",
                    stroke={"align": "inside", "fill": "#252B36", "thickness": 1},
                    children=[
                        text("Diablo 4 World Boss Schedule", "scheduleTitle", fill="#F8FAFC", font_size=16, font_weight="700"),
                        text("Upcoming World Boss Spawns", "scheduleSubtitle", fill="#A1A1AA", font_size=13, font_weight="600"),
                        schedule_card("10:30 PM Today", "Ashava", "Caen Adar, Scosglen", "Scosglen", "Pred", "#F59E0B"),
                        schedule_card("2:00 AM Tomorrow", "Avarice", "Saraan Caldera, Dry Steppes", "Dry Steppes", "Pred", "#F59E0B"),
                        schedule_card("5:30 AM Tomorrow", "Wandering Death", "The Crucible, Fractured Peaks", "Fractured Peaks", "Conf", "#22C55E"),
                        schedule_card("9:00 AM Tomorrow", "Ashava", "Seared Basin, Hawezar", "Hawezar", "Pred", "#F59E0B"),
                        schedule_card("12:30 PM Tomorrow", "Avarice", "Fields of Desecration, Kehjistan", "Kehjistan", "Verify", "#EF4444"),
                        schedule_card("4:00 PM Tomorrow", "Wandering Death", "The Crucible, Fractured Peaks", "Fractured Peaks", "Pred", "#F59E0B"),
                        schedule_card("7:30 PM Tomorrow", "Ashava", "Caen Adar, Scosglen", "Scosglen", "Conf", "#22C55E"),
                        schedule_card("11:00 PM Tomorrow", "Avarice", "Saraan Caldera, Dry Steppes", "Dry Steppes", "Pred", "#F59E0B"),
                    ],
                ),
                frame(
                    "Current Location Card",
                    id=uid("loc"),
                    layout="vertical",
                    gap=8,
                    padding=14,
                    corner_radius=8,
                    fill="#151922",
                    stroke={"align": "inside", "fill": "#252B36", "thickness": 1},
                    children=[
                        text("Diablo 4 World Boss Locations", "locTitle", fill="#F8FAFC", font_size=16, font_weight="700"),
                        text("All World Boss Spawn Locations", "locSub", fill="#A1A1AA", font_size=13, font_weight="600"),
                        text("Caen Adar", "locName2", fill="#F8FAFC", font_size=15, font_weight="700"),
                        text("Scosglen", "locRegion2", fill="#A1A1AA", font_size=13, font_weight="400"),
                        text("Suggested waypoint: Corbach", "locWaypoint", fill="#71717A", font_size=12, font_weight="400"),
                        text("Ride northwest from Corbach and enter the arena from the southern path.", "locRoute", fill="#71717A", font_size=11, font_weight="400", line_height=1.3, width="fill_container", text_growth="fixed-width"),
                        button("View Map", name="locationMapButton", fill_color="#1A1F2A", text_color="#A1A1AA", icon_name="map", border=True, height=34, text_size=13),
                    ],
                ),
                frame(
                    "Accuracy Panel",
                    id=uid("acc"),
                    layout="vertical",
                    gap=6,
                    padding=14,
                    corner_radius=8,
                    fill="#151922",
                    stroke={"align": "inside", "fill": "#252B36", "thickness": 1},
                    children=[
                        text("How the Diablo 4 World Boss Timer Works", "accTitle", fill="#F8FAFC", font_size=16, font_weight="700", width="fill_container", text_growth="fixed-width"),
                        text("Timer Accuracy and Last Updated", "accSub", fill="#A1A1AA", font_size=13, font_weight="600"),
                        badge("Predicted", "#F59E0B", name="accBadge"),
                        text("Generated from the current world boss rotation.", "accExplain", fill="#A1A1AA", font_size=12, font_weight="400", line_height=1.35, width="fill_container", text_growth="fixed-width"),
                        text("Updated 2m ago", "accUpdated", fill="#71717A", font_size=11, font_weight="400"),
                        text("Timezone: America/New_York", "accTimezone", fill="#71717A", font_size=11, font_weight="400"),
                        text("Source: algorithm | Algorithm: world-boss-v1 | Season: S13", "accSource", fill="#71717A", font_size=11, font_weight="400", width="fill_container", text_growth="fixed-width"),
                    ],
                ),
                frame(
                    "Rewards",
                    id=uid("rewards"),
                    layout="vertical",
                    gap=8,
                    children=[
                        text("Diablo 4 World Boss Loot and Rewards", "rewardsTitle", fill="#F8FAFC", font_size=16, font_weight="700"),
                        frame(
                            "rewardGrid",
                            layout="vertical",
                            gap=10,
                            children=[
                                reward_card("Ashava", "Grand Cache, legendary gear, cosmetics, mount armor, trophy, and seasonal reward notes.", "Worth farming for mount armor and cosmetics."),
                                reward_card("Avarice", "Grand Cache, legendary gear, cosmetics, mount armor, trophy, and seasonal reward notes.", "Worth farming for legendary drops and quick cache checks."),
                                reward_card("Wandering Death", "Grand Cache, legendary gear, cosmetics, mount armor, trophy, and seasonal reward notes.", "Worth farming for the unique trophy and seasonal reward chances."),
                            ],
                        ),
                    ],
                ),
                frame(
                    "How Timer Works Section",
                    id=uid("how"),
                    layout="vertical",
                    gap=6,
                    padding=14,
                    corner_radius=8,
                    fill="#151922",
                    stroke={"align": "inside", "fill": "#252B36", "thickness": 1},
                    children=[
                        text("How the Diablo 4 World Boss Timer Works", "howTitle", fill="#F8FAFC", font_size=16, font_weight="700", width="fill_container", text_growth="fixed-width"),
                        text("How We Calculate the Next World Boss Spawn", "howSub1", fill="#A1A1AA", font_size=13, font_weight="600"),
                        text("The timer uses the known world boss rotation cycle (approximately every 3.5 hours) combined with community-verified spawn times to predict the next spawn. Confirmed times are manually reviewed or corrected by our team.", "howBody1", fill="#71717A", font_size=12, font_weight="400", line_height=1.4, width="fill_container", text_growth="fixed-width"),
                        text("Predicted vs Confirmed Spawn Times", "howSub2", fill="#A1A1AA", font_size=13, font_weight="600"),
                        text("Predicted times are generated from the rotation algorithm. Confirmed times have been manually verified. Needs verification means the anchor time requires community input.", "howBody2", fill="#71717A", font_size=12, font_weight="400", line_height=1.4, width="fill_container", text_growth="fixed-width"),
                    ],
                ),
                frame(
                    "FAQ Section",
                    id=uid("faq"),
                    layout="vertical",
                    gap=8,
                    padding=14,
                    corner_radius=8,
                    fill="#151922",
                    stroke={"align": "inside", "fill": "#252B36", "thickness": 1},
                    children=[
                        text("Diablo 4 World Boss FAQ", "faqTitle", fill="#F8FAFC", font_size=16, font_weight="700"),
                        faq_item("When is the next World Boss in Diablo 4?", "The next World Boss is shown in the timer card at the top of the page. It includes the boss name, live countdown, local spawn time, region, location, nearest waypoint, and confidence status."),
                        faq_item("How often do World Bosses spawn in Diablo 4?", "The timer uses a 210-minute, or 3.5-hour, interval as the default prediction rule. Future events are still labeled by confidence status because seasonal updates or special events may affect the schedule."),
                        faq_item("Where do World Bosses spawn in Diablo 4?", "World Bosses spawn in fixed arena locations across Sanctuary, including Fractured Peaks, Scosglen, Dry Steppes, Kehjistan, and Hawezar. The locations section shows the current spawn point, region, nearby waypoint, and map option."),
                        faq_item("Is this Diablo 4 World Boss Timer accurate?", "This Diablo 4 World Boss Timer is designed to be transparent rather than overpromise. Confirmed events have been reviewed, Predicted events are generated from the current rotation logic, and Needs verification events should be checked before you rely on them."),
                        faq_item("Can I get a reminder before a World Boss spawns?", "Yes. The reminder panel can support warning times such as 5, 15, 30, or 60 minutes before the event. Browser notification permission should only be requested after you choose a reminder."),
                        faq_item("Does the timer show my local time?", "Yes. Event times are stored in UTC and converted in your browser so the timer can show the next spawn in your local timezone."),
                        faq_item("What do World Bosses drop in Diablo 4?", "World Bosses may drop Grand Caches, legendary gear, cosmetics, mount armor, trophies, and seasonal rewards. The rewards section gives a quick overview so you can decide whether the next event is worth joining."),
                    ],
                ),
                frame(
                    "Disclaimer",
                    id=uid("disc"),
                    layout="vertical",
                    gap=4,
                    padding=14,
                    corner_radius=8,
                    fill="#151922",
                    stroke={"align": "inside", "fill": "#252B36", "thickness": 1},
                    children=[
                        text(
                            "This is an unofficial fan-made Diablo 4 tool. Diablo IV and related names, images, and assets belong to Blizzard Entertainment. This site is not affiliated with or endorsed by Blizzard Entertainment.",
                            "disclaimerText",
                            fill="#71717A",
                            font_size=11,
                            font_weight="400",
                            line_height=1.4,
                            width="fill_container",
                            text_growth="fixed-width",
                        )
                    ],
                ),
            ]
        )

    return frame(
        name,
        id=frame_id,
        x=0,
        y=0,
        width=360,
        fill="#0B0D12",
        layout="vertical",
        gap=10,
        padding=12,
        children=children,
    )


def mobile_qa_screen():
    return frame(
        "Mobile 360x640 QA viewport",
        id="gVbWL",
        x=1690,
        y=0,
        width=360,
        height=640,
        fill="#0B0D12",
        layout="vertical",
        gap=10,
        padding=12,
        children=[
            frame(
                "Compact Header",
                layout="horizontal",
                justify_content="space_between",
                align_items="center",
                padding=[0, 10],
                height=44,
                corner_radius=6,
                fill="#11141B",
                children=[
                    text("D4 Boss Timer", "qaLogo", fill="#F8FAFC", font_size=13, font_weight="700"),
                    frame(
                        "qaMenu",
                        layout="horizontal",
                        align_items="center",
                        gap=4,
                        padding=[4, 8],
                        corner_radius=4,
                        children=[icon("qaMenuIcon", "menu", fill="#A1A1AA", size=16), text("Menu", "qaMenuText", fill="#A1A1AA", font_size=12, font_weight="600")],
                    ),
                ],
            ),
            text("Diablo 4 World Boss Timer", "qaTitle", fill="#F8FAFC", font_size=22, font_weight="800", width="fill_container", text_growth="fixed-width", line_height=1.1),
            timer_card(),
            frame(
                "Below viewport actions",
                layout="horizontal",
                align_items="center",
                gap=8,
                height=40,
                children=[
                    button("View Map", name="qaMapButton", fill_color="#1A1F2A", text_color="#A1A1AA", icon_name="map", border=True, height=36, text_size=13),
                    button("Report Wrong Time", name="qaReportButton", fill_color="#00000000", text_color="#71717A", icon_name="flag", height=36, text_size=12, padding=[0, 10]),
                ],
            ),
            text("Route note: Ride northwest from Corbach and enter the arena from the southern path.", "qaRouteNote", fill="#71717A", font_size=11, font_weight="400", line_height=1.25, width="fill_container", text_growth="fixed-width"),
        ],
    )


def desktop_screen():
    return frame(
        "Desktop shell 1180 + 24px padding",
        id="Z8ADo",
        x=420,
        y=0,
        width=1228,
        fill="#0B0D12",
        layout="vertical",
        gap=16,
        padding=24,
        children=[
            frame(
                "Desktop Header",
                layout="horizontal",
                justify_content="space_between",
                align_items="center",
                padding=[0, 16],
                height=54,
                corner_radius=8,
                fill="#11141B",
                children=[
                    text("D4 Boss Timer", "deskBrand", fill="#F8FAFC", font_size=16, font_weight="800"),
                    frame(
                        "Anchor nav",
                        layout="horizontal",
                        gap=18,
                        children=[
                            text("Schedule", "navSchedule", fill="#A1A1AA", font_size=12, font_weight="600"),
                            text("Locations", "navLocations", fill="#A1A1AA", font_size=12, font_weight="600"),
                            text("Rewards", "navRewards", fill="#A1A1AA", font_size=12, font_weight="600"),
                            text("FAQ", "navFaq", fill="#A1A1AA", font_size=12, font_weight="600"),
                        ],
                    ),
                    button("Remind Me", name="deskHeaderCta", fill_color="#9F2B25", height=34, text_size=13),
                ],
            ),
            frame(
                "Announcement Banner",
                layout="horizontal",
                align_items="center",
                gap=6,
                padding=[8, 14],
                corner_radius=6,
                fill="#1A1F2A",
                stroke={"align": "inside", "fill": "#F59E0B", "thickness": 1},
                children=[
                    icon("annIcon", "megaphone", fill="#F59E0B", size=14),
                    text("[Announcement message goes here when announcement.enabled = true]", "annText", fill="#A1A1AA", font_size=12, font_weight="400", width="fill_container", text_growth="fixed-width"),
                    icon("annDismiss", "x", fill="#71717A", size=14),
                ],
            ),
            frame(
                "Title + purpose",
                layout="vertical",
                gap=6,
                children=[
                    text("Diablo 4 World Boss Timer", "deskH1", fill="#F8FAFC", font_size=34, font_weight="900"),
                    text("Next spawn, local time, current location, reminder, and accuracy status in one compact tool.", "deskSub", fill="#A1A1AA", font_size=14, font_weight="400", width="fill_container", text_growth="fixed-width"),
                ],
            ),
            frame(
                "Desktop hero grid",
                layout="horizontal",
                gap=16,
                height=420,
                children=[
                    frame(
                        "Timer and reminder column",
                        layout="vertical",
                        gap=16,
                        width="fill_container",
                        children=[
                            timer_card(),
                            frame(
                                "Desktop Tracker and Reminders",
                                layout="vertical",
                                gap=12,
                                padding=16,
                                corner_radius=8,
                                fill="#151922",
                                stroke={"align": "inside", "fill": "#252B36", "thickness": 1},
                                children=[
                                    text("Diablo 4 World Boss Tracker and Reminders", "trackerTitle", fill="#F8FAFC", font_size=16, font_weight="700"),
                                    text("Choose when to be reminded before Ashava spawns. Browser notifications are requested only after a reminder choice.", "trackerCopy", fill="#A1A1AA", font_size=12, font_weight="400", line_height=1.35, width="fill_container", text_growth="fixed-width"),
                                    frame(
                                        "tracker row",
                                        layout="horizontal",
                                        gap=8,
                                        children=[
                                            button("5 min", name="deskLead5", fill_color="#1A1F2A", text_color="#A1A1AA", border=True, height=32, text_size=12),
                                            button("15 min", name="deskLead15", fill_color="#9F2B25", text_color="#F8FAFC", height=32, text_size=12),
                                            button("30 min", name="deskLead30", fill_color="#1A1F2A", text_color="#A1A1AA", border=True, height=32, text_size=12),
                                            button("60 min", name="deskLead60", fill_color="#1A1F2A", text_color="#A1A1AA", border=True, height=32, text_size=12),
                                        ],
                                    ),
                                ],
                            ),
                        ],
                    ),
                    frame(
                        "Upcoming World Boss Schedule",
                        layout="vertical",
                        gap=8,
                        padding=14,
                        corner_radius=8,
                        fill="#151922",
                        stroke={"align": "inside", "fill": "#252B36", "thickness": 1},
                        width="fill_container",
                        children=[
                            frame(
                                "schedule header",
                                layout="horizontal",
                                justify_content="space_between",
                                align_items="center",
                                children=[
                                    text("Upcoming World Boss Schedule", "scheduleH2", fill="#F8FAFC", font_size=16, font_weight="700"),
                                    text("8 events", "scheduleCount", fill="#A1A1AA", font_size=12, font_weight="600"),
                                ],
                            ),
                            schedule_card("10:30 PM Today", "Ashava", "Caen Adar, Scosglen", "Scosglen", "Pred", "#F59E0B"),
                            schedule_card("2:00 AM Tomorrow", "Avarice", "Saraan Caldera, Dry Steppes", "Dry Steppes", "Pred", "#F59E0B"),
                            schedule_card("5:30 AM Tomorrow", "Wandering Death", "The Crucible, Fractured Peaks", "Fractured Peaks", "Conf", "#22C55E"),
                            schedule_card("9:00 AM Tomorrow", "Ashava", "Seared Basin, Hawezar", "Hawezar", "Pred", "#F59E0B"),
                            schedule_card("12:30 PM Tomorrow", "Avarice", "Fields of Desecration, Kehjistan", "Kehjistan", "Verify", "#EF4444"),
                            schedule_card("4:00 PM Tomorrow", "Wandering Death", "The Crucible, Fractured Peaks", "Fractured Peaks", "Pred", "#F59E0B"),
                            schedule_card("7:30 PM Tomorrow", "Ashava", "Caen Adar, Scosglen", "Scosglen", "Conf", "#22C55E"),
                            schedule_card("11:00 PM Tomorrow", "Avarice", "Saraan Caldera, Dry Steppes", "Dry Steppes", "Pred", "#F59E0B"),
                        ],
                    ),
                ],
            ),
            frame(
                "Location + Accuracy grid",
                layout="horizontal",
                gap=16,
                height=170,
                children=[
                    frame(
                        "Current Location Card",
                        layout="vertical",
                        gap=8,
                        padding=14,
                        corner_radius=8,
                        fill="#151922",
                        stroke={"align": "inside", "fill": "#252B36", "thickness": 1},
                        width="fill_container",
                        children=[
                            text("Diablo 4 World Boss Locations", "locTitle", fill="#F8FAFC", font_size=16, font_weight="700"),
                            text("Caen Adar", "locName", fill="#F8FAFC", font_size=15, font_weight="700"),
                            text("Scosglen", "locRegion", fill="#A1A1AA", font_size=13, font_weight="400"),
                            text("Suggested waypoint: Corbach", "locWaypoint", fill="#71717A", font_size=12, font_weight="400"),
                            text("Ride northwest from Corbach and enter the arena from the southern path.", "locRoute", fill="#71717A", font_size=11, font_weight="400", line_height=1.3, width="fill_container", text_growth="fixed-width"),
                            button("View Map", name="desktopMapButton", fill_color="#1A1F2A", text_color="#A1A1AA", icon_name="map", border=True, height=34, text_size=13),
                        ],
                    ),
                    frame(
                        "Timer Accuracy",
                        layout="vertical",
                        gap=6,
                        padding=14,
                        corner_radius=8,
                        fill="#151922",
                        stroke={"align": "inside", "fill": "#252B36", "thickness": 1},
                        width="fill_container",
                        children=[
                            text("Timer Accuracy", "accuracyTitle", fill="#F8FAFC", font_size=16, font_weight="700"),
                            badge("Predicted", "#F59E0B", name="accuracyBadge"),
                            text("Generated from the current world boss rotation.", "accuracyCopy", fill="#A1A1AA", font_size=12, font_weight="400", line_height=1.35, width="fill_container", text_growth="fixed-width"),
                            text("Updated: 2m ago", "accuracyUpdated", fill="#71717A", font_size=11, font_weight="400"),
                            text("Timezone: America/New_York", "accuracyTZ", fill="#71717A", font_size=11, font_weight="400"),
                            text("Source: algorithm | Algorithm: world-boss-v1 | Season: S13", "accuracySource", fill="#71717A", font_size=11, font_weight="400", width="fill_container", text_growth="fixed-width"),
                            button("Report Wrong Time", name="desktopReportButton", fill_color="#00000000", text_color="#71717A", icon_name="flag", height=32, text_size=12, padding=[0, 10]),
                        ],
                    ),
                ],
            ),
            frame(
                "Static rewards loot cards",
                layout="horizontal",
                gap=8,
                height=170,
                children=[
                    reward_card("Ashava", "Grand Cache, legendary gear, cosmetics, mount armor, trophy, and seasonal reward notes.", "Worth farming for mount armor and cosmetics."),
                    reward_card("Avarice", "Grand Cache, legendary gear, cosmetics, mount armor, trophy, and seasonal reward notes.", "Worth farming for legendary drops and quick cache checks."),
                    reward_card("Wandering Death", "Grand Cache, legendary gear, cosmetics, mount armor, trophy, and seasonal reward notes.", "Worth farming for the unique trophy and seasonal reward chances."),
                ],
            ),
            frame(
                "How Timer Works Section",
                layout="vertical",
                gap=8,
                padding=16,
                corner_radius=8,
                fill="#151922",
                stroke={"align": "inside", "fill": "#252B36", "thickness": 1},
                children=[
                    text("How the Diablo 4 World Boss Timer Works", "desktopHowTitle", fill="#F8FAFC", font_size=16, font_weight="700"),
                    text("A timer is only useful when players understand how much they can trust it. This tool uses a confirmed anchor, predicted rotation, local timezone conversion, manual review, and user feedback when needed.", "desktopHowBody1", fill="#71717A", font_size=12, font_weight="400", line_height=1.4, width="fill_container", text_growth="fixed-width"),
                    text("Confirmed means the event has been reviewed or manually corrected. Predicted means the time was generated from the current schedule logic. Needs verification means there may be a timing, boss, or location issue that should be checked before you rely on it.", "desktopHowBody2", fill="#71717A", font_size=12, font_weight="400", line_height=1.4, width="fill_container", text_growth="fixed-width"),
                ],
            ),
            frame(
                "FAQ Section",
                layout="vertical",
                gap=8,
                padding=16,
                corner_radius=8,
                fill="#151922",
                stroke={"align": "inside", "fill": "#252B36", "thickness": 1},
                children=[
                    text("Diablo 4 World Boss FAQ", "desktopFaqTitle", fill="#F8FAFC", font_size=16, font_weight="700"),
                    faq_item("When is the next World Boss in Diablo 4?", "The next World Boss is shown in the timer card at the top of the page. It includes the boss name, live countdown, local spawn time, region, location, nearest waypoint, and confidence status."),
                    faq_item("How often do World Bosses spawn in Diablo 4?", "The timer uses a 210-minute, or 3.5-hour, interval as the default prediction rule. Future events are still labeled by confidence status because seasonal updates or special events may affect the schedule."),
                    faq_item("Can I get a reminder before a World Boss spawns?", "Yes. The reminder panel can support warning times such as 5, 15, 30, or 60 minutes before the event. Browser notification permission should only be requested after you choose a reminder."),
                ],
            ),
            frame(
                "SEO Content Expansion",
                layout="vertical",
                gap=14,
                padding=16,
                corner_radius=8,
                fill="#151922",
                stroke={"align": "inside", "fill": "#252B36", "thickness": 1},
                children=[
                    text("Next Diablo 4 World Boss", "seoTitle1", fill="#F8FAFC", font_size=16, font_weight="700"),
                    text("Use this Diablo 4 World Boss Timer to check the next world boss spawn, live countdown, local time, and current location before you log in.", "seoBody1", fill="#A1A1AA", font_size=13, font_weight="400", line_height=1.35, width="fill_container", text_growth="fixed-width"),
                    text("Diablo 4 World Boss Schedule", "seoTitle2", fill="#F8FAFC", font_size=16, font_weight="700"),
                    text("The schedule shows upcoming spawns in your local timezone. Each event includes the boss name, estimated spawn time, region, location, and confidence status so you can compare the next few events quickly.", "seoBody2", fill="#A1A1AA", font_size=13, font_weight="400", line_height=1.35, width="fill_container", text_growth="fixed-width"),
                ],
            ),
            frame(
                "Disclaimer",
                layout="vertical",
                gap=4,
                padding=14,
                corner_radius=8,
                fill="#151922",
                stroke={"align": "inside", "fill": "#252B36", "thickness": 1},
                children=[
                    text(
                        "This is an unofficial fan-made Diablo 4 tool. Diablo IV and related names, images, and assets belong to Blizzard Entertainment. This site is not affiliated with or endorsed by Blizzard Entertainment.",
                        "desktopDisclaimer",
                        fill="#71717A",
                        font_size=11,
                        font_weight="400",
                        line_height=1.4,
                        width="fill_container",
                        text_growth="fixed-width",
                    )
                ],
            ),
        ],
    )


def states_tokens_mock():
    return frame(
        "States + Tokens + Mock",
        id="wSQh6",
        x=0,
        y=3700,
        width=1280,
        fill="#0B0D12",
        layout="vertical",
        gap=16,
        padding=24,
        children=[
            text("P0 States, Design Tokens, and Mock Contract", "statesTitle", fill="#F8FAFC", font_size=30, font_weight="900"),
            text("Frontend-only UI inventory for /diablo-4-world-boss-timer/. No backend, database, Supabase, Cron, or real API work. Mock data matches Implementation Lock DTOs.", "statesSub", fill="#A1A1AA", font_size=14, font_weight="400", line_height=1.35, width="fill_container", text_growth="fixed-width"),
            frame(
                "Design token swatches",
                layout="horizontal",
                gap=12,
                height=100,
                children=[
                    badge("Page", "#0B0D12", text_color="#F8FAFC", name="swatchPage"),
                    badge("Card", "#151922", text_color="#F8FAFC", name="swatchCard"),
                    badge("Gold", "#D6A84F", text_color="#0B0D12", name="swatchGold"),
                    badge("Red", "#9F2B25", text_color="#F8FAFC", name="swatchRed"),
                    badge("Green", "#22C55E", text_color="#0B0D12", name="swatchGreen"),
                    badge("Amber", "#F59E0B", text_color="#0B0D12", name="swatchAmber"),
                ],
            ),
            frame(
                "States and contract grid",
                layout="horizontal",
                gap=16,
                children=[
                    frame(
                        "Confirmed / Predicted / Needs verification",
                        layout="vertical",
                        gap=8,
                        padding=16,
                        corner_radius=8,
                        fill="#151922",
                        stroke={"align": "inside", "fill": "#252B36", "thickness": 1},
                        width="fill_container",
                        children=[
                            badge("Confirmed", "#22C55E", text_color="#0B0D12", name="stateConfirmed"),
                            badge("Predicted", "#F59E0B", text_color="#0B0D12", name="statePredicted"),
                            badge("Needs verification", "#EF4444", text_color="#0B0D12", name="stateNeeds"),
                            text("Confidence states must always include text labels, not only color.", "stateNote", fill="#A1A1AA", font_size=12, font_weight="400", line_height=1.35, width="fill_container", text_growth="fixed-width"),
                        ],
                    ),
                    frame(
                        "API loading / failed / empty",
                        layout="vertical",
                        gap=8,
                        padding=16,
                        corner_radius=8,
                        fill="#151922",
                        stroke={"align": "inside", "fill": "#252B36", "thickness": 1},
                        width="fill_container",
                        children=[
                            text("Loading next spawn...", "loadingState", fill="#A1A1AA", font_size=12, font_weight="600"),
                            text("Unable to load the next World Boss.", "failedState", fill="#EF4444", font_size=12, font_weight="600"),
                            text("Schedule anchor needs verification.", "emptyState", fill="#A1A1AA", font_size=12, font_weight="600"),
                            text("No upcoming World Boss events are available yet.", "noFutureState", fill="#A1A1AA", font_size=12, font_weight="600"),
                        ],
                    ),
                ],
            ),
        ],
    )


def p0_variants():
    return frame(
        "P0 State Variants",
        id="swqhX",
        x=1320,
        y=4360,
        width=1180,
        height=760,
        fill="#0B0D12",
        layout="vertical",
        gap=18,
        padding=24,
        children=[
            text("P0 State Variants", "variantsTitle", fill="#F8FAFC", font_size=28, font_weight="900"),
            text("Visual reference for required fallback and interaction states. These are compact component variants, not full pages.", "variantsSub", fill="#A1A1AA", font_size=13, font_weight="400", line_height=1.35, width="fill_container", text_growth="fixed-width"),
            frame(
                "row1",
                layout="horizontal",
                gap=16,
                height=210,
                children=[
                    frame("API loading", layout="vertical", gap=10, padding=16, corner_radius=8, fill="#151922", stroke={"align": "inside", "fill": "#252B36", "thickness": 1}, width="fill_container", children=[text("Loading next spawn...", "v1", fill="#A1A1AA", font_size=12, font_weight="600")]),
                    frame("Current API failed", layout="vertical", gap=10, padding=16, corner_radius=8, fill="#151922", stroke={"align": "inside", "fill": "#EF4444", "thickness": 1}, width="fill_container", children=[text("Unable to load the next World Boss.", "v2", fill="#EF4444", font_size=12, font_weight="600")]),
                    frame("No active anchor", layout="vertical", gap=10, padding=16, corner_radius=8, fill="#151922", stroke={"align": "inside", "fill": "#252B36", "thickness": 1}, width="fill_container", children=[text("Schedule anchor needs verification.", "v3", fill="#A1A1AA", font_size=12, font_weight="600")]),
                ],
            ),
            frame(
                "row2",
                layout="horizontal",
                gap=16,
                height=210,
                children=[
                    frame("Schedule failed", layout="vertical", gap=10, padding=16, corner_radius=8, fill="#151922", stroke={"align": "inside", "fill": "#EF4444", "thickness": 1}, width="fill_container", children=[text("Upcoming schedule could not load.", "v4", fill="#EF4444", font_size=12, font_weight="600")]),
                    frame("No future events", layout="vertical", gap=10, padding=16, corner_radius=8, fill="#151922", stroke={"align": "inside", "fill": "#252B36", "thickness": 1}, width="fill_container", children=[text("No upcoming World Boss events are available yet.", "v5", fill="#A1A1AA", font_size=12, font_weight="600")]),
                    frame("Timezone failed", layout="vertical", gap=10, padding=16, corner_radius=8, fill="#151922", stroke={"align": "inside", "fill": "#F59E0B", "thickness": 1}, width="fill_container", children=[text("UTC time shown", "v6", fill="#F59E0B", font_size=12, font_weight="600")]),
                    frame("Notification denied", layout="vertical", gap=10, padding=16, corner_radius=8, fill="#151922", stroke={"align": "inside", "fill": "#EF4444", "thickness": 1}, width="fill_container", children=[text("Notifications are blocked in this browser.", "v7", fill="#EF4444", font_size=12, font_weight="600")]),
                ],
            ),
        ],
    )


def interaction_patch():
    return frame(
        "P0 Interaction States Patch",
        id="Xnfj3",
        x=2620,
        y=0,
        width=1280,
        height=1180,
        fill="#0B0D12",
        layout="vertical",
        gap=18,
        padding=24,
        children=[
            text("P0 Interaction States Patch", "patchTitle", fill="#F8FAFC", font_size=30, font_weight="900"),
            text("Missing visual states required before implementation: countdown rollover, notification support, map lazy loading, mobile menu, announcement, stale data, and reminder local-intent flow.", "patchSub", fill="#A1A1AA", font_size=14, font_weight="400", line_height=1.35, width="fill_container", text_growth="fixed-width"),
            frame(
                "State row A",
                layout="horizontal",
                gap=16,
                height=210,
                children=[
                    frame("Event expired checking next", layout="vertical", gap=10, padding=16, corner_radius=8, fill="#151922", stroke={"align": "inside", "fill": "#D6A84F", "thickness": 1}, width="fill_container", children=[text("Checking next World Boss spawn...", "a1", fill="#D6A84F", font_size=12, font_weight="600")]),
                    frame("Notification unsupported", layout="vertical", gap=10, padding=16, corner_radius=8, fill="#151922", stroke={"align": "inside", "fill": "#252B36", "thickness": 1}, width="fill_container", children=[text("Browser notifications are unavailable.", "a2", fill="#A1A1AA", font_size=12, font_weight="600")]),
                    frame("Stale data indicator", layout="vertical", gap=10, padding=16, corner_radius=8, fill="#151922", stroke={"align": "inside", "fill": "#F59E0B", "thickness": 1}, width="fill_container", children=[badge("Stale data", "#F59E0B", text_color="#0B0D12", name="staleChip"), text("If generated_at exceeds stale_after_seconds, keep last known event visible, show warning, and offer Retry.", "a3", fill="#A1A1AA", font_size=12, font_weight="400", line_height=1.35, width="fill_container", text_growth="fixed-width")]),
                    frame("Announcement active", layout="vertical", gap=10, padding=16, corner_radius=8, fill="#151922", stroke={"align": "inside", "fill": "#F59E0B", "thickness": 1}, width="fill_container", children=[text("Spawn timing advisory: verify this event before relying on it.", "a4", fill="#F8FAFC", font_size=12, font_weight="400", line_height=1.2, width="fill_container", text_growth="fixed-width")]),
                ],
            ),
            frame(
                "State row B",
                layout="horizontal",
                gap=16,
                height=280,
                children=[
                    frame("Map closed lazy", layout="vertical", gap=10, padding=16, corner_radius=8, fill="#151922", stroke={"align": "inside", "fill": "#252B36", "thickness": 1}, width="fill_container", children=[text("View Map remains collapsed until user intent.", "b1", fill="#A1A1AA", font_size=12, font_weight="600")]),
                    frame("Map loading", layout="vertical", gap=10, padding=16, corner_radius=8, fill="#151922", stroke={"align": "inside", "fill": "#D6A84F", "thickness": 1}, width="fill_container", children=[text("Loading map...", "b2", fill="#D6A84F", font_size=12, font_weight="600")]),
                    frame("Map failed", layout="vertical", gap=10, padding=16, cornerRadius=8, fill="#151922", stroke={"align": "inside", "fill": "#EF4444", "thickness": 1}, width="fill_container", children=[text("Map could not load.", "b3", fill="#EF4444", font_size=12, font_weight="600")]),
                ],
            ),
            frame(
                "State row C",
                layout="horizontal",
                gap=16,
                height=360,
                children=[
                    frame("Mobile menu open state", layout="vertical", gap=8, padding=16, cornerRadius=8, fill="#151922", stroke={"align": "inside", "fill": "#252B36", "thickness": 1}, width=360, children=[
                        text("Mobile Menu Open", "c1", fill="#F8FAFC", font_size=16, font_weight="800"),
                        text("Focus trap inside menu. Escape closes. Links close menu after anchor navigation.", "c2", fill="#71717A", font_size=11, font_weight="400", line_height=1.25, width="fill_container", text_growth="fixed-width"),
                    ]),
                    frame("Reminder panel states", layout="vertical", gap=10, padding=16, cornerRadius=8, fill="#151922", stroke={"align": "inside", "fill": "#252B36", "thickness": 1}, width="fill_container", children=[text("Reminder saved locally, permission denied, unsupported, checking.", "c3", fill="#A1A1AA", font_size=12, font_weight="600")]),
                    frame("A11y implementation notes", layout="vertical", gap=10, padding=16, cornerRadius=8, fill="#151922", stroke={"align": "inside", "fill": "#252B36", "thickness": 1}, width="fill_container", children=[text("Countdown is aria-live polite. Dialogs need focus trap and focus restore.", "c4", fill="#A1A1AA", font_size=12, font_weight="600")]),
                ],
            ),
        ],
    )


def report_dialog_states():
    return frame(
        "Report Wrong Time Dialog States",
        id="jVg6b",
        x=1320,
        y=3700,
        width=1180,
        height=620,
        fill="#0B0D12",
        layout="vertical",
        gap=18,
        padding=24,
        children=[
            text("Report Wrong Time Dialog", "reportTitle", fill="#F8FAFC", font_size=28, font_weight="900"),
            text("P0 report flow: report type is required, note is optional up to 500 characters, submission uses the shared WorldBossReportPayload contract.", "reportSub", fill="#A1A1AA", font_size=13, font_weight="400", line_height=1.35, width="fill_container", text_growth="fixed-width"),
            frame(
                "Report dialog variants row",
                layout="horizontal",
                gap=16,
                children=[
                    frame("Default form", layout="vertical", gap=12, padding=18, corner_radius=8, fill="#151922", stroke={"align": "inside", "fill": "#252B36", "thickness": 1}, width="fill_container", children=[text("Select report type and optional note.", "r1", fill="#A1A1AA", font_size=12, font_weight="400")]),
                    frame("Validation and API error", layout="vertical", gap=12, padding=18, corner_radius=8, fill="#151922", stroke={"align": "inside", "fill": "#EF4444", "thickness": 1}, width="fill_container", children=[text("Report type is required. Failed to submit report.", "r2", fill="#EF4444", font_size=12, font_weight="400")]),
                    frame("Submitted state", layout="vertical", gap=12, padding=18, corner_radius=8, fill="#151922", stroke={"align": "inside", "fill": "#22C55E", "thickness": 1}, width="fill_container", children=[text("Report submitted. Thanks - we will review this event.", "r3", fill="#22C55E", font_size=12, font_weight="400")]),
                ],
            ),
        ],
    )


def tablet_screen():
    return frame(
        "Tablet 768x1024 Draft",
        id="f7LVE",
        x=2620,
        y=1300,
        width=768,
        height=1024,
        fill="#0B0D12",
        layout="vertical",
        gap=10,
        padding=14,
        children=[
            frame(
                "Tablet Header",
                layout="horizontal",
                justify_content="space_between",
                align_items="center",
                padding=[0, 14],
                height=52,
                corner_radius=8,
                fill="#11141B",
                children=[
                    text("D4 Boss Timer", "tabletBrand", fill="#F8FAFC", font_size=15, font_weight="800"),
                    frame("Tablet nav", layout="horizontal", gap=14, children=[text("Schedule", "tabNav1", fill="#A1A1AA", font_size=12, font_weight="600"), text("Locations", "tabNav2", fill="#A1A1AA", font_size=12, font_weight="600"), text("Rewards", "tabNav3", fill="#A1A1AA", font_size=12, font_weight="600")]),
                    button("Remind Me", name="tabletCta", fill_color="#9F2B25", height=34, text_size=13),
                ],
            ),
            text("Diablo 4 World Boss Timer", "tabletTitle", fill="#F8FAFC", font_size=28, font_weight="900"),
            timer_card(),
            frame(
                "Tablet schedule two-column cards",
                layout="vertical",
                gap=8,
                padding=12,
                corner_radius=8,
                fill="#151922",
                stroke={"align": "inside", "fill": "#252B36", "thickness": 1},
                children=[
                    text("Diablo 4 World Boss Schedule", "tabletScheduleTitle", fill="#F8FAFC", font_size=16, font_weight="800"),
                    text("Tablet uses two-column cards: still not a squeezed table, denser than mobile.", "tabletScheduleNote", fill="#A1A1AA", font_size=12, font_weight="400", line_height=1.25, width="fill_container", text_growth="fixed-width"),
                    frame("schedGrid1", layout="horizontal", gap=10, children=[schedule_card("10:30 PM Today", "Ashava", "Caen Adar, Scosglen", "Scosglen", "Pred", "#F59E0B"), schedule_card("2:00 AM Tomorrow", "Avarice", "Saraan Caldera, Dry Steppes", "Dry Steppes", "Pred", "#F59E0B")]),
                    frame("schedGrid2", layout="horizontal", gap=10, children=[schedule_card("5:30 AM Tomorrow", "Wandering Death", "The Crucible, Fractured Peaks", "Fractured Peaks", "Conf", "#22C55E"), schedule_card("9:00 AM Tomorrow", "Ashava", "Seared Basin, Hawezar", "Hawezar", "Pred", "#F59E0B")]),
                    frame("schedGrid3", layout="horizontal", gap=10, children=[schedule_card("12:30 PM Tomorrow", "Avarice", "Fields of Desecration, Kehjistan", "Kehjistan", "Verify", "#EF4444"), schedule_card("4:00 PM Tomorrow", "Wandering Death", "The Crucible, Fractured Peaks", "Fractured Peaks", "Pred", "#F59E0B")]),
                ],
            ),
            frame(
                "Tablet Location Accuracy row",
                layout="horizontal",
                gap=14,
                height=142,
                children=[
                    frame("Tablet Location", layout="vertical", gap=8, padding=14, corner_radius=8, fill="#151922", stroke={"align": "inside", "fill": "#252B36", "thickness": 1}, width="fill_container", children=[text("Current Location", "tLoc", fill="#F8FAFC", font_size=15, font_weight="700")]),
                    frame("Tablet Accuracy", layout="vertical", gap=8, padding=14, corner_radius=8, fill="#151922", stroke={"align": "inside", "fill": "#252B36", "thickness": 1}, width="fill_container", children=[text("Timer Accuracy", "tAcc", fill="#F8FAFC", font_size=15, font_weight="700")]),
                ],
            ),
            frame(
                "Tablet rewards three-card grid",
                layout="horizontal",
                gap=10,
                height=94,
                children=[reward_card("Ashava", "Reward summary", "Mount armor / cosmetics"), reward_card("Avarice", "Reward summary", "Legendary drops"), reward_card("Wandering Death", "Reward summary", "Unique trophy")],
            ),
            text("Tablet rule: Timer remains full width. Schedule uses two-column cards if text fits. Rewards may use three-card grid at 768px.", "tabletFooterNote", fill="#71717A", font_size=10, font_weight="400", line_height=1.2, width="fill_container", text_growth="fixed-width"),
        ],
    )


def handoff_checklist():
    return frame(
        "Implementation Handoff Checklist",
        id="Z7aNt",
        x=3520,
        y=1300,
        width=1180,
        height=1024,
        fill="#0B0D12",
        layout="vertical",
        gap=18,
        padding=24,
        children=[
            text("Implementation Handoff Checklist", "handoffTitle", fill="#F8FAFC", font_size=30, font_weight="900"),
            text("Non-visual requirements that must travel with the Pencil draft: SEO copy, structured data, exact DTO mocks, analytics events, and QA acceptance checks.", "handoffSub", fill="#A1A1AA", font_size=14, font_weight="400", line_height=1.35, width="fill_container", text_growth="fixed-width"),
            frame("handoffRow1", layout="horizontal", gap=16, height=280, children=[frame("SEO content requirements", layout="vertical", gap=10, padding=16, corner_radius=8, fill="#151922", stroke={"align": "inside", "fill": "#252B36", "thickness": 1}, width="fill_container", children=[text("SEO content requirements", "h1", fill="#F8FAFC", font_size=16, font_weight="800")]), frame("Structured data requirements", layout="vertical", gap=10, padding=16, corner_radius=8, fill="#151922", stroke={"align": "inside", "fill": "#252B36", "thickness": 1}, width="fill_container", children=[text("Structured data requirements", "h2", fill="#F8FAFC", font_size=16, font_weight="800")]), frame("Mock DTO fixture requirements", layout="vertical", gap=10, padding=16, cornerRadius=8, fill="#151922", stroke={"align": "inside", "fill": "#252B36", "thickness": 1}, width="fill_container", children=[text("Mock DTO fixture requirements", "h3", fill="#F8FAFC", font_size=16, font_weight="800")])]),
            frame("handoffRow2", layout="horizontal", gap=16, height=270, children=[frame("Analytics taxonomy", layout="vertical", gap=10, padding=16, cornerRadius=8, fill="#151922", stroke={"align": "inside", "fill": "#252B36", "thickness": 1}, width="fill_container", children=[text("Analytics taxonomy", "h4", fill="#F8FAFC", font_size=16, font_weight="800")]), frame("Automated QA baseline", layout="vertical", gap=10, padding=16, cornerRadius=8, fill="#151922", stroke={"align": "inside", "fill": "#252B36", "thickness": 1}, width="fill_container", children=[text("Automated QA baseline", "h5", fill="#F8FAFC", font_size=16, font_weight="800")]), frame("Copy and publishing guardrails", layout="vertical", gap=10, padding=16, cornerRadius=8, fill="#151922", stroke={"align": "inside", "fill": "#252B36", "thickness": 1}, width="fill_container", children=[text("Copy and publishing guardrails", "h6", fill="#F8FAFC", font_size=16, font_weight="800")])]),
            frame("handoffRow3", layout="horizontal", gap=16, height=260, children=[frame("Contract boundaries", layout="vertical", gap=10, padding=16, cornerRadius=8, fill="#151922", stroke={"align": "inside", "fill": "#252B36", "thickness": 1}, width="fill_container", children=[text("Contract boundaries", "h7", fill="#F8FAFC", font_size=16, font_weight="800")]), frame("Typography implementation note", layout="vertical", gap=10, padding=16, cornerRadius=8, fill="#151922", stroke={"align": "inside", "fill": "#252B36", "thickness": 1}, width="fill_container", children=[text("Typography implementation note", "h8", fill="#F8FAFC", font_size=16, font_weight="800")]), frame("P0 links and routing", layout="vertical", gap=10, padding=16, cornerRadius=8, fill="#151922", stroke={"align": "inside", "fill": "#252B36", "thickness": 1}, width="fill_container", children=[text("P0 links and routing", "h9", fill="#F8FAFC", font_size=16, font_weight="800")])]),
        ],
    )


def main():
    doc = {
        "version": "2.11",
        "children": [
            mobile_main_screen("KH3vA", name="Mobile 360x760", include_full_sections=True),
            desktop_screen(),
            mobile_qa_screen(),
            interaction_patch(),
            tablet_screen(),
            handoff_checklist(),
            states_tokens_mock(),
            report_dialog_states(),
            p0_variants(),
            mobile_main_screen("FuMSG", name="Mobile 360x760", include_full_sections=True),
        ],
    }
    OUT.write_text(json.dumps(doc, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    main()
