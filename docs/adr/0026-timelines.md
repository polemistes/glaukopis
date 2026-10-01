# 0026 — Timelines

Date: 2026-10-01. Status: accepted.

## Context

Those who write about events — of history or of an invented world — need
to see them in time: a city's events beside another's, a life beside the
events of its years. What is known of time is uneven: some dates exact,
some to a year or a century, and much known only as *after* this or
*before* that. A timeline that took only dates would leave out most of
what a scholar knows.

## Decision

- **The facts live on the elements.** An element says when it is (`when`
  on the element): at a point or over a span, each end a time written in
  words, or relative to another element — after, before, between, during —
  and perhaps approximate. A timeline is a view of a map, not a thing of
  its own: every map can be seen as one, beside its diagram and its text,
  once anything in it says when it is.
- **Times are read as spans of what they may be** (`timeline/time.ts`): a
  year is the whole year, a century the whole century, a day a day. Years
  are counted as astronomers count them (1 BC is 0), so that BC and AD lie
  on one axis. A timeline's axis is either dates or **units** of the
  writer's own, in which times are numbers.
- **What is relative is solved** (`timeline/solve.ts`): the window of each
  end is propagated from everything it refers to, and it is drawn in the
  middle of a closed window, or a little way from an open one's edge, with
  the window shown. Chains are drawn in their order. A contradiction is
  reported on the element, as is a reference to what is not placed.
  Where nothing is written at all, the elements are ordered in levels
  without a scale.
- **Lanes are branches** (`timeline/lanes.ts`): by default each child of
  the centre is a lane; the writer chooses otherwise, branch by branch. A
  lane's own placement is its span. An element that stands for another
  map brings that map's placed elements with it, so that maps are compared
  by inclusion, as the document already does.
- Nothing of it goes into the document yet.

## Consequences

- Lanes can be every element of a kind (`kind` on a lane); a chronology,
  a table of what is placed in the order of time, is added to the map as
  an element of its own, as a copy of the moment. To come: the timeline
  as a figure, and dragging written times along the axis.
- The solving is linear in the number of placed elements and rounds, and is
  done again whenever the project changes; a map of some hundreds of placed
  elements is solved in milliseconds.
