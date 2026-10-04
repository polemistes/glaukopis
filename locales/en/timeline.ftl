# Timelines: when elements are, and a map seen along an axis of time.

timeline-title = Timeline
timeline-view = The timeline
timeline-settings = The timeline
timeline-axis = Axis
timeline-axis-dates = Dates
timeline-axis-units = Units of your own
timeline-dates-hint = Years, with BC where needed: 431 BC, c. 480 BCE, May 1453, 1453-05-29, 5th century BC.
timeline-unit = What a unit is called
timeline-unit-placeholder = year, day, cycle…
timeline-units-hint = Times are numbers of the unit: Year 12, Day 3, or just 12. They may be negative.
timeline-lanes = Lanes
timeline-lanes-given = Each child of the centre is a lane, until you choose. A lane holds what is placed in its branch; its own placement, if it has one, is the span of the lane.
timeline-lanes-chosen = The lanes you chose, in the order of the text.
timeline-lanes-reset = Each child of the centre again
timeline-one-lane = One lane
timeline-each-child = { $count ->
    [one] Its child a lane
   *[other] Each of { $count } children a lane
}
timeline-no-branches = The map has nothing under its centre yet.
timeline-lanes-by-kind = Lanes by kind
timeline-lanes-by-kind-hint = Every element of a kind a lane of its own: each character, each place.
timeline-each-of-kind = Each a lane
timeline-chronology = Add a chronology to the map
timeline-chronology-hint = An element with a table of everything placed, in the order of time, to be written on and printed
timeline-chronology-title = Chronology
timeline-chronology-when = When
timeline-chronology-what = What
timeline-chronology-made = A chronology was added to the map
timeline-elsewhere = Elsewhere in the map
timeline-ordered = In order, without dates
timeline-empty = Nothing says when it is yet. Choose “Say when it is…” in an element’s menu.
timeline-unplaced = { $count ->
    [one] One element could not be placed:
   *[other] { $count } elements could not be placed:
}
timeline-contradiction = cannot be where it says it is
# Dragging what is placed, and placing what is not.
timeline-moving = Move by dragging
timeline-moving-hint = Drag an element along the axis, or the edge of a span, to change its time; off, so that nothing moves by mistake
timeline-without = Elements without a time
timeline-without-hint = Drag one onto the timeline, or press it to say when it is:
timeline-waiting-hint = Says nothing of its time yet: press it to say when it is, or drag it along the lane to place it
timeline-implied-hint = says nothing of its time, and stands within { $parent }; press it to say when it is, or, with moving on, drag it along the lane to place it
timeline-unknown = refers to what is not placed, or to a time that cannot be read

## Saying when an element is
when-title = When it is
when-say = Say when it is…
when-change = When it is…
when-clear = No longer say
when-kind = At a point, or over a span
when-point = At a point
when-span = Over a span
when-when = When
when-start = From
when-end = To
when-at = At a time
when-after = After an element
when-before = Before an element
when-between = Between two elements
when-during = During an element
when-time = Time
when-time-placeholder = 431 BC, May 1453, c. 480…
when-unit-placeholder = Year 12, Day 3, 12…
when-unread = This cannot be read as a time.
when-after-what = After
when-before-what = Before
when-during-what = During
when-choose = Choose an element…
when-approx = Approximately
# A margin either side of a written time, drawn fading away both ways from it.
when-margin = Give or take
when-margin-placeholder = 5 years, 3 months, 10 days…
when-margin-unit-placeholder = 5…
when-margin-unread = This cannot be read as a length of time.
when-hint-dates = Years, dates, months, centuries and decades are read, with BC or BCE where needed. A year stands for the whole year.
when-hint-units = Times are numbers of the timeline’s unit, set under its lanes. “Year 12” and “12” are the same.
when-bc = BC
# $month: 1 to 12; $year: as written.
when-month-of = { $year }, month { $month }
# How a placement is said beside the element: "after the quarrel, before the embassy".
when-said-after = after
when-said-before = before
when-said-during = during
when-said-to = to
when-said-approx = c.
