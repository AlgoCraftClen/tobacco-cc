/** ============================================================
 *  CC Tobacco — Distribution OS · Tailwind theme
 *  Drop into tailwind.config.js (or merge `theme.extend`).
 *  Dark-mode-first. Semantic colors are fixed; `accent` is the
 *  single themeable brand hue (emerald by default).
 *  Pair with ds-tokens.css so the CSS variables resolve at runtime.
 *  ============================================================ */
module.exports = {
  darkMode: "class", // app is dark by default; tokens live on :root
  theme: {
    extend: {
      colors: {
        // surfaces (warm near-black)
        bg: "#0a0a0b",
        "bg-grad": "#0c0c0e",
        surface: {
          DEFAULT: "#131316", // cards / panels        → bg-surface
          2: "#17171b",       // raised / popovers      → bg-surface-2
          3: "#1d1d22",       // chips / inset wells     → bg-surface-3
        },
        // hairline borders (alpha white)
        line: {
          DEFAULT: "rgba(255,255,255,0.065)", // → border-line
          2: "rgba(255,255,255,0.11)",        // → border-line-2
          3: "rgba(255,255,255,0.16)",        // → border-line-3
        },
        // foreground ramp
        content: {
          DEFAULT: "#f3f3f4", // primary text  → text-content
          2: "#9a9aa2",       // muted         → text-content-2
          3: "#66666e",       // subtle        → text-content-3
          4: "#48484f",       // faint / disabled
        },
        // brand accent (themeable)
        accent: {
          DEFAULT: "#3ecf8e",
          600: "#34b87d",
          ink: "#05130d",     // text/icon on solid accent
        },
        // semantic (fixed — never recolor with the accent)
        positive: "#3ecf8e",
        warning: "#e0a93c",
        danger: "#f06a6a",
        info: "#5b8def",
        // inventory unit hues (categorical)
        unit: {
          case: "#5b8def",
          box: "#c08bf0",
          roll: "#e0a93c",
          can: "#4fc4cf",
        },
      },

      fontFamily: {
        sans: ['"Geist"', "ui-sans-serif", "system-ui", "-apple-system", '"Segoe UI"', "sans-serif"],
        mono: ['"Geist Mono"', "ui-monospace", '"SF Mono"', "Menlo", "monospace"],
      },

      // type ramp used across the OS (size / line-height / tracking)
      fontSize: {
        micro:    ["11px",   { lineHeight: "1.4",  letterSpacing: "0" }],
        caption:  ["12px",   { lineHeight: "1.4",  letterSpacing: "0" }],
        sm:       ["13px",   { lineHeight: "1.5",  letterSpacing: "-0.01em" }],
        base:     ["13.5px", { lineHeight: "1.55", letterSpacing: "-0.011em" }],
        md:       ["14px",   { lineHeight: "1.4",  letterSpacing: "-0.015em" }],
        lg:       ["16px",   { lineHeight: "1.3",  letterSpacing: "-0.02em" }],
        title:    ["23px",   { lineHeight: "1.1",  letterSpacing: "-0.025em" }],
        display:  ["28px",   { lineHeight: "1",    letterSpacing: "-0.03em" }],
        hero:     ["38px",   { lineHeight: "1.12", letterSpacing: "-0.03em" }],
      },

      // 4px base grid. Named aliases match in-product usage.
      spacing: {
        0.5: "2px",
        1: "4px",
        1.5: "6px",
        2: "8px",
        2.5: "10px",
        3: "12px",
        3.5: "14px",
        4: "16px",
        4.5: "18px",
        5: "20px",
        5.5: "22px", // default page gutter (--pad)
        7: "28px",   // comfy page gutter
        row: "46px", // default table row height (--row-h)
      },

      borderRadius: {
        xs: "7px",   // chips, small steppers
        sm: "9px",   // buttons, inputs, nav items
        DEFAULT: "13px", // cards, panels, modals
        lg: "15px",  // command palette
        pill: "9999px",
      },

      boxShadow: {
        sm: "0 1px 2px rgba(0,0,0,0.4)",
        DEFAULT: "0 4px 16px -4px rgba(0,0,0,0.5), 0 2px 6px -2px rgba(0,0,0,0.4)",
        lg: "0 24px 60px -12px rgba(0,0,0,0.7), 0 8px 24px -8px rgba(0,0,0,0.5)",
        pop: "0 16px 40px -8px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.11)",
        // focus ring (emerald, low alpha)
        focus: "0 0 0 3px rgba(62,207,142,0.07)",
      },

      ringColor: { accent: "rgba(62,207,142,0.30)" },

      fontFeatureSettings: {
        // numerals: tabular + slashed zero on .font-mono money/IDs
        tnum: '"tnum","zero"',
      },
    },
  },
  plugins: [],
};
