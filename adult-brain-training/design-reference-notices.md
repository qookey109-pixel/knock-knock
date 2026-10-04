# Knock Knock design references

## React Bits ShapeGrid adaptation
Source: https://github.com/DavidHDev/react-bits/blob/main/src/content/Backgrounds/ShapeGrid/ShapeGrid.jsx
Used in adult-brain-training/index.html as a lightweight square-grid Canvas adaptation.
React/hooks, continuous redraw, multiple shape modes and pointer trails were removed. CSS provides slow home-only movement; the canvas redraws on resize or a changed hovered cell. Reduced motion and page visibility are respected.

MIT + Commons Clause License Condition v1.0

Copyright (c) 2026 David Haz

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, and distribute the Software as part of an application, website, or product, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

Commons Clause Restriction

You may use this Software, including for any commercial purpose, so long as you do not sell, sublicense, or redistribute the components themselves-whether alone, in a bundle, or as a ported version.

No Warranty

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## Visual and motion references (independent implementations)
- ThreeUI TactileButton: https://github.com/MengTo/threeui/blob/main/src/shaders/neuform-isolated/sources/nexus-tactile.html
  Inspired layered highlights, short depression and elevation. No source, shader, assets or dependencies copied.
- 60fps Airbnb tactile tab: https://60fps.design/shots/airbnb-tactile-tab-button-interaction
  Inspired short spring timing. No media copied.
- 60fps Circle menu: https://60fps.design/shots/circle-menu-dropdown-morph-interaction
  Inspired sound-popover entrance. No media copied.
- 60fps Sudoku completion: https://60fps.design/shots/sudoku-complete-confetti-animation
  Inspired a brief, clipped paper celebration for completed games. No media copied.
